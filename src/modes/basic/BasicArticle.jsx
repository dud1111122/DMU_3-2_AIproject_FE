import { useState } from 'react'
import Icon from '../../components/Icon.jsx'
import AiBadge from '../../shared/AiBadge.jsx'
import { api } from '../../api/index.js'
import { errorMessage } from '../../api/errors.js'
import { useApi, useReport } from '../../shared/hooks.js'
import { useStore } from '../../shared/store.jsx'
import { AI_DISCLOSURE, citationLabel, formatDate, reportReasons, sourceStatusLabel, withParticle, sourceDetail } from '../../shared/format.js'
import { BIcon, ErrorState, FollowButton, Notice, PrimaryButton, SafeImage, SaveButton, Sheet, Skeleton, TopBar, useNav } from './ui.jsx'

export default function BasicArticle({ postId }) {
  const nav = useNav()
  const { data: post, error, loading, reload } = useApi(() => api.post(postId), [postId])
  const [reporting, setReporting] = useState(false)
  const { canReport } = useReport()

  if (!post) return <div><TopBar onBack={nav.back} title="게시물" />{loading ? <Skeleton rows={4} /> : <ErrorState error={error} onRetry={reload} />}</div>
  const name = post.persona.displayName
  const openReport = () => { if (canReport()) setReporting(true) }

  return <article className="min-h-full">
    <TopBar onBack={nav.back} title="" right={<>
      <SaveButton post={post} />
      <button onClick={openReport} aria-label="게시물 신고" className="grid h-9 w-9 place-items-center text-[#6f6b63]"><Icon name="flag" size={19} /></button>
    </>} />

    <section className="mx-4 mt-4 flex items-center gap-3 rounded-2xl border border-[#e7e3da] bg-white px-4 py-3.5" aria-label="게시자">
      <button onClick={() => nav.openPersona(post.persona.id)} className="min-w-0 flex-1 text-left" aria-label={`게시자 ${name} 프로필 보기`}>
        <span className="text-[10px] font-semibold text-[#6f6b63]">게시자</span>
        <span className="mt-0.5 flex items-center gap-1.5"><strong className="truncate text-[15px]">{name}</strong><AiBadge className="text-[#6f6b63]" /></span>
        <span className="mt-0.5 block text-[11px] text-[#6f6b63]">@{post.persona.username}</span>
      </button>
      <FollowButton target={post} name={name} />
    </section>

    <div className="px-5 pt-6">
      <h1 className="font-basic text-[27px] font-bold leading-[1.25] tracking-[-.02em] text-balance">{post.title}</h1>
      <p className="mt-2 text-[15px] leading-[1.6] text-[#4a4741]">{post.summary}</p>
      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px] text-[#6f6b63]">
        <span>{formatDate(post.publishedAt)}</span>
        {post.topics.map((topic) => <button key={topic.id} onClick={() => nav.openTopic(topic)} className="rounded-full bg-[#efece4] px-2 py-0.5 text-[#4a4741]">#{topic.name}</button>)}
      </div>
    </div>
    {post.caption && <p className="px-5 pt-5 text-[14px] leading-[1.8] text-[#2f2d29]">{post.caption}</p>}

    <ol className="px-5" aria-label="카드">{post.sections.map((section, index) => <li key={section.id} className="mt-6 border-t border-[#e7e3da] pt-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-basic text-[13px] font-bold text-[#2f5d50]">{String(index + 1).padStart(2, '0')}</span>
        <span className={`rounded px-1.5 py-0.5 text-[10px] ${section.citationType === 'DIRECT_QUOTE' ? 'bg-[#e8efec] font-semibold text-[#2f5d50]' : 'bg-[#efece4] text-[#6f6b63]'}`}>{citationLabel(section)}{section.citationType === 'DIRECT_QUOTE' && section.quoteAttribution ? ` · ${section.quoteAttribution}` : ''}</span>
      </div>
      {section.title && <h2 className="font-basic mt-2 text-[20px] font-bold leading-[1.35] text-balance">{section.title}</h2>}
      {section.image && <figure className="mt-3">
        <SafeImage image={section.image} eager={index === 0} className="aspect-[16/10] w-full rounded-lg" />
        <figcaption className="mt-1.5 text-[10px] leading-4 text-[#6f6b63]">{[section.image.aiGenerated && 'AI 생성 이미지', section.image.credit].filter(Boolean).join(' · ')}</figcaption>
      </figure>}
      {section.citationType === 'DIRECT_QUOTE'
        ? <blockquote className="font-basic mt-3 border-l-2 border-[#2f5d50] pl-3.5 text-[15px] leading-[1.8] text-[#2f2d29]">{section.body}</blockquote>
        : <p className="mt-3 whitespace-pre-line text-[14px] leading-[1.8] text-[#2f2d29]">{section.body}</p>}
    </li>)}</ol>

    {post.keyPoints.length > 0 && <section className="mx-5 mt-8 rounded-xl border border-[#e7e3da] bg-white p-4" aria-labelledby="basic-learn">
      <h2 id="basic-learn" className="text-[12px] font-semibold">이 글의 핵심</h2>
      <ol className="mt-2 space-y-1.5">{post.keyPoints.map((point) => <li key={point.id} className="flex gap-2 text-[13px] leading-[1.6] text-[#3d3a35]"><span className="font-basic font-bold text-[#2f5d50]">{point.order}</span>{point.text}</li>)}</ol>
      <div className="mt-4 flex gap-2">
        <button onClick={() => nav.openQuiz(post)} className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full border border-[#2f5d50] text-[13px] font-semibold text-[#2f5d50]"><BIcon name="quiz" size={17} />이해 확인 퀴즈</button>
        <button onClick={() => nav.openChat(post)} className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-[#2f5d50] text-[13px] font-semibold text-white"><Icon name="comment" size={17} />설명해 보기</button>
      </div>
    </section>}

    <section className="mx-5 mb-6 mt-6 rounded-xl bg-[#f1eee7] p-4" aria-labelledby="basic-sources">
      <h2 id="basic-sources" className="text-[12px] font-semibold">참고 문헌</h2>
      {post.sources.length ? <ol className="mt-2 space-y-2.5">{post.sources.map((source, index) => <li key={source.id} className="flex gap-2 text-[12px] leading-5 text-[#3d3a35]">
        <span className="text-[#6f6b63]">{index + 1}.</span>
        <span className="min-w-0">
          {source.url ? <a href={source.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-baseline gap-1 underline decoration-[#c9c3b6] underline-offset-2">{source.title}{sourceDetail(source) && <span className="opacity-70"> · {sourceDetail(source)}</span>}<BIcon name="external" size={11} className="shrink-0 self-center" /><span className="sr-only">(새 탭에서 열림)</span></a> : <span>{source.title}{sourceDetail(source) && <span className="opacity-70"> · {sourceDetail(source)}</span>}</span>}
          {source.author && <span className="text-[#6f6b63]"> · {source.author}</span>}
          <span className={`mt-0.5 block text-[10px] ${source.verified ? 'text-[#2f5d50]' : 'text-[#9a6b1f]'}`}>{sourceStatusLabel(source)}</span>
        </span>
      </li>)}</ol> : <p className="mt-2 text-[12px] text-[#6f6b63]">등록된 문헌이 없어요.</p>}
      <p className="mt-3 border-t border-[#e2ddd2] pt-3 text-[11px] leading-[1.6] text-[#6f6b63]">{AI_DISCLOSURE} {withParticle(name, '를', '을')} 재현한 AI 페르소나의 글이에요. 직접 인용과 AI 재구성 문장은 따로 표시했어요.</p>
    </section>

    <Bottom post={post} name={name} onChat={() => nav.openChat(post)} />
    {reporting && <ReportSheet post={post} onClose={() => setReporting(false)} />}
  </article>
}

function Bottom({ post, name, onChat }) {
  const { isLiked, likeCount, toggleLike } = useStore()
  const liked = isLiked(post)
  return <div className="sticky bottom-0 z-10 flex items-center gap-3 border-t border-[#e7e3da] bg-[#fbfaf7] px-4 py-2.5">
    <button onClick={() => toggleLike(post)} aria-pressed={liked} aria-label={`${liked ? '좋아요 취소' : '좋아요'}, ${likeCount(post)}개`} className={`flex h-11 shrink-0 items-center gap-1.5 px-1 text-[12px] ${liked ? 'text-[#c2410c]' : ''}`}><Icon name="heart" size={22} filled={liked} />{likeCount(post).toLocaleString('ko-KR')}</button>
    <button onClick={onChat} className="flex h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-full bg-[#1c1b19] px-3 text-[14px] font-semibold text-white"><Icon name="comment" size={19} /><span className="truncate">{withParticle(name, '와', '과')} 대화하기</span></button>
  </div>
}

function ReportSheet({ post, onClose }) {
  const { showToast } = useStore()
  const { report, sending, error } = useReport()
  const [reason, setReason] = useState(null)
  const [detail, setDetail] = useState('')
  const submit = async (event) => {
    event.preventDefault()
    const result = await report(post.id, reason, detail.trim() || undefined)
    if (result) { showToast('신고를 접수했어요. 관리자가 확인할게요.'); onClose() }
  }
  return <Sheet title="게시물 신고" onClose={onClose}>
    <form onSubmit={submit}>
      <p className="mt-1 text-[12px] leading-5 text-[#6f6b63]">게시물당 한 번 신고할 수 있어요. 관리자가 직접 확인해요.</p>
      <fieldset className="mt-3 space-y-1.5">
        <legend className="sr-only">신고 사유</legend>
        {reportReasons.map((item) => <label key={item.code} className={`flex h-11 cursor-pointer items-center gap-3 rounded-lg border px-3 text-[13px] ${reason === item.code ? 'border-[#1c1b19] bg-white font-semibold' : 'border-[#e7e3da]'}`}>
          <input type="radio" name="report-reason" value={item.code} checked={reason === item.code} onChange={() => setReason(item.code)} className="accent-[#1c1b19]" />{item.label}
        </label>)}
      </fieldset>
      <label className="mt-3 block text-[12px] font-semibold">상세 내용 (선택)
        <textarea value={detail} onChange={(event) => setDetail(event.target.value.slice(0, 500))} maxLength={500} rows={3} placeholder="어떤 부분이 문제인지 알려 주세요." className="mt-1 w-full resize-none rounded-lg border border-[#d9d4c9] bg-white p-3 text-[13px] font-normal outline-none placeholder:text-[#a39e93]" />
      </label>
      <p className="text-right text-[10px] text-[#6f6b63]">{detail.length}/500</p>
      {error && <Notice tone="error" className="mt-2">{errorMessage(error)}</Notice>}
      <PrimaryButton type="submit" disabled={!reason || sending} className="mt-3 w-full">{sending ? '보내는 중…' : '신고하기'}</PrimaryButton>
    </form>
  </Sheet>
}
