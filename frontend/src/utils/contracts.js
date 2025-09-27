import { parseEther } from 'viem'

// Contract configuration
export const UWI_CONTRACT_CONFIG = {
  address: import.meta.env.VITE_UWI_CONTRACT_ADDRESS,
  abi: [
    "function mintIdentity(address to, string memory username, string memory zkProofHash) external returns (uint256)",
    "function hasIdentity(address user) public view returns (bool)",
    "function getIdentityTokenId(address user) public view returns (uint256)",
    "function getIdentityData(uint256 tokenId) public view returns (tuple(string username, uint256 createdAt, bool isVerified, bool isSybilResistant, string zkProofHash))",
    "function isVerifiedHuman(address user) public view returns (bool)",
    "function totalSupply() public view returns (uint256)",
    "function tokenURI(uint256 tokenId) public view returns (string)",
    "function ownerOf(uint256 tokenId) public view returns (address)",
    "function name() public view returns (string)",
    "function symbol() public view returns (string)"
  ]
}

// Real contract minting function
export const mintIdentityNFT = async (writeContract, identityData) => {
  try {
    console.log('🚀 Minting UWI with real contract:', UWI_CONTRACT_CONFIG.address)
    console.log('📊 Identity data:', identityData)

    const result = await writeContract({
      ...UWI_CONTRACT_CONFIG,
      functionName: 'mintIdentity',
      args: [
        identityData.walletAddress,
        identityData.username,
        identityData.zkProofHash || `zk_proof_${Date.now()}`
      ]
    })

    console.log('✅ Transaction sent:', result)
    return {
      hash: result,
      success: true,
      tokenId: null // Will be determined from transaction receipt
    }
  } catch (error) {
    console.error('❌ Minting failed:', error)
    throw new Error(`Contract minting failed: ${error.message}`)
  }
}

// Check if user already has identity
export const checkUserIdentity = async (readContract, address) => {
  try {
    const hasIdentity = await readContract({
      ...UWI_CONTRACT_CONFIG,
      functionName: 'hasIdentity',
      args: [address]
    })

    if (hasIdentity) {
      const tokenId = await readContract({
        ...UWI_CONTRACT_CONFIG,
        functionName: 'getIdentityTokenId',
        args: [address]
      })

      const identityData = await readContract({
        ...UWI_CONTRACT_CONFIG,
        functionName: 'getIdentityData',
        args: [tokenId]
      })

      return {
        hasIdentity: true,
        tokenId: tokenId.toString(),
        username: identityData[0], // username
        createdAt: identityData[1], // createdAt
        isVerified: identityData[2], // isVerified
        zkProofHash: identityData[4] // zkProofHash
      }
    }

    return { hasIdentity: false }
  } catch (error) {
    console.error('Error checking identity:', error)
    return { hasIdentity: false, error: error.message }
  }
}

// Get token metadata
export const getTokenMetadata = async (readContract, tokenId) => {
  try {
    const tokenURI = await readContract({
      ...UWI_CONTRACT_CONFIG,
      functionName: 'tokenURI',
      args: [tokenId]
    })

    return { tokenURI, success: true }
  } catch (error) {
    console.error('Error getting token metadata:', error)
    return { success: false, error: error.message }
  }
}
