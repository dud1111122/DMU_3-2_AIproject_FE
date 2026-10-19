import { ApiError } from './errors.js'

const BASE = `${import.meta.env.VITE_API_BASE || ''}/api/v1`

// Spring Security 기본 CSRF 쿠키(XSRF-TOKEN)를 변경 요청 헤더로 돌려보낸다.
const csrfToken = () => document.cookie.split('; ').find((item) => item.startsWith('XSRF-TOKEN='))?.split('=')[1]

// 새 브라우저는 XSRF-TOKEN 쿠키가 없으므로 변경 요청 전에 한 번 발급받는다.
async function ensureCsrf() {
  if (!csrfToken()) await fetch(`${BASE}/auth/csrf`, { credentials: 'include' }).catch(() => {})
}

export async function httpRequest(method, path, { query, body } = {}) {
  const params = new URLSearchParams(Object.entries(query || {}).filter(([, value]) => value !== undefined && value !== null && value !== ''))
  const url = `${BASE}${path}${params.size ? `?${params}` : ''}`
  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (method !== 'GET') await ensureCsrf()
  if (method !== 'GET' && csrfToken()) headers['X-XSRF-TOKEN'] = decodeURIComponent(csrfToken())
  let response
  try {
    response = await fetch(url, { method, headers, credentials: 'include', body: body === undefined ? undefined : JSON.stringify(body) })
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', null)
  }
  if (response.status === 204) return { status: 204, data: null }
  const json = await response.json().catch(() => null)
  if (!response.ok) throw new ApiError(response.status, json?.error?.code || 'UNKNOWN', json?.error?.message || null, json?.error?.fields || [], json?.error || {})
  return { status: response.status, data: json?.data ?? null }
}

// POST 발언 스트림(text/event-stream). EventSource는 POST를 못 하므로 fetch 본문을 직접 읽는다.
// 사전 오류(404·409·503 등)는 일반 JSON 오류로 오고, 스트림 중 오류는 `error` 이벤트로 온다.
// 성공하면 마지막 `turn` 이벤트의 저장된 발언을 돌려준다. delta마다 onDelta(text)를 부른다.
export async function httpStream(path, { signal, onDelta } = {}) {
  await ensureCsrf()
  const headers = { Accept: 'text/event-stream' }
  if (csrfToken()) headers['X-XSRF-TOKEN'] = decodeURIComponent(csrfToken())
  let response
  try {
    response = await fetch(`${BASE}${path}`, { method: 'POST', headers, credentials: 'include', signal })
  } catch (failure) {
    if (failure?.name === 'AbortError') throw failure
    throw new ApiError(0, 'NETWORK_ERROR', null)
  }
  const isStream = (response.headers.get('Content-Type') || '').includes('text/event-stream')
  if (!response.ok || !isStream || !response.body) {
    const json = await response.json().catch(() => null)
    throw new ApiError(response.status, json?.error?.code || 'UNKNOWN', json?.error?.message || null, json?.error?.fields || [], json?.error || {})
  }

  let turn = null
  // 한 블록(빈 줄로 끝난 묶음)을 해석한다. 여러 줄 data는 줄바꿈으로 이어 붙인다.
  const handle = (block) => {
    let event = 'message'
    const data = []
    for (const line of block.split('\n')) {
      if (!line || line.startsWith(':')) continue
      const colon = line.indexOf(':')
      const field = colon === -1 ? line : line.slice(0, colon)
      const value = colon === -1 ? '' : line.slice(colon + 1).replace(/^ /, '')
      if (field === 'event') event = value
      else if (field === 'data') data.push(value)
    }
    if (!data.length) return
    let payload
    try { payload = JSON.parse(data.join('\n')) } catch { throw new ApiError(0, 'STREAM_INTERRUPTED', null) }
    if (event === 'delta') onDelta?.(payload.text ?? '')
    else if (event === 'turn') turn = payload
    else if (event === 'error') throw new ApiError(0, payload.code || 'UNKNOWN', payload.message || null, [], payload)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  try {
    for (;;) {
      const { value, done } = await reader.read()
      if (done) break
      // CRLF를 LF로 맞추되 끝에 남은 CR은 다음 조각과 합쳐서 판단한다.
      buffer = (buffer + decoder.decode(value, { stream: true })).replace(/\r\n/g, '\n')
      let end = buffer.indexOf('\n\n')
      while (end !== -1) {
        const block = buffer.slice(0, end)
        buffer = buffer.slice(end + 2)
        handle(block)
        end = buffer.indexOf('\n\n')
      }
    }
    buffer = (buffer + decoder.decode()).replace(/\r\n/g, '\n').trim()
    if (buffer) handle(buffer)
  } catch (failure) {
    await reader.cancel().catch(() => {})
    throw failure
  }
  if (!turn) throw new ApiError(0, 'STREAM_INTERRUPTED', null)
  return turn
}
