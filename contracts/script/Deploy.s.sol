// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/UniversalWebIdentity.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Self Protocol Hub addresses
        address selfHub;
        string memory network;
        
        if (block.chainid == 44787) {
            // Celo Alfajores (Testnet)
            selfHub = 0x16ECBA51e18a4a7e61fdC417f0d47AFEeDfbed74;
            network = "Celo Alfajores";
        } else if (block.chainid == 42220) {
            // Celo Mainnet
            selfHub = 0xe57F4773bd9c9d8b6Cd70431117d353298B9f5BF;
            network = "Celo Mainnet";
        } else {
            // Default for local/other chains
            selfHub = address(0x1234567890123456789012345678901234567890);
            network = "Local/Unknown";
        }
        
        bytes32 scope = keccak256(abi.encodePacked("uwi-protocol-v1"));
        
        UniversalWebIdentity uwi = new UniversalWebIdentity(selfHub, scope);
        
        console.log("====================================");
        console.log("Universal Web3 Identity Deployment");
        console.log("====================================");
        console.log("Network:", network);
        console.log("Chain ID:", block.chainid);
        console.log("Contract deployed to:", address(uwi));
        console.log("Self Hub:", selfHub);
        console.log("Scope:", vm.toString(scope));
        console.log("Deployer:", msg.sender);
        console.log("Contract Name:", uwi.name());
        console.log("Contract Symbol:", uwi.symbol());
        console.log("====================================");
        console.log("");
        console.log("Next Steps:");
        console.log("1. Update your frontend .env with:");
        console.log("   VITE_UWI_CONTRACT_ADDRESS=", address(uwi));
        console.log("2. Verify contract on explorer");
        console.log("3. Test minting from your frontend");
        console.log("====================================");
        
        vm.stopBroadcast();
    }
}
