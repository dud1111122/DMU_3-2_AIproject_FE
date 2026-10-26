import { useCallback, useRef, useState } from 'react'
import Icon from './Icon.jsx'
import Avatar from './Avatar.jsx'
import AiBadge from '../shared/AiBadge.jsx'
import { useStore } from '../shared/store.jsx'
import { formatDate } from '../shared/format.js'

const textTones = ['#f4efe6', '#eaf0f6', '#eef3ea', '#f6ecec', '#efeaf5']

// 가로 스크롤 스냅으로 넘기는 캐러셀. 손가락으로 밀거나 화살표·점으로 이동한다.
export function useCarousel(count) {
  const trackRef = useRef(null)
  const [index, setIndex] = useState(0)
  const onScroll = useCallback(() => { const track = trackRef.current; if (track) setIndex(Math.round(track.scrollLeft / track.clientWidth)) }, [])
  const goTo = (next) => { const track = trackRef.current; const target = Math.max(0, Math.min(count - 1, next)); if (track) track.scrollTo({ left: target * track.clientWidth, behavior: 'smooth' }); setIndex(target) }
  return { trackRef, index, onScroll, goTo, count }
}

export function Carousel({ post, carousel, onTap }) {
  const { trackRef, index, onScroll, goTo } = carousel
  const total = post.sections.length
  return <div className="carousel-root relative" role="region" aria-roledescription="carousel" aria-label={`${post.title} 카드`}>
    <div ref={trackRef} onScroll={onScroll} className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto" onClick={onTap}>
      {post.sections.map((section, order) => <Slide key={section.id} section={section} index={order} total={total} tone={textTones[(Number(post.id) + order) % textTones.length]} />)}
    </div>
    {index > 0 && <button type="button" onClick={() => goTo(index - 1)} className="carousel-arrow absolute left-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full bg-white/85 shadow" aria-label="이전 카드"><Icon name="back" size={16} strokeWidth={2.2} /></button>}
    {index < total - 1 && <button type="button" onClick={() => goTo(index + 1)} className="carousel-arrow absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 rotate-180 place-items-center rounded-full bg-white/85 shadow" aria-label="다음 카드"><Icon name="back" size={16} strokeWidth={2.2} /></button>}
    {total > 1 && <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-medium text-white">{index + 1}/{total}</span>}
  </div>
}

export function Dots({ carousel }) {
  if (carousel.count < 2) return null
  return <div className="flex items-center gap-1">{Array.from({ length: carousel.count }, (_, i) => <button key={i} type="button" onClick={() => carousel.goTo(i)} className={`h-1.5 w-1.5 rounded-full ${i === carousel.index ? 'bg-[#0095f6]' : 'bg-[#c7c7c7]'}`} aria-label={`${i + 1}번째 카드로 이동`} aria-current={i === carousel.index ? 'true' : undefined} />)}</div>
}

function Slide({ section, index, total, tone }) {
  const [failed, setFailed] = useState(false)
  const image = section.image && !failed ? section.image : null
  const quote = section.citationType === 'DIRECT_QUOTE'
  const attribution = quote && section.quoteAttribution && <p className={`mt-2 text-[11px] ${image ? 'text-white/85' : 'text-[#6b665c]'}`}>— {section.quoteAttribution}</p>
  return <section aria-label={`카드 ${index + 1}/${total}${section.title ? ` · ${section.title}` : ''}`} className="relative aspect-[4/5] w-full shrink-0 snap-center overflow-hidden" style={{ background: tone }}>
    {image ? <>
      <img src={image.url} alt={image.altText || ''} onError={() => setFailed(true)} draggable={false} className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/5" />
      <div className="no-scrollbar absolute inset-x-0 bottom-0 max-h-[64%] overflow-y-auto px-5 pb-5 pt-8 text-white">
        {section.title && <h3 className="text-[21px] font-bold leading-[1.25] tracking-[-.02em] drop-shadow">{section.title}</h3>}
        <p className={`${section.title ? 'mt-2' : ''} whitespace-pre-line text-[14px] leading-[1.6] text-white/95 drop-shadow`}>{section.body}</p>
        {attribution}
        {image.credit && <p className="mt-3 text-[9px] text-white/65">이미지 · {image.credit}</p>}
      </div>
    </> : <div className="no-scrollbar absolute inset-0 flex flex-col overflow-y-auto px-6 py-5 text-[#2b2925]">
      <div className="my-auto py-4">
        {quote ? <>
          <Icon name="quote" size={30} strokeWidth={1.6} className="text-[#b9b1a2]" />
          <p className="mt-2 whitespace-pre-line font-serif text-[22px] font-semibold leading-[1.45]">{section.body}</p>
          {attribution}
          {section.title && <p className="mt-4 text-[12px] text-[#6b665c]">{section.title}</p>}
        </> : <>
          {section.title && <h3 className="text-[22px] font-bold leading-[1.3] tracking-[-.02em]">{section.title}</h3>}
          <p className={`${section.title ? 'mt-3' : ''} whitespace-pre-line text-[15px] leading-[1.7] text-[#3d3a35]`}>{section.body}</p>
        </>}
      </div>
      {section.image && failed && <p className="text-[10px] leading-4 text-[#8a8478]">이미지를 불러오지 못했어요{section.image.altText ? ` · ${section.image.altText}` : ''}</p>}
    </div>}
  </section>
}

export function PersonaHeader({ post, onOpenPersona, onOpenMenu, compact = false }) {
  const { isFollowing, toggleFollow } = useStore()
  const following = isFollowing(post)
  const topics = post.topics.map((topic) => topic.name).join(' · ')
  return <header className="flex h-[54px] items-center gap-2.5 px-3">
    <Avatar person={post.persona} size="sm" onClick={() => onOpenPersona(post.persona)} />
    <div className="min-w-0 flex-1">
      <span className="flex items-center gap-1.5">
        <button onClick={() => onOpenPersona(post.persona)} className="truncate text-[13px] font-semibold">{post.persona.username}</button>
        <AiBadge className="text-[#737373]" />
        {!following && <><span className="text-[#737373]">·</span><button onClick={() => toggleFollow(post)} className="shrink-0 text-[13px] font-semibold text-[#0095f6]">팔로우</button></>}
      </span>
      <span className="block truncate text-[11px] text-[#737373]">{post.persona.displayName}{topics ? ` · ${topics}` : ''}{compact ? '' : ` · ${formatDate(post.publishedAt)}`}</span>
    </div>
    {onOpenMenu && <button onClick={() => onOpenMenu(post)} className="grid h-9 w-9 place-items-center" aria-label="게시물 메뉴"><Icon name="more" size={22} /></button>}
  </header>
}

export function ActionBar({ post, carousel, onOpenChat, onShare }) {
  const { isLiked, isSaved, toggleLike, toggleSave } = useStore()
  const liked = isLiked(post)
  const saved = isSaved(post)
  return <div className="relative flex h-11 items-center justify-between px-3">
    <div className="flex items-center gap-4">
      <button onClick={() => toggleLike(post)} aria-label={liked ? '좋아요 취소' : '좋아요'} aria-pressed={liked} className={liked ? 'text-[#ff3040]' : ''}><Icon name="heart" size={25} filled={liked} /></button>
      <button onClick={() => onOpenChat(post)} aria-label={`${post.persona.displayName} 페르소나와 이 게시물로 대화하기`}><Icon name="comment" size={24} /></button>
      <button onClick={() => onShare(post)} aria-label="공유 문구 복사"><Icon name="send" size={23} /></button>
    </div>
    <div className="absolute left-1/2 -translate-x-1/2"><Dots carousel={carousel} /></div>
    <button onClick={() => toggleSave(post)} aria-label={saved ? '저장 취소' : '저장'} aria-pressed={saved}><Icon name="bookmark" size={24} filled={saved} /></button>
  </div>
}

export default function PostCard({ post, onOpenPost, onOpenPersona, onOpenChat, onOpenMenu, onShare }) {
  const { likeCount } = useStore()
  const carousel = useCarousel(post.sections.length)
  return <article className="border-b border-[#efefef] pb-3" aria-label={`${post.persona.displayName}의 게시물: ${post.title}`}>
    <PersonaHeader post={post} onOpenPersona={onOpenPersona} onOpenMenu={onOpenMenu} />
    <Carousel post={post} carousel={carousel} onTap={() => onOpenPost(post)} />
    <ActionBar post={post} carousel={carousel} onOpenChat={onOpenChat} onShare={onShare} />
    <div className="px-3 text-[13px] leading-[1.5]">
      <p className="font-semibold">좋아요 {likeCount(post).toLocaleString('ko-KR')}개</p>
      <p className="mt-1"><button onClick={() => onOpenPersona(post.persona)} className="mr-1 font-semibold">{post.persona.username}</button><strong className="font-semibold">{post.title}</strong></p>
      {post.caption && <p className="mt-0.5 line-clamp-2 text-[#262626]">{post.caption}</p>}
      <button onClick={() => onOpenPost(post)} className="mt-1 text-[12px] text-[#737373]">{post.keyPoints ? `학습 포인트 ${post.keyPoints.length}개 · 참고 문헌 ${post.sources.length}개 · ` : ''}자세히 보기</button>
      <p className="mt-1 text-[10px] text-[#8e8e8e]">{formatDate(post.publishedAt)} · AI가 생성한 게시물</p>
    </div>
  </article>
}
