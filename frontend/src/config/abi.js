import { parseAbi } from 'viem'

export const uwiAbi = parseAbi([
  'struct IdentityData { string username; uint256 createdAt; bool isVerified; bool isSybilResistant; string zkProofHash; }',
  'function mintIdentity(address to, string username, string zkProofHash) returns (uint256)',
  'function hasIdentity(address user) view returns (bool)',
  'function getIdentityTokenId(address user) view returns (uint256)',
  'function getIdentityData(uint256 tokenId) view returns (IdentityData)',
  'function isVerifiedHuman(address user) view returns (bool)',
  'function totalSupply() view returns (uint256)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'event IdentityMinted(address indexed user, uint256 indexed tokenId, string username)',
])
