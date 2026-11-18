import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { api } from '../api/index.js'
import { errorMessage } from '../api/errors.js'
import { useStore } from './store.jsx'
import * as U from './usage.js'
import { completeBundleOnce } from './bundleCompletion.js'

export const WAIT_MS = 3000

export const useBundleSize = () => useSyncExternalStore(U.subscribeBundleSize, U.readBundleSize)

// 오늘 사용량. 회원은 GET /usage/today, 비회원은 로컬 집계. 실패하면 summary는 null이다.
export function useUsageSummary() {
  const { isMember, sessionKey } = useStore()
  const [state, setState] = useState({ summary: null, loading: true })
  const [nonce, setNonce] = useState(0)
  useEffect(() => {
    let alive = true
    if (!isMember) { setState({ summary: U.guestSummary(), loading: false }); return undefined }
    setState((current) => ({ ...current, loading: true }))
    api.usageToday().then(
      (raw) => alive && setState({ summary: U.normalizeUsage(raw), loading: false }),
      () => alive && setState({ summary: null, loading: false }),
    )
    return () => { alive = false }
  }, [isMember, sessionKey, nonce])
  return { summary: state.summary, loading: state.loading, refresh: () => setNonce((value) => value + 1) }
}

// 오늘 약속을 정한다. 같은 날 두 번은 안 된다(회원은 서버 409, 비회원은 로컬 검사).
export async function savePledge(isMember, pledgedCount) {
  let summary
  if (isMember) {
    await api.setPledge(pledgedCount)
    summary = U.normalizeUsage(await api.usageToday())
  } else {
    if (!U.guestSetPledge(pledgedCount)) throw U.pledgeError()
    summary = U.guestSummary()
  }
  U.markAskedToday()
  U.announcePledge(pledgedCount)
  return summary
}

const reloadStats = async () => { try { return U.normalizeUsage(await api.usageToday()) } catch { return null } }

// 묶음 진행 상태 기계. list는 현재 범위의 게시물 목록(usePaged 모양)이다. 범위가 바뀌면 첫 묶음을 보여준다.
// phase: reading(묶음을 보는 중) → ended(종료 카드) → waiting(약속 초과 뒤 "더보기" 3초 대기) → stopped(그만보기).
// 묶음이 끝나면 한 번만 POST /usage/bundles를 부른다. 다음 묶음은 사용자가 "더보기"/"다시 보기"를 눌러야 시작한다.
export function useBundleReader({ list, resetKey }) {
  const { isMember, sessionKey, sessionStatus, showToast } = useStore()
  const day = U.kstDate()
  const viewer = isMember ? `member:${sessionKey}` : 'guest'
  const scope = JSON.stringify([viewer, day, resetKey])
  const { summary } = useUsageSummary()
  const [bundle, setBundle] = useState(() => ({ start: 0, size: U.readBundleSize() }))
  const [phase, setPhase] = useState('reading')
  const [override, setOverride] = useState(null)
  const [pledged, setPledged] = useState(undefined)
  const [tipText, setTipText] = useState(null)
  const [busy, setBusy] = useState(false)
  const [seenKey, setSeenKey] = useState(scope)
  const session = useRef(0)

  // 범위가 바뀌면 렌더 중에 초기화한다. 이전 범위의 늦은 응답은 session 번호로 버린다.
  if (seenKey !== scope) {
    session.current += 1
    setSeenKey(scope)
    setBundle({ start: 0, size: U.readBundleSize() })
    setPhase('reading')
    setOverride(null)
    setPledged(undefined)
    setTipText(null)
    setBusy(false)
  }

  useEffect(() => U.subscribePledge(setPledged), [])
  useEffect(() => () => { session.current += 1 }, [])

  const end = bundle.start + bundle.size
  const available = list.items.length
  const visible = list.items.slice(bundle.start, end)
  const hasMore = Boolean(list.hasMore)

  const finish = async (posts) => {
    const token = session.current
    const count = posts.length
    const seconds = posts.reduce((sum, post) => sum + U.estimateSeconds(post), 0)
    setBusy(true)
    let result = null
    const postIds = posts.map((post) => post.id)
    const completion = completeBundleOnce({ day, viewer, scope: resetKey, start: bundle.start, postIds }, () => {
      if (!isMember) U.guestAddBundle(count, seconds, day)
      return api.completeBundle(postIds)
    })
    try {
      result = await completion.promise
    } catch (failure) {
      if (token === session.current && isMember) showToast(errorMessage(failure))
    }
    if (token !== session.current) return
    let next = null
    if (!isMember) next = U.guestSummary()
    // 재방문한 묶음의 예전 응답으로 최신 합계를 덮어쓰지 않는다.
    else next = !completion.reused && result?.stats ? U.normalizeStats(result.stats) : await reloadStats()
    if (token !== session.current) return
    if (next) setOverride((current) => ({ ...current, ...next }))
    if (result?.tip && !U.tipShownToday(isMember)) {
      const text = U.tipMessage(result.tip, (next || summary)?.week || { count: count, minutes: 0 })
      if (text) { U.markTipShown(isMember); setTipText(text) }
    }
    setBusy(false)
  }

  // 묶음 채우기: 다 찼거나 더 받을 게시물이 없으면 묶음을 끝낸다. 모자라면 사용자가 "더보기"로 다음 묶음을 연다.
  useEffect(() => {
    if (phase !== 'reading' || list.loading || sessionStatus === 'loading') return
    if (available > bundle.start && (available >= end || !hasMore)) {
      setPhase('ended')
      finish(list.items.slice(bundle.start, end))
    }
  }, [phase, list.loading, available, hasMore, bundle.start, bundle.size, scope, sessionStatus]) // eslint-disable-line react-hooks/exhaustive-deps

  const merged = { ...(summary || {}), ...(override || {}) }
  const view = merged.today
    ? { bundleCount: visible.length, today: merged.today, week: merged.week, month: merged.month, stopsThisWeek: merged.stopsThisWeek ?? 0, pledgedCount: pledged !== undefined ? pledged : merged.pledgedCount ?? null }
    : null
  const overPledge = U.overPledge(view)

  const advance = () => {
    const nextStart = bundle.start + bundle.size
    const nextSize = U.readBundleSize()
    setBundle({ start: nextStart, size: nextSize })
    setPhase('reading')
    setTipText(null)
    if (available < nextStart + nextSize && hasMore && !list.loading) list.loadMore()
  }

  // "더보기": 약속을 넘겼으면 약속을 보여주고 3초 기다린 뒤 이어간다.
  const more = () => {
    if (busy || phase !== 'ended') return
    if (overPledge) setPhase('waiting')
    else advance()
  }
  useEffect(() => {
    if (phase !== 'waiting') return undefined
    const timer = setTimeout(advance, WAIT_MS)
    return () => clearTimeout(timer)
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  const stop = async () => {
    if (phase === 'stopped') return
    const token = session.current
    setPhase('stopped')
    let next = null
    if (!isMember) {
      U.guestAddStop()
      next = U.guestSummary()
    } else {
      try {
        const result = await api.recordStop()
        next = result?.stats ? U.normalizeStats(result.stats) : await reloadStats()
      } catch (failure) {
        showToast(errorMessage(failure))
        next = await reloadStats()
      }
    }
    if (token === session.current && next) setOverride((current) => ({ ...current, ...next }))
  }

  // "다시 보기": 멈춘 뒤 새 묶음을 시작한다. 자동으로 이어지지 않는다.
  const again = () => { if (phase === 'stopped') advance() }

  const needsMore = phase === 'reading' && available < end && hasMore
  const exhausted = phase === 'reading' && available <= bundle.start && !hasMore

  return {
    phase,
    visible,
    bundleSize: bundle.size,
    bundleStart: bundle.start,
    view,
    overPledge,
    tipText,
    busy,
    needsMore,
    exhausted,
    loadingMore: Boolean(list.loading),
    loadError: list.error || null,
    more,
    stop,
    again,
    retryLoad: () => { if (!list.loading) list.loadMore() },
  }
}
