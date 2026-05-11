// SPDX-License-Identifier: MIT
pragma solidity 0.8.34;

// forgefmt: disable-start
//
//        ██████╗ ██████╗  █████╗ ██╗███╗   ██╗██████╗ ███████╗██████╗ ██╗ █████╗
//        ██╔══██╗██╔══██╗██╔══██╗██║████╗  ██║██╔══██╗██╔════╝██╔══██╗██║██╔══██╗
//        ██████╔╝██████╔╝███████║██║██╔██╗ ██║██████╔╝█████╗  ██║  ██║██║███████║
//        ██╔══██╗██╔══██╗██╔══██║██║██║╚██╗██║██╔═══╝ ██╔══╝  ██║  ██║██║██╔══██║
//        ██████╔╝██║  ██║██║  ██║██║██║ ╚████║██║     ███████╗██████╔╝██║██║  ██║
//        ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝╚═╝     ╚══════╝╚═════╝ ╚═╝╚═╝  ╚═╝
//
//        Specialty AI Brains as iNFTs · Agent-paid knowledge marketplace
//
// forgefmt: disable-end

import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import { Errors } from "./lib/Errors.sol";

interface IERC721Owner {
    function ownerOf(uint256 tokenId) external view returns (address);
}

/// @title  RoyaltyDistributor
/// @author Brainpedia Team
/// @notice Settles a multi-Brain query payment in a single transaction.
///         Takes a list of (tokenId, amount) pairs and credits each amount
///         to the corresponding Brain owner's pending balance for later
///         pull-collection.
/// @dev    Audit finding #3: pull-payment pattern prevents a reverting Brain
///         owner from DoS-ing the entire batch. Each (tokenId, amount) pair
///         increments `pendingWithdrawals[ownerOf(tokenId)]`. Brain owners
///         call `withdraw()` to collect. Surplus `msg.value` is refunded to
///         the caller at the end of `distribute`.
contract RoyaltyDistributor is ReentrancyGuard {
    // ============ Immutables ============

    IERC721Owner public immutable BRAIN;

    // ============ Storage ============

    /// @notice Brain owner → pending native payment balance (wei).
    mapping(address brainOwner => uint256 amount) public pendingWithdrawals;

    // ============ Events ============

    /// @notice Per-recipient distribution log.
    event Distributed(
        uint256 indexed tokenId,
        address indexed brainOwner,
        address indexed payer,
        uint256 amount,
        bytes32 reason
    );
    event WithdrawnByOwner(address indexed brainOwner, uint256 amount);

    // ============ Constructor ============

    constructor(address brain_) {
        if (brain_ == address(0)) revert Errors.ZeroAddress();
        BRAIN = IERC721Owner(brain_);
    }

    // ============ External: distribute ============

    /// @param tokenIds the Brain iNFTs to pay
    /// @param amounts  amount-in-wei per Brain (must equal `tokenIds.length`)
    /// @param reason   free-form bytes32, typically keccak256(promptHash) for
    ///                 off-chain attribution. Pass 0x0 if not needed.
    function distribute(uint256[] calldata tokenIds, uint256[] calldata amounts, bytes32 reason)
        external
        payable
        nonReentrant
    {
        if (tokenIds.length != amounts.length) revert Errors.LengthMismatch();

        uint256 total;
        for (uint256 i; i < amounts.length; ++i) {
            total += amounts[i];
        }
        if (msg.value < total) revert Errors.InsufficientValue();

        for (uint256 i; i < tokenIds.length; ++i) {
            address brainOwner = BRAIN.ownerOf(tokenIds[i]);
            pendingWithdrawals[brainOwner] += amounts[i];
            emit Distributed(tokenIds[i], brainOwner, msg.sender, amounts[i], reason);
        }

        // Refund any surplus to msg.sender so over-pay doesn't get stuck.
        uint256 refund = msg.value - total;
        if (refund > 0) {
            (bool ok,) = msg.sender.call{ value: refund }("");
            if (!ok) revert Errors.TransferFailed();
        }
    }

    // ============ External: pull-payment withdrawal ============

    /// @notice Brain owners pull their accumulated distribution credits.
    function withdraw() external nonReentrant {
        uint256 amount = pendingWithdrawals[msg.sender];
        if (amount == 0) revert Errors.ZeroAmount();
        pendingWithdrawals[msg.sender] = 0;
        (bool ok,) = msg.sender.call{ value: amount }("");
        if (!ok) revert Errors.TransferFailed();
        emit WithdrawnByOwner(msg.sender, amount);
    }
}
