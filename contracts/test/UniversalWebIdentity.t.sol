// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/UniversalWebIdentity.sol";

contract UniversalWebIdentityTest is Test {
    UniversalWebIdentity public uwi;
    
    address public selfHub = address(0x1234567890123456789012345678901234567890);
    bytes32 public scope = keccak256(abi.encodePacked("test-scope"));
    
    address public user = address(0x1);
    string public username = "testuser";
    string public zkProofHash = "mock_zk_proof_hash";
    
    function setUp() public {
        uwi = new UniversalWebIdentity(selfHub, scope);
    }
    
    function testMintIdentity() public {
        // Test minting
        uint256 tokenId = uwi.mintIdentity(user, username, zkProofHash);
        
        // Verify token was minted
        assertEq(tokenId, 1);
        assertEq(uwi.ownerOf(tokenId), user);
        assertEq(uwi.hasIdentity(user), true);
        assertEq(uwi.getIdentityTokenId(user), tokenId);
        
        // Verify identity data
        UniversalWebIdentity.IdentityData memory data = uwi.getIdentityData(tokenId);
        assertEq(data.username, username);
        assertEq(data.isVerified, true);
        assertEq(data.isSybilResistant, true);
        assertEq(data.zkProofHash, zkProofHash);
    }
    
    function testPreventDuplicateIdentity() public {
        // Mint first identity
        uwi.mintIdentity(user, username, zkProofHash);
        
        // Try to mint second identity for same user - should fail
        vm.expectRevert("UWI: Address already has identity");
        uwi.mintIdentity(user, "newusername", "new_proof");
    }
    
    function testSoulboundTransfer() public {
        // Mint identity
        uint256 tokenId = uwi.mintIdentity(user, username, zkProofHash);
        
        // Try to transfer - should fail
        vm.prank(user);
        vm.expectRevert("UWI: Soulbound tokens cannot be transferred");
        uwi.transferFrom(user, address(0x2), tokenId);
    }
    
    function testTokenURI() public {
        uint256 tokenId = uwi.mintIdentity(user, username, zkProofHash);
        
        string memory tokenURI = uwi.tokenURI(tokenId);
        
        // Token URI should start with data:application/json;base64,
        assertTrue(bytes(tokenURI).length > 0);
    }
}
