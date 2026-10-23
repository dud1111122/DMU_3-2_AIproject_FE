import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api } from '../api/index.js'
import { errorMessage } from '../api/errors.js'
import usePersistedState from '../hooks/usePersistedState.js'

const StoreContext = createContext(null)
export const useStore = () => useContext(StoreContext)

// 세 모드가 함께 쓰는 로그인 세션·활동 상태·관심 주제·알림. 모드를 바꿔도 이 상태는 유지된다.
export function AppProviders({ children }) {
  const [user, setUser] = useState(null)
  const [sessionStatus, setSessionStatus] = useState('loading')
  const [loginPrompt, setLoginPrompt] = useState(null)
  const [toast, setToast] = useState(null)
  const [topics, setTopics] = useState([])
  const [aiConfigured, setAiConfigured] = useState(true)
  const [activity, setActivity] = useState({ liked: {}, saved: {}, following: {} })
  const [guestInterests, setGuestInterests] = usePersistedState('de-shorts:guest-interests', [])

  useEffect(() => {
    api.me().then((me) => { setUser(me); setSessionStatus('member') }).catch(() => setSessionStatus('guest'))
    api.topics().then(setTopics).catch(() => setTopics([]))
    api.health().then((health) => setAiConfigured(health.ai === 'configured')).catch(() => {})
  }, [])
  useEffect(() => { if (!toast) return undefined; const timer = setTimeout(() => setToast(null), 2600); return () => clearTimeout(timer) }, [toast])
  useEffect(() => {
    setActivity({ liked: {}, saved: {}, following: {} })
    if (!user) return undefined
    let alive = true
    // 목록의 페르소나에는 팔로우 상태가 없으므로, 로그인하면 팔로우 목록으로 한 번에 채운다.
    api.follows({ limit: 50 }).then((page) => alive && setActivity((current) => ({ ...current, following: Object.fromEntries(page.items.map((persona) => [persona.id, true])) }))).catch(() => {})
    return () => { alive = false }
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const showToast = useCallback((message) => setToast({ message, id: Date.now() }), [])
  const promptLogin = useCallback((reason) => setLoginPrompt({ reason }), [])
  const requireMember = useCallback((reason) => { if (user) return true; setLoginPrompt({ reason }); return false }, [user])

  const login = async (username, password) => {
    const me = await api.login(username, password)
    setUser(me)
    setSessionStatus('member')
    setLoginPrompt(null)
    showToast(`${me.displayName}님, 환영해요.`)
    return me
  }
  const logout = async () => {
    try { await api.logout() } catch { /* 이미 만료된 세션이어도 화면은 비회원으로 돌린다 */ }
    setUser(null)
    setSessionStatus('guest')
    showToast('로그아웃했어요.')
  }
  const updateProfile = async (changes) => { const me = await api.updateMe(changes); setUser(me); return me }

  const isLiked = (post) => activity.liked[post.id] ?? post.userState?.liked ?? false
  const isSaved = (post) => activity.saved[post.id] ?? post.userState?.saved ?? false
  // 게시물(post.persona)과 페르소나 DTO를 모두 받는다.
  const isFollowing = (target) => {
    const personaId = target.persona ? target.persona.id : target.id
    return activity.following[personaId] ?? (target.persona ? target.userState?.followingPersona : target.userState?.following) ?? false
  }
  const likeCount = (post) => post.likeCount + (isLiked(post) ? 1 : 0) - (post.userState?.liked ? 1 : 0)

  const toggle = (kind, id, next, call, reason) => {
    if (!requireMember(reason)) return
    setActivity((current) => ({ ...current, [kind]: { ...current[kind], [id]: next } }))
    call().catch((error) => {
      setActivity((current) => ({ ...current, [kind]: { ...current[kind], [id]: !next } }))
      showToast(errorMessage(error))
    })
  }
  const toggleLike = (post) => { const next = !isLiked(post); toggle('liked', post.id, next, () => api.setLike(post.id, next), '좋아요는 로그인 후 사용할 수 있어요.') }
  const toggleSave = (post) => { const next = !isSaved(post); toggle('saved', post.id, next, () => api.setSaved(post.id, next), '저장은 로그인 후 사용할 수 있어요.') }
  const toggleFollow = (target) => { const personaId = target.persona ? target.persona.id : target.id; const next = !isFollowing(target); toggle('following', personaId, next, () => api.setFollow(personaId, next), '팔로우는 로그인 후 사용할 수 있어요.') }

  // 비회원 관심 주제는 이 브라우저에만, 회원은 서버에 저장한다.
  const interestIds = user ? user.interests.map((topic) => topic.id) : guestInterests
  const toggleInterest = async (topicId) => {
    const on = !interestIds.includes(topicId)
    if (!user) { setGuestInterests((ids) => on ? [...ids, topicId] : ids.filter((id) => id !== topicId)); return }
    const topic = topics.find((item) => item.id === topicId)
    setUser((me) => ({ ...me, interests: on ? [...me.interests, topic] : me.interests.filter((item) => item.id !== topicId) }))
    try { await api.setInterest(topicId, on) } catch (error) {
      setUser((me) => ({ ...me, interests: on ? me.interests.filter((item) => item.id !== topicId) : [...me.interests, topic] }))
      showToast(errorMessage(error))
    }
  }

  const value = {
    user, isMember: Boolean(user), sessionStatus, sessionKey: user?.id || 'guest', login, logout, updateProfile,
    loginPrompt, promptLogin, closeLoginPrompt: () => setLoginPrompt(null), requireMember,
    toast, showToast, topics, aiConfigured,
    isLiked, isSaved, isFollowing, likeCount, toggleLike, toggleSave, toggleFollow,
    interestIds, toggleInterest,
  }
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

