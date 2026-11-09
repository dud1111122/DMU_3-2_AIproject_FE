import { useEffect, useState } from 'react'
import Icon from '../../components/Icon.jsx'
import AiBadge from '../../shared/AiBadge.jsx'
import { errorMessage } from '../../api/errors.js'

export { AiBadge }

// 페르소나 이미지는 없으므로 이름 첫 글자를 원 안에 그린다. 색은 ID로 고정해 모드·화면마다 같게 보인다.
const avatarColors = ['#5b6b8c', '#7a5c8e', '#4f7a6a', '#8c6a4f', '#5f7f99', '#8e5c6c', '#6b7b4f', '#4f6f8e', '#7f6b99', '#8e7a4f']
export function Avatar({ persona, size = 32, className = '' }) {
  const name = persona?.displayName || persona?.username || '?'
  const color = avatarColors[(Number(persona?.id) || name.charCodeAt(0)) % avatarColors.length]
  return <span aria-hidden="true" className={`relative grid shrink-0 place-items-center overflow-hidden rounded-full font-semibold text-white ${className}`} style={{ width: size, height: size, background: color, fontSize: Math.round(size * 0.44) }}>{name.slice(0, 1)}{persona?.avatarUrl && <img src={persona.avatarUrl} alt="" className="absolute inset-0 h-full w-full object-cover" onError={(event) => { event.currentTarget.style.display = 'none' }} />}</span>
}

export function ScreenHeader({ title, onBack, children }) {
  return <header className="flex h-12 shrink-0 items-center pr-2">
    <button onClick={onBack} aria-label="뒤로" className="grid h-12 w-12 shrink-0 place-items-center"><Icon name="back" size={24} /></button>
    {title && <h1 className="min-w-0 flex-1 truncate text-[16px] font-medium">{title}</h1>}
    {children}
  </header>
}

export function Screen({ title, onBack, headerExtra, children, bodyClassName = '' }) {
  return <div className="flex h-full flex-col bg-[#0f0f0f] text-white">
    <ScreenHeader title={title} onBack={onBack}>{headerExtra}</ScreenHeader>
    <div className={`no-scrollbar min-h-0 flex-1 overflow-y-auto ${bodyClassName}`}>{children}</div>
  </div>
}

export function Loading({ label = '불러오는 중…', className = 'py-16' }) {
  return <div role="status" className={`flex flex-col items-center justify-center gap-3 text-[13px] text-[#aaa] ${className}`}><span className="shorts-spinner" aria-hidden="true" />{label}</div>
}

export const isAiOff = (error) => error?.status === 503

export function ErrorState({ error, onRetry, className = 'py-16' }) {
  return <div role="alert" className={`flex flex-col items-center px-8 text-center ${className}`}>
    <p className="text-[15px] font-medium">{isAiOff(error) ? 'AI 기능이 아직 설정되지 않았어요' : '불러오지 못했어요'}</p>
    <p className="mt-1.5 text-[13px] leading-5 text-[#aaa]">{errorMessage(error)}</p>
    {onRetry && !isAiOff(error) && <button onClick={onRetry} className="mt-4 h-9 rounded-full bg-[#f1f1f1] px-4 text-[14px] font-medium text-[#0f0f0f]">다시 시도</button>}
  </div>
}

export function Empty({ icon, title, body, action, className = 'py-16' }) {
  return <div className={`flex flex-col items-center px-10 text-center ${className}`}>
    {icon && <span className="mb-3 text-[#aaa]"><Icon name={icon} size={40} strokeWidth={1.4} /></span>}
    <p className="break-keep text-[15px] font-medium">{title}</p>
    {body && <p className="mt-1.5 break-keep text-[13px] leading-5 text-[#aaa]">{body}</p>}
    {action}
  </div>
}

export function PillButton({ children, onClick, light = false, disabled, className = '', ...rest }) {
  return <button onClick={onClick} disabled={disabled} className={`h-9 shrink-0 rounded-full px-4 text-[14px] font-medium disabled:opacity-40 ${light ? 'bg-[#f1f1f1] text-[#0f0f0f]' : 'bg-white/10 text-white'} ${className}`} {...rest}>{children}</button>
}

export function Chip({ active, onClick, children, ...rest }) {
  return <button onClick={onClick} aria-pressed={active} className={`h-8 shrink-0 whitespace-nowrap rounded-lg px-3 text-[14px] font-medium ${active ? 'bg-[#f1f1f1] text-[#0f0f0f]' : 'bg-white/10 text-white'}`} {...rest}>{children}</button>
}

// 이미지 로딩에 실패하면 onFail로 알려 텍스트 카드로 바꾼다.
export function CardImage({ image, className = '', onFail, eager = false }) {
  const [failed, setFailed] = useState(false)
  useEffect(() => setFailed(false), [image?.url])
  if (!image || failed) return null
  return <img src={image.url} alt={image.altText || ''} loading={eager ? 'eager' : 'lazy'} draggable={false} onError={() => { setFailed(true); onFail?.() }} className={className} />
}

// 채널·저장함·검색에서 쓰는 9:16 미리보기. 첫 이미지 카드가 있으면 사진, 없으면 첫 카드 글을 보여준다.
export function PostTile({ post, onOpen, rounded = false, showPersona = true }) {
  const [failed, setFailed] = useState(false)
  const imageCard = post.sections.find((section) => section.image)
  const first = post.sections[0]
  return <button onClick={() => onOpen(post)} aria-label={`${post.title} 쇼츠 보기`} className={`relative aspect-[9/16] w-full overflow-hidden bg-[#272727] text-left ${rounded ? 'rounded-lg' : ''}`}>
    {imageCard && !failed ? <img src={imageCard.image.url} alt="" loading="lazy" onError={() => setFailed(true)} className="h-full w-full object-cover" />
      : <span className="shorts-textcard absolute inset-0 flex items-center p-3"><span className="line-clamp-6 text-[12px] font-semibold leading-[17px]">{first?.title || first?.body}</span></span>}
    <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
    <span className="absolute left-1.5 top-1.5 rounded bg-black/60 px-1 text-[10px] font-medium">카드 {post.sections.length}</span>
    <span className="absolute inset-x-2 bottom-2"><strong className="line-clamp-2 text-[13px] font-medium leading-[18px]">{post.title}</strong>{showPersona && <span className="mt-0.5 block truncate text-[11px] text-white/75">@{post.persona.username}</span>}</span>
  </button>
}

export function TileGrid({ posts, onOpen, columns = 3 }) {
  return <div className={`grid gap-[2px] ${columns === 2 ? 'grid-cols-2 gap-1 px-1' : 'grid-cols-3'}`}>{posts.map((post) => <PostTile key={post.id} post={post} onOpen={(item) => onOpen(item, posts)} rounded={columns === 2} />)}</div>
}

// 회원 전용 화면을 비회원이 열었을 때의 안내.
export function MemberOnly({ icon, title, body, onLogin }) {
  return <Empty icon={icon} title={title} body={body} className="py-20" action={<PillButton light onClick={onLogin} className="mt-5">로그인</PillButton>} />
}
