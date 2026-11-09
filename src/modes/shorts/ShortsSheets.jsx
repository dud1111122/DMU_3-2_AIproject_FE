import { useState } from 'react'
import Icon from '../../components/Icon.jsx'
import { useStore } from '../../shared/store.jsx'
import { useFullPost, useReport } from '../../shared/hooks.js'
import { AI_DISCLOSURE, citationLabel, reportReasons, sourceStatusLabel, formatDate, sourceDetail } from '../../shared/format.js'
import { errorMessage } from '../../api/errors.js'
import { Avatar, AiBadge, PillButton } from './ui.jsx'

// 하단 시트. 바깥을 누르면 닫히고 시트 안의 클릭은 막는다.
export function BottomSheet({ label, onClose, children, full = false }) {
  return <div className="absolute inset-0 z-50 flex items-end bg-black/50" onClick={onClose}>
    <div role="dialog" aria-modal="true" aria-label={label} onClick={(event) => event.stopPropagation()} className={`shorts-sheet w-full overflow-y-auto overscroll-contain rounded-t-xl bg-[#212121] pb-6 pt-2 text-white ${full ? 'max-h-[92%]' : 'max-h-[78%]'}`}>
      <div className="mx-auto mb-2 h-1 w-10 rounded bg-white/30" />
      {children}
    </div>
  </div>
}

function Row({ icon, label, detail, onClick }) {
  return <button onClick={onClick} className="flex min-h-12 w-full items-center gap-4 px-4 py-2 text-left">
    <span className="grid w-[22px] place-items-center">{icon ? <Icon name={icon} size={22} /> : null}</span><span className="flex-1 text-[14px]">{label}</span>{detail && <span className="text-[12px] text-[#aaa]">{detail}</span>}
  </button>
}

// 더보기(점 세 개) 메뉴. 신고는 게시물이 활성일 때만 보인다.
export function MenuSheet({ post, onClose, go, onReport, onMode }) {
  const { user, isMember, logout } = useStore()
  const rows = [
    [null, isMember ? `${user.displayName} 계정` : '로그인', isMember ? '계정 관리' : '', () => go('account')],
    ['bookmark', '저장한 쇼츠', '', () => go('saved')],
    ['heart', '구독 채널', '', () => go('following')],
    ['book', '복습', '', () => go('review')],
    ['debate', '토론', '', () => go('debates')],
    ['grid', '관심 주제·추천 채널', '', () => go('recommend')],
    ['search', '검색', '', () => go('search')],
  ]
  return <BottomSheet label="추가 메뉴" onClose={onClose}>
    {rows.map(([icon, label, detail, action]) => <Row key={label} icon={icon} label={label} detail={detail} onClick={action} />)}
    {post && <Row icon="flag" label="이 쇼츠 신고" onClick={onReport} />}
    <Row icon="settings" label="화면 모드 변경" detail="유튜브 쇼츠 모드" onClick={onMode} />
    {isMember && <Row label="로그아웃" onClick={() => { onClose(); logout() }} />}
  </BottomSheet>
}

// 설명·출처 시트. 제목·요약·캡션·페르소나·주제·카드 목록·문헌·AI 안내·핵심 포인트를 모두 보여 준다.
function InfoSheetView({ post, onClose, onOpenChannel, onQuiz, onChat }) {
  const persona = post.persona
  return <BottomSheet label="설명과 출처" onClose={onClose} full>
    <div className="flex items-center justify-between border-b border-white/10 px-4 pb-3"><strong className="text-[16px]">설명과 출처</strong><button onClick={onClose} aria-label="닫기"><Icon name="close" size={22} /></button></div>
    <div className="px-4 pt-4">
      <h2 className="text-[18px] font-bold leading-6">{post.title}</h2>
      <p className="mt-1 text-[12px] text-[#aaa]">{formatDate(post.publishedAt)} · 카드 {post.sections.length}장{post.topics.length ? ` · ${post.topics.map((topic) => topic.name).join(', ')}` : ''}</p>
      <button onClick={() => onOpenChannel(persona)} className="mt-4 flex items-center gap-3 text-left">
        <Avatar persona={persona} size={36} />
        <span><strong className="flex items-center gap-1.5 text-[14px] font-medium">{persona.displayName}<AiBadge /></strong><span className="text-[12px] text-[#aaa]">@{persona.username}</span></span>
      </button>
      {post.summary && <p className="mt-4 text-[14px] leading-6">{post.summary}</p>}
      {post.caption && <p className="mt-3 rounded-xl bg-white/10 p-3 text-[13px] leading-5">{post.caption}</p>}

      {post.keyPoints.length > 0 && <><h3 className="mt-5 text-[14px] font-bold">핵심 포인트</h3>
        <ul className="mt-2 space-y-2 text-[13px] leading-5">{post.keyPoints.map((keyPoint) => <li key={keyPoint.id} className="flex gap-2"><span className="text-[#aaa]">•</span><span>{keyPoint.text}</span></li>)}</ul></>}

      <h3 className="mt-5 text-[14px] font-bold">카드</h3>
      <ol className="mt-2 space-y-2">{post.sections.map((section, index) => <li key={section.id} className="flex gap-3 text-[13px] leading-5">
        <span className="w-4 shrink-0 text-[#aaa]">{index + 1}</span>
        <span className="min-w-0"><span className="mr-1.5 rounded bg-white/10 px-1 text-[11px] text-[#ccc]">{citationLabel(section)}</span>{section.title && <strong className="block font-medium">{section.title}</strong>}<span className="text-[#ccc]">{section.body}</span>{section.quoteAttribution && <span className="block text-[12px] text-[#aaa]">— {section.quoteAttribution}</span>}{section.image?.aiGenerated && <span className="block text-[11px] text-[#aaa]">AI 생성 이미지{section.image.credit ? ` · ${section.image.credit}` : ''}</span>}</span>
      </li>)}</ol>

      <h3 className="mt-5 text-[14px] font-bold">출처</h3>
      {post.sources.length ? <ol className="mt-2 space-y-2">{post.sources.map((source, index) => <li key={source.id} className="flex gap-3 text-[13px] leading-5">
        <span className="w-4 shrink-0 text-[#aaa]">{index + 1}</span>
        <span className="min-w-0"><span className="block">{source.author ? `${source.author}, ` : ''}{source.url ? <a href={source.url} target="_blank" rel="noreferrer" className="break-all text-[#3ea6ff] underline">{source.title}{sourceDetail(source) && <span className="opacity-70"> · {sourceDetail(source)}</span>}</a> : source.title}</span><span className={`block text-[11px] ${source.verified ? 'text-[#7ddc8d]' : 'text-[#f5b942]'}`}>{sourceStatusLabel(source)}</span></span>
      </li>)}</ol> : <p className="mt-2 text-[13px] text-[#aaa]">등록된 문헌이 없어요.</p>}

      <div className="mt-5 rounded-xl border border-white/15 p-3 text-[12px] leading-5 text-[#bbb]">
        <p>{AI_DISCLOSURE}</p>
        <p className="mt-1">{persona.displayName}의 관점을 바탕으로 한 AI 재현 콘텐츠예요. 실제 인물이 직접 게시하거나 답변한 것이 아니며, 카드의 'AI 재구성' 부분은 출처를 바탕으로 다시 쓴 내용이에요.</p>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <PillButton light onClick={onQuiz} className="w-full">학습 퀴즈</PillButton>
        <PillButton onClick={onChat} className="w-full">AI와 대화</PillButton>
      </div>
    </div>
  </BottomSheet>
}

// 신고는 로그인 회원만 가능하다. useReport가 비회원이면 로그인 안내를 띄운다.
export function ReportSheet({ post, onClose }) {
  const { report, sending, error } = useReport()
  const { showToast, isMember } = useStore()
  const [code, setCode] = useState('')
  const [detail, setDetail] = useState('')
  const [localError, setLocalError] = useState(null)
  // 비회원은 App에서 로그인 안내로 바꿔 열기 때문에 여기서는 회원만 온다. 서버 권한 오류는 error로 보여 준다.
  if (!isMember) return null

  const submit = async () => {
    if (!code) { setLocalError('신고 사유를 골라 주세요.'); return }
    if (detail.length > 500) { setLocalError('상세 내용은 500자 이하로 입력해 주세요.'); return }
    setLocalError(null)
    const result = await report(post.id, code, detail.trim() || undefined)
    if (result) { showToast('신고가 접수됐어요. 확인 후 조치할게요.'); onClose() }
  }
  return <BottomSheet label="이 쇼츠 신고" onClose={onClose}>
    <div className="flex items-center justify-between px-4 pb-2"><strong className="text-[16px]">이 쇼츠 신고</strong><button onClick={onClose} aria-label="닫기"><Icon name="close" size={22} /></button></div>
    <div className="px-4">
      <p className="text-[12px] text-[#aaa]">‘{post.title}’ 게시물을 신고해요. 한 게시물은 한 번만 신고할 수 있어요.</p>
      <fieldset className="mt-3 space-y-1">
        <legend className="sr-only">신고 사유</legend>
        {reportReasons.map((reason) => <label key={reason.code} className="flex h-11 cursor-pointer items-center gap-3 text-[14px]"><input type="radio" name="report-reason" value={reason.code} checked={code === reason.code} onChange={() => setCode(reason.code)} className="accent-white" />{reason.label}</label>)}
      </fieldset>
      <label className="mt-2 block text-[12px] text-[#aaa]">상세 내용 (선택, 500자 이하)
        <textarea value={detail} onChange={(event) => setDetail(event.target.value)} rows={3} maxLength={600} className="mt-1 w-full resize-none rounded-lg border border-white/20 bg-white/10 p-2.5 text-[14px] outline-none" />
      </label>
      <p className="mt-1 text-right text-[11px] text-[#777]">{detail.length}/500</p>
      {(localError || error) && <p role="alert" className="mt-1 text-[12px] text-[#ff8a8a]">{localError || errorMessage(error)}</p>}
      <PillButton light onClick={submit} disabled={sending} className="mt-3 w-full">{sending ? '보내는 중…' : '신고 보내기'}</PillButton>
    </div>
  </BottomSheet>
}

// 목록에서 연 쇼츠는 학습 포인트·문헌이 없으므로 상세를 먼저 불러온다.
export function InfoSheet({ post, onClose, ...rest }) {
  const full = useFullPost(post)
  if (!full.post) return <BottomSheet label="설명과 출처" onClose={onClose} full><div className="px-4 py-10 text-center text-[13px] text-[#aaa]">{full.error ? '설명을 불러오지 못했어요.' : '설명을 불러오는 중…'}</div></BottomSheet>
  return <InfoSheetView post={full.post} onClose={onClose} {...rest} />
}
