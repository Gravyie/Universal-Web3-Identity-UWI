// Thin client for /api. Every error is thrown as ApiError with the server's
// stable `code` and human `message`, so UI can branch on code and show message.

export class ApiError extends Error {
  constructor(code, message, status) {
    super(message)
    this.code = code
    this.status = status
  }
}

async function request(path, init) {
  let res
  try {
    res = await fetch(`/api${path}`, init)
  } catch {
    throw new ApiError('Network', "Couldn't reach UWI. Check your connection and try again.")
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new ApiError(data.error?.code ?? 'Http', data.error?.message ?? `Request failed (${res.status}).`, res.status)
  }
  return data
}

const post = (path, body) =>
  request(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

export const api = {
  status: () => request('/status'),
  human: (id) => request(`/v1/humans/${encodeURIComponent(id)}`),
  gate: (id) => request(`/v1/gates/${id}`),
  demo: (payload) => post('/demo', payload),
  relay: (action, payload) => post('/relay', { action, ...payload }),
}
