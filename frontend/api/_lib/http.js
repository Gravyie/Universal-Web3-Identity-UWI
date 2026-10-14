import { explain } from './chain.js'

export function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

/**
 * Wraps a handler with CORS, method checks and uniform error responses:
 * every failure is { error: { code, message } } with a meaningful status.
 */
export function route(methods, handler) {
  return async function wrapped(req, res) {
    cors(res)
    if (req.method === 'OPTIONS') return res.status(204).end()
    if (!methods.includes(req.method)) {
      res.setHeader('Allow', methods.join(', '))
      return res.status(405).json({ error: { code: 'MethodNotAllowed', message: `Use ${methods.join(' or ')}.` } })
    }
    try {
      return await handler(req, res)
    } catch (error) {
      const { code, message } = explain(error)
      const status = error.status ?? (code === 'ChainError' || code === 'Internal' ? 502 : 400)
      if (status >= 500) console.error(`[api] ${req.url}`, error)
      return res.status(status).json({ error: { code, message } })
    }
  }
}

export function body(req) {
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body)
    } catch {
      return {}
    }
  }
  return req.body ?? {}
}
