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

interface ITextResolver {
    function setText(bytes32 node, string calldata key, string calldata value) external;
}

/// @title  SubnameRegistrar
/// @notice Issues `<label>.<parent>` subnames for Brain owners. The parent
///         node hash and ENS contract addresses are constructor params —
///         deploy-time configuration so the same contract works against
///         Sepolia, mainnet, or any custom registry without code changes.
///
/// @dev    Production version should integrate with the ENS Name Wrapper
///         and use fuses to lock subname permissions trustlessly.
contract SubnameRegistrar is Ownable {
    IENS public immutable ens;
    ITextResolver public immutable resolver;
    bytes32 public immutable parentNode;

    /// @dev label hash → registered owner. Used to enforce one-shot registration.
    mapping(bytes32 => address) public ownerOfLabel;

    event SubnameRegistered(bytes32 indexed labelHash, string label, address indexed owner);
    event TextRecordsBatched(bytes32 indexed node, uint256 count);

    error LabelAlreadyTaken();
    error NotLabelOwner();

    constructor(address ens_, address resolver_, bytes32 parentNode_, address initialOwner)
        Ownable(initialOwner)
    {
        ens = IENS(ens_);
        resolver = ITextResolver(resolver_);
        parentNode = parentNode_;
    }

    function register(string calldata label, address owner_) external returns (bytes32 node) {
        bytes32 labelHash = keccak256(bytes(label));
        if (ownerOfLabel[labelHash] != address(0)) revert LabelAlreadyTaken();

        ownerOfLabel[labelHash] = owner_;
        ens.setSubnodeRecord(parentNode, labelHash, owner_, address(resolver), 0);

        node = keccak256(abi.encodePacked(parentNode, labelHash));
        emit SubnameRegistered(labelHash, label, owner_);
    }

    /// @notice Batched text record write. Caller must own the subname.
    function setTextRecords(
        string calldata label,
        string[] calldata keys,
        string[] calldata values
    ) external {
        bytes32 labelHash = keccak256(bytes(label));
        if (ownerOfLabel[labelHash] != msg.sender) revert NotLabelOwner();
        require(keys.length == values.length, "len");

        bytes32 node = keccak256(abi.encodePacked(parentNode, labelHash));
        for (uint256 i; i < keys.length; ++i) {
            resolver.setText(node, keys[i], values[i]);
        }
        emit TextRecordsBatched(node, keys.length);
    }
}
