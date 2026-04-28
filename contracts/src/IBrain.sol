// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @title  IBrain — ERC-7857-style intelligent NFT for Brainpedia
/// @notice Each Brain is one tokenId. The token's "intelligence" is a list
///         of IntelligentData records pointing at 0G Storage merkle roots
///         (each root = one wiki snapshot). Owners append new roots when
///         they sync; queries authorize via authorizeUsage().
interface IBrain {
    struct IntelligentData {
        bytes32 storageRoot;   // 0G Storage Log layer merkle root
        uint64  createdAt;     // block.timestamp
        string  description;   // free-form ("snapshot v3 — added 12 articles")
    }

    event BrainMinted(uint256 indexed tokenId, address indexed owner, bytes32 storageRoot);
    event StorageRootAppended(uint256 indexed tokenId, bytes32 storageRoot, string description);
    event UsageAuthorized(uint256 indexed tokenId, address indexed agent, uint64 expiresAt);
    event UsageRevoked(uint256 indexed tokenId, address indexed agent);
    event BrainPayment(
        uint256 indexed tokenId,
        address indexed payer,
        address indexed brainOwner,
        uint256 amount,
        bytes32 queryHash
    );

    function mint(
        address to,
        bytes32 initialStorageRoot,
        string calldata description
    ) external returns (uint256 tokenId);

    function appendStorageRoot(
        uint256 tokenId,
        bytes32 storageRoot,
        string calldata description
    ) external;

    function authorizeUsage(uint256 tokenId, address agent, uint64 ttlSeconds) external payable;

    function revokeAuthorization(uint256 tokenId, address agent) external;

    function isAuthorized(uint256 tokenId, address agent) external view returns (bool);

    function intelligenceOf(uint256 tokenId) external view returns (IntelligentData[] memory);

    function currentStorageRoot(uint256 tokenId) external view returns (bytes32);
}
