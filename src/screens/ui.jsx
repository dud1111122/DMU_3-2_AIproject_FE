import { useEffect, useRef } from 'react'
import Icon from '../components/Icon.jsx'
import Avatar from '../components/Avatar.jsx'
import AiBadge from '../shared/AiBadge.jsx'
import { api } from '../api/index.js'
import { errorMessage, isStatus } from '../api/errors.js'
import { useApi } from '../shared/hooks.js'
import { useStore } from '../shared/store.jsx'

export const firstImage = (post) => post.sections?.find((section) => section.image)?.image || null
export const shareText = (post) => `${post.title} — ${post.persona.displayName} AI 페르소나 · 디쇼츠\n${post.summary || ''}`.trim()

// 목록에서 받은 게시물을 먼저 보여 주고, 최신 userState·본문은 서버에서 다시 받는다.
export function usePost(postId, initial) {
  const query = useApi(() => api.post(postId), [postId])
  // 목록 항목은 학습 포인트·문헌이 없어서 상세가 도착하기 전에는 보여 주지 않는다.
  const post = query.data || null
  return { ...query, post }
}

export function BackHeader({ title, sub, onBack, border = true, right = null }) {
  return <header className={`sticky top-0 z-20 flex h-[52px] shrink-0 items-center gap-3 bg-white px-3 ${border ? 'border-b border-[#efefef]' : ''}`}>
    <button onClick={onBack} aria-label="뒤로" className="grid h-9 w-9 place-items-center"><Icon name="back" size={23} /></button>
    <span className="min-w-0 flex-1"><strong className="block truncate text-[16px]">{title}</strong>{sub && <span className="block truncate text-[11px] text-[#737373]">{sub}</span>}</span>
    {right}
  </header>
}

export function Loading({ label = '불러오는 중…', className = 'py-14' }) {
  return <div role="status" className={`flex flex-col items-center justify-center gap-2 text-[12px] text-[#737373] ${className}`}><span className="h-6 w-6 animate-spin rounded-full border-2 border-[#dbdbdb] border-t-[#737373]" />{label}</div>
}

export function ErrorState({ error, onRetry, className = 'py-12' }) {
  const ai = isStatus(error, 503)
  return <div role="alert" className={`flex flex-col items-center px-8 text-center ${className}`}>
    <Icon name="alert" size={30} strokeWidth={1.5} className="text-[#8e8e8e]" />
    <p className="mt-2 text-[13px] leading-5 text-[#262626]">{errorMessage(error)}</p>
    {onRetry && !ai && <button onClick={onRetry} className="mt-3 h-8 rounded-lg bg-[#efefef] px-4 text-[12px] font-semibold">다시 시도</button>}
  </div>
}

export function Empty({ icon = 'grid', text, action = null }) {
  return <div className="flex min-h-[180px] flex-col items-center justify-center px-8 py-8 text-center text-[#737373]">
    <Icon name={icon} size={30} strokeWidth={1.5} />
    <p className="mt-3 text-[12px] leading-5">{text}</p>
    {action}
  </div>
}

// 비회원에게 로그인 안내를 화면 안에서 보여 주는 자리.
export function MemberGate({ text, reason }) {
  const { promptLogin } = useStore()
  return <Empty icon="user" text={text} action={<button onClick={() => promptLogin(reason || text)} className="mt-3 h-9 rounded-lg bg-[#0095f6] px-5 text-[12px] font-semibold text-white">로그인</button>} />
}

export function AiOffNotice({ className = '' }) {
  return <p role="status" className={`rounded-lg bg-[#fff4e5] px-3 py-2 text-[11px] leading-5 text-[#8a5a00] ${className}`}>AI 기능이 아직 설정되지 않았어요. 게시물 읽기와 퀴즈는 계속 할 수 있어요.</p>
}

// 목록 끝이 보이면 다음 페이지를 불러온다. 버튼도 함께 두어 키보드로도 이어 볼 수 있다.
export function LoadMore({ list, label = '더 보기' }) {
  const ref = useRef(null)
  const { hasMore, loading, loadMore, error, items } = list
  useEffect(() => {
    const node = ref.current
    if (!node || !hasMore || loading || error) return undefined
    const observer = new IntersectionObserver((entries) => { if (entries[0].isIntersecting) loadMore() }, { rootMargin: '200px' })
    observer.observe(node)
    return () => observer.disconnect()
  }, [hasMore, loading, error, loadMore])
  if (error && items.length) return <div className="px-4 py-4 text-center"><p className="text-[12px] text-[#737373]">{errorMessage(error)}</p><button onClick={list.reload} className="mt-2 h-8 rounded-lg bg-[#efefef] px-4 text-[12px] font-semibold">다시 시도</button></div>
  if (loading && items.length) return <Loading className="py-5" label="더 불러오는 중…" />
  if (!hasMore) return null
  return <div ref={ref} className="px-4 py-4 text-center"><button onClick={loadMore} className="h-8 rounded-lg bg-[#efefef] px-4 text-[12px] font-semibold">{label}</button></div>
}

// 목록 공통 상태: 첫 로딩·오류·빈 목록을 처리하고 내용은 children으로 그린다.
export function ListState({ list, empty, children }) {
  if (list.loading && !list.items.length) return <Loading />
  if (list.error && !list.items.length) return <ErrorState error={list.error} onRetry={list.reload} />
  if (!list.items.length) return empty
  return <>{children}<LoadMore list={list} /></>
}

export function Sheet({ title, onClose, children }) {
  return <div className="absolute inset-0 z-[60] flex items-end bg-black/40" onClick={onClose}>
    <div role="dialog" aria-modal="true" aria-label={title} className="max-h-[85%] w-full overflow-y-auto rounded-t-2xl bg-white px-5 pb-7 pt-3" onClick={(event) => event.stopPropagation()}>
      <div className="mx-auto mb-3 h-1 w-9 rounded bg-[#dbdbdb]" />
      <div className="mb-1 flex items-center justify-between"><strong className="text-[15px]">{title}</strong><button onClick={onClose} aria-label="닫기"><Icon name="close" size={21} /></button></div>
      {children}
    </div>
  </div>
}

export function PostTile({ post, onOpen }) {
  const image = firstImage(post)
  return <button onClick={() => onOpen(post)} aria-label={`${post.title} 게시물 열기`} className="group relative aspect-square overflow-hidden bg-[#f1ede4] text-left">
    {image ? <img src={image.url} alt="" loading="lazy" onError={(event) => { event.currentTarget.style.display = 'none' }} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" /> : null}
    <span className={`absolute inset-0 flex items-end p-2 text-[11px] font-semibold leading-[1.3] ${image ? 'bg-gradient-to-t from-black/55 to-transparent text-white' : 'text-[#3d3a35]'}`}><span className="line-clamp-3">{post.title}</span></span>
    {post.sections.length > 1 && <span className="absolute right-1.5 top-1.5 text-white drop-shadow"><Icon name="layers" size={16} /></span>}
  </button>
}

export function PostGrid({ list, onOpenPost, empty }) {
  return <ListState list={list} empty={<Empty text={empty} />}>
    <div className="grid grid-cols-3 gap-[2px]">{list.items.map((post) => <PostTile key={post.id} post={post} onOpen={onOpenPost} />)}</div>
  </ListState>
}

export function PersonaRow({ persona, onOpen, showFollow = true, extra = null }) {
  const { isFollowing, toggleFollow } = useStore()
  const following = isFollowing(persona)
  return <div className="flex items-center gap-3 px-4 py-2.5">
    <Avatar person={persona} size="md" onClick={() => onOpen(persona)} />
    <button onClick={() => onOpen(persona)} className="min-w-0 flex-1 text-left">
      <span className="flex items-center gap-1.5"><strong className="truncate text-[13px]">{persona.username}</strong><AiBadge className="text-[#737373]" /></span>
      <span className="block truncate text-[12px] text-[#737373]">{persona.displayName}{persona.topics?.length ? ` · ${persona.topics.map((topic) => topic.name).join(', ')}` : ''}</span>
      {extra}
    </button>
    {showFollow && <button onClick={() => toggleFollow(persona)} aria-pressed={following} className={`h-8 shrink-0 rounded-lg px-3 text-[12px] font-semibold ${following ? 'bg-[#efefef] text-[#111]' : 'bg-[#0095f6] text-white'}`}>{following ? '팔로잉' : '팔로우'}</button>}
  </div>
}

export function PostRow({ post, onOpen, extra = null }) {
  const image = firstImage(post)
  return <button onClick={() => onOpen(post)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left">
    <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-[#f1ede4]">{image && <img src={image.url} alt="" loading="lazy" onError={(event) => { event.currentTarget.style.display = 'none' }} className="h-full w-full object-cover" />}</span>
    <span className="min-w-0 flex-1"><strong className="block truncate text-[13px] font-semibold">{post.title}</strong><span className="block truncate text-[11px] text-[#737373]">{post.persona.displayName}{post.topics?.length ? ` · ${post.topics.map((topic) => topic.name).join(', ')}` : ''}</span>{extra}</span>
  </button>
}
