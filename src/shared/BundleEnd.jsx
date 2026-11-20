import { useEffect, useRef } from 'react'
import { errorMessage } from '../api/errors.js'
import { BundleSizeSelect, PledgeProgress, THEME } from './UsageComponents.jsx'
import { useBundleReader } from './useUsage.js'

// 묶음 화면 안의 종료 카드. 단계에 따라 다른 내용을 그린다.
//  - reading: 다음 게시물을 불러오는 중·실패·더 없음 안내 (평소엔 아무것도 그리지 않는다)
//  - ended: 종료 카드 (오늘·이번 주·이번 달, 약속, 멈춘 횟수, 시간 팁, 더보기·그만보기)
//  - waiting: 약속을 넘긴 뒤 "더보기"의 3초 대기
//  - stopped: "오늘은 여기까지" 화면과 "다시 보기"
export default function BundleEnd({ reader, theme = 'basic' }) {
  const t = THEME[theme]
  const { phase, view } = reader

  if (phase === 'reading') {
    if (reader.loadingMore) return <p className={`py-6 text-center text-[12px] ${t.muted}`}>다음 게시물을 불러오는 중이에요…</p>
    if (reader.loadError) return <div className={`py-6 text-center text-[12px] ${t.muted}`}>
      <p>게시물을 불러오지 못했어요. {errorMessage(reader.loadError)}</p>
      <button onClick={reader.retryLoad} className={`mt-3 h-9 rounded-full px-4 text-[12px] font-semibold ${t.ghost}`}>다시 시도</button>
    </div>
    if (reader.needsMore) return <div className="py-6 text-center"><button onClick={reader.retryLoad} className={`h-9 rounded-full px-4 text-[12px] font-semibold ${t.ghost}`}>다음 게시물 불러오기</button></div>
    if (reader.exhausted) return <p className={`py-8 text-center text-[12px] ${t.faint}`}>게시물을 모두 봤어요.</p>
    return null
  }

  if (phase === 'waiting') return <WaitCard reader={reader} theme={theme} />
  if (phase === 'stopped') return <StopCard view={view} reader={reader} theme={theme} />
  return <EndCard reader={reader} theme={theme} />
}

function EndCard({ reader, theme }) {
  const t = THEME[theme]
  const { view, tipText, busy, bundleSize } = reader
  const heading = view && view.bundleCount < bundleSize ? `${view.bundleCount}개를 봤어요` : '이번 묶음을 다 봤어요'
  return <section aria-labelledby="bundle-end-title" className={`mx-auto my-4 w-full max-w-[420px] p-5 ${t.card}`}>
    <h2 id="bundle-end-title" className={`text-[15px] font-semibold ${t.heading}`}>{heading}</h2>
    {view ? <>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div><p className={`text-[11px] ${t.muted}`}>오늘 본 개수</p><p className="text-[30px] font-bold leading-tight tabular-nums">{view.today.count}<span className="ml-0.5 text-[15px] font-semibold">개</span></p></div>
        <div><p className={`text-[11px] ${t.muted}`}>예상 시간</p><p className="text-[30px] font-bold leading-tight tabular-nums">약 {view.today.minutes}<span className="ml-0.5 text-[15px] font-semibold">분</span></p></div>
      </div>
      <p className={`mt-3 text-[12px] ${t.muted}`}>이번 주 {view.week.count}개 · 약 {view.week.minutes}분 <span className="mx-1">|</span> 이번 달 {view.month.count}개 · 약 {view.month.minutes}분</p>
      {view.pledgedCount != null && <div className="mt-4"><PledgeProgress count={view.today.count} pledged={view.pledgedCount} theme={theme} /></div>}
      <p className={`mt-3 text-[12px] ${t.muted}`}>이번 주 스스로 멈춘 횟수 {view.stopsThisWeek}번</p>
    </> : <p className={`mt-3 text-[12px] ${t.muted}`}>사용량을 불러오지 못했어요. 묶음은 계속 볼 수 있어요.</p>}

    {tipText && <div className={`mt-4 rounded-xl p-3.5 text-[12px] leading-5 ${t.tip}`}>
      <p className="mb-1 text-[11px] font-semibold opacity-70">오늘의 시간 팁</p>
      {tipText}
    </div>}

    <div className="mt-5 grid grid-cols-2 gap-2">
      <button onClick={reader.more} disabled={busy} className={`h-11 rounded-full text-[14px] font-semibold disabled:opacity-40 ${t.primary}`}>더보기</button>
      <button onClick={reader.stop} disabled={busy} className={`h-11 rounded-full text-[14px] font-semibold disabled:opacity-40 ${t.ghost}`}>그만보기</button>
    </div>
    <div className="mt-4">
      <p className={`mb-2 text-[11px] ${t.muted}`}>다음 묶음 크기 · 바꾼 크기는 다음 묶음부터 적용돼요</p>
      <BundleSizeSelect theme={theme} />
    </div>
  </section>
}

function WaitCard({ reader, theme }) {
  const t = THEME[theme]
  const { view } = reader
  return <section role="status" aria-live="polite" className={`mx-auto my-4 w-full max-w-[420px] p-5 text-center ${t.card}`}>
    <p className="text-[14px] font-semibold">오늘 약속한 {view?.pledgedCount ?? ''}개를 넘었어요.</p>
    <p className={`mt-2 text-[12px] leading-5 ${t.muted}`}>3초 뒤에 이어서 볼게요. 그만 보려면 아래 버튼을 눌러 주세요.</p>
    <button onClick={reader.stop} className={`mt-5 h-11 w-full rounded-full text-[14px] font-semibold ${t.ghost}`}>그만보기</button>
  </section>
}

function StopCard({ view, reader, theme }) {
  const t = THEME[theme]
  return <section aria-labelledby="bundle-stop-title" className={`mx-auto my-4 w-full max-w-[420px] p-5 ${t.card}`}>
    <h2 id="bundle-stop-title" className={`text-[18px] font-bold ${t.heading}`}>오늘은 여기까지</h2>
    <p className={`mt-2 text-[13px] leading-6 ${t.muted}`}>이번 주 스스로 멈춘 횟수 <span className="font-semibold text-current">{view?.stopsThisWeek ?? 0}번</span>이에요.</p>
    {view && <p className={`mt-1 text-[12px] ${t.faint}`}>오늘 {view.today.count}개 · 약 {view.today.minutes}분 봤어요.</p>}
    <button onClick={reader.again} className={`mt-5 h-11 w-full rounded-full text-[14px] font-semibold ${t.primary}`}>다시 보기</button>
    <p className={`mt-2 text-center text-[11px] ${t.faint}`}>다시 보기를 누르면 새 묶음이 시작돼요.</p>
  </section>
}

// 홈 피드용 묶음 목록(basic·instagram). 묶음 게시물만 그리고 그 뒤에 종료 카드를 둔다.
// list는 usePaged 모양이다. resetKey(필터·로그인 상태)가 바뀌면 묶음을 처음부터 센다.
export function BundleFeed({ list, resetKey, theme = 'basic', renderPost }) {
  const reader = useBundleReader({ list, resetKey })
  const top = useRef(null)
  const first = useRef(true)
  // 새 묶음이 시작되면 맨 위로 올린다.
  useEffect(() => {
    if (first.current) { first.current = false; return }
    top.current?.scrollIntoView?.({ block: 'start' })
  }, [reader.bundleStart])
  return <div>
    <div ref={top} />
    {reader.visible.map((post, index) => renderPost(post, index))}
    <BundleEnd reader={reader} theme={theme} />
  </div>
}
