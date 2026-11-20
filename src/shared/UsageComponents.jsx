import { BUNDLE_SIZES } from './usage.js'
import * as U from './usage.js'
import { useBundleSize } from './useUsage.js'

// 세 모드의 색 토큰. 공용 컴포넌트는 이 토큰만 골라 쓰므로 모드마다 같은 구조로 보인다.
export const THEME = {
  basic: {
    card: 'rounded-2xl border border-[#e7e3da] bg-white text-[#1c1b19]',
    muted: 'text-[#6f6b63]',
    faint: 'text-[#a39e93]',
    primary: 'bg-[#1c1b19] text-white',
    ghost: 'border border-[#d9d4c9] bg-white text-[#3d3a35]',
    track: 'bg-[#efece4]',
    fill: 'bg-[#2f5d50]',
    chip: 'border border-[#d9d4c9] text-[#3d3a35]',
    chipOn: 'border-[#1c1b19] bg-[#1c1b19] text-white',
    tip: 'bg-[#f3f1ec] text-[#3d3a35]',
    heading: 'font-basic',
  },
  instagram: {
    card: 'rounded-xl border border-[#efefef] bg-white text-[#111]',
    muted: 'text-[#737373]',
    faint: 'text-[#8e8e8e]',
    primary: 'bg-[#0095f6] text-white',
    ghost: 'bg-[#efefef] text-[#111]',
    track: 'bg-[#efefef]',
    fill: 'bg-[#0095f6]',
    chip: 'bg-[#efefef] text-[#111]',
    chipOn: 'bg-[#0095f6] text-white',
    tip: 'bg-[#f6f6f6] text-[#262626]',
    heading: '',
  },
  shorts: {
    card: 'rounded-2xl bg-[#212121] text-white',
    muted: 'text-[#aaa]',
    faint: 'text-[#888]',
    primary: 'bg-white text-black',
    ghost: 'bg-white/10 text-white',
    track: 'bg-white/15',
    fill: 'bg-white',
    chip: 'bg-white/10 text-white',
    chipOn: 'bg-white text-black',
    tip: 'bg-white/10 text-[#ddd]',
    heading: '',
  },
}

// 묶음 크기 선택 (3·5·10). 브라우저 로컬에 저장한다.
export function BundleSizeSelect({ theme = 'basic', className = '' }) {
  const size = useBundleSize()
  const t = THEME[theme]
  return <div role="radiogroup" aria-label="묶음 크기" className={`flex gap-2 ${className}`}>
    {BUNDLE_SIZES.map((count) => <button key={count} role="radio" aria-checked={size === count} onClick={() => U.writeBundleSize(count)} className={`h-9 min-w-[56px] rounded-full px-3.5 text-[13px] font-semibold ${size === count ? t.chipOn : t.chip}`}>{count}개</button>)}
  </div>
}

// 약속 진행. 약속이 없으면 아무것도 그리지 않는다.
export function PledgeProgress({ count, pledged, theme = 'basic' }) {
  const t = THEME[theme]
  if (pledged == null) return null
  const ratio = Math.min(100, Math.round((count / pledged) * 100))
  return <div>
    <div className={`flex items-baseline justify-between text-[12px] ${t.muted}`}>
      <span>오늘 약속 {pledged}개</span>
      <span>지금 {count}개</span>
    </div>
    <div role="progressbar" aria-label="오늘 약속 진행" aria-valuemin={0} aria-valuemax={pledged} aria-valuenow={Math.min(count, pledged)} className={`mt-1.5 h-1.5 overflow-hidden rounded-full ${t.track}`}>
      <div className={`h-full rounded-full ${t.fill}`} style={{ width: `${ratio}%` }} />
    </div>
  </div>
}
