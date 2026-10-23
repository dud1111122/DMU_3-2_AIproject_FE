import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../api/index.js'
import { errorMessage } from '../api/errors.js'
import { useStore } from './store.jsx'

// 로그인 상태가 바뀌면 userState가 달라지므로 모든 조회는 세션 키가 바뀔 때 다시 불러온다.
export function useApi(loader, deps = []) {
  const { sessionKey } = useStore()
  const [state, setState] = useState({ data: null, error: null, loading: true })
  const [nonce, setNonce] = useState(0)
  useEffect(() => {
    let alive = true
    setState((current) => ({ ...current, loading: true, error: null }))
    loader().then((data) => alive && setState({ data, error: null, loading: false }), (error) => alive && setState({ data: null, error, loading: false }))
    return () => { alive = false }
  }, [...deps, sessionKey, nonce]) // eslint-disable-line react-hooks/exhaustive-deps
  return { ...state, reload: () => setNonce((value) => value + 1) }
}

// cursor 기반 목록. loader(cursor)는 { items, nextCursor }를 돌려준다.
export function usePaged(loader, deps = []) {
  const { sessionKey } = useStore()
  const [state, setState] = useState({ items: [], nextCursor: null, loading: true, error: null, extra: null })
  const [nonce, setNonce] = useState(0)
  const generation = useRef(0)
  useEffect(() => {
    const current = ++generation.current
    setState({ items: [], nextCursor: null, loading: true, error: null, extra: null })
    loader(undefined).then((page) => current === generation.current && setState({ items: page.items, nextCursor: page.nextCursor, loading: false, error: null, extra: page }), (error) => current === generation.current && setState((value) => ({ ...value, loading: false, error })))
  }, [...deps, sessionKey, nonce]) // eslint-disable-line react-hooks/exhaustive-deps
  const loadMore = () => {
    if (!state.nextCursor || state.loading) return
    const current = generation.current
    setState((value) => ({ ...value, loading: true }))
    loader(state.nextCursor).then((page) => current === generation.current && setState((value) => ({ ...value, items: [...value.items, ...page.items], nextCursor: page.nextCursor, loading: false })), (error) => current === generation.current && setState((value) => ({ ...value, loading: false, error })))
  }
  return { ...state, hasMore: Boolean(state.nextCursor), loadMore, reload: () => setNonce((value) => value + 1) }
}

// 전체 문항에 답한 뒤 한 번에 제출한다. 정답·해설은 제출 결과에만 있다.
export function useQuiz(postId) {
  const quiz = useApi(() => api.quiz(postId), [postId])
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const questions = quiz.data?.questions || []
  const choose = (questionId, optionOrder) => { if (!result) setAnswers((current) => ({ ...current, [questionId]: optionOrder })) }
  const canSubmit = questions.length > 0 && questions.every((question) => answers[question.id]) && !submitting && !result
  const submit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    setSubmitError(null)
    try { setResult(await api.submitQuiz(postId, questions.map((question) => ({ questionId: question.id, selectedOptionOrder: answers[question.id] })))) } catch (error) { setSubmitError(errorMessage(error)) } finally { setSubmitting(false) }
  }
  const retry = () => { setAnswers({}); setResult(null); setSubmitError(null) }
  const resultFor = (questionId) => result?.results.find((item) => item.questionId === questionId) || null
  return { loading: quiz.loading, error: quiz.error, reload: quiz.reload, questions, answers, choose, canSubmit, submit, submitting, submitError, result, resultFor, retry }
}

// 회원은 게시물당 대화방 하나를 서버에 저장하고, 비회원은 이 화면의 메모리에서만 대화한다.
export function useStudyChat(postId) {
  const { isMember, sessionKey } = useStore()
  const [conversationId, setConversationId] = useState(null)
  const [messages, setMessages] = useState([])
  const [assessments, setAssessments] = useState({})
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    let alive = true
    setMessages([]); setAssessments({}); setConversationId(null); setError(null)
    if (!isMember) { setLoading(false); return undefined }
    setLoading(true)
    api.openConversation(postId).then((conversation) => {
      if (!alive) return
      setConversationId(conversation.id)
      setMessages(conversation.messages)
      setAssessments(Object.fromEntries(conversation.assessments.map((item) => [item.keyPointId, item])))
      setLoading(false)
    }, (failure) => { if (alive) { setError(failure); setLoading(false) } })
    return () => { alive = false }
  }, [postId, sessionKey, nonce]) // eslint-disable-line react-hooks/exhaustive-deps

  const applyAssessments = (items) => setAssessments((current) => ({ ...current, ...Object.fromEntries(items.map((item) => [item.keyPointId, item])) }))
  const send = useCallback(async (text) => {
    const content = text.trim()
    if (!content || sending) return false
    setSending(true)
    setError(null)
    try {
      if (isMember) {
        const response = await api.sendMessage(conversationId, content)
        setMessages((current) => [...current, response.userMessage, response.personaMessage])
        applyAssessments(response.assessments)
      } else {
        const history = messages.slice(-10).map((message) => ({ role: message.role, content: message.content }))
        const response = await api.guestChat(postId, content, history)
        const stamp = Date.now()
        setMessages((current) => [...current, { id: `guest-${stamp}-u`, role: 'USER', content }, { id: `guest-${stamp}-p`, role: 'PERSONA', content: response.reply.content }])
        applyAssessments(response.assessments)
      }
      return true
    } catch (failure) {
      setError(failure)
      return false
    } finally {
      setSending(false)
    }
  }, [isMember, conversationId, messages, postId, sending])

  return { messages, assessments, loading, sending, error, send, persisted: isMember, reload: () => setNonce((value) => value + 1) }
}

export function useReviewItems(status) {
  const { isMember, showToast } = useStore()
  const list = usePaged((cursor) => isMember ? api.reviewItems({ status, cursor }) : Promise.resolve({ items: [], nextCursor: null }), [status, isMember])
  const [overrides, setOverrides] = useState({})
  const setStatus = async (item, next) => {
    setOverrides((current) => ({ ...current, [item.id]: next }))
    try { await api.setReviewStatus(item.id, next) } catch (error) { setOverrides((current) => ({ ...current, [item.id]: item.status })); showToast(errorMessage(error)) }
  }
  const items = list.items.map((item) => overrides[item.id] ? { ...item, status: overrides[item.id] } : item)
  return { ...list, items, setStatus }
}

// 대담은 회원 전용이다. 목록과 만들기는 회원만 쓰고, 비회원이 만들려 하면 로그인 안내를 띄운다.
export function useDebates() {
  const { isMember, requireMember } = useStore()
  const mine = usePaged((cursor) => isMember ? api.myDebates({ cursor }) : Promise.resolve({ items: [], nextCursor: null }), [isMember])
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState(null)
  // 만들면 발언이 없는 새 대담이 생긴다. 같은 조합이어도 새로 만든다.
  const create = async (personaIds, topic) => {
    if (!requireMember('토론은 로그인 후 만들 수 있어요.')) return null
    setCreating(true)
    setError(null)
    try {
      const debate = await api.createDebate(personaIds, topic)
      mine.reload()
      return debate
    } catch (failure) {
      setError(failure)
      return null
    } finally {
      setCreating(false)
    }
  }
  return { myDebates: mine.items, loadingMine: mine.loading, create, creating, error, clearError: () => setError(null) }
}

const STOP_CODES = ['DEBATE_ENDED', 'TURN_LIMIT_REACHED']
const AUTO_GAP_MS = 900
const isOpenDebate = (debate) => Boolean(debate && debate.status === 'ACTIVE' && debate.turnCount < debate.turnLimit)
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// 대담 한 편의 화면 상태와 발언 흐름.
// - 스트림(다음 발언·자동 진행)과 메시지·마침은 lock 하나를 나눠 쓴다. 두 개가 동시에 돌지 않는다.
// - 발언 응답은 목록에 바로 붙이고, 실패·중지 뒤에는 GET /debates/{id}로 맞춘다.
// - failure는 { kind: 'turn'|'message'|'end'|'load'|'stopped', error } 이다. kind에 따라 화면이 다르게 안내한다.
export function useDebate(debateId) {
  const [debate, setDebate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [draft, setDraft] = useState(null)
  const [busy, setBusy] = useState(null)
  const [failure, setFailure] = useState(null)
  const [autoPlaying, setAutoPlaying] = useState(false)
  const snapshot = useRef(null)
  const lock = useRef(null)
  const controller = useRef(null)
  const autoOn = useRef(false)
  const alive = useRef(false)

  const commit = (next) => { snapshot.current = next; if (alive.current) setDebate(next) }
  const acquire = (kind) => { if (lock.current) return false; lock.current = kind; setBusy(kind); return true }
  const release = () => { lock.current = null; if (alive.current) setBusy(null) }
  const fail = (kind, error) => { if (alive.current) setFailure({ kind, error }) }
  const stopAuto = () => { autoOn.current = false; if (alive.current) setAutoPlaying(false) }

  const refresh = async () => {
    try { const next = await api.debate(debateId); if (alive.current) commit(next) } catch (error) { fail('load', error) }
  }
  const load = async () => {
    setLoading(true)
    setLoadError(null)
    try { const next = await api.debate(debateId); if (alive.current) commit(next) } catch (error) { if (alive.current) setLoadError(error) } finally { if (alive.current) setLoading(false) }
  }
  useEffect(() => {
    alive.current = true
    snapshot.current = null
    lock.current = null
    autoOn.current = false
    setDebate(null); setDraft(null); setBusy(null); setFailure(null); setAutoPlaying(false)
    load()
    return () => { alive.current = false; autoOn.current = false; controller.current?.abort() }
  }, [debateId]) // eslint-disable-line react-hooks/exhaustive-deps

  // 발언이나 메시지가 저장되면 목록에 붙이고, 한도에 닿으면 대담을 자동으로 마친다.
  const applyTurn = (turn) => {
    const latest = snapshot.current
    const next = { ...latest, turns: [...latest.turns, turn], turnCount: latest.turnCount + 1, remainingTurns: latest.turnLimit - latest.turnCount - 1 }
    commit(next)
    // 12번째 발언이 저장되면 서버가 요약을 만들고 스스로 마친다. 화면은 다시 읽어 상태를 맞춘다.
    // 요약이 실패했으면 ACTIVE로 남으므로 사용자가 '대담 마치기'로 다시 시도한다.
    if (next.turnCount >= next.turnLimit) void refresh()
  }

  // AI 발언 한 개를 스트림으로 받는다. 성공하면 true.
  const nextTurn = async () => {
    const current = snapshot.current
    if (!isOpenDebate(current) || !acquire('turn')) return false
    const ctrl = new AbortController()
    controller.current = ctrl
    let text = ''
    let turn = null
    let error = null
    let aborted = false
    setDraft({ text: '' })
    setFailure(null)
    try {
      turn = await api.streamDebateTurn(current.id, { signal: ctrl.signal, onDelta: (chunk) => { text += chunk; if (alive.current) setDraft({ text }) } })
    } catch (caught) {
      // 중지하면 서버는 계속 만들어 저장한다. 여기서는 읽기만 멈춘다.
      if (caught?.name === 'AbortError') aborted = true
      else error = caught
    } finally {
      controller.current = null
      if (alive.current) setDraft(null)
      release()
    }
    if (turn) { applyTurn(turn); return true }
    if (aborted) { fail('stopped', null); await refresh(); return false }
    // 스트림 중 오류면 발언은 저장되지 않고 받은 글자는 버린다(draft는 이미 지워졌다).
    // 예외로 12번째 발언은 저장된 뒤 요약만 실패할 수 있으므로(turn 뒤 error) 항상 서버 상태를 다시 읽는다.
    fail('turn', error)
    await refresh()
    return false
  }

  // 자동 진행: 다음 발언을 차례로 받는다. 멈춤·메시지·오류·종료가 나면 끝난다.
  const autoLoop = async () => {
    while (autoOn.current && alive.current) {
      if (!isOpenDebate(snapshot.current)) break
      const ok = await nextTurn()
      if (!ok) break
      await pause(AUTO_GAP_MS)
    }
    autoOn.current = false
    if (alive.current) setAutoPlaying(false)
  }
  const startAuto = () => {
    if (autoOn.current || !isOpenDebate(snapshot.current)) return
    autoOn.current = true
    setAutoPlaying(true)
    void autoLoop()
  }

  // 사용자가 메시지를 보내면 자동 진행은 지금 발언이 끝난 뒤 멈춘다.
  const sendMessage = async (text) => {
    const content = text.trim()
    const current = snapshot.current
    if (!content || !isOpenDebate(current)) return false
    stopAuto()
    if (!acquire('message')) return false
    setFailure(null)
    let turn = null
    let error = null
    try { turn = await api.sendDebateMessage(current.id, content) } catch (caught) { error = caught } finally { release() }
    if (turn) { applyTurn(turn); return true }
    fail('message', error)
    if (STOP_CODES.includes(error?.code)) await refresh()
    return false
  }

  // 마침: 요약을 만든다. 실패하면 대담은 ACTIVE로 남고 같은 호출로 다시 시도할 수 있다.
  const endDebate = async () => {
    const current = snapshot.current
    if (!current || current.status !== 'ACTIVE' || current.turnCount === 0) return false
    stopAuto()
    if (!acquire('end')) return false
    setFailure(null)
    let next = null
    let error = null
    try { next = await api.endDebate(current.id) } catch (caught) { error = caught } finally { release() }
    if (next) { commit(next); return true }
    fail('end', error)
    if (STOP_CODES.includes(error?.code)) await refresh()
    return false
  }

  return {
    debate, loading, loadError, draft, busy, failure, autoPlaying,
    canAct: isOpenDebate(debate),
    // ACTIVE이면 12턴에 닿아도 마칠 수 있다(요약 실패 뒤 다시 시도).
    canEnd: Boolean(debate) && debate.status === 'ACTIVE' && debate.turnCount > 0 && !busy,
    reload: load,
    refresh,
    nextTurn, startAuto, pauseAuto: stopAuto,
    stopReading: () => controller.current?.abort(),
    sendMessage, endDebate,
    clearFailure: () => setFailure(null),
  }
}

export function useReport() {
  const { requireMember } = useStore()
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const canReport = () => requireMember('신고는 로그인 후 사용할 수 있어요.')
  const report = async (postId, reasonCode, detail) => {
    if (!canReport()) return null
    setSending(true)
    setError(null)
    try { return await api.report(postId, reasonCode, detail) } catch (failure) { setError(failure); return null } finally { setSending(false) }
  }
  return { report, sending, error, canReport }
}

// 목록 항목에는 학습 포인트·문헌이 없다. 상세가 필요한 화면은 이 훅으로 게시물을 채운다.
export function useFullPost(listPost) {
  const complete = Boolean(listPost?.keyPoints && listPost?.sources)
  const detail = useApi(() => complete ? Promise.resolve(listPost) : api.post(listPost.id), [listPost?.id])
  return { post: complete ? listPost : detail.data, error: detail.error, reload: detail.reload }
}
