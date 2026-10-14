import { formatEther } from 'viem'
import { attestorAddress, config, publicClient } from './_lib/chain.js'
import { route } from './_lib/http.js'

/** Health and capability check the UI uses to decide which paths to offer. */
export default route(['GET'], async (_req, res) => {
  let balance = null
  if (attestorAddress) {
    balance = await publicClient.getBalance({ address: attestorAddress }).then(formatEther, () => null)
  }
  res.setHeader('Cache-Control', 'public, s-maxage=30')
  return res.status(200).json({
    chainId: config.chainId,
    contracts: { registry: config.registry ?? null, gates: config.gates ?? null },
    relayer: { configured: Boolean(attestorAddress), address: attestorAddress, balance },
    demoIssuance: config.demoIssuance && Boolean(attestorAddress),
    self: { configured: Boolean(config.self.endpoint), endpointType: config.self.endpointType },
  })
})
