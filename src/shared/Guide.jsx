import { useEffect, useRef, useState } from 'react'
import Icon from '../components/Icon.jsx'
import { markGuideSeen, setGuideRunning } from './guide.js'

// 처음 들어온 사용자 안내. 휴대폰 화면 전체를 어둡게 덮고 지금 설명하는 곳만 뚫어 보여준다.
// 구멍은 큰 box-shadow로 만들고 휴대폰 화면이 그걸 잘라내므로, 데스크톱에서도 목업 바깥은 어두워지지 않는다. 기획 §4.
const PAD = 6      // 대상 둘레 여백
const GAP = 10     // 대상과 말풍선 사이
const EDGE = 12    // 화면 가장자리 여백

const clamp = (value, min, max) => Math.max(min, Math.min(max, value))
const same = (a, b) => a && b && a.top === b.top && a.left === b.left && a.width === b.width && a.height === b.height

export default function Guide({ steps, mode, dark = false, onClose }) {
  const rootRef = useRef(null)
  const popRef = useRef(null)
  const [list, setList] = useState(null)
  const [index, setIndex] = useState(0)
  const [hole, setHole] = useState(null)
  const [pop, setPop] = useState(null)

  const step = list ? list[index] : null
  const last = list ? index === list.length - 1 : false

  // 피드처럼 나중에 그려지는 대상을 잠깐 기다렸다가, 끝내 없는 단계는 빼고 시작한다.
  useEffect(() => {
    let cancelled = false
    const startedAt = Date.now()
    const check = () => {
      if (cancelled) return
      const waiting = steps.some((item) => item.target && !document.querySelector(item.target))
      if (waiting && Date.now() - startedAt < 3000) { setTimeout(check, 120); return }
      setList(steps.filter((item) => !item.target || document.querySelector(item.target)))
    }
    check()
    return () => { cancelled = true }
  }, [steps])

  const finish = () => { markGuideSeen(mode); onClose() }
  const finishRef = useRef(finish)
  finishRef.current = finish

  // 가이드가 떠 있는 동안에는 하루 약속 모달을 미룬다.
  // 대상을 기다리는 동안 약속 모달이 먼저 뜨지 않게, 단계가 정해지기 전부터 걸어 둔다.
  useEffect(() => {
    setGuideRunning(true)
    return () => setGuideRunning(false)
  }, [])
  useEffect(() => { if (list && !list.length) setGuideRunning(false) }, [list])

  // 대상이 화면 밖이면 먼저 끌어온다. 움직이는 건 구멍이 맡으므로 스크롤은 즉시 처리한다.
  useEffect(() => {
    if (!step?.target) return
    document.querySelector(step.target)?.scrollIntoView({ block: 'nearest', behavior: 'auto' })
  }, [step])

  // 대상 위치는 매 프레임 다시 재어 레이아웃이 바뀌어도 구멍이 따라가게 한다.
  useEffect(() => {
    if (!step) return undefined
    let raf = 0
    const tick = () => {
      const root = rootRef.current
      const popover = popRef.current
      if (root && popover) {
        const base = root.getBoundingClientRect()
        const element = step.target ? document.querySelector(step.target) : null
        const popWidth = popover.offsetWidth
        const popHeight = popover.offsetHeight
        let nextHole
        let nextPop
        if (element && base.width) {
          const box = element.getBoundingClientRect()
          nextHole = {
            top: Math.round(box.top - base.top) - PAD,
            left: Math.round(box.left - base.left) - PAD,
            width: Math.round(box.width) + PAD * 2,
            height: Math.round(box.height) + PAD * 2,
          }
          const below = nextHole.top + nextHole.height + GAP
          const above = nextHole.top - GAP - popHeight
          const top = below + popHeight <= base.height - EDGE ? below
            : above >= EDGE ? above
              : clamp(base.height - popHeight - EDGE, EDGE, base.height)
          nextPop = { top: Math.round(top), left: Math.round(clamp(nextHole.left + nextHole.width / 2 - popWidth / 2, EDGE, Math.max(EDGE, base.width - popWidth - EDGE))) }
        } else {
          // 대상이 없는 단계: 구멍을 가운데 점으로 줄여 화면 전체를 덮고 말풍선만 가운데에 둔다.
          nextHole = { top: Math.round(base.height / 2), left: Math.round(base.width / 2), width: 0, height: 0 }
          nextPop = { top: Math.round((base.height - popHeight) / 2), left: Math.round((base.width - popWidth) / 2) }
        }
        setHole((prev) => (same(prev, nextHole) ? prev : nextHole))
        setPop((prev) => (prev && prev.top === nextPop.top && prev.left === nextPop.left ? prev : nextPop))
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [step])

  const total = list ? list.length : 0
  useEffect(() => {
    if (!total) return undefined
    const onKey = (event) => {
      if (event.key === 'Escape') { event.preventDefault(); finishRef.current() }
      else if (event.key === 'ArrowRight') { event.preventDefault(); setIndex((value) => Math.min(value + 1, total - 1)) }
      else if (event.key === 'ArrowLeft') { event.preventDefault(); setIndex((value) => Math.max(value - 1, 0)) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [total])

  if (!list || !list.length || !step) return null

  const card = dark ? 'bg-[#212121] text-white' : 'bg-white text-[#1c1b19]'
  const sub = dark ? 'text-white/65' : 'text-[#6f6b63]'
  const ghost = dark ? 'border-white/25 text-white' : 'border-[#d9d4c9] text-[#3d3a35]'
  const solid = dark ? 'bg-white text-[#0f0f0f]' : 'bg-[#1c1b19] text-white'

  return <div ref={rootRef} className="guide-root absolute inset-0 z-[95] overflow-hidden" role="dialog" aria-modal="true" aria-labelledby="guide-title">
    <div className="guide-hole" style={{ top: hole?.top ?? 0, left: hole?.left ?? 0, width: hole?.width ?? 0, height: hole?.height ?? 0, borderRadius: step.radius ?? 12 }} />
    <div ref={popRef} className={`guide-pop absolute z-10 w-[min(280px,calc(100%-24px))] rounded-2xl p-4 shadow-xl ${card}`} style={{ top: pop?.top ?? 0, left: pop?.left ?? 0, visibility: pop ? 'visible' : 'hidden' }}>
      <button type="button" onClick={finish} aria-label="안내 건너뛰기" className={`absolute right-2.5 top-2.5 grid h-7 w-7 place-items-center rounded-full ${sub}`}><Icon name="close" size={17} /></button>
      <strong id="guide-title" className="block pr-7 text-[15px] font-bold leading-[1.4]">{step.title}</strong>
      <p className={`mt-1.5 text-[12.5px] leading-[1.65] ${sub}`}>{step.text}</p>
      <div className="mt-3.5 flex items-center justify-between gap-2">
        <span className={`text-[11px] tabular-nums ${sub}`}>{index + 1} / {list.length}</span>
        <div className="flex items-center gap-1.5">
          {index > 0 && <button type="button" onClick={() => setIndex(index - 1)} className={`h-8 rounded-full border px-3 text-[12px] font-semibold ${ghost}`}>이전</button>}
          <button type="button" onClick={() => (last ? finish() : setIndex(index + 1))} className={`h-8 rounded-full px-3.5 text-[12px] font-semibold ${solid}`}>{last ? '시작하기' : '다음'}</button>
        </div>
      </div>
    </div>
  </div>
}
