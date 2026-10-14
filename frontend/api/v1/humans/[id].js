// GET /api/v1/humans/:id — id is a wallet address or a username.
// Public, CORS-enabled, edge-cached for 15 s. The same answer a contract gets
// from isVerifiedHuman(), for backends that don't want to talk to a chain.
import { lookupHuman } from '../../_lib/credentials.js'
import { route } from '../../_lib/http.js'

export default route(['GET'], async (req, res) => {
  const id = String(req.query.id ?? '').trim()
  if (!id) return res.status(400).json({ error: { code: 'BadRequest', message: 'Pass an address or username.' } })
  const human = await lookupHuman(id)
  res.setHeader('Cache-Control', 'public, s-maxage=15, stale-while-revalidate=60')
  return res.status(200).json(human)
})
