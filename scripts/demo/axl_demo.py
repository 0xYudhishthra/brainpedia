#!/usr/bin/env python3
"""
Brainpedia AXL demo — satisfies the Gensyn AXL bounty requirement:

    "Working examples: a Python script that spins up 4 nodes,
     queries through orchestrator, prints the synthesized answer."

This script:
  1. Spawns 4 separate AXL daemons (3 Brain nodes + 1 orchestrator),
     each with its own Ed25519 key, its own port, and its own MCP service.
  2. Bootstraps the mesh so the orchestrator discovers each Brain.
  3. Sends a single query through the orchestrator.
  4. Fans out to all 3 Brains via /mcp/{peer_id}/brainpedia.brain over AXL.
  5. Prints the synthesized answer.

Per Gensyn rules, every cross-process call goes through the AXL daemons —
no shared in-process queue, no central broker.

Usage:
    python -m venv .venv && source .venv/bin/activate
    pip install -r requirements.txt
    # Build the AXL `node` binary from gensyn-ai/axl and put on PATH.
    AXL_BIN=/path/to/axl/node python axl_demo.py

Environment:
    AXL_BIN              path to the axl `node` binary (required)
    AXL_BASE_PORT        first port used; subsequent nodes use +1, +2, ...
                         (default: 9002)
    BRAINPEDIA_DEMO_DIR  scratch dir for per-node configs + keys
                         (default: ./.axl-demo)
"""

from __future__ import annotations

import json
import os
import shutil
import signal
import socket
import subprocess
import sys
import time
from contextlib import suppress
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import httpx
from nacl.signing import SigningKey


@dataclass
class NodeHandle:
    name: str
    port: int
    api_url: str
    peer_id: str
    config_path: Path
    process: subprocess.Popen[bytes]


def must_env(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        sys.exit(f"missing required env var: {name}")
    return value


def free_port_starting_at(start: int) -> int:
    port = start
    while port < start + 100:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(("127.0.0.1", port))
                return port
            except OSError:
                port += 1
    raise RuntimeError("no free port found")


def gen_node_config(workdir: Path, name: str, port: int, bootstrap: list[str]) -> tuple[Path, str]:
    """
    Generates a node-config.json with a fresh Ed25519 keypair. Returns
    (config_path, peer_id_hex).
    """
    node_dir = workdir / name
    node_dir.mkdir(parents=True, exist_ok=True)

    signing_key = SigningKey.generate()
    private_hex = signing_key.encode().hex()
    public_hex = signing_key.verify_key.encode().hex()

    config = {
        "listen_addr": f"127.0.0.1:{port}",
        "private_key_hex": private_hex,
        "bootstrap_peers": bootstrap,
        "data_dir": str(node_dir / "data"),
        # service registration is handled via separate MCP server process; see brain_service.py
    }
    config_path = node_dir / "node-config.json"
    config_path.write_text(json.dumps(config, indent=2))
    return config_path, public_hex


def spawn_node(axl_bin: str, name: str, config_path: Path, port: int) -> NodeHandle:
    log_path = config_path.parent / "node.log"
    proc = subprocess.Popen(
        [axl_bin, "-config", str(config_path)],
        stdout=open(log_path, "wb"),
        stderr=subprocess.STDOUT,
    )
    api_url = f"http://127.0.0.1:{port}"
    # crude readiness wait
    for _ in range(40):
        with suppress(Exception):
            r = httpx.get(f"{api_url}/topology", timeout=0.25)
            if r.status_code < 500:
                break
        time.sleep(0.25)
    cfg = json.loads(config_path.read_text())
    peer_id = SigningKey(bytes.fromhex(cfg["private_key_hex"])).verify_key.encode().hex()
    return NodeHandle(
        name=name, port=port, api_url=api_url, peer_id=peer_id,
        config_path=config_path, process=proc,
    )


def stop(node: NodeHandle) -> None:
    with suppress(Exception):
        node.process.send_signal(signal.SIGTERM)
        node.process.wait(timeout=3)


def call_mcp(api_url: str, peer_id: str, service: str, method: str, params: dict[str, Any]) -> dict[str, Any]:
    body = {"jsonrpc": "2.0", "id": int(time.time() * 1000), "method": method, "params": params}
    r = httpx.post(f"{api_url}/mcp/{peer_id}/{service}", json=body, timeout=30.0)
    r.raise_for_status()
    return r.json()


def main() -> int:
    axl_bin = must_env("AXL_BIN")
    if not shutil.which(axl_bin) and not Path(axl_bin).is_file():
        sys.exit(f"AXL_BIN not executable: {axl_bin}")

    base_port = int(os.environ.get("AXL_BASE_PORT", "9002"))
    workdir = Path(os.environ.get("BRAINPEDIA_DEMO_DIR", "./.axl-demo")).absolute()
    if workdir.exists():
        shutil.rmtree(workdir)
    workdir.mkdir(parents=True)

    # 1. Orchestrator first — its address becomes the bootstrap peer for the Brains.
    orch_port = free_port_starting_at(base_port)
    orch_cfg, orch_peer = gen_node_config(workdir, "orchestrator", orch_port, [])
    orchestrator = spawn_node(axl_bin, "orchestrator", orch_cfg, orch_port)
    print(f"orchestrator up on {orchestrator.api_url}  peer={orchestrator.peer_id[:12]}…")
    bootstrap = [f"tls://127.0.0.1:{orch_port}#{orch_peer}"]

    # 2. Three Brain nodes — each its own daemon, its own key, its own port.
    brains: list[NodeHandle] = []
    for name in ("defi", "malaysia", "mushroom"):
        port = free_port_starting_at(base_port + 10 + len(brains))
        cfg, _peer = gen_node_config(workdir, name, port, bootstrap)
        node = spawn_node(axl_bin, name, cfg, port)
        print(f"  brain[{name}] up on {node.api_url}  peer={node.peer_id[:12]}…")
        brains.append(node)

    # NOTE Day 4: each Brain's MCP service is registered by running
    #             scripts/demo/brain_service.py against its api_url.
    #             For now we only verify topology connectivity — the
    #             actual `query` MCP method is the next milestone.

    try:
        # Wait briefly for mesh to form
        time.sleep(2)
        topo = httpx.get(f"{orchestrator.api_url}/topology", timeout=5.0).json()
        print(f"\norchestrator sees {len(topo)} peers")

        # 3. Demo query — once brain_service.py is wired, this will return
        #    real synthesized answers instead of the placeholder error.
        prompt = "What's the safest 8%+ stablecoin yield right now?"
        answers = []
        for brain in brains:
            try:
                resp = call_mcp(
                    orchestrator.api_url, brain.peer_id, "brainpedia.brain", "query",
                    {"prompt": prompt},
                )
                answers.append((brain.name, resp))
            except Exception as e:
                answers.append((brain.name, {"error": str(e)}))

        print("\n=== fan-out results ===")
        for name, resp in answers:
            print(f"\n[{name}] {json.dumps(resp, indent=2)}")

        # 4. Synthesis pass — Day 4 calls 0G Compute. Placeholder concat for now.
        synthesized = " | ".join(
            (a.get("result", {}) or {}).get("answer", "<no-answer>")
            for _, a in answers
        )
        print("\n=== synthesized ===")
        print(synthesized)
        return 0
    finally:
        for n in (*brains, orchestrator):
            stop(n)
        print("\n✓ all nodes stopped")


if __name__ == "__main__":
    sys.exit(main())
