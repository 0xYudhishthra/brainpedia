// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

interface IENS {
    function setSubnodeRecord(
        bytes32 node,
        bytes32 label,
        address owner,
        address resolver,
        uint64 ttl
    ) external;
}

/// @title  AccessTokenRegistrar
/// @notice Issues TTL-bounded subnames under `client.<parent>` as one-time
///         capability tokens. When an agent pays to query a Brain, this
///         registrar mints `agent<hash>.client.<parent>` for them; the
///         Brain validates by resolving the name on-chain (or by reading
///         `expiresAt` here directly).
///
/// @dev    This is the "Most Creative Use of ENS" angle from the bounty.
contract AccessTokenRegistrar is Ownable {
    IENS public immutable ens;
    address public immutable resolver;
    /// @notice node hash for `client.<parent>`
    bytes32 public immutable clientParentNode;

    struct Token {
        address agent;
        bytes32 brainNameHash; // namehash of the Brain ENS name this grants access to
        uint64  expiresAt;
        bool    consumed;
    }

    /// @dev label hash → token state.
    mapping(bytes32 => Token) public tokens;

    /// @dev only the issuer (typically the Brain or a payment processor) can mint/consume.
    mapping(address => bool) public issuers;

    event Issued(bytes32 indexed labelHash, address indexed agent, bytes32 brainNameHash, uint64 expiresAt);
    event Consumed(bytes32 indexed labelHash, address indexed agent);
    event Revoked(bytes32 indexed labelHash);

    error NotIssuer();
    error LabelTaken();
    error NotFound();
    error Expired();

    constructor(address ens_, address resolver_, bytes32 clientParentNode_, address initialOwner)
        Ownable(initialOwner)
    {
        ens = IENS(ens_);
        resolver = resolver_;
        clientParentNode = clientParentNode_;
    }

    function setIssuer(address issuer, bool allowed) external onlyOwner {
        issuers[issuer] = allowed;
    }

    function issue(
        string calldata label,
        address agent,
        bytes32 brainNameHash,
        uint64 ttlSeconds
    ) external returns (bytes32 node) {
        if (!issuers[msg.sender]) revert NotIssuer();
        bytes32 labelHash = keccak256(bytes(label));
        if (tokens[labelHash].agent != address(0)) revert LabelTaken();

        uint64 expiresAt = uint64(block.timestamp) + ttlSeconds;
        tokens[labelHash] = Token({
            agent: agent,
            brainNameHash: brainNameHash,
            expiresAt: expiresAt,
            consumed: false
        });

        ens.setSubnodeRecord(clientParentNode, labelHash, agent, resolver, ttlSeconds);
        node = keccak256(abi.encodePacked(clientParentNode, labelHash));
        emit Issued(labelHash, agent, brainNameHash, expiresAt);
    }

    function consume(string calldata label) external returns (Token memory t) {
        if (!issuers[msg.sender]) revert NotIssuer();
        bytes32 labelHash = keccak256(bytes(label));
        t = tokens[labelHash];
        if (t.agent == address(0)) revert NotFound();
        if (t.expiresAt < block.timestamp) revert Expired();

        tokens[labelHash].consumed = true;
        emit Consumed(labelHash, t.agent);
    }

    function revoke(string calldata label) external onlyOwner {
        bytes32 labelHash = keccak256(bytes(label));
        delete tokens[labelHash];
        emit Revoked(labelHash);
    }

    function isValid(string calldata label, address agent) external view returns (bool) {
        bytes32 labelHash = keccak256(bytes(label));
        Token memory t = tokens[labelHash];
        return t.agent == agent && !t.consumed && t.expiresAt >= block.timestamp;
    }
}
