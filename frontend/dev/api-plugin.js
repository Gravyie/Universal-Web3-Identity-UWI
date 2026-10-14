import fs from 'node:fs'
import path from 'node:path'

/**
 * Serves /api/* from the same files Vercel deploys, so `npm run dev` runs the
 * whole product. Supports Vercel's `[param].js` dynamic segments and the
 * req.query / res.status().json() helpers the handlers use.
 */
export function devApi({ dir = 'api' } = {}) {
  return {
    name: 'uwi-dev-api',
    configureServer(server) {
      const root = path.resolve(server.config.root, dir)

      const resolve = (segments) => {
        let current = root
        const params = {}
        for (const [i, seg] of segments.entries()) {
          const last = i === segments.length - 1
          const exact = path.join(current, last ? `${seg}.js` : seg)
          if (fs.existsSync(exact)) {
            current = exact
            continue
          }
          const dynamic = fs.readdirSync(current).find((f) => /^\[.+\](\.js)?$/.test(f) && (last ? f.endsWith('.js') : !f.endsWith('.js')))
          if (!dynamic) return null
          params[dynamic.replace(/^\[|\](\.js)?$/g, '')] = decodeURIComponent(seg)
          current = path.join(current, dynamic)
        }
        return current.endsWith('.js') ? { file: current, params } : null
      }

      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url, 'http://localhost')
        if (!url.pathname.startsWith(`/${dir}/`)) return next()
        const match = resolve(url.pathname.slice(dir.length + 2).split('/').filter(Boolean))
        if (!match || path.basename(match.file).startsWith('_')) return next()

        let raw = ''
        for await (const chunk of req) raw += chunk
        req.query = { ...Object.fromEntries(url.searchParams), ...match.params }
        try {
          req.body = raw ? JSON.parse(raw) : {}
        } catch {
          req.body = raw
        }
        res.status = (code) => ((res.statusCode = code), res)
        res.json = (data) => {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(data))
          return res
        }
        res.send = (data) => (res.end(data), res)

        try {
          const mod = await server.ssrLoadModule(match.file)
          await mod.default(req, res)
        } catch (error) {
          server.config.logger.error(`[api] ${url.pathname}: ${error.stack ?? error}`)
          if (!res.headersSent) res.status(500).json({ error: { code: 'Internal', message: error.message } })
        }
      })
    },
  }
}
