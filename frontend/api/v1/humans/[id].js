// GET /api/v1/humans/:id — id is a wallet address or a username.
// Public, CORS-enabled, edge-cached for 15 s. The same answer a contract gets
// from isVerifiedHuman(), for backends that don't want to talk to a chain.
import { lookupHuman } from '../../_lib/credentials.js'
import { route } from '../../_lib/http.js'

export default route(['GET'], async (req, res) => {
  const id = String(req.query.id ?? '').trim()
  // an address or a username (3-24 of a-z, 0-9, _); anything else never reaches the chain
  if (!/^0x[0-9a-fA-F]{40}$/.test(id) && !/^[a-z0-9_]{3,24}$/i.test(id)) {
    return res.status(400).json({ error: { code: 'BadRequest', message: 'Pass a wallet address or a username (3-24 letters, digits or _).' } })
  }
  const human = await lookupHuman(id)
  res.setHeader('Cache-Control', 'public, s-maxage=15, stale-while-revalidate=60')
  return res.status(200).json(human)
})
