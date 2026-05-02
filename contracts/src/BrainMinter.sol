// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

interface IBrainMintable {
    function mint(address to, bytes32 initialStorageRoot, string calldata description)
        external
        returns (uint256 tokenId);

    function transferOwnership(address newOwner) external;
}

/// @title  BrainMinter
/// @notice Owns Brain.sol (after Brain.transferOwnership(BrainMinter)) and
///         exposes a *permissionless* mint so anyone can self-onboard a Brain
///         from their own Obsidian vault — they call mintToSender() and the
///         minted iNFT is owned by msg.sender. No owner gating.
///
///         Brain.sol stays at its existing address (`0x4E5c…b08F`) and its
///         existing tokenIds (1-4) keep working — only the right to mint NEW
///         tokens moves to this wrapper.
///
/// @dev    Optional anti-spam fee can be set by the wrapper's admin (the
///         original deployer). Forwarded to admin on next sweep. Default
///         0 wei for the hackathon — anyone can mint for gas only.
///
///         If we ever need to migrate again, this contract has its own
///         `transferBrainOwnership(newOwner)` which forwards the call to
///         Brain.transferOwnership — escape hatch if BrainMinter v2 ships.
contract BrainMinter is Ownable {
    IBrainMintable public immutable brain;

    /// @notice anti-spam fee in wei. 0 = free.
    uint256 public mintFeeWei;

    event Minted(uint256 indexed tokenId, address indexed minter, bytes32 storageRoot);
    event MintFeeUpdated(uint256 newFeeWei);
    event FeesSwept(address indexed to, uint256 amount);

    error InsufficientFee();
    error TransferFailed();

    constructor(address brain_, uint256 initialFeeWei, address initialOwner)
        Ownable(initialOwner)
    {
        brain = IBrainMintable(brain_);
        mintFeeWei = initialFeeWei;
    }

    /// @notice Mint a fresh Brain iNFT to msg.sender. Permissionless.
    /// @param  initialStorageRoot  0G Storage merkle root of the snapshot manifest
    /// @param  description         free-form (specialty / brief / etc.)
    /// @return tokenId             the new token id (assigned by Brain.sol)
    function mintToSender(bytes32 initialStorageRoot, string calldata description)
        external
        payable
        returns (uint256 tokenId)
    {
        if (msg.value < mintFeeWei) revert InsufficientFee();
        tokenId = brain.mint(msg.sender, initialStorageRoot, description);
        emit Minted(tokenId, msg.sender, initialStorageRoot);
    }

    /// @notice Update anti-spam fee. Owner-only.
    function setMintFee(uint256 newFeeWei) external onlyOwner {
        mintFeeWei = newFeeWei;
        emit MintFeeUpdated(newFeeWei);
    }

    /// @notice Sweep accumulated mint fees to a recipient. Owner-only.
    function sweepFees(address payable to) external onlyOwner {
        uint256 bal = address(this).balance;
        (bool ok, ) = to.call{value: bal}("");
        if (!ok) revert TransferFailed();
        emit FeesSwept(to, bal);
    }

    /// @notice Escape hatch — hand Brain.sol ownership to a new minter
    ///         contract if we ever ship v2. Owner-only, irreversible.
    function transferBrainOwnership(address newOwner) external onlyOwner {
        brain.transferOwnership(newOwner);
    }
}
