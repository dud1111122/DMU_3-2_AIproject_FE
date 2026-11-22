import { useEffect, useState } from 'react'
import { errorMessage } from '../api/errors.js'
import { useStore } from './store.jsx'
import { useGuideRunning } from './guide.js'
import { PLEDGE_MAX, PLEDGE_MIN, askedToday, markAskedToday } from './usage.js'
import { THEME } from './UsageComponents.jsx'
import { savePledge, useUsageSummary } from './useUsage.js'

const PRESETS = [5, 10, 20, 30]

// 기본 모드에 들어올 때마다 확인한다. 그날(KST) 아직 묻지 않았고 약속이 없으면 한 번 띄운다.
// 회원은 needsPledge, 비회원은 로컬 기록으로 판단한다. 건너뛰거나 정하면 그날은 다시 묻지 않는다.
// 기본 모드 셸(BasicApp)에서만 렌더링한다.
export function PledgeGate({ theme = 'basic' }) {
  const { summary, loading } = useUsageSummary()
  const guideRunning = useGuideRunning()
  const [open, setOpen] = useState(false)
  // 처음 안내가 떠 있는 동안에는 묻지 않는다. 안내가 끝나면 그때 띄운다. 기획 §4.
  useEffect(() => {
    if (loading || !summary || open || guideRunning) return
    if (summary.needsPledge && !askedToday()) setOpen(true)
  }, [loading, summary, open, guideRunning])
  if (!open) return null
  return <PledgeSheet theme={theme} onDone={() => setOpen(false)} />
}

// "오늘 몇 개 볼까요?" (1~100). 건너뛰면 오늘은 다시 묻지 않는다. 정한 약속은 오늘 바꿀 수 없다.
export function PledgeSheet({ theme = 'basic', onDone }) {
  const t = THEME[theme]
  const { isMember, showToast } = useStore()
  const [value, setValue] = useState('')
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const count = Number(value)
  const valid = value !== '' && Number.isInteger(count) && count >= PLEDGE_MIN && count <= PLEDGE_MAX

  const submit = async (event) => {
    event?.preventDefault()
    if (!valid || saving) return
    setSaving(true)
    setError(null)
    try {
      await savePledge(isMember, count)
      showToast(`오늘은 ${count}개까지 볼게요.`)
      onDone()
    } catch (failure) {
      if (failure?.code === 'PLEDGE_ALREADY_SET') {
        markAskedToday()
        showToast('오늘 약속은 이미 정했어요. 내일 다시 정할 수 있어요.')
        onDone()
      } else {
        setError(errorMessage(failure))
      }
    } finally {
      setSaving(false)
    }
  }

  const skip = () => { markAskedToday(); onDone() }

  return <div className="absolute inset-0 z-[70] flex items-end bg-black/40" onClick={skip}>
    <form role="dialog" aria-modal="true" aria-labelledby="pledge-title" onSubmit={submit} onClick={(event) => event.stopPropagation()} className={`w-full rounded-t-2xl px-5 pb-7 pt-4 ${t.card}`}>
      <div className="mx-auto mb-4 h-1 w-10 rounded bg-current opacity-20" />
      <h2 id="pledge-title" className={`text-[18px] font-bold ${t.heading}`}>오늘 몇 개 볼까요?</h2>
      <p className={`mt-1.5 text-[12px] leading-5 ${t.muted}`}>{PLEDGE_MIN}~{PLEDGE_MAX}개 중에서 골라 주세요. 정한 개수는 오늘 하루 바꿀 수 없어요. 넘겨도 막지 않고, 개수를 보여 드릴게요.</p>

      <div className="mt-4 flex items-center gap-2">
        <input type="number" inputMode="numeric" min={PLEDGE_MIN} max={PLEDGE_MAX} value={value} onChange={(event) => { setValue(event.target.value); setError(null) }} aria-label="오늘 볼 개수" placeholder="개수" className={`h-11 w-28 rounded-xl px-3 text-[16px] font-semibold outline-none ${t.chip}`} />
        <span className={`text-[14px] ${t.muted}`}>개</span>
      </div>
      <div role="group" aria-label="빠른 선택" className="mt-3 flex flex-wrap gap-2">
        {PRESETS.map((preset) => <button key={preset} type="button" onClick={() => setValue(String(preset))} aria-pressed={count === preset} className={`h-8 min-w-[52px] rounded-full px-3 text-[12px] font-semibold ${count === preset ? t.chipOn : t.chip}`}>{preset}개</button>)}
      </div>
      {error && <p role="alert" className="mt-3 text-[12px] text-[#c0392b]">{error}</p>}

      <div className="mt-5 grid grid-cols-2 gap-2">
        <button type="button" onClick={skip} className={`h-11 rounded-full text-[14px] font-semibold ${t.ghost}`}>건너뛰기</button>
        <button type="submit" disabled={!valid || saving} className={`h-11 rounded-full text-[14px] font-semibold disabled:opacity-40 ${t.primary}`}>{saving ? '정하는 중…' : '정하기'}</button>
      </div>
    </form>
  </div>
}
