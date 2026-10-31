import { useState } from 'react'
import Icon from '../components/Icon.jsx'
import { api } from '../api/index.js'
import { reviewReasonLabels } from '../shared/format.js'
import { usePaged, useReviewItems } from '../shared/hooks.js'
import { useStore } from '../shared/store.jsx'
import { Empty, ListState, MemberGate, PostRow } from './ui.jsx'

const segments = [['review', '복습'], ['chat', '게시물 대화']]

// 학습 탭: 복습 목록과 대화할 게시물 목록. 복습은 회원 전용이다.
export default function LearningScreen({ onOpenPost, onOpenChat }) {
  const [tab, setTab] = useState('review')
  return <div className="pb-6">
    <header className="sticky top-0 z-20 bg-white px-4 pb-2 pt-3"><strong className="text-[18px]">학습</strong>
      <div role="tablist" className="mt-3 grid grid-cols-2 rounded-lg bg-[#efefef] p-0.5">{segments.map(([key, label]) => <button key={key} role="tab" aria-selected={tab === key} onClick={() => setTab(key)} className={`h-8 rounded-md text-[12px] font-semibold ${tab === key ? 'bg-white shadow-sm' : 'text-[#737373]'}`}>{label}</button>)}</div>
    </header>
    {tab === 'review' ? <ReviewPanel onOpenPost={onOpenPost} /> : <ChatPanel onOpenChat={onOpenChat} />}
  </div>
}

function ReviewPanel({ onOpenPost }) {
  const { isMember } = useStore()
  const [status, setStatus] = useState('OPEN')
  const list = useReviewItems(status)
  if (!isMember) return <MemberGate text="로그인하면 퀴즈 오답과 대화에서 놓친 학습 포인트를 복습 목록으로 모아 볼 수 있어요." />
  return <>
    <div role="radiogroup" aria-label="복습 상태" className="mx-4 mt-3 flex gap-2">{[['OPEN', '복습 중'], ['DONE', '완료']].map(([key, label]) => <button key={key} role="radio" aria-checked={status === key} onClick={() => setStatus(key)} className={`h-7 rounded-full px-3 text-[11px] font-semibold ${status === key ? 'bg-[#111] text-white' : 'bg-[#efefef] text-[#111]'}`}>{label}</button>)}</div>
    <div className="mt-2">
      <ListState list={list} empty={<Empty icon="book" text={status === 'OPEN' ? '복습할 학습 포인트가 없어요. 퀴즈에서 틀리거나 대화에서 놓친 내용이 여기에 모여요.' : '완료한 복습이 아직 없어요.'} />}>
        {list.items.map((item) => {
          const done = item.status === 'DONE'
          return <div key={item.id} className="flex items-start gap-3 border-b border-[#efefef] px-4 py-3">
            <button onClick={() => list.setStatus(item, done ? 'OPEN' : 'DONE')} aria-pressed={done} aria-label={done ? '복습 다시 열기' : '복습 완료로 표시'} className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border ${done ? 'border-[#0095f6] bg-[#0095f6] text-white' : 'border-[#c7c7c7]'}`}>{done && <Icon name="check" size={14} strokeWidth={2.6} />}</button>
            <div className="min-w-0 flex-1">
              <span className="flex min-w-0 items-center gap-1.5 text-[10px] text-[#737373]"><span className="shrink-0 rounded-full bg-[#efefef] px-1.5 py-px">{reviewReasonLabels[item.reason]}</span><span className="truncate">{item.post.title}</span></span>
              <p className={`mt-1 text-[13px] leading-5 ${done ? 'text-[#8e8e8e] line-through' : ''}`}>{item.keyPoint.text}</p>
              <button onClick={() => onOpenPost({ id: item.post.id })} className="mt-1 text-[11px] font-semibold text-[#0095f6]">게시물 열기</button>
            </div>
          </div>
        })}
      </ListState>
    </div>
  </>
}

function ChatPanel({ onOpenChat }) {
  const list = usePaged((cursor) => api.feed({ cursor }), [])
  return <>
    <p className="px-4 pt-3 text-[11px] leading-5 text-[#737373]">게시물을 고르면 그 내용과 학습 포인트를 바탕으로 페르소나와 대화해요. 비회원 대화는 저장되지 않아요.</p>
    <ListState list={list} empty={<Empty icon="send" text="대화할 게시물이 아직 없어요." />}>
      {list.items.map((post) => <PostRow key={post.id} post={post} onOpen={onOpenChat} extra={<span className="text-[11px] text-[#0095f6]">이 게시물로 대화하기</span>} />)}
    </ListState>
  </>
}
