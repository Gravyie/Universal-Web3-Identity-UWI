// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract UniversalIdentity is ERC721, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    
    Counters.Counter private _tokenIdCounter;
    
    // Mapping from owner to their identity token ID
    mapping(address => uint256) private _ownerToTokenId;
    
    // Mapping to store identity metadata
    mapping(uint256 => string) private _identityData;
    
    event IdentityMinted(address indexed user, uint256 indexed tokenId, string username);
    
    constructor() ERC721("Universal Web3 Identity", "UWI") {}
    
    // Override transfer functions to make tokens soulbound
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override {
        require(from == address(0), "UWI: Token is soulbound and cannot be transferred");
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }
    
    // Mint identity NFT - only one per address
    function mintIdentity(
        address to,
        string memory username,
        string memory metadataURI
    ) public onlyOwner {
        require(_ownerToTokenId[to] == 0, "UWI: Address already has an identity");
        
        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, metadataURI);
        _ownerToTokenId[to] = tokenId;
        _identityData[tokenId] = username;
        
        emit IdentityMinted(to, tokenId, username);
    }
    
    // Get user's identity token ID
    function getIdentityTokenId(address user) public view returns (uint256) {
        return _ownerToTokenId[user];
    }
    
    // Check if user has identity
    function hasIdentity(address user) public view returns (bool) {
        return _ownerToTokenId[user] != 0;
    }
    
    // Get identity username
    function getUsername(uint256 tokenId) public view returns (string memory) {
        require(_exists(tokenId), "UWI: Token does not exist");
        return _identityData[tokenId];
    }
    
    // Override required functions
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }
    
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
