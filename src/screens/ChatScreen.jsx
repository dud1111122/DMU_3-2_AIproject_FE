import { useEffect, useRef, useState } from 'react'
import AiBadge from '../shared/AiBadge.jsx'
import { assessmentLabels } from '../shared/format.js'
import { useStudyChat } from '../shared/hooks.js'
import { useStore } from '../shared/store.jsx'
import { errorMessage, isStatus } from '../api/errors.js'
import { AiOffNotice, BackHeader, ErrorState, Loading, usePost } from './ui.jsx'

const suggestions = ['이 게시물의 핵심을 한 문장으로 말해 줄 수 있나요?', '제 생각과 어떻게 다른지 짚어 주세요.', '제가 이해한 내용이 맞는지 확인해 주세요.']
const levelTone = { UNDERSTOOD: 'bg-[#dcfce7] text-[#166534]', PARTIAL: 'bg-[#fef3c7] text-[#92400e]', MISSED: 'bg-[#fee2e2] text-[#991b1b]' }

// 게시물 기반 대화만 지원한다. 회원은 게시물마다 대화방 하나가 저장되고, 비회원 대화는 이 화면에만 남는다.
export default function ChatScreen({ postId, initialPost, onBack }) {
  const { isMember, aiConfigured } = useStore()
  const { post } = usePost(postId, initialPost)
  const chat = useStudyChat(postId)
  const [text, setText] = useState('')
  const listRef = useRef(null)
  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' }) }, [chat.messages.length, chat.sending])

  const aiOff = !aiConfigured || isStatus(chat.error, 503)
  const loadFailed = isMember && chat.error && !chat.messages.length && !chat.loading
  const persona = post?.persona

  const send = async (event) => {
    event?.preventDefault()
    if (aiOff || !text.trim()) return
    const ok = await chat.send(text)
    if (ok) setText('')
  }

  return <div className="flex min-h-0 flex-1 flex-col">
    <BackHeader title={persona?.displayName || 'AI 페르소나'} sub={post?.title} onBack={onBack} right={persona && <AiBadge className="mr-1 text-[#737373]" />} />

    {post?.keyPoints?.length > 0 && <section aria-label="학습 포인트 평가" className="shrink-0 border-b border-[#efefef] bg-[#fafafa] px-4 py-2.5">
      <p className="mb-1.5 text-[11px] font-semibold text-[#737373]">학습 포인트 · 최근 평가</p>
      <ul className="space-y-1.5">{post.keyPoints.map((point, index) => {
        const assessment = chat.assessments[point.id]
        return <li key={point.id} className="flex items-start gap-2 text-[11px] leading-4">
          <span className="min-w-0 flex-1 text-[#262626]">{index + 1}. {point.text}</span>
          <span className={`shrink-0 rounded-full px-2 py-px text-[10px] font-semibold ${assessment ? levelTone[assessment.level] : 'bg-[#efefef] text-[#737373]'}`}>{assessment ? assessmentLabels[assessment.level] : '미평가'}</span>
        </li>
      })}</ul>
    </section>}

    <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
      <p className="mx-auto max-w-[300px] text-center text-[10px] leading-4 text-[#8e8e8e]">실제 인물이 아닌 AI 재현 페르소나와의 대화예요. 답변에 오류가 있을 수 있어요. {isMember ? '대화는 계정에 저장돼요.' : '비회원 대화는 이 화면에만 남고, 나가면 사라져요.'}</p>

      {chat.loading ? <Loading className="py-10" /> : loadFailed ? <ErrorState error={chat.error} onRetry={chat.reload} className="py-8" /> : <>
        {!chat.messages.length && !chat.error && <div className="mt-6 text-center text-[12px] text-[#737373]">
          <p>{post ? `‘${post.title}’의 내용으로 질문해 보세요.` : '게시물의 내용으로 질문해 보세요.'}</p>
          <div className="mt-3 flex flex-col items-center gap-2">{suggestions.map((item) => <button key={item} onClick={() => setText(item)} disabled={aiOff} className="h-8 max-w-full truncate rounded-full border border-[#dbdbdb] px-3 text-[12px] disabled:opacity-40">{item}</button>)}</div>
        </div>}
        <div className="mt-4 flex flex-col gap-3">{chat.messages.map((message) => message.role === 'USER'
          ? <p key={message.id} className="max-w-[78%] self-end whitespace-pre-line rounded-[20px] bg-[#3797f0] px-4 py-2.5 text-[13px] leading-[1.5] text-white">{message.content}</p>
          : <div key={message.id} className="max-w-[84%] self-start rounded-[20px] bg-[#efefef] px-4 py-2.5"><p className="whitespace-pre-line text-[13px] leading-[1.55]">{message.content}</p></div>)}
        {chat.sending && <div className="w-fit rounded-[20px] bg-[#efefef] px-4 py-3" role="status" aria-label="페르소나가 답변을 작성하는 중"><span className="flex gap-1">{[0, 1, 2].map((dot) => <i key={dot} className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#8e8e8e]" style={{ animationDelay: `${dot * 150}ms` }} />)}</span></div>}
        </div>
      </>}
    </div>

    <div className="shrink-0 border-t border-[#efefef] bg-white px-3 pb-3 pt-2">
      {aiOff && <AiOffNotice className="mb-2" />}
      {chat.error && !loadFailed && <div role="alert" className="mb-2 flex items-center justify-between gap-2 rounded-lg bg-[#fef2f2] px-3 py-2 text-[11px] leading-4 text-[#b42318]"><span>{errorMessage(chat.error)}</span>{!aiOff && <button onClick={() => send()} disabled={chat.sending || !text.trim()} className="shrink-0 font-semibold underline disabled:opacity-40">다시 보내기</button>}</div>}
      <form onSubmit={send} className="flex items-end gap-2 rounded-2xl border border-[#dbdbdb] py-1.5 pl-4 pr-2">
        <textarea rows={1} value={text} maxLength={2000} disabled={aiOff} onChange={(event) => setText(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); send() } }} placeholder={aiOff ? 'AI 기능이 설정되지 않았어요' : '이 게시물에 대해 물어보세요'} aria-label="메시지 입력" className="max-h-24 min-w-0 flex-1 resize-none bg-transparent py-1.5 text-[13px] outline-none placeholder:text-[#a3a3a3] disabled:opacity-50" />
        <button type="submit" disabled={!text.trim() || chat.sending || aiOff} className="h-8 shrink-0 px-2 text-[13px] font-semibold text-[#0095f6] disabled:opacity-40">{chat.sending ? '전송 중' : '보내기'}</button>
      </form>
      <p className="mt-1 flex justify-between text-[10px] text-[#8e8e8e]"><span>{isMember ? '' : '비회원 대화는 저장되지 않아요.'}</span><span>{text.length}/2000</span></p>
    </div>
  </div>
}
