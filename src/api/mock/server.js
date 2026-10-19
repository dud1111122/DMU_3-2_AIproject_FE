import { ApiError } from '../errors.js'
import { demoAccounts, personas, topics } from '../../data/catalog.js'
import { seedPosts } from '../../data/posts.js'
import { chatReply, debateBody, debateSummary } from './mockAi.js'

// 기획/BE_Endpoint.md 계약을 브라우저 안에서 흉내 내는 목업 서버. 회원 기록은 localStorage에 둔다.
const DB_KEY = 'de-shorts:mock-db'
const AI_CONFIGURED = import.meta.env.VITE_MOCK_AI !== 'off'
const LATENCY_MS = 250
const REPORT_REASONS = ['INACCURATE', 'FAKE_QUOTE', 'HARMFUL', 'INAPPROPRIATE', 'OTHER']

const counters = { section: 1000, keyPoint: 2000, question: 4000, source: 3000 }
const nextSeed = (kind) => String(++counters[kind])
const posts = seedPosts.map((raw) => {
  const sections = raw.sections.map((section, index) => ({ id: nextSeed('section'), order: index + 1, title: section.title ?? null, body: section.body, citationType: section.citationType || 'RECONSTRUCTION', quoteAttribution: section.quoteAttribution ?? null, image: section.image ?? null }))
  const keyPoints = raw.keyPoints.map((keyPoint, index) => ({ id: nextSeed('keyPoint'), order: index + 1, text: keyPoint.text, sectionOrder: keyPoint.sectionOrder ?? null, sectionId: sections.find((section) => section.order === keyPoint.sectionOrder)?.id ?? null }))
  const questions = raw.questions.map((question, index) => ({ id: nextSeed('question'), order: index + 1, keyPointId: keyPoints[question.keyPointIndex].id, text: question.text, options: question.options.map((text, optionIndex) => ({ order: optionIndex + 1, text })), correctOptionOrder: question.correctOptionOrder, explanation: question.explanation }))
  const sources = raw.sources.map((source) => ({ id: nextSeed('source'), title: source.title, author: source.author ?? null, url: source.url ?? null, verified: Boolean(source.verified), checkedAt: source.checkedAt ?? null }))
  return { ...raw, groundingMode: 'MODEL_KNOWLEDGE', sections, keyPoints, questions, sources }
})

const emptyDb = () => ({ sessionUserId: null, users: Object.fromEntries(demoAccounts.map((account) => [account.id, { ...account }])), interests: {}, follows: {}, likes: {}, saved: {}, attempts: {}, reviews: {}, conversations: {}, debates: {}, reports: {}, seq: 10000 })
let db = (() => { try { return { ...emptyDb(), ...JSON.parse(localStorage.getItem(DB_KEY) || '{}') } } catch { return emptyDb() } })()
const save = () => { try { localStorage.setItem(DB_KEY, JSON.stringify(db)) } catch { /* 저장소를 못 써도 현재 세션은 계속 동작한다 */ } }
const nextId = () => String(++db.seq)
const bucket = (name, uid) => (db[name][uid] ||= [])
const now = () => new Date().toISOString()
const RESPONSE = Symbol('response')
const created = (data) => ({ [RESPONSE]: true, status: 201, data })
const noContent = () => ({ [RESPONSE]: true, status: 204, data: null })

const fail = (status, code, message, meta) => { throw new ApiError(status, code, message, [], meta) }
const failValidation = (fields) => { throw new ApiError(400, 'VALIDATION_FAILED', '입력한 내용을 다시 확인해 주세요.', fields) }
const needUser = (ctx) => ctx.uid || fail(401, 'UNAUTHORIZED', '로그인이 필요해요.')
const needAi = () => AI_CONFIGURED || fail(503, 'AI_NOT_CONFIGURED', 'AI 기능이 아직 설정되지 않았어요.')
const findPost = (id) => posts.find((post) => post.id === id) || fail(404, 'NOT_FOUND', '게시물을 찾을 수 없어요.')
const findPersona = (id) => personas.find((persona) => persona.id === id) || fail(404, 'NOT_FOUND', '페르소나를 찾을 수 없어요.')
const byIdAsc = (a, b) => Number(a.id) - Number(b.id)
const latestFirst = (a, b) => b.publishedAt.localeCompare(a.publishedAt) || Number(b.id) - Number(a.id)

function page(items, query) {
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 20))
  const start = Number(query.cursor) || 0
  const next = start + limit
  return { items: items.slice(start, next), nextCursor: next < items.length ? String(next) : null }
}

const topicRef = (id) => { const topic = topics.find((item) => item.id === id); return { id: topic.id, name: topic.name } }
const personaRef = (persona) => ({ id: persona.id, username: persona.username, displayName: persona.displayName, aiPersona: true })
const personaDto = (persona, uid) => ({
  ...personaRef(persona), era: persona.era, bio: persona.bio, avatarUrl: null, aiDisclosure: '실제 인물이 아닌 AI 재현입니다.',
  topics: persona.topicIds.map(topicRef), postCount: posts.filter((post) => post.personaId === persona.id).length,
  userState: { authenticated: Boolean(uid), following: Boolean(uid) && bucket('follows', uid).includes(persona.id) },
})
const likeCount = (post) => post.likeBase + Object.values(db.likes).filter((ids) => ids.includes(post.id)).length
const postDto = (post, uid) => ({
  id: post.id, persona: personaRef(findPersona(post.personaId)), title: post.title, summary: post.summary, caption: post.caption,
  groundingMode: post.groundingMode, publishedAt: post.publishedAt, likeCount: likeCount(post), topics: post.topicIds.map(topicRef),
  sections: post.sections, keyPoints: post.keyPoints.map(({ id, order, text, sectionId }) => ({ id, order, text, sectionId })), sources: post.sources,
  userState: { authenticated: Boolean(uid), liked: Boolean(uid) && bucket('likes', uid).includes(post.id), saved: Boolean(uid) && bucket('saved', uid).some((item) => item.postId === post.id), followingPersona: Boolean(uid) && bucket('follows', uid).includes(post.personaId) },
})
const userDto = (uid) => { const user = db.users[uid]; return { id: user.id, username: user.username, displayName: user.displayName, bio: user.bio, avatarUrl: null, role: user.role, interests: bucket('interests', uid).map(topicRef) } }

function upsertReview(uid, post, keyPointId, reason) {
  const items = bucket('reviews', uid)
  const found = items.find((item) => item.keyPointId === keyPointId)
  if (found) Object.assign(found, { status: 'OPEN', reason, completedAt: null, updatedAt: now() })
  else items.push({ id: nextId(), postId: post.id, keyPointId, reason, status: 'OPEN', updatedAt: now(), completedAt: null })
}
const reviewDto = (item) => { const post = findPost(item.postId); return { id: item.id, status: item.status, reason: item.reason, updatedAt: item.updatedAt, completedAt: item.completedAt, keyPoint: { id: item.keyPointId, text: post.keyPoints.find((keyPoint) => keyPoint.id === item.keyPointId).text }, post: { id: post.id, title: post.title, persona: personaRef(findPersona(post.personaId)) } } }

const conversationDto = (conversation) => { const post = findPost(conversation.postId); return { id: conversation.id, post: { id: post.id, title: post.title }, persona: personaRef(findPersona(post.personaId)), messages: conversation.messages, assessments: Object.entries(conversation.assessments).map(([keyPointId, value]) => ({ keyPointId, ...value })) } }
const findConversation = (uid, id) => bucket('conversations', uid).find((item) => item.id === id) || fail(404, 'NOT_FOUND', '대화를 찾을 수 없어요.')
function validContent(content) {
  const text = typeof content === 'string' ? content.trim() : ''
  if (!text || text.length > 2000) fail(400, 'INVALID_CONTENT', '메시지는 1~2000자로 입력해 주세요.')
  return text
}

const kstDate = (iso = now()) => new Date(new Date(iso).getTime() + 9 * 3600 * 1000).toISOString().slice(0, 10)
const DEBATE_TURN_LIMIT = 30
const debatesInProgress = new Set()
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const debatePersona = (persona) => ({ id: persona.id, username: persona.username, displayName: persona.displayName, avatarPath: null, avatarUrl: null, aiDisclosure: '실제 인물이 아닌 AI 재현입니다.' })
const findDebate = (uid, id) => bucket('debates', uid).find((item) => item.id === id) || fail(404, 'NOT_FOUND', '토론을 찾을 수 없어요.')
const debateDto = (item) => ({ id: item.id, status: item.status, topic: item.topic, personas: item.personaIds.map((id) => debatePersona(findPersona(id))), turns: item.turns, summary: item.summary, turnCount: item.turns.length, turnLimit: DEBATE_TURN_LIMIT, remainingTurns: DEBATE_TURN_LIMIT - item.turns.length, createdAt: item.createdAt, endedAt: item.endedAt })
const debateListDto = (item) => ({ id: item.id, status: item.status, topic: item.topic, personas: item.personaIds.map((id) => debatePersona(findPersona(id))), turnCount: item.turns.length, createdAt: item.createdAt })
// 진행 중인 대담에 발언을 더할 수 있는지 확인한다. 실제 서버와 같은 오류 코드를 쓴다.
function ensureOpenDebate(item) {
  if (item.status === 'ENDED') fail(409, 'DEBATE_ENDED', '이미 끝난 대담입니다.')
  if (item.turns.length >= DEBATE_TURN_LIMIT) fail(409, 'TURN_LIMIT_REACHED', `발언 한도(${DEBATE_TURN_LIMIT}개)에 도달했습니다.`)
  if (debatesInProgress.has(item.id)) fail(409, 'REQUEST_IN_PROGRESS', '이전 발언을 만드는 중입니다. 잠시 후 다시 시도해 주세요.')
}
// 마지막(30번째) 발언이 저장되면 서버가 요약을 만들고 ENDED로 바꾼다(AI·사용자 발언 모두 해당).
function finishWhenFull(item) {
  if (item.status !== 'ACTIVE' || item.turns.length < DEBATE_TURN_LIMIT) return
  const [a, b] = item.personaIds.map(findPersona)
  item.summary = debateSummary(a, b, item.topic)
  item.status = 'ENDED'
  item.endedAt = now()
}
function debateInput(body) {
  const ids = Array.isArray(body?.personaIds) ? body.personaIds.map(String) : []
  const topic = typeof body?.topic === 'string' ? body.topic.trim() : ''
  if (ids.length !== 2 || ids[0] === ids[1]) failValidation([{ field: 'personaIds', message: '서로 다른 페르소나 두 명을 골라 주세요.' }])
  if (!topic || topic.length > 200) failValidation([{ field: 'topic', message: '논제는 1~200자로 입력해 주세요.' }])
  return { a: findPersona(ids[0]), b: findPersona(ids[1]), ids, topic }
}

const routes = []
const on = (method, pattern, handler) => routes.push({ method, pattern: new RegExp(`^${pattern.replace(/\{(\w+)\}/g, '(?<$1>[^/]+)')}$`), handler })

on('POST', '/auth/login', ({ body }) => {
  const user = Object.values(db.users).find((item) => item.username === body?.username && item.password === body?.password)
  if (!user) fail(401, 'INVALID_CREDENTIALS', '아이디 또는 비밀번호가 올바르지 않아요.')
  db.sessionUserId = user.id
  return userDto(user.id)
})
on('POST', '/auth/logout', (ctx) => { needUser(ctx); db.sessionUserId = null; return noContent() })
on('GET', '/users/me', (ctx) => userDto(needUser(ctx)))
on('PATCH', '/users/me', (ctx) => {
  const uid = needUser(ctx)
  const { displayName, bio } = ctx.body || {}
  if (displayName !== undefined && (!displayName.trim() || displayName.length > 50)) fail(400, 'INVALID_DISPLAY_NAME', '이름은 1~50자로 입력해 주세요.')
  Object.assign(db.users[uid], displayName !== undefined && { displayName: displayName.trim() }, bio !== undefined && { bio: String(bio).slice(0, 300) })
  return userDto(uid)
})
on('GET', '/health', () => ({ status: 'ok', ai: AI_CONFIGURED ? 'configured' : 'not-configured' }))
on('GET', '/topics', () => topics.map((topic) => topicRef(topic.id)))

on('GET', '/personas', ({ query, uid }) => {
  const q = (query.q || '').trim().toLowerCase()
  const items = personas.filter((persona) => (!q || `${persona.displayName} ${persona.bio}`.toLowerCase().includes(q)) && (!query.topicId || persona.topicIds.includes(query.topicId)))
  return page(items.sort(byIdAsc).map((persona) => personaDto(persona, uid)), query)
})
on('GET', '/personas/recommendations', ({ query, uid }) => {
  const wanted = (query.topicIds ? String(query.topicIds).split(',') : uid ? bucket('interests', uid) : []).filter((id) => topics.some((topic) => topic.id === id)).slice(0, 10)
  const scored = personas.map((persona) => ({ persona, matchCount: persona.topicIds.filter((id) => wanted.includes(id)).length }))
  const ranked = wanted.length ? scored.filter((item) => item.matchCount > 0).sort((a, b) => b.matchCount - a.matchCount || byIdAsc(a.persona, b.persona)) : scored.sort((a, b) => byIdAsc(a.persona, b.persona))
  return { items: ranked.slice(0, 10).map(({ persona, matchCount }) => ({ ...personaDto(persona, uid), matchCount })), topicIds: wanted }
})
on('GET', '/personas/{id}', ({ params, uid }) => personaDto(findPersona(params.id), uid))
on('GET', '/personas/{id}/posts', ({ params, query, uid }) => { findPersona(params.id); return page(posts.filter((post) => post.personaId === params.id).sort(latestFirst).map((post) => postDto(post, uid)), query) })
on('GET', '/feed', (ctx) => {
  const { query, uid } = ctx
  const following = query.following === 'true' || query.following === true
  if (following) needUser(ctx)
  const items = posts.filter((post) => (!query.topicId || post.topicIds.includes(query.topicId)) && (!following || bucket('follows', uid).includes(post.personaId)))
  return page(items.sort(latestFirst).map((post) => postDto(post, uid)), query)
})
on('GET', '/search', ({ query, uid }) => {
  const q = (query.q || '').trim().toLowerCase()
  const type = query.type || 'post'
  if (!['post', 'persona', 'topic'].includes(type)) fail(400, 'INVALID_TYPE', '검색 종류가 올바르지 않아요.')
  if (!q) return { items: [], nextCursor: null }
  const desc = (a, b) => Number(b.id) - Number(a.id)
  if (type === 'persona') return page(personas.filter((persona) => `${persona.displayName} ${persona.username} ${persona.bio}`.toLowerCase().includes(q)).sort(desc).map((persona) => personaDto(persona, uid)), query)
  if (type === 'topic') return page(topics.filter((topic) => topic.name.toLowerCase().includes(q)).sort(desc).map((topic) => topicRef(topic.id)), query)
  return page(posts.filter((post) => `${post.title} ${post.summary} ${post.sections.map((section) => `${section.title || ''} ${section.body}`).join(' ')} ${findPersona(post.personaId).displayName} ${post.topicIds.map((id) => topicRef(id).name).join(' ')}`.toLowerCase().includes(q)).sort(desc).map((post) => postDto(post, uid)), query)
})
on('GET', '/posts/{id}', ({ params, uid }) => postDto(findPost(params.id), uid))

const toggleIn = (name, uid, id, present) => { const items = bucket(name, uid); const has = items.includes(id); if (present && !has) items.push(id); if (!present && has) items.splice(items.indexOf(id), 1); return noContent() }
on('PUT', '/users/me/interests/{topicId}', (ctx) => { topicRef(ctx.params.topicId); return toggleIn('interests', needUser(ctx), ctx.params.topicId, true) })
on('DELETE', '/users/me/interests/{topicId}', (ctx) => toggleIn('interests', needUser(ctx), ctx.params.topicId, false))
on('PUT', '/users/me/follows/{personaId}', (ctx) => { findPersona(ctx.params.personaId); return toggleIn('follows', needUser(ctx), ctx.params.personaId, true) })
on('DELETE', '/users/me/follows/{personaId}', (ctx) => toggleIn('follows', needUser(ctx), ctx.params.personaId, false))
on('GET', '/users/me/follows', (ctx) => { const uid = needUser(ctx); return page(bucket('follows', uid).map(findPersona).sort(byIdAsc).map((persona) => personaDto(persona, uid)), ctx.query) })
on('PUT', '/users/me/posts/{postId}/like', (ctx) => { findPost(ctx.params.postId); return toggleIn('likes', needUser(ctx), ctx.params.postId, true) })
on('DELETE', '/users/me/posts/{postId}/like', (ctx) => toggleIn('likes', needUser(ctx), ctx.params.postId, false))
on('PUT', '/users/me/saved-posts/{postId}', (ctx) => {
  const uid = needUser(ctx)
  findPost(ctx.params.postId)
  if (!bucket('saved', uid).some((item) => item.postId === ctx.params.postId)) bucket('saved', uid).push({ postId: ctx.params.postId, createdAt: now() })
  return noContent()
})
on('DELETE', '/users/me/saved-posts/{postId}', (ctx) => { const uid = needUser(ctx); db.saved[uid] = bucket('saved', uid).filter((item) => item.postId !== ctx.params.postId); return noContent() })
on('GET', '/users/me/saved-posts', (ctx) => { const uid = needUser(ctx); return page([...bucket('saved', uid)].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((item) => ({ ...postDto(findPost(item.postId), uid), savedAt: item.createdAt })), ctx.query) })

on('GET', '/posts/{postId}/quiz', ({ params }) => { const post = findPost(params.postId); return { postId: post.id, questions: post.questions.map(({ id, order, keyPointId, text, options }) => ({ id, order, keyPointId, text, options })) } })
on('POST', '/posts/{postId}/quiz/attempts', ({ params, body, uid }) => {
  const post = findPost(params.postId)
  const answers = Array.isArray(body?.answers) ? body.answers : []
  const seen = new Set()
  for (const answer of answers) {
    const question = post.questions.find((item) => item.id === String(answer.questionId))
    if (!question || seen.has(question.id) || !question.options.some((option) => option.order === answer.selectedOptionOrder)) fail(400, 'INVALID_ANSWERS', '답안이 올바르지 않아요. 모든 문항에 한 번씩 답해 주세요.')
    seen.add(question.id)
  }
  if (seen.size !== post.questions.length) fail(400, 'INVALID_ANSWERS', '모든 문항에 답해 주세요.')
  const results = post.questions.map((question) => { const selected = answers.find((answer) => String(answer.questionId) === question.id).selectedOptionOrder; return { questionId: question.id, keyPointId: question.keyPointId, selectedOptionOrder: selected, isCorrect: selected === question.correctOptionOrder, correctOptionOrder: question.correctOptionOrder, explanation: question.explanation } })
  const result = { attemptId: null, persisted: false, postId: post.id, correctCount: results.filter((item) => item.isCorrect).length, totalCount: results.length, results, submittedAt: now() }
  if (uid) {
    result.attemptId = nextId()
    result.persisted = true
    bucket('attempts', uid).push(result)
    results.filter((item) => !item.isCorrect).forEach((item) => upsertReview(uid, post, item.keyPointId, 'QUIZ_WRONG'))
  }
  return created(result)
})
on('GET', '/users/me/quiz-attempts', (ctx) => { const uid = needUser(ctx); return page([...bucket('attempts', uid)].reverse().map((attempt) => ({ id: attempt.attemptId, post: { id: attempt.postId, title: findPost(attempt.postId).title }, correctCount: attempt.correctCount, totalCount: attempt.totalCount, submittedAt: attempt.submittedAt })), ctx.query) })
on('GET', '/users/me/quiz-attempts/{id}', (ctx) => bucket('attempts', needUser(ctx)).find((attempt) => attempt.attemptId === ctx.params.id) || fail(404, 'NOT_FOUND', '응시 기록을 찾을 수 없어요.'))
on('GET', '/users/me/review-items', (ctx) => { const uid = needUser(ctx); return page(bucket('reviews', uid).filter((item) => !ctx.query.status || item.status === ctx.query.status).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).map(reviewDto), ctx.query) })
on('PATCH', '/users/me/review-items/{id}', (ctx) => {
  const item = bucket('reviews', needUser(ctx)).find((review) => review.id === ctx.params.id) || fail(404, 'NOT_FOUND', '복습 항목을 찾을 수 없어요.')
  if (!['OPEN', 'DONE'].includes(ctx.body?.status)) fail(400, 'INVALID_STATUS', '상태가 올바르지 않아요.')
  Object.assign(item, { status: ctx.body.status, completedAt: ctx.body.status === 'DONE' ? now() : null, updatedAt: now() })
  return reviewDto(item)
})

on('POST', '/posts/{postId}/study-conversations', (ctx) => {
  const uid = needUser(ctx)
  const post = findPost(ctx.params.postId)
  const found = bucket('conversations', uid).find((item) => item.postId === post.id)
  if (found) return conversationDto(found)
  const conversation = { id: nextId(), postId: post.id, messages: [], assessments: {} }
  bucket('conversations', uid).push(conversation)
  return created(conversationDto(conversation))
})
on('GET', '/study-conversations/{id}', (ctx) => {
  const dto = conversationDto(findConversation(needUser(ctx), ctx.params.id))
  const limit = Math.min(50, Number(ctx.query.limit) || 50)
  const end = ctx.query.beforeMessageId ? dto.messages.findIndex((message) => message.id === ctx.query.beforeMessageId) : dto.messages.length
  return { ...dto, messages: dto.messages.slice(Math.max(0, end - limit), end) }
})
on('GET', '/study-conversations/{id}/assessment', (ctx) => ({ items: conversationDto(findConversation(needUser(ctx), ctx.params.id)).assessments }))
on('POST', '/study-conversations/{id}/messages', (ctx) => {
  const uid = needUser(ctx)
  const conversation = findConversation(uid, ctx.params.id)
  const content = validContent(ctx.body?.content)
  needAi()
  const post = findPost(conversation.postId)
  const previous = Object.fromEntries(Object.entries(conversation.assessments).map(([id, value]) => [id, value.level]))
  const reply = chatReply({ persona: findPersona(post.personaId), post, content, previous })
  const userMessage = { id: nextId(), role: 'USER', content, createdAt: now() }
  const personaMessage = { id: nextId(), role: 'PERSONA', content: reply.content, createdAt: now() }
  conversation.messages.push(userMessage, personaMessage)
  const assessments = reply.assessments.map((item) => ({ ...item, evidenceMessageId: userMessage.id, updatedAt: now() }))
  assessments.forEach(({ keyPointId, ...value }) => {
    conversation.assessments[keyPointId] = value
    if (value.level === 'MISSED') upsertReview(uid, post, keyPointId, 'CHAT_MISSED')
  })
  return created({ userMessage, personaMessage, assessments })
})
on('POST', '/guest/posts/{postId}/chat', ({ params, body }) => {
  const post = findPost(params.postId)
  const content = validContent(body?.content)
  const history = Array.isArray(body?.history) ? body.history : []
  if (history.length > 10 || history.some((item) => !['USER', 'PERSONA'].includes(item.role) || typeof item.content !== 'string' || item.content.length > 2000)) fail(400, 'INVALID_HISTORY', '대화 기록 형식이 올바르지 않아요.')
  needAi()
  const reply = chatReply({ persona: findPersona(post.personaId), post, content })
  return { reply: { role: 'PERSONA', content: reply.content }, assessments: reply.assessments }
})

on('POST', '/debates', (ctx) => {
  const uid = needUser(ctx)
  const { a, b, topic } = debateInput(ctx.body)
  needAi()
  const item = { id: nextId(), personaIds: [a.id, b.id], topic, status: 'ACTIVE', turns: [], summary: null, createdAt: now(), endedAt: null }
  bucket('debates', uid).push(item)
  return created(debateDto(item))
})
on('GET', '/debates/{id}', (ctx) => debateDto(findDebate(needUser(ctx), ctx.params.id)))
on('GET', '/users/me/debates', (ctx) => { const uid = needUser(ctx); return page([...bucket('debates', uid)].reverse().map(debateListDto), ctx.query) })
on('POST', '/debates/{id}/messages', (ctx) => {
  const item = findDebate(needUser(ctx), ctx.params.id)
  const content = typeof ctx.body?.content === 'string' ? ctx.body.content.trim() : ''
  if (!content || content.length > 300) failValidation([{ field: 'content', message: '메시지는 1~300자로 입력해 주세요.' }])
  ensureOpenDebate(item)
  const turn = { order: item.turns.length + 1, speakerType: 'USER', personaId: null, body: content, createdAt: now() }
  item.turns.push(turn)
  finishWhenFull(item)
  return created(turn)
})
on('POST', '/debates/{id}/end', (ctx) => {
  const item = findDebate(needUser(ctx), ctx.params.id)
  if (item.status === 'ENDED') fail(409, 'DEBATE_ENDED', '이미 끝난 대담입니다.')
  if (!item.turns.length) failValidation([{ field: 'turns', message: '발언이 하나 이상 있어야 대담을 마칠 수 있어요.' }])
  if (debatesInProgress.has(item.id)) fail(409, 'REQUEST_IN_PROGRESS', '이전 발언을 만드는 중입니다. 잠시 후 다시 시도해 주세요.')
  needAi()
  const [a, b] = item.personaIds.map(findPersona)
  item.summary = debateSummary(a, b, item.topic)
  item.status = 'ENDED'
  item.endedAt = now()
  return debateDto(item)
})

// 발언 스트림 목업. 실제 서버처럼 발언을 끝까지 만들어 저장하고, 읽는 쪽이 멈추면 읽기만 끊는다.
export async function mockDebateTurn(id, { signal, onDelta } = {}) {
  const uid = needUser({ uid: db.users[db.sessionUserId] ? db.sessionUserId : null })
  const item = findDebate(uid, id)
  needAi()
  ensureOpenDebate(item)
  debatesInProgress.add(item.id)
  try {
    const aiCount = item.turns.filter((turn) => turn.speakerType === 'PERSONA').length
    const [first, second] = item.personaIds.map(findPersona)
    const speaker = aiCount % 2 === 0 ? first : second
    const other = aiCount % 2 === 0 ? second : first
    const body = debateBody(speaker, other, item.topic, aiCount)
    let reading = true
    for (const chunk of Array.from(body.match(/[\s\S]{1,6}/g) || [])) {
      await sleep(40)
      if (signal?.aborted) reading = false
      if (reading) onDelta?.(chunk)
    }
    const turn = { order: item.turns.length + 1, speakerType: 'PERSONA', personaId: speaker.id, body, createdAt: now() }
    item.turns.push(turn)
    finishWhenFull(item)
    save()
    if (!reading) throw new DOMException('The operation was aborted.', 'AbortError')
    return turn
  } finally {
    debatesInProgress.delete(item.id)
  }
}

on('POST', '/posts/{postId}/reports', (ctx) => {
  const uid = needUser(ctx)
  const post = findPost(ctx.params.postId)
  const reports = (db.reports[uid] ||= {})
  if (reports[post.id]) return reports[post.id]
  if (!REPORT_REASONS.includes(ctx.body?.reasonCode)) fail(400, 'INVALID_REASON', '신고 사유를 골라 주세요.')
  const detail = (ctx.body.detail || '').trim()
  if (detail.length > 500) fail(400, 'INVALID_DETAIL', '상세 내용은 500자 이하로 입력해 주세요.')
  reports[post.id] = { id: nextId(), postId: post.id, reasonCode: ctx.body.reasonCode, detail: detail || null, status: 'OPEN', createdAt: now() }
  return created(reports[post.id])
})

export async function mockRequest(method, path, { query = {}, body } = {}) {
  await new Promise((resolve) => setTimeout(resolve, LATENCY_MS))
  const route = routes.find((item) => item.method === method && item.pattern.test(path))
  if (!route) throw new ApiError(404, 'NOT_FOUND', '요청한 주소를 찾을 수 없어요.')
  const uid = db.users[db.sessionUserId] ? db.sessionUserId : null
  const result = route.handler({ params: path.match(route.pattern).groups || {}, query, body, uid })
  save()
  const response = result?.[RESPONSE] ? result : { status: 200, data: result }
  return { status: response.status, data: response.data === undefined ? null : JSON.parse(JSON.stringify(response.data)) }
}
