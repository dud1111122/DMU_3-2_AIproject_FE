import { useRef, useState } from 'react'
import Icon from '../components/Icon.jsx'
import { ActionBar, Carousel, PersonaHeader, useCarousel } from '../components/PostCard.jsx'
import { formatDate, withParticle } from '../shared/format.js'
import { BackHeader, ErrorState, Loading, usePost } from './ui.jsx'

export default function DetailScreen({ postId, initialPost, onBack, onOpenPersona, onOpenChat, onOpenQuiz, onOpenMenu, onOpenReport, onShare }) {
  const { post, loading, error, reload } = usePost(postId, initialPost)
  const carousel = useCarousel(post?.sections.length || 0)
  const trackRef = useRef(null)
  const [pointIndex, setPointIndex] = useState(0)
  if (!post) return <div className="pb-6"><BackHeader title="게시물" onBack={onBack} />{loading ? <Loading /> : <ErrorState error={error} onRetry={reload} />}</div>

  const { persona } = post
  const pointCount = post.keyPoints.length
  // 학습 포인트는 한 번에 하나씩 가로로 넘긴다. 스크롤 위치로 현재 번호를 맞춘다.
  const onPointScroll = () => {
    const el = trackRef.current
    if (el && el.clientWidth) setPointIndex(Math.round(el.scrollLeft / el.clientWidth))
  }
  const goPoint = (index) => trackRef.current?.scrollTo({ left: index * trackRef.current.clientWidth, behavior: 'smooth' })

  return <div className="pb-8">
    <BackHeader title="게시물" sub={persona.displayName} onBack={onBack} right={<button onClick={() => onOpenMenu(post)} aria-label="게시물 메뉴" className="grid h-9 w-9 place-items-center"><Icon name="more" size={22} /></button>} />
    <PersonaHeader post={post} onOpenPersona={onOpenPersona} compact />
    <Carousel post={post} carousel={carousel} />
    <ActionBar post={post} carousel={carousel} onOpenChat={onOpenChat} onShare={onShare} />

    <div className="px-4 pt-2">
      <h1 className="text-[18px] font-bold leading-[1.35] tracking-[-.01em]">{post.title}</h1>
      <p className="mt-1.5 text-[13px] leading-[1.6] text-[#262626]">{post.summary}</p>
      {post.caption && <p className="mt-2 text-[12px] leading-[1.6] text-[#737373]">{post.caption}</p>}
      <div className="mt-2.5 flex flex-wrap gap-1.5">{post.topics.map((topic) => <span key={topic.id} className="rounded-full bg-[#efefef] px-2.5 py-1 text-[11px]">{topic.name}</span>)}</div>
      <p className="mt-2 text-[10px] text-[#8e8e8e]">{formatDate(post.publishedAt)} 게시 · AI 재현 페르소나가 생성</p>
    </div>

    {pointCount > 0 && <section aria-labelledby="ig-keypoints" className="mx-4 mt-4 rounded-xl bg-[#f6f6f6] p-4">
      <div className="flex items-baseline justify-between">
        <h2 id="ig-keypoints" className="text-[13px] font-semibold">학습 포인트</h2>
        <span className="text-[11px] text-[#737373]" aria-live="polite">{pointIndex + 1}/{pointCount}</span>
      </div>
      <div ref={trackRef} onScroll={onPointScroll} className="no-scrollbar mt-2 flex snap-x snap-mandatory overflow-x-auto" aria-roledescription="carousel" aria-label="학습 포인트">
        {post.keyPoints.map((point, index) => {
          const cardIndex = post.sections.findIndex((section) => section.id === point.sectionId)
          return <div key={point.id} role="group" aria-roledescription="slide" aria-label={`${index + 1}/${pointCount}`} className="flex min-h-[96px] w-full shrink-0 snap-center flex-col justify-between">
            <p className="flex gap-2 text-[13px] leading-6"><span className="font-semibold text-[#0095f6]">{index + 1}</span><span className="min-w-0 flex-1">{point.text}</span></p>
            {cardIndex >= 0 && <button onClick={() => carousel.goTo(cardIndex)} className="mt-2 self-start text-[11px] text-[#737373] underline underline-offset-2">카드 {cardIndex + 1} 보기</button>}
          </div>
        })}
      </div>
      <div className="mt-2 flex justify-center gap-1.5">
        {post.keyPoints.map((point, index) => <button key={point.id} onClick={() => goPoint(index)} aria-label={`${index + 1}번 학습 포인트로 이동`} aria-current={index === pointIndex ? 'true' : undefined} className={`h-1.5 rounded-full ${index === pointIndex ? 'w-4 bg-[#0095f6]' : 'w-1.5 bg-[#c7c7c7]'}`} />)}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button onClick={() => onOpenQuiz(post)} className="min-h-12 rounded-lg bg-[#0095f6] px-3 py-2 text-[13px] font-semibold leading-tight text-white">이해 확인</button>
        <button onClick={() => onOpenChat(post)} className="min-h-12 break-keep rounded-lg border border-[#dbdbdb] bg-white px-3 py-2 text-[12px] font-semibold leading-tight text-[#262626]">{withParticle(persona.displayName, '와', '과')} 대화하기</button>
      </div>
    </section>}

    <div className="mx-4 mt-4 flex justify-center">
      <button onClick={() => onOpenReport(post)} className="h-9 px-3 text-[12px] text-[#e5484d]">이 게시물 신고하기</button>
    </div>
  </div>
}
