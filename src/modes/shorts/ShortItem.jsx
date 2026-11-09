import { useRef, useState } from 'react'
import Icon from '../../components/Icon.jsx'
import { useStore } from '../../shared/store.jsx'
import { citationLabel, compactCount } from '../../shared/format.js'
import { AiBadge, Avatar, CardImage } from './ui.jsx'

const SWIPE_PX = 48

// 게시물 하나가 쇼츠 한 편, 카드 한 장이 한 화면이다. 자동 재생은 없고 좌우 스와이프·탭·화살표 키로만 넘긴다.
export default function ShortItem({ post, card, onCard, near, topOffset, onQuiz, onChat, onInfo, onShare, onChannel }) {
  const { isLiked, isSaved, isFollowing, likeCount, toggleLike, toggleSave, toggleFollow } = useStore()
  const total = post.sections.length
  const last = total - 1
  const [dx, setDx] = useState(0)
  const drag = useRef(null)
  const go = (next) => onCard(Math.max(0, Math.min(last, next)))
  const liked = isLiked(post)
  const saved = isSaved(post)
  const following = isFollowing(post)

  // 세로 넘김은 스크롤(스냅)에 맡기고, 가로로 움직인 경우에만 카드 넘김으로 가져온다.
  const onPointerDown = (event) => { if (event.button > 0) return; drag.current = { x: event.clientX, y: event.clientY, mode: null } }
  const onPointerMove = (event) => {
    const state = drag.current
    if (!state) return
    const mx = event.clientX - state.x
    const my = event.clientY - state.y
    if (!state.mode) {
      if (Math.abs(mx) > 8 && Math.abs(mx) > Math.abs(my)) { state.mode = 'h'; event.currentTarget.setPointerCapture?.(event.pointerId) }
      else if (Math.abs(my) > 8) state.mode = 'v'
    }
    if (state.mode === 'h') setDx((card === 0 && mx > 0) || (card === last && mx < 0) ? mx / 3 : mx)
  }
  const onPointerUp = (event) => {
    const state = drag.current
    drag.current = null
    if (!state) return
    const mx = event.clientX - state.x
    if (state.mode === 'h') { setDx(0); if (mx <= -SWIPE_PX) go(card + 1); else if (mx >= SWIPE_PX) go(card - 1); return }
    if (state.mode) return
    const { left, width } = event.currentTarget.parentElement.getBoundingClientRect() // 트랙은 현재 카드만큼 이동해 있으므로 바깥 article 기준으로 잰다
    const x = (event.clientX - left) / width
    if (x < 1 / 3) go(card - 1)
    else if (x > 2 / 3) go(card + 1)
  }
  const onPointerCancel = () => { drag.current = null; setDx(0) }

  return <article className="relative h-full snap-start snap-always overflow-hidden bg-black text-white" aria-roledescription="쇼츠" aria-label={`${post.persona.displayName}: ${post.title}`}>
    {near ? <div className={`shorts-track absolute inset-0 flex touch-pan-y select-none ${dx ? 'dragging' : ''}`} style={{ transform: `translateX(calc(${-card * 100}% + ${dx}px))` }}
      onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerCancel} onDragStart={(event) => event.preventDefault()}>
      {post.sections.map((section, index) => <Card key={section.id} section={section} current={index === card} eager={Math.abs(index - card) <= 1} topOffset={topOffset} />)}
    </div> : <div className="shorts-textcard absolute inset-0" />}

    <div className="sr-only" aria-live="polite">{`카드 ${card + 1}/${total}`}</div>
    <div className="absolute left-4 flex gap-2 focus-within:z-10" style={{ top: topOffset }}>
      <span className="shorts-shadow pointer-events-none rounded-full bg-black/45 px-2 py-0.5 text-[12px] font-medium tabular-nums">{card + 1}/{total}</span>
      <button onClick={() => go(card - 1)} disabled={card === 0} className="sr-only rounded-full bg-black/60 px-2 text-[12px] focus:not-sr-only">이전 카드</button>
      <button onClick={() => go(card + 1)} disabled={card === last} className="sr-only rounded-full bg-black/60 px-2 text-[12px] focus:not-sr-only">다음 카드</button>
    </div>

    <div className="absolute bottom-[27px] right-0 flex w-16 flex-col items-center gap-3">
      <Action icon="heart" label={compactCount(likeCount(post))} ariaLabel={liked ? '좋아요 취소' : '좋아요'} pressed={liked} onClick={() => toggleLike(post)} />
      <Action icon="bookmark" label={saved ? '저장됨' : '저장'} ariaLabel={saved ? '저장 취소' : '저장'} pressed={saved} onClick={() => toggleSave(post)} />
      <Action icon="book" label="퀴즈" ariaLabel="학습 퀴즈 풀기" onClick={() => onQuiz(post)} />
      <Action icon="comment" label="대화" ariaLabel={`${post.persona.displayName} AI와 이 게시물로 대화하기`} onClick={() => onChat(post)} />
      <Action icon="layers" label="출처" ariaLabel="설명과 출처 보기" onClick={() => onInfo(post)} />
      <Action icon="send" label="공유" ariaLabel="공유할 문구 복사" onClick={() => onShare(post)} />
      <button onClick={() => onChannel(post.persona)} aria-label={`${post.persona.displayName} 채널로 이동`} className="mt-1 h-10 w-10 overflow-hidden rounded-[6px] border-2 border-white/80"><Avatar persona={post.persona} size={36} className="!rounded-none" /></button>
    </div>

    <div className="absolute bottom-[19px] left-4 right-16">
      <div className="flex items-center gap-2">
        <button onClick={() => onChannel(post.persona)} className="flex min-w-0 items-center gap-2" aria-label={`${post.persona.displayName} 채널로 이동`}>
          <Avatar persona={post.persona} size={32} />
          <span className="shorts-shadow truncate text-[14px] font-medium">@{post.persona.username}</span>
        </button>
        <AiBadge className="shorts-shadow" />
        <button onClick={() => toggleFollow(post)} aria-pressed={following} className={`h-10 shrink-0 rounded-[20px] px-4 text-[14px] font-medium ${following ? 'bg-white/20 text-white' : 'bg-[#0f0f0f] text-[#f1f1f1]'}`}>{following ? '구독중' : '구독'}</button>
      </div>
      <button onClick={() => onInfo(post)} className="shorts-shadow mt-2 block w-full truncate text-left text-[14px] leading-5">{post.title}</button>
    </div>

    <div className="absolute inset-x-0 bottom-0 flex h-[3px] gap-[2px]" role="progressbar" aria-label="카드 위치" aria-valuemin={1} aria-valuemax={total} aria-valuenow={card + 1} aria-valuetext={`${total}장 중 ${card + 1}번째 카드`}>
      {post.sections.map((section, index) => <span key={section.id} className={`h-full flex-1 ${index <= card ? 'bg-[#ff0033]' : 'bg-white/30'}`} />)}
    </div>
  </article>
}

function Card({ section, current, eager, topOffset }) {
  const [imageFailed, setImageFailed] = useState(false)
  const hasImage = Boolean(section.image) && !imageFailed
  const quote = section.citationType === 'DIRECT_QUOTE'
  return <div className={`relative h-full w-full shrink-0 overflow-hidden ${hasImage ? 'bg-[#111]' : 'shorts-textcard'}`} aria-hidden={!current}>
    {section.image && <CardImage image={section.image} eager={eager} onFail={() => setImageFailed(true)} className="pointer-events-none absolute inset-0 h-full w-full object-cover" />}
    {hasImage && <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/50 via-black/5 via-40% to-black/85" />}
    <div className={`pointer-events-none absolute left-4 right-[76px] flex flex-col ${hasImage ? 'justify-end' : 'justify-center'}`} style={{ top: topOffset + 36, bottom: 104 }}>
      <div className="flex flex-wrap gap-1.5">
        <span className="max-w-full truncate rounded bg-black/55 px-1.5 py-0.5 text-[11px] font-medium">{citationLabel(section)}{quote && section.quoteAttribution ? ` · ${section.quoteAttribution}` : ''}</span>
        {hasImage && section.image.aiGenerated && <span className="rounded bg-black/55 px-1.5 py-0.5 text-[11px] font-medium">AI 생성 이미지</span>}
      </div>
      {section.title && <h2 className={`shorts-shadow mt-2.5 font-extrabold leading-[1.25] tracking-[-.02em] ${hasImage ? 'text-[21px]' : 'text-[24px]'}`}>{section.title}</h2>}
      <p className={`shorts-shadow mt-2 overflow-hidden whitespace-pre-line ${quote ? 'font-editorial text-[19px] leading-8' : hasImage ? 'text-[15px] leading-6' : 'text-[17px] leading-7'} ${hasImage ? 'line-clamp-6' : 'line-clamp-[10]'}`}>{section.body}</p>
      {section.image && imageFailed && <p className="mt-2 text-[11px] text-white/60">이미지를 불러오지 못해 글로만 보여드려요. ({section.image.altText})</p>}
      {hasImage && section.image.credit && <p className="mt-2 truncate text-[10px] text-white/60">이미지: {section.image.credit}</p>}
    </div>
  </div>
}

function Action({ icon, label, ariaLabel, pressed, onClick }) {
  return <div className="flex flex-col items-center">
    <button onClick={onClick} aria-label={ariaLabel} aria-pressed={pressed} className="shorts-icon-shadow grid h-8 w-8 place-items-center rounded-full"><Icon name={icon} size={30} strokeWidth={1.7} filled={pressed} /></button>
    <span className="shorts-shadow h-4 text-[12px] font-medium leading-4">{label}</span>
  </div>
}
