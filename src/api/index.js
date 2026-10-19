import { httpRequest, httpStream } from './http.js'
import { mockRequest, mockDebateTurn } from './mock/server.js'
import { mockUsageRequest } from './mock/usage.js'
import { adaptRealApi } from './real.js'

// VITE_API_MODE=real이면 실제 Spring Boot API, 아니면 같은 계약의 브라우저 목업을 쓴다.
export const API_MODE = import.meta.env.VITE_API_MODE === 'real' ? 'real' : 'mock'
const request = API_MODE === 'real' ? httpRequest : mockRequest
const get = (path, query) => request('GET', path, { query }).then((response) => response.data)
const send = (method, path, body) => request(method, path, { body }).then((response) => response.data)
// 묶음·사용량 API (기획 §15). 목업은 mock/usage.js가 맡아, server.js 등록 없이도 동작한다.
const usageRequest = API_MODE === 'real' ? httpRequest : mockUsageRequest
const usage = (method, path, body) => usageRequest(method, path, { body }).then((response) => response.data)

const rawApi = {
  login: (username, password) => send('POST', '/auth/login', { username, password }),
  logout: () => send('POST', '/auth/logout'),
  me: () => get('/users/me'),
  updateMe: (changes) => send('PATCH', '/users/me', changes),
  health: () => get('/health'),

  topics: () => get('/topics'),
  personas: ({ q, topicId, cursor, limit } = {}) => get('/personas', { q, topicId, cursor, limit }),
  recommendations: (topicIds) => get('/personas/recommendations', { topicIds: topicIds?.length ? topicIds.join(',') : undefined }),
  persona: (id) => get(`/personas/${id}`),
  personaPosts: (id, { cursor, limit } = {}) => get(`/personas/${id}/posts`, { cursor, limit }),
  feed: ({ topicId, following, cursor, limit } = {}) => get('/feed', { topicId, following: following ? 'true' : undefined, cursor, limit }),
  search: (q, type = 'post', { cursor, limit } = {}) => get('/search', { q, type, cursor, limit }),
  post: (id) => get(`/posts/${id}`),

  setInterest: (topicId, on) => send(on ? 'PUT' : 'DELETE', `/users/me/interests/${topicId}`),
  setFollow: (personaId, on) => send(on ? 'PUT' : 'DELETE', `/users/me/follows/${personaId}`),
  follows: ({ cursor, limit } = {}) => get('/users/me/follows', { cursor, limit }),
  setLike: (postId, on) => send(on ? 'PUT' : 'DELETE', `/users/me/posts/${postId}/like`),
  setSaved: (postId, on) => send(on ? 'PUT' : 'DELETE', `/users/me/saved-posts/${postId}`),
  savedPosts: ({ cursor, limit } = {}) => get('/users/me/saved-posts', { cursor, limit }),

  quiz: (postId) => get(`/posts/${postId}/quiz`),
  submitQuiz: (postId, answers) => send('POST', `/posts/${postId}/quiz/attempts`, { answers }),
  quizAttempts: ({ cursor, limit } = {}) => get('/users/me/quiz-attempts', { cursor, limit }),
  reviewItems: ({ status, cursor, limit } = {}) => get('/users/me/review-items', { status, cursor, limit }),
  setReviewStatus: (id, status) => send('PATCH', `/users/me/review-items/${id}`, { status }),

  openConversation: (postId) => send('POST', `/posts/${postId}/study-conversations`),
  conversation: (id) => get(`/study-conversations/${id}`),
  sendMessage: (conversationId, content) => send('POST', `/study-conversations/${conversationId}/messages`, { content }),
  guestChat: (postId, content, history) => send('POST', `/guest/posts/${postId}/chat`, { content, history }),

  // 대담은 회원만 쓴다(비회원 대담 없음). 만들 때는 발언 없이 시작한다.
  createDebate: (personaIds, topic) => send('POST', '/debates', { personaIds, topic }),
  debate: (id) => get(`/debates/${id}`),
  myDebates: ({ cursor, limit } = {}) => get('/users/me/debates', { cursor, limit }),
  sendDebateMessage: (id, content) => send('POST', `/debates/${id}/messages`, { content }),
  endDebate: (id) => send('POST', `/debates/${id}/end`),
  // 발언 스트림. options = { signal, onDelta(text) }, 결과는 저장된 AI 발언이다.
  streamDebateTurn: (id, options) => (API_MODE === 'real' ? httpStream(`/debates/${id}/turns`, options) : mockDebateTurn(id, options)),

  report: (postId, reasonCode, detail) => send('POST', `/posts/${postId}/reports`, { reasonCode, detail }),
  conversationAssessment: (id) => get(`/study-conversations/${id}/assessment`),

  // 묶음 보기·사용량 (회원은 서버 집계, 비회원은 bundle·tip만 받고 저장하지 않는다)
  usageToday: () => usage('GET', '/usage/today'),
  setPledge: (pledgedCount) => usage('PUT', '/usage/today/pledge', { pledgedCount }),
  completeBundle: (postIds) => usage('POST', '/usage/bundles', { postIds }),
  recordStop: () => usage('POST', '/usage/stops'),
}

// 실제 서버 모드에서는 백엔드 응답을 계약 모양으로 바꾼 뒤 화면에 넘긴다.
export const api = API_MODE === 'real' ? adaptRealApi(rawApi) : rawApi
