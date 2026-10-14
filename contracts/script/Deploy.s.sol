// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {UWIRegistry} from "../src/UWIRegistry.sol";
import {UWIGates} from "../src/UWIGates.sol";

/// forge script script/Deploy.s.sol --rpc-url hedera_testnet --broadcast
/// Env: PRIVATE_KEY (deployer + owner), ATTESTOR (optional, defaults to deployer)
contract Deploy is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(pk);
        address attestor = vm.envOr("ATTESTOR", deployer);

        vm.startBroadcast(pk);
        UWIRegistry registry = new UWIRegistry(deployer, attestor);
        UWIGates gates = new UWIGates(registry);
        vm.stopBroadcast();

        console.log("UWIRegistry:", address(registry));
        console.log("UWIGates:   ", address(gates));
        console.log("Attestor:   ", attestor);
    }
}
