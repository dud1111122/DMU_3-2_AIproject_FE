import { useRef, useState } from 'react'
import Icon from '../components/Icon.jsx'
import Avatar from '../components/Avatar.jsx'

export default function DetailScreen({ post, person, onBack, onOpenPerson, onOpenComments, saved, onToggleSave, liked, onToggleLike, followed, onToggleFollow }) {
  const [slideIndex, setSlideIndex] = useState(0)
  const touchStart = useRef(null)
  const slide = post.slides[slideIndex]
  const move = (direction) => setSlideIndex((index) => Math.max(0, Math.min(post.slides.length - 1, index + direction)))

  return <div className="h-full overflow-y-auto pb-20">
    <header className="flex h-[54px] items-center gap-4 border-b border-[#efefef] px-4"><button onClick={onBack} aria-label="뒤로"><Icon name="back" size={23} /></button><strong className="text-[16px]">게시물</strong></header>
    <div className="flex h-[54px] items-center gap-2.5 px-3">
      <button onClick={() => onOpenPerson(person)}><Avatar person={person} size="sm" story /></button>
      <button onClick={() => onOpenPerson(person)} className="flex-1 text-left"><strong className="block text-[13px]">{person.handle}</strong><span className="text-[10px] text-[#737373]">{person.name} · {person.era}</span></button>
      <button onClick={() => onToggleFollow(person.id)} className={`rounded-md px-3 py-1.5 text-[11px] font-semibold ${followed ? 'bg-[#efefef]' : 'bg-[#0095f6] text-white'}`}>{followed ? '팔로잉' : '팔로우'}</button><button aria-label="게시물 메뉴"><Icon name="more" size={21} /></button>
    </div>

    <section aria-label={`카드 ${slideIndex + 1}/${post.slides.length}`} className="relative aspect-square w-full overflow-hidden bg-[#ece9e2]" onTouchStart={(event) => { touchStart.current = event.touches[0].clientX }} onTouchEnd={(event) => { if (touchStart.current === null) return; const delta = event.changedTouches[0].clientX - touchStart.current; if (Math.abs(delta) > 45) move(delta < 0 ? 1 : -1); touchStart.current = null }}>
      <img src={slide.image} alt="" className="h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/10" />
      <div className="absolute left-5 right-5 top-7 text-white drop-shadow-md"><p className="text-[10px] font-semibold tracking-[.18em]">{person.field.toUpperCase()}</p><h1 className="mt-4 max-w-[290px] text-[29px] font-semibold leading-[1.15] tracking-[-.04em]">{slide.title}</h1></div>
      <div className="absolute bottom-8 left-5 right-5 text-[13px] leading-5 text-white drop-shadow">{slide.subtitle}</div>
      {slideIndex > 0 && <button onClick={() => move(-1)} className="absolute left-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-white/85" aria-label="이전 카드"><Icon name="back" size={18} /></button>}
      {slideIndex < post.slides.length - 1 && <button onClick={() => move(1)} className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 rotate-180 place-items-center rounded-full bg-white/85" aria-label="다음 카드"><Icon name="back" size={18} /></button>}
      <span className="absolute right-3 top-3 rounded-full bg-black/45 px-2 py-1 text-[10px] text-white">{slideIndex + 1}/{post.slides.length}</span>
      <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">{post.slides.map((_, index) => <button key={index} onClick={() => setSlideIndex(index)} aria-label={`${index + 1}번째 카드`} className={`h-1.5 w-1.5 rounded-full ${slideIndex === index ? 'bg-[#0095f6]' : 'bg-white/75'}`} />)}</div>
    </section>

    <div className="flex items-center justify-between px-4 pt-3">
      <div className="flex items-center gap-4"><button onClick={() => onToggleLike(post.id)} aria-label={liked ? '좋아요 취소' : '좋아요'} className={liked ? 'text-red-500' : ''}><Icon name="heart" size={24} filled={liked} /></button><button onClick={() => onOpenComments(post)} aria-label="댓글"><Icon name="comment" size={23} /></button><button aria-label="공유"><Icon name="send" size={22} /></button></div>
      <button onClick={() => onToggleSave(post.id)} aria-label={saved ? '저장 취소' : '저장'} className={saved ? 'text-[#0095f6]' : ''}><Icon name="bookmark" size={23} filled={saved} /></button>
    </div>
    <div className="px-4 pb-5 pt-2 text-[12px] leading-[1.6]">
      <p className="font-semibold">좋아요 {liked ? '2,482' : post.likes}개</p>
      <p className="mt-1"><strong className="mr-1">{person.handle}</strong>{post.caption}</p>
      <button onClick={() => onOpenComments(post)} className="mt-1 text-[#737373]">댓글 모두 보기</button>
      <p className="mt-1 text-[9px] uppercase text-[#8e8e8e]">{post.date} · 카드 {slideIndex + 1}/{post.slides.length}</p>
      <div className="mt-4 border-t border-[#efefef] pt-3"><p className="text-[10px] font-semibold text-[#737373]">출처</p><p className="mt-1 text-[11px] leading-5">{post.source}</p><p className="mt-2 text-[10px] leading-4 text-[#8e8e8e]">카드 설명은 출처를 바탕으로 정리했습니다. 실제 인용과 해설을 구분해 읽어주세요.</p></div>
      <div className="mt-4 flex flex-wrap gap-2">{post.tags.map((tag) => <button key={tag} className="text-[11px] text-[#00376b]">#{tag}</button>)}</div>
    </div>
  </div>
}
