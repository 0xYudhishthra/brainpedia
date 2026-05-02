// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

interface IERC721Owner {
    function ownerOf(uint256 tokenId) external view returns (address);
}

/// @title  RoyaltyDistributor
/// @notice Settles a multi-Brain query payment in a single transaction —
///         takes a list of (tokenId, amount) pairs and forwards each amount
///         to the corresponding Brain's owner.
///
/// @dev    The orchestrator (or a payment-relayer agent) computes the
///         citation-weighted splits off chain, then calls `distribute` once
///         with `msg.value` equal to `Σ amounts`. Each Brain owner receives
///         their share via raw `call` (so contracts can receive too) and an
///         `Distributed` event is emitted per token. If `msg.value` is
///         greater than the sum, the surplus is refunded to msg.sender so
///         the orchestrator never accidentally over-pays.
///
///         Why a separate contract (rather than a multicall on Brain.sol):
///         keeps the iNFT contract focused on intelligence-data semantics,
///         lets us iterate on royalty-split rules (citation-weighted today;
///         confidence-weighted, time-decayed, etc. later) without touching
///         the iNFT owner storage. Brain.sol stays minimal.
contract RoyaltyDistributor {
    IERC721Owner public immutable brain;

    /// @notice Distribution log per recipient.
    event Distributed(
        uint256 indexed tokenId,
        address indexed brainOwner,
        address indexed payer,
        uint256 amount,
        bytes32 reason
    );

    error LengthMismatch();
    error InsufficientValue();
    error TransferFailed();

    constructor(address brain_) {
        brain = IERC721Owner(brain_);
    }

    /// @param tokenIds  the Brain iNFTs to pay
    /// @param amounts   amount-in-wei per Brain (must equal `tokenIds.length`)
    /// @param reason    free-form bytes32 — typically keccak256(promptHash) for
    ///                  off-chain attribution. Pass 0x0 if not needed.
    function distribute(
        uint256[] calldata tokenIds,
        uint256[] calldata amounts,
        bytes32 reason
    ) external payable {
        if (tokenIds.length != amounts.length) revert LengthMismatch();

        uint256 total;
        for (uint256 i; i < amounts.length; ++i) total += amounts[i];
        if (msg.value < total) revert InsufficientValue();

        for (uint256 i; i < tokenIds.length; ++i) {
            address brainOwner = brain.ownerOf(tokenIds[i]);
            (bool ok, ) = brainOwner.call{value: amounts[i]}("");
            if (!ok) revert TransferFailed();
            emit Distributed(tokenIds[i], brainOwner, msg.sender, amounts[i], reason);
        }

        // Refund any surplus to msg.sender so over-pay doesn't get stuck.
        uint256 refund = msg.value - total;
        if (refund > 0) {
            (bool ok, ) = msg.sender.call{value: refund}("");
            if (!ok) revert TransferFailed();
        }
    }
}
