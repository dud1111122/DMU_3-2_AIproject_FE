import Icon from '../components/Icon.jsx'
import { modes } from './modes.js'

export default function ModeSheet({ current, onSelect, onClose, floating = false, dark = false }) {
  return <div className={`mode-ui ${floating ? 'fixed sm:items-center' : 'absolute'} inset-0 z-[80] flex items-end justify-center bg-black/45`} onClick={onClose}>
    <div role="dialog" aria-modal="true" aria-label="화면 모드 선택" className={`w-full px-4 pb-7 pt-3 ${floating ? 'max-w-[402px] rounded-t-2xl sm:rounded-2xl' : 'rounded-t-2xl'} ${dark ? 'bg-[#212121] text-white' : 'bg-white text-[#111]'}`} onClick={(event) => event.stopPropagation()}>
      <div className={`mx-auto mb-3 h-1 w-9 rounded ${dark ? 'bg-white/30' : 'bg-[#dbdbdb]'}`} />
      <div className="flex items-center justify-between"><strong className="text-[16px]">화면 모드</strong><button onClick={onClose} aria-label="닫기"><Icon name="close" size={21} /></button></div>
      <p className={`mt-1 text-[12px] leading-5 ${dark ? 'text-white/60' : 'text-[#737373]'}`}>모드를 바꿔도 같은 게시물과 저장·좋아요·팔로우 상태가 그대로 유지돼요.</p>
      <div className="mt-3 space-y-2">{modes.map((mode) => <button key={mode.id} onClick={() => onSelect(mode.id)} aria-pressed={current === mode.id} className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left ${current === mode.id ? (dark ? 'border-white bg-white/10' : 'border-[#111] bg-[#f6f6f6]') : (dark ? 'border-white/15' : 'border-[#e5e5e5]')}`}>
        <span className="flex-1"><strong className="block text-[14px]">{mode.label}</strong><span className={`text-[12px] ${dark ? 'text-white/60' : 'text-[#737373]'}`}>{mode.description}</span></span>
        {current === mode.id && <Icon name="check" size={20} strokeWidth={2.4} />}
      </button>)}</div>
    </div>
  </div>
}
