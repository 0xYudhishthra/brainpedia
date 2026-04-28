// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {Brain} from "../src/Brain.sol";
import {SubnameRegistrar} from "../src/SubnameRegistrar.sol";
import {AccessTokenRegistrar} from "../src/AccessTokenRegistrar.sol";

/// @notice Deploys Brain + the two registrars. Reads everything from env.
///
/// Required env:
///   PRIVATE_KEY            deployer key
///   ENS_REGISTRY           ENS Registry address (Sepolia / mainnet — see ensjs)
///   ENS_PUBLIC_RESOLVER    ENS Public Resolver address
///   ENS_PARENT_NODE        namehash(parentName) — bytes32
///   ENS_CLIENT_PARENT_NODE namehash("client." + parentName) — bytes32
contract Deploy is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address ensRegistry = vm.envAddress("ENS_REGISTRY");
        address resolver = vm.envAddress("ENS_PUBLIC_RESOLVER");
        bytes32 parentNode = vm.envBytes32("ENS_PARENT_NODE");
        bytes32 clientParentNode = vm.envBytes32("ENS_CLIENT_PARENT_NODE");
        address deployer = vm.addr(pk);

        vm.startBroadcast(pk);

        Brain brain = new Brain(deployer);
        SubnameRegistrar subnames = new SubnameRegistrar(
            ensRegistry,
            resolver,
            parentNode,
            deployer
        );
        AccessTokenRegistrar accessTokens = new AccessTokenRegistrar(
            ensRegistry,
            resolver,
            clientParentNode,
            deployer
        );

        vm.stopBroadcast();

        console.log("Brain:                    ", address(brain));
        console.log("SubnameRegistrar:         ", address(subnames));
        console.log("AccessTokenRegistrar:     ", address(accessTokens));
        console.log("Deployer:                 ", deployer);
    }
}
