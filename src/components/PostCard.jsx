import { useRef, useState } from 'react'
import Icon from './Icon.jsx'
import Avatar from './Avatar.jsx'

export default function PostCard({ post, person, saved, liked, onToggleSave, onToggleLike, onOpenPerson, onOpenPost, onOpenComments }) {
  const [index, setIndex] = useState(0)
  const touchStart = useRef(null)
  const swiped = useRef(false)
  const slide = post.slides[index]
  const change = (next) => setIndex(Math.max(0, Math.min(post.slides.length - 1, next)))
  const onSwipeEnd = (event) => {
    if (touchStart.current === null) return
    const delta = event.changedTouches[0].clientX - touchStart.current
    if (Math.abs(delta) > 45) { change(index + (delta < 0 ? 1 : -1)); swiped.current = true }
    touchStart.current = null
  }
  return <article className="border-b border-[#efefef] pb-3">
    <header className="flex h-[55px] items-center justify-between px-3">
      <button onClick={() => onOpenPerson(person)} className="flex min-w-0 items-center gap-2.5 text-left">
        <Avatar person={person} size="sm" story />
        <span className="min-w-0"><strong className="block truncate text-[13px] font-semibold">{person.handle}</strong><span className="block truncate text-[10px] text-[#737373]">{person.field} · 지식 카드</span></span>
      </button>
      <button className="grid h-9 w-9 place-items-center" aria-label="게시물 메뉴"><Icon name="more" size={23} /></button>
    </header>
    <div role="button" tabIndex={0} className="relative block aspect-square w-full overflow-hidden bg-[#edeae2] text-left" onClick={() => { if (swiped.current) { swiped.current = false; return } onOpenPost(post) }} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') onOpenPost(post) }} onTouchStart={(event) => { touchStart.current = event.touches[0].clientX; swiped.current = false }} onTouchEnd={onSwipeEnd} aria-label="게시물 자세히 보기">
      <img src={slide.image} alt="" className="h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-black/10" />
      <div className="absolute left-5 right-5 top-7 text-white drop-shadow-md">
        <p className="text-[10px] font-semibold tracking-[.22em]">{person.field.toUpperCase()} · {index + 1}/{post.slides.length}</p>
        <h2 className="mt-4 max-w-[290px] text-[30px] font-semibold leading-[1.16] tracking-[-.04em]">{slide.title}</h2>
        {index === 0 && <p className="mt-3 max-w-[280px] text-[13px] leading-5 text-white/90">{slide.subtitle}</p>}
      </div>
      <span className="absolute right-3 top-3 rounded-full bg-black/45 px-2 py-1 text-[10px] text-white">{index + 1}/{post.slides.length}</span>
      {index > 0 && <button type="button" onClick={(event) => { event.stopPropagation(); change(index - 1) }} className="absolute left-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-white/80" aria-label="이전 카드"><Icon name="back" size={18} /></button>}
      {index < post.slides.length - 1 && <button type="button" onClick={(event) => { event.stopPropagation(); change(index + 1) }} className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 rotate-180 place-items-center rounded-full bg-white/80" aria-label="다음 카드"><Icon name="back" size={18} /></button>}
    </div>
    <div className="flex items-center justify-between px-3 pt-2">
      <div className="flex items-center gap-3.5">
        <button onClick={() => onToggleLike(post.id)} aria-label={liked ? '좋아요 취소' : '좋아요'} className={liked ? 'text-red-500' : ''}><Icon name="heart" size={24} filled={liked} /></button>
        <button onClick={() => onOpenComments(post)} aria-label="댓글 보기"><Icon name="comment" size={23} /></button>
        <button aria-label="게시물 공유"><Icon name="send" size={22} /></button>
      </div>
      <div className="flex items-center gap-1.5" aria-label={`${index + 1}번째 카드`}>{post.slides.map((_, i) => <button key={i} onClick={() => change(i)} className={`h-1.5 w-1.5 rounded-full ${i === index ? 'bg-[#0095f6]' : 'bg-[#c7c7c7]'}`} aria-label={`${i + 1}번째 카드로 이동`} />)}</div>
      <button onClick={() => onToggleSave(post.id)} aria-label={saved ? '저장 취소' : '저장'} className={saved ? 'text-[#0095f6]' : ''}><Icon name="bookmark" size={23} filled={saved} /></button>
    </div>
    <div className="px-3 pt-1.5 text-[12px] leading-[1.55]">
      <p className="font-semibold">좋아요 {liked ? '2,482' : post.likes}개</p>
      <p className="mt-1 line-clamp-2"><strong className="mr-1 font-semibold">{person.handle}</strong>{post.caption}</p>
      <button onClick={() => onOpenPost(post)} className="mt-0.5 text-[#737373]">더 보기</button>
      <button onClick={() => onOpenComments(post)} className="ml-2 text-[#737373]">댓글 모두 보기</button>
      <p className="mt-1 text-[9px] uppercase text-[#8e8e8e]">{post.date} · 출처 보기</p>
    </div>
  </article>
}
