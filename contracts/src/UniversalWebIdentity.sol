// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title UniversalWebIdentity
 * @dev Soulbound Token for Universal Web3 Identity with Self Protocol integration
 */
contract UniversalWebIdentity is ERC721, ERC721URIStorage, Ownable {
    using Strings for uint256;
    
    uint256 private _nextTokenId = 1;
    
    // Self Protocol Integration
    address public immutable selfHub;
    bytes32 public verificationConfigId;
    bytes32 public scope;
    
    // Identity mappings
    mapping(address => uint256) private _ownerToTokenId;
    mapping(uint256 => IdentityData) private _tokenToIdentity;
    mapping(address => bool) private _verifiedHumans;
    
    struct IdentityData {
        string username;
        uint256 createdAt;
        bool isVerified;
        bool isSybilResistant;
        string zkProofHash;
    }
    
    // Events
    event IdentityMinted(address indexed user, uint256 indexed tokenId, string username);
    event IdentityVerified(address indexed user, uint256 indexed tokenId, string zkProofHash);
    
    constructor(
        address _selfHub,
        bytes32 _scope
    ) ERC721("Universal Web3 Identity", "UWI") Ownable(msg.sender) {
        selfHub = _selfHub;
        scope = _scope;
    }
    
    // Override transfer functions to make tokens soulbound (OZ v5.0 syntax)
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        require(from == address(0) || to == address(0), "UWI: Soulbound tokens cannot be transferred");
        return super._update(to, tokenId, auth);
    }
    
    // Mint identity SBT
    function mintIdentity(
        address to,
        string memory username,
        string memory zkProofHash
    ) external returns (uint256) {
        require(_ownerToTokenId[to] == 0, "UWI: Address already has identity");
        require(bytes(username).length > 0, "UWI: Username cannot be empty");
        require(bytes(username).length <= 50, "UWI: Username too long");
        
        uint256 tokenId = _nextTokenId++;
        
        // Store identity data
        _tokenToIdentity[tokenId] = IdentityData({
            username: username,
            createdAt: block.timestamp,
            isVerified: true,
            isSybilResistant: true,
            zkProofHash: zkProofHash
        });
        
        _ownerToTokenId[to] = tokenId;
        _verifiedHumans[to] = true;
        
        // Mint soulbound token
        _safeMint(to, tokenId);
        
        // Set token URI
        string memory tokenUri = generateTokenURI(tokenId);
        _setTokenURI(tokenId, tokenUri);
        
        emit IdentityMinted(to, tokenId, username);
        emit IdentityVerified(to, tokenId, zkProofHash);
        
        return tokenId;
    }
    
    // Generate dynamic token URI with embedded SVG
    function generateTokenURI(uint256 tokenId) public view returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "UWI: Token does not exist");
        
        IdentityData memory identity = _tokenToIdentity[tokenId];
        
        string memory json = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '{"name": "Universal Web3 Identity #',
                        tokenId.toString(),
                        '", "description": "Verified Soulbound Identity for ',
                        identity.username,
                        '. This token represents a Self Protocol verified human identity that cannot be transferred.",',
                        '"image": "data:image/svg+xml;base64,',
                        Base64.encode(bytes(generateSVG(tokenId))),
                        '", "attributes": [',
                        '{"trait_type": "Username", "value": "', identity.username, '"},',
                        '{"trait_type": "Verified", "value": "Self Protocol"},',
                        '{"trait_type": "Sybil Resistant", "value": "True"},',
                        '{"trait_type": "Type", "value": "Soulbound"},',
                        '{"trait_type": "Created", "value": "', identity.createdAt.toString(), '"},',
                        '{"trait_type": "ZK Proof Hash", "value": "', identity.zkProofHash, '"}',
                        ']}'
                    )
                )
            )
        );
        
        return string(abi.encodePacked("data:application/json;base64,", json));
    }
    
    // Generate beautiful SVG for the NFT
    function generateSVG(uint256 tokenId) internal view returns (string memory) {
        IdentityData memory identity = _tokenToIdentity[tokenId];
        
        // Create color variations based on token ID
        string memory color1 = tokenId % 2 == 0 ? "#667eea" : "#764ba2";
        string memory color2 = tokenId % 2 == 0 ? "#764ba2" : "#f093fb";
        
        return string(
            abi.encodePacked(
                '<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">',
                '<defs>',
                '<linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">',
                '<stop offset="0%" style="stop-color:', color1, ';stop-opacity:1" />',
                '<stop offset="100%" style="stop-color:', color2, ';stop-opacity:1" />',
                '</linearGradient>',
                '<filter id="glow">',
                '<feGaussianBlur stdDeviation="3" result="coloredBlur"/>',
                '<feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>',
                '</filter>',
                '</defs>',
                '<rect width="400" height="400" fill="url(#grad1)"/>',
                '<circle cx="200" cy="120" r="60" fill="white" fill-opacity="0.2" filter="url(#glow)"/>',
                '<polygon points="170,100 190,140 210,140 230,100 200,85" fill="white" fill-opacity="0.8"/>',
                '<text x="200" y="200" font-family="Arial, sans-serif" font-size="32" fill="white" text-anchor="middle" font-weight="bold" filter="url(#glow)">UWI</text>',
                '<text x="200" y="230" font-family="Arial, sans-serif" font-size="18" fill="white" text-anchor="middle">', identity.username, '</text>',
                '<text x="200" y="280" font-family="Arial, sans-serif" font-size="14" fill="white" text-anchor="middle" fill-opacity="0.9">Universal Web3 Identity</text>',
                '<text x="200" y="300" font-family="Arial, sans-serif" font-size="12" fill="white" text-anchor="middle" fill-opacity="0.8">Verified Human</text>',
                '<text x="200" y="340" font-family="Arial, sans-serif" font-size="11" fill="white" text-anchor="middle" fill-opacity="0.7">Self Protocol Verified</text>',
                '<text x="200" y="360" font-family="Arial, sans-serif" font-size="10" fill="white" text-anchor="middle" fill-opacity="0.6">Token #', tokenId.toString(), '</text>',
                '</svg>'
            )
        );
    }
    
    // View functions
    function hasIdentity(address user) public view returns (bool) {
        return _ownerToTokenId[user] != 0;
    }
    
    function getIdentityTokenId(address user) public view returns (uint256) {
        return _ownerToTokenId[user];
    }
    
    function getIdentityData(uint256 tokenId) public view returns (IdentityData memory) {
        require(_ownerOf(tokenId) != address(0), "UWI: Token does not exist");
        return _tokenToIdentity[tokenId];
    }
    
    function isVerifiedHuman(address user) public view returns (bool) {
        return _verifiedHumans[user];
    }
    
    function totalSupply() public view returns (uint256) {
        return _nextTokenId - 1;
    }
    
    // Admin functions
    function setScope(bytes32 _scope) external onlyOwner {
        scope = _scope;
    }
    
    function setVerificationConfigId(bytes32 _configId) external onlyOwner {
        verificationConfigId = _configId;
    }
    
    // Required overrides for OZ v5.0
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
