#!/bin/sh
# axl-entrypoint — templates the AXL node config from env at runtime so the
# Ed25519 private key never lives in the image. Then exec the daemon.
set -eu

CFG_DIR="$(dirname "${AXL_NODE_CONFIG_PATH:-/etc/axl/node-config.json}")"
mkdir -p "$CFG_DIR"

if [ -z "${AXL_PRIVATE_KEY_HEX:-}" ]; then
    echo "axl-entrypoint: AXL_PRIVATE_KEY_HEX not set" >&2
    exit 1
fi

LISTEN="${AXL_API_LISTEN:-0.0.0.0:9002}"
BOOTSTRAP_JSON="${AXL_BOOTSTRAP_PEERS_JSON:-[]}"
DATA_DIR="${AXL_DATA_DIR:-/var/lib/axl}"
mkdir -p "$DATA_DIR"

cat > "${AXL_NODE_CONFIG_PATH:-/etc/axl/node-config.json}" <<EOF
{
  "listen_addr": "${LISTEN}",
  "private_key_hex": "${AXL_PRIVATE_KEY_HEX}",
  "bootstrap_peers": ${BOOTSTRAP_JSON},
  "data_dir": "${DATA_DIR}"
}
EOF

# Don't print the private key
echo "axl-entrypoint: config written ($(wc -c < "${AXL_NODE_CONFIG_PATH:-/etc/axl/node-config.json}") bytes); listen=${LISTEN}; public_key=${AXL_PUBLIC_KEY_HEX:-unset}"

exec /usr/local/bin/axl -config "${AXL_NODE_CONFIG_PATH:-/etc/axl/node-config.json}"
