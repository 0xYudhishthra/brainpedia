// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IBrain} from "./IBrain.sol";

/// @title  Brain — ERC-7857-style iNFT
/// @notice Reference layout adapted for Brainpedia. Each tokenId binds to
///         an append-only list of IntelligentData (0G Storage merkle
///         roots), per-agent usage authorizations with TTL, and a hook
///         for Mixture-of-Brains royalty payments.
///
/// @dev Intentionally minimal — the production-grade version inherits
///      ZK proof verification from the 0g-agent-nft reference impl.
contract Brain is ERC721, Ownable, IBrain {
    uint256 private _nextTokenId;

    mapping(uint256 => IntelligentData[]) private _intelligence;
    mapping(uint256 => mapping(address => uint64)) private _authExpiry;
    /// @dev tokenId → minimum payment required for authorizeUsage (wei).
    mapping(uint256 => uint256) public minPaymentOf;

    constructor(address initialOwner) ERC721("Brainpedia Brain", "BRAIN") Ownable(initialOwner) {}

    function mint(
        address to,
        bytes32 initialStorageRoot,
        string calldata description
    ) external override onlyOwner returns (uint256 tokenId) {
        tokenId = ++_nextTokenId;
        _safeMint(to, tokenId);
        _intelligence[tokenId].push(
            IntelligentData({
                storageRoot: initialStorageRoot,
                createdAt: uint64(block.timestamp),
                description: description
            })
        );
        emit BrainMinted(tokenId, to, initialStorageRoot);
    }

    function appendStorageRoot(
        uint256 tokenId,
        bytes32 storageRoot,
        string calldata description
    ) external override {
        require(ownerOf(tokenId) == msg.sender, "Brain: not owner");
        _intelligence[tokenId].push(
            IntelligentData({
                storageRoot: storageRoot,
                createdAt: uint64(block.timestamp),
                description: description
            })
        );
        emit StorageRootAppended(tokenId, storageRoot, description);
    }

    function setMinPayment(uint256 tokenId, uint256 amount) external {
        require(ownerOf(tokenId) == msg.sender, "Brain: not owner");
        minPaymentOf[tokenId] = amount;
    }

    function authorizeUsage(
        uint256 tokenId,
        address agent,
        uint64 ttlSeconds
    ) external payable override {
        require(msg.value >= minPaymentOf[tokenId], "Brain: insufficient payment");
        uint64 expiresAt = uint64(block.timestamp) + ttlSeconds;
        _authExpiry[tokenId][agent] = expiresAt;

        address brainOwner = ownerOf(tokenId);
        if (msg.value > 0) {
            (bool ok, ) = brainOwner.call{value: msg.value}("");
            require(ok, "Brain: payment forward failed");
            emit BrainPayment(tokenId, msg.sender, brainOwner, msg.value, bytes32(0));
        }
        emit UsageAuthorized(tokenId, agent, expiresAt);
    }

    function revokeAuthorization(uint256 tokenId, address agent) external override {
        require(ownerOf(tokenId) == msg.sender, "Brain: not owner");
        delete _authExpiry[tokenId][agent];
        emit UsageRevoked(tokenId, agent);
    }

    function isAuthorized(uint256 tokenId, address agent) external view override returns (bool) {
        return _authExpiry[tokenId][agent] >= block.timestamp;
    }

    function intelligenceOf(uint256 tokenId) external view override returns (IntelligentData[] memory) {
        return _intelligence[tokenId];
    }

    function currentStorageRoot(uint256 tokenId) external view override returns (bytes32) {
        IntelligentData[] storage list = _intelligence[tokenId];
        require(list.length > 0, "Brain: no intelligence");
        return list[list.length - 1].storageRoot;
    }
}
