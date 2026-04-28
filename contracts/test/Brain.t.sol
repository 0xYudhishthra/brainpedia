// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import {Brain} from "../src/Brain.sol";

contract BrainTest is Test {
    Brain brain;
    address owner = address(0xA11CE);
    address alice = address(0xA11CEB0B);
    address agent = address(0xBEEF);

    function setUp() public {
        vm.prank(owner);
        brain = new Brain(owner);
    }

    function test_mint_storesInitialIntelligence() public {
        bytes32 root = bytes32(uint256(0x1234));
        vm.prank(owner);
        uint256 id = brain.mint(alice, root, "v1");
        assertEq(brain.ownerOf(id), alice);
        assertEq(brain.currentStorageRoot(id), root);
        assertEq(brain.intelligenceOf(id).length, 1);
    }

    function test_appendStorageRoot_onlyOwnerCanAppend() public {
        vm.prank(owner);
        uint256 id = brain.mint(alice, bytes32(uint256(1)), "v1");

        bytes32 newRoot = bytes32(uint256(2));
        vm.prank(alice);
        brain.appendStorageRoot(id, newRoot, "v2");

        assertEq(brain.currentStorageRoot(id), newRoot);
        assertEq(brain.intelligenceOf(id).length, 2);

        // non-owner reverts
        vm.expectRevert(bytes("Brain: not owner"));
        vm.prank(agent);
        brain.appendStorageRoot(id, bytes32(uint256(3)), "v3");
    }

    function test_authorizeUsage_setsExpiryAndForwardsPayment() public {
        vm.prank(owner);
        uint256 id = brain.mint(alice, bytes32(uint256(1)), "v1");

        vm.prank(alice);
        brain.setMinPayment(id, 1 ether);

        vm.deal(agent, 5 ether);
        uint256 aliceBalanceBefore = alice.balance;
        vm.prank(agent);
        brain.authorizeUsage{value: 1 ether}(id, agent, 60);

        assertTrue(brain.isAuthorized(id, agent));
        assertEq(alice.balance, aliceBalanceBefore + 1 ether);
    }

    function test_authorizeUsage_revertsBelowMinPayment() public {
        vm.prank(owner);
        uint256 id = brain.mint(alice, bytes32(uint256(1)), "v1");

        vm.prank(alice);
        brain.setMinPayment(id, 1 ether);

        vm.deal(agent, 1 ether);
        vm.expectRevert(bytes("Brain: insufficient payment"));
        vm.prank(agent);
        brain.authorizeUsage{value: 0.5 ether}(id, agent, 60);
    }

    function test_isAuthorized_expiresOverTime() public {
        vm.prank(owner);
        uint256 id = brain.mint(alice, bytes32(uint256(1)), "v1");
        vm.deal(agent, 1 ether);
        vm.prank(agent);
        brain.authorizeUsage{value: 0}(id, agent, 60);
        assertTrue(brain.isAuthorized(id, agent));
        vm.warp(block.timestamp + 61);
        assertFalse(brain.isAuthorized(id, agent));
    }
}
