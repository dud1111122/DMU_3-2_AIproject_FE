import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Icon from '../../components/Icon.jsx'
import AiBadge from '../../shared/AiBadge.jsx'
import { errorMessage } from '../../api/errors.js'
import { useStore } from '../../shared/store.jsx'
import { formatDate } from '../../shared/format.js'

export const SheetRootContext = createContext(null)
export const NavContext = createContext(null)
export const useNav = () => useContext(NavContext)

// 공용 Icon에 없는 기호만 여기에 둔다.
const extraPaths = {
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  external: <><path d="M14 4h6v6" /><path d="M20 4 11 13" /><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></>,
  quiz: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="m8 9 2 2 4-4M8 16h8" /></>,
  image: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="1.6" /><path d="m21 16-5-5-9 9" /></>,
  refresh: <><path d="M20 11a8 8 0 1 0-2.3 5.7" /><path d="M20 4v7h-7" /></>,
  down: <path d="m6 9 6 6 6-6" />,
}

export function BIcon({ name, size = 20, strokeWidth = 1.8, className = '', filled = false }) {
  if (!extraPaths[name]) return <Icon name={name} size={size} strokeWidth={strokeWidth} className={className} filled={filled} />
  return <svg aria-hidden="true" className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">{extraPaths[name]}</svg>
}

export function TopBar({ title, onBack, right, large = false }) {
  if (large) return <header className="sticky top-0 z-20 flex h-[54px] items-center justify-between border-b border-[#e7e3da] bg-[#fbfaf7] px-5">
    <h1 className="font-basic text-[22px] font-bold tracking-[-.02em] text-balance">{title}</h1>{right}
  </header>
  return <header className="sticky top-0 z-20 flex h-[50px] items-center gap-1 border-b border-[#e7e3da] bg-[#fbfaf7] px-2">
    {onBack && <button onClick={onBack} aria-label="뒤로" className="grid h-9 w-9 shrink-0 place-items-center rounded-full"><Icon name="back" size={21} /></button>}
    <h1 className="min-w-0 flex-1 truncate px-1 text-[14px] font-semibold">{title}</h1>
    {right && <div className="flex shrink-0 items-center">{right}</div>}
  </header>
}

export function Skeleton({ rows = 3, card = false }) {
  return <div className="space-y-4 px-4 py-4" role="status" aria-label="불러오는 중">
    {Array.from({ length: rows }, (_, index) => <div key={index} className={`animate-pulse ${card ? 'rounded-2xl border border-[#e7e3da] bg-white p-4' : ''}`}>
      {card && index === 0 && <div className="mb-3 aspect-[4/3] rounded-lg bg-[#efece4]" />}
      <div className="h-3 w-20 rounded bg-[#e9e5dc]" /><div className="mt-2.5 h-4 w-4/5 rounded bg-[#e9e5dc]" /><div className="mt-2 h-3 w-3/5 rounded bg-[#efece4]" />
    </div>)}
    <span className="sr-only">불러오는 중…</span>
  </div>
}

export function ErrorState({ error, onRetry, compact = false }) {
  return <div role="alert" className={`text-center ${compact ? 'px-4 py-6' : 'px-6 py-14'}`}>
    <p className="font-basic text-[17px] font-bold">불러오지 못했어요</p>
    <p className="mt-1.5 text-[12px] leading-5 text-[#6f6b63]">{errorMessage(error)}</p>
    {onRetry && <button onClick={onRetry} className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-full border border-[#d9d4c9] bg-white px-4 text-[12px] font-semibold"><BIcon name="refresh" size={15} />다시 시도</button>}
  </div>
}

export function Empty({ title, text, action }) {
  return <div className="px-6 py-14 text-center">
    <p className="font-basic text-[18px] font-bold">{title}</p>
    {text && <p className="mt-2 text-[12px] leading-5 text-[#6f6b63]">{text}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
}

export function Notice({ children, tone = 'soft', className = '' }) {
  const tones = { soft: 'bg-[#f1eee7] text-[#5a564f]', warn: 'border border-[#ecd9b8] bg-[#fbf3e4] text-[#7a5a1e]', error: 'border border-[#f0c9c3] bg-[#fdf0ee] text-[#9b2c1f]', accent: 'bg-[#e8efec] text-[#2f5d50]' }
  return <p className={`rounded-lg px-3 py-2.5 text-[11px] leading-[1.6] ${tones[tone]} ${className}`}>{children}</p>
}

export function Chip({ active, onClick, children, label, pressed = true }) {
  return <button onClick={onClick} aria-pressed={pressed ? active : undefined} aria-label={label} className={`h-8 shrink-0 rounded-full px-3.5 text-[12px] font-semibold ${active ? 'bg-[#1c1b19] text-white' : 'border border-[#d9d4c9] bg-white text-[#4a4741]'}`}>{children}</button>
}

export const PrimaryButton = ({ className = '', ...props }) => <button {...props} className={`inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-[#1c1b19] px-4 text-[13px] font-semibold text-white disabled:opacity-35 ${className}`} />
export const GhostButton = ({ className = '', ...props }) => <button {...props} className={`inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-[#d9d4c9] bg-white px-4 text-[13px] font-semibold text-[#3d3a35] disabled:opacity-40 ${className}`} />

export function FollowButton({ target, name, className = 'h-8 px-3.5 text-[12px]' }) {
  const { isFollowing, toggleFollow } = useStore()
  const following = isFollowing(target)
  return <button onClick={() => toggleFollow(target)} aria-pressed={following} aria-label={`${name} ${following ? '팔로우 취소' : '팔로우'}`} className={`shrink-0 rounded-full font-semibold ${following ? 'border border-[#d9d4c9] bg-white text-[#3d3a35]' : 'bg-[#1c1b19] text-white'} ${className}`}>{following ? '팔로잉' : '팔로우'}</button>
}

export function SaveButton({ post, className = 'h-9 w-9' }) {
  const { isSaved, toggleSave } = useStore()
  const saved = isSaved(post)
  return <button onClick={() => toggleSave(post)} aria-label={saved ? `${post.title} 저장 취소` : `${post.title} 저장`} aria-pressed={saved} className={`grid shrink-0 place-items-center rounded-full ${saved ? 'text-[#2f5d50]' : 'text-[#6f6b63]'} ${className}`}><Icon name="bookmark" size={20} filled={saved} /></button>
}

// 이미지가 없거나 깨져도 글은 읽혀야 하므로 대체 문구를 보여준다.
export function SafeImage({ image, className = '', eager = false }) {
  const [failed, setFailed] = useState(false)
  useEffect(() => setFailed(false), [image?.url])
  if (!image?.url) return null
  if (failed) return <div role="img" aria-label={image.altText || '이미지'} className={`flex flex-col items-center justify-center gap-1.5 bg-[#efece4] px-6 text-center text-[#6f6b63] ${className}`}>
    <BIcon name="image" size={22} /><span className="text-[11px] leading-4">이미지를 불러오지 못했어요{image.altText ? <><br />{image.altText}</> : null}</span>
  </div>
  return <img src={image.url} alt={image.altText || ''} loading={eager ? 'eager' : 'lazy'} onError={() => setFailed(true)} className={`bg-[#ece8df] object-cover ${className}`} />
}

export function Monogram({ name, src = null, size = 'h-10 w-10 text-[15px]' }) {
  return <span aria-hidden="true" className={`font-basic relative grid shrink-0 place-items-center overflow-hidden rounded-full border border-[#e2ddd2] bg-[#f1eee7] font-bold text-[#2f5d50] ${size}`}>{name?.[0]}{src && <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" onError={(event) => { event.currentTarget.style.display = 'none' }} />}</span>
}

export function PersonaRow({ persona, onOpen, meta, follow = true }) {
  return <div className="flex items-center gap-3 border-b border-[#e7e3da] py-3">
    <button onClick={() => onOpen(persona.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left" aria-label={`${persona.displayName} 프로필 보기`}>
      <Monogram name={persona.displayName} />
      <span className="min-w-0">
        <span className="flex items-center gap-1.5"><strong className="truncate text-[14px]">{persona.displayName}</strong><AiBadge className="text-[#6f6b63]" /></span>
        <span className="mt-0.5 block truncate text-[11px] text-[#6f6b63]">{meta ?? persona.bio}</span>
      </span>
    </button>
    {follow && <FollowButton target={persona} name={persona.displayName} />}
  </div>
}

export function PostRow({ post, onOpen, showSave = true, extra }) {
  return <div className="flex items-start gap-2 border-b border-[#e7e3da] py-3.5">
    <button onClick={() => onOpen(post.id)} className="min-w-0 flex-1 text-left">
      <span className="block text-[11px] font-semibold text-[#2f5d50]">{post.persona.displayName}</span>
      <strong className="font-basic mt-0.5 line-clamp-2 block text-[16px] leading-[1.35]">{post.title}</strong>
      <span className="mt-1 line-clamp-2 block text-[12px] leading-[1.55] text-[#6f6b63]">{post.summary}</span>
      <span className="mt-1.5 block text-[11px] text-[#6f6b63]">{formatDate(post.publishedAt)} · 카드 {post.sections.length}장{extra ? ` · ${extra}` : ''}</span>
    </button>
    {showSave && <SaveButton post={post} />}
  </div>
}

// 목록 끝에 닿으면 다음 페이지를 불러오고, 스크롤이 어려운 환경을 위해 버튼도 둔다.
export function LoadMore({ list, endText }) {
  const ref = useRef(null)
  const { hasMore, loading, loadMore, error } = list
  useEffect(() => {
    const node = ref.current
    if (!node || !hasMore || loading || error) return undefined
    const observer = new IntersectionObserver((entries) => { if (entries[0].isIntersecting) loadMore() }, { rootMargin: '200px' })
    observer.observe(node)
    return () => observer.disconnect()
  }, [hasMore, loading, error, loadMore])
  if (error && list.items.length) return <ErrorState compact error={error} onRetry={list.reload} />
  if (hasMore) return <div ref={ref} className="py-5 text-center"><GhostButton onClick={loadMore} disabled={loading} className="h-9 text-[12px]">{loading ? '불러오는 중…' : '더 보기'}</GhostButton></div>
  if (endText && list.items.length) return <p className="py-8 text-center text-[12px] text-[#a39e93]">{endText}</p>
  return null
}

export function Sheet({ title, onClose, children, label }) {
  const root = useContext(SheetRootContext)
  useEffect(() => {
    const onKey = (event) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  if (!root) return null
  return createPortal(<div className="absolute inset-0 z-[70] flex items-end bg-black/45" onClick={onClose}>
    <div role="dialog" aria-modal="true" aria-label={label || title} onClick={(event) => event.stopPropagation()} className="max-h-[86%] w-full overflow-y-auto rounded-t-2xl bg-[#fbfaf7] px-5 pb-8 pt-3 text-[#1c1b19]">
      <div className="mx-auto mb-3 h-1 w-9 rounded bg-[#d9d4c9]" />
      <div className="flex items-center justify-between"><strong className="text-[16px]">{title}</strong><button onClick={onClose} aria-label="닫기" className="grid h-8 w-8 place-items-center"><Icon name="close" size={20} /></button></div>
      {children}
    </div>
  </div>, root)
}

export function SectionTitle({ children, id, right }) {
  return <div className="flex items-end justify-between border-b border-[#1c1b19] pb-2"><h2 id={id} className="text-[12px] font-semibold">{children}</h2>{right}</div>
}
