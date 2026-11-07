import { useState } from 'react'
import { useReviewItems } from '../../shared/hooks.js'
import { useStore } from '../../shared/store.jsx'
import { reviewReasonLabels } from '../../shared/format.js'
import { Chip, Empty, ErrorState, GhostButton, LoadMore, Notice, PrimaryButton, Skeleton, TopBar, useNav } from './ui.jsx'

export default function BasicStudy() {
  const nav = useNav()
  const { isMember, promptLogin } = useStore()
  const [status, setStatus] = useState('OPEN')
  const review = useReviewItems(status)

  return <div className="pb-8">
    <TopBar large title="학습" />
    <div className="px-5 pt-4">
      {!isMember ? <Empty
        title="복습은 로그인 후 쓸 수 있어요"
        text="퀴즈에서 틀리거나 대화에서 놓친 핵심을 모아 두고 다시 읽을 수 있어요."
        action={<PrimaryButton onClick={() => promptLogin('로그인하면 틀린 문항과 놓친 핵심을 복습 목록에 모아 둘 수 있어요.')}>로그인하기</PrimaryButton>} />
        : <>
          <div role="tablist" aria-label="복습 상태" className="flex gap-1.5">
            <Chip active={status === 'OPEN'} pressed={false} onClick={() => setStatus('OPEN')}><span role="tab" aria-selected={status === 'OPEN'}>복습 중</span></Chip>
            <Chip active={status === 'DONE'} pressed={false} onClick={() => setStatus('DONE')}><span role="tab" aria-selected={status === 'DONE'}>완료</span></Chip>
          </div>
          <p className="mt-3 text-[11px] leading-5 text-[#6f6b63]">{status === 'OPEN' ? '퀴즈 오답이나 대화에서 놓친 핵심이에요. 다시 읽은 뒤 완료로 표시하세요.' : '완료했어요. 다시 틀리거나 놓치면 복습으로 돌아와요.'}</p>

          <div className="mt-2">
            {review.loading && !review.items.length && <Skeleton rows={3} />}
            {review.error && !review.items.length && <ErrorState error={review.error} onRetry={review.reload} />}
            {!review.loading && !review.error && !review.items.length && (status === 'OPEN'
              ? <Empty title="복습할 항목이 없어요" text="퀴즈에서 틀리거나 대화에서 핵심을 놓치면 여기에 모여요." action={<GhostButton onClick={() => nav.goTab('home')}>글 읽으러 가기</GhostButton>} />
              : <Empty title="완료한 복습이 없어요" text="복습 중 항목을 다 읽었다면 ‘완료로 표시’를 눌러 보세요." />)}
            {review.items.map((item) => <ReviewRow key={item.id} item={item} onOpen={() => nav.openPost(item.post.id)} onToggle={() => review.setStatus(item, item.status === 'OPEN' ? 'DONE' : 'OPEN')} />)}
            <LoadMore list={review} />
          </div>
          {status === 'OPEN' && review.items.length > 0 && <Notice className="mt-4">복습 항목은 자동으로 사라지지 않아요. 직접 완료로 표시해 주세요.</Notice>}
        </>}
    </div>
  </div>
}

function ReviewRow({ item, onOpen, onToggle }) {
  const done = item.status === 'DONE'
  return <article className="border-b border-[#e7e3da] py-4">
    <div className="flex items-center gap-2 text-[11px]">
      <span className={`rounded px-1.5 py-0.5 font-semibold ${done ? 'bg-[#efece4] text-[#6f6b63]' : 'bg-[#fbf3e4] text-[#8a5a12]'}`}>{reviewReasonLabels[item.reason]}</span>
      <span className="min-w-0 truncate text-[#6f6b63]">{item.post.persona?.displayName}</span>
    </div>
    <p className="mt-2 text-[14px] font-semibold leading-[1.55]">{item.keyPoint.text}</p>
    <button onClick={onOpen} className="mt-1.5 block max-w-full truncate text-left text-[12px] text-[#2f5d50] underline decoration-[#b9cdc6] underline-offset-2" aria-label={`글 「${item.post.title}」 열기`}>「{item.post.title}」 다시 읽기</button>
    <div className="mt-3 flex justify-end">
      <button onClick={onToggle} aria-pressed={done} className={`h-8 rounded-full px-3.5 text-[12px] font-semibold ${done ? 'border border-[#d9d4c9] text-[#3d3a35]' : 'bg-[#2f5d50] text-white'}`}>{done ? '다시 복습하기' : '완료로 표시'}</button>
    </div>
  </article>
}
