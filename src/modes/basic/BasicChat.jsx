import { useEffect, useRef, useState } from 'react'
import Icon from '../../components/Icon.jsx'
import AiBadge from '../../shared/AiBadge.jsx'
import { errorMessage } from '../../api/errors.js'
import { useStudyChat } from '../../shared/hooks.js'
import { useStore } from '../../shared/store.jsx'
import { assessmentLabels, withParticle } from '../../shared/format.js'
import { BIcon, ErrorState, Notice, useNav } from './ui.jsx'

const MAX = 2000
const levelStyles = { UNDERSTOOD: 'bg-[#e8efec] text-[#2f5d50]', PARTIAL: 'bg-[#fbf3e4] text-[#8a5a12]', MISSED: 'bg-[#fdf0ee] text-[#9b2c1f]' }
const clip = (text, length) => text.length > length ? `${text.slice(0, length).trim()}…` : text

export default function BasicChat({ post }) {
  const nav = useNav()
  const { aiConfigured, isMember } = useStore()
  const chat = useStudyChat(post.id)
  const [text, setText] = useState('')
  const [lastSent, setLastSent] = useState('')
  const [pointsOpen, setPointsOpen] = useState(true)
  const listRef = useRef(null)
  const name = post.persona.displayName
  const aiOff = !aiConfigured || chat.error?.status === 503
  const assessed = post.keyPoints.filter((point) => chat.assessments[point.id])
  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' }) }, [chat.messages.length, chat.sending])

  const send = async (value) => {
    const content = value.trim()
    if (!content || chat.sending || aiOff) return
    setLastSent(content)
    if (await chat.send(content)) { setText(''); setLastSent('') }
  }
  const starters = [
    `이 글의 핵심을 제 말로 설명해 볼게요.`,
    ...post.keyPoints.slice(0, 3).map((point) => `“${clip(point.text, 22)}” 부분을 더 풀어 주세요.`),
  ]

  return <div className="flex h-full flex-col">
    <header className="flex h-[56px] shrink-0 items-center gap-2 border-b border-[#e7e3da] bg-[#fbfaf7] px-2">
      <button onClick={nav.back} aria-label="뒤로" className="grid h-9 w-9 shrink-0 place-items-center"><Icon name="back" size={21} /></button>
      <button onClick={() => nav.openPersona(post.persona.id)} className="min-w-0 flex-1 text-left" aria-label={`${name} 프로필 보기`}>
        <span className="flex items-center gap-1.5"><strong className="truncate text-[15px]">{name}</strong><AiBadge className="text-[#6f6b63]" /></span>
        <span className="block truncate text-[11px] text-[#6f6b63]">글을 바탕으로 이해를 확인하는 대화</span>
      </button>
    </header>

    <div className="shrink-0 border-b border-[#e7e3da] bg-white">
      <button onClick={() => nav.returnToPost(post.id)} className="flex w-full items-center gap-2 px-4 pt-2.5 text-left" aria-label={`글 「${post.title}」 다시 읽기`}>
        <span className="shrink-0 text-[10px] font-semibold text-[#6f6b63]">이 글</span>
        <strong className="min-w-0 flex-1 truncate text-[13px]">{post.title}</strong>
        <Icon name="chevron" size={15} className="shrink-0 text-[#a39e93]" />
      </button>
      <button onClick={() => setPointsOpen((open) => !open)} aria-expanded={pointsOpen} aria-controls="chat-keypoints" className="flex w-full items-center gap-2 px-4 pb-2.5 pt-1.5 text-left text-[11px] text-[#6f6b63]">
        <span className="font-semibold text-[#1c1b19]">핵심 포인트</span>
        <span className="flex gap-1">{post.keyPoints.map((point) => { const level = chat.assessments[point.id]?.level; return <i key={point.id} className={`h-2 w-2 rounded-full ${level === 'UNDERSTOOD' ? 'bg-[#2f5d50]' : level === 'PARTIAL' ? 'bg-[#d4a14a]' : level === 'MISSED' ? 'bg-[#d9796b]' : 'bg-[#e2ddd2]'}`} /> })}</span>
        <span className="flex-1">{assessed.length}/{post.keyPoints.length} 확인됨</span>
        <BIcon name="down" size={15} className={`transition-transform ${pointsOpen ? 'rotate-180' : ''}`} />
      </button>
      {pointsOpen && <ol id="chat-keypoints" className="max-h-[38vh] space-y-2 overflow-y-auto border-t border-[#efece4] px-4 py-3">{post.keyPoints.map((point) => {
        const assessment = chat.assessments[point.id]
        return <li key={point.id} className="text-[12px] leading-[1.55]">
          <div className="flex items-start gap-2">
            <span className="font-basic shrink-0 font-bold text-[#2f5d50]">{point.order}</span>
            <span className="min-w-0 flex-1 text-[#3d3a35]">{point.text}</span>
            <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${assessment ? levelStyles[assessment.level] : 'bg-[#efece4] text-[#6f6b63]'}`}>{assessment ? assessmentLabels[assessment.level] : '확인 전'}</span>
          </div>
          {assessment?.feedback && <p className="ml-4 mt-1 text-[11px] text-[#6f6b63]">{assessment.feedback}</p>}
        </li>
      })}</ol>}
    </div>

    <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-3" aria-live="polite">
      <p className="mx-auto max-w-[290px] text-center text-[10px] leading-4 text-[#a39e93]">AI 페르소나와의 대화예요. 실제 인물의 답변이 아니고, 틀릴 수 있어요.</p>
      {!isMember && <Notice tone="warn" className="mt-2 text-center">로그인하지 않은 대화는 저장되지 않아요. 새로고침하거나 나가면 대화가 사라져요.</Notice>}
      {aiOff && <Notice tone="warn" className="mt-2 text-center">AI 기능이 아직 설정되지 않아 지금은 대화할 수 없어요. 글 읽기와 퀴즈는 계속 할 수 있어요.</Notice>}
      {chat.loading ? <p className="py-10 text-center text-[12px] text-[#6f6b63]" role="status">대화를 불러오는 중…</p>
        : chat.error && !chat.messages.length && chat.error.status !== 503 && !lastSent ? <ErrorState compact error={chat.error} onRetry={chat.reload} />
          : <div className="mt-4 space-y-3">
            <Bubble role="PERSONA" content={`${withParticle(name, '가', '이')} 쓴 「${post.title}」을 함께 이야기해 봐요. 읽은 내용을 당신의 말로 설명해 보거나, 헷갈리는 부분을 물어보세요.`} />
            {chat.messages.map((message) => <Bubble key={message.id} {...message} />)}
            {chat.sending && <div className="w-fit rounded-2xl rounded-tl-md border border-[#e7e3da] bg-white px-4 py-3" role="status" aria-label={`${name} 페르소나가 답변을 작성하는 중`}><span className="flex gap-1">{[0, 1, 2].map((dot) => <i key={dot} className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#a39e93]" style={{ animationDelay: `${dot * 150}ms` }} />)}</span></div>}
          </div>}
      {chat.error && lastSent && !chat.sending && chat.error.status !== 503 && <div role="alert" className="mt-3 rounded-lg border border-[#f0c9c3] bg-[#fdf0ee] px-3 py-2.5 text-[12px] text-[#9b2c1f]">
        <p>{errorMessage(chat.error)}</p>
        <button onClick={() => send(lastSent)} className="mt-1.5 font-semibold underline underline-offset-2">다시 보내기</button>
      </div>}
    </div>

    <div className="shrink-0 border-t border-[#e7e3da] bg-[#fbfaf7] px-3 pb-3 pt-2.5">
      {!text && !chat.messages.length && !aiOff && !chat.loading && <div className="no-scrollbar -mx-3 mb-2 flex gap-1.5 overflow-x-auto px-3">{starters.map((starter) => <button key={starter} onClick={() => send(starter)} disabled={chat.sending} className="h-8 shrink-0 rounded-full bg-[#efece4] px-3 text-[12px] text-[#3d3a35]">{starter}</button>)}</div>}
      <form onSubmit={(event) => { event.preventDefault(); send(text) }} className="flex items-center gap-2 rounded-full border border-[#d9d4c9] bg-white pl-4 pr-1.5">
        <input value={text} onChange={(event) => setText(event.target.value.slice(0, MAX))} maxLength={MAX} disabled={aiOff} placeholder={aiOff ? 'AI 기능이 설정되지 않았어요' : `${withParticle(name, '에게', '에게')} 이해한 내용을 말해 보세요`} aria-label="메시지 입력" className="h-11 min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-[#a39e93] disabled:opacity-50" />
        <button disabled={!text.trim() || chat.sending || aiOff || chat.loading} aria-label="보내기" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#1c1b19] text-white disabled:opacity-30"><Icon name="send" size={16} /></button>
      </form>
      {text.length > MAX - 200 && <p className="mt-1 text-right text-[10px] text-[#6f6b63]">{text.length}/{MAX}</p>}
    </div>
  </div>
}

function Bubble({ role, content }) {
  if (role === 'USER') return <p className="ml-auto w-fit max-w-[80%] whitespace-pre-line rounded-2xl rounded-tr-md bg-[#1c1b19] px-3.5 py-2.5 text-[14px] leading-[1.55] text-white">{content}</p>
  return <p className="w-fit max-w-[85%] whitespace-pre-line rounded-2xl rounded-tl-md border border-[#e7e3da] bg-white px-3.5 py-2.5 text-[14px] leading-[1.6]">{content}</p>
}
