// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {Brain} from "../src/Brain.sol";

/// @notice Deploys only Brain.sol — used on the 0G Galileo testnet (chain id 16602)
///         where ENS doesn't exist. ENS registrars deploy to Sepolia separately.
contract DeployBrain is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(pk);
        vm.startBroadcast(pk);
        Brain brain = new Brain(deployer);
        vm.stopBroadcast();
        console.log("Brain:    ", address(brain));
        console.log("Deployer: ", deployer);
    }
}
