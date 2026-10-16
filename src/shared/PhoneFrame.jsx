import Overlays from './Overlays.jsx'

// ?bare=1 이면 휴대폰 틀 없이 화면만 393×852(iPhone 16 논리 크기)로 그린다. 스크린샷을 목업에 넣을 때 쓴다.
export default function PhoneFrame({ dark = false, screenClassName = 'bg-white', children }) {
  const bare = new URLSearchParams(window.location.search).has('bare')
  const screen = <div className={`mockup-phone-display phone-inner relative flex flex-col ${screenClassName}`}>
    <div className={`phone-status ${dark ? 'status-dark bg-black text-white' : ''}`} aria-hidden="true">
      <span>9:41</span>
      <span className="flex items-center gap-1">
        <svg width="17" height="12" viewBox="0 0 17 12" fill="currentColor"><rect x="0" y="8" width="3" height="4" rx=".7" /><rect x="4.5" y="5.5" width="3" height="6.5" rx=".7" /><rect x="9" y="3" width="3" height="9" rx=".7" /><rect x="13.5" width="3" height="12" rx=".7" /></svg>
        <svg width="16" height="12" viewBox="0 0 16 12" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M1 3.5a11 11 0 0 1 14 0M3.5 6.2a7 7 0 0 1 9 0M6 8.7a3 3 0 0 1 4 0" /><circle cx="8" cy="11" r=".8" fill="currentColor" stroke="none" /></svg>
        <span className="battery"><i /></span>
      </span>
    </div>
    {children}
    <Overlays dark={dark} />
    {!bare && <div className="phone-home-indicator" aria-hidden="true"><span /></div>}
  </div>

  if (bare) return <main className="mode-ui phone-bare">{screen}</main>
  return <main className="mode-ui phone-stage">
    <div className="mockup-phone phone-frame">
      <div className="mockup-phone-camera" aria-hidden="true" />
      {screen}
    </div>
  </main>
}
