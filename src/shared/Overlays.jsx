import { useState } from 'react'
import Icon from '../components/Icon.jsx'
import { API_MODE } from '../api/index.js'
import { errorMessage } from '../api/errors.js'
import { useStore } from './store.jsx'

// 로그인 안내 시트와 토스트는 모든 모드의 휴대폰 화면 안에 같은 방식으로 뜬다.
export default function Overlays({ dark = false }) {
  const { loginPrompt, closeLoginPrompt, toast } = useStore()
  return <>
    {loginPrompt && <LoginSheet dark={dark} reason={loginPrompt.reason} onClose={closeLoginPrompt} />}
    {toast && <div key={toast.id} role="status" className={`absolute inset-x-4 bottom-20 z-[90] rounded-xl px-4 py-3 text-[13px] shadow-lg ${dark ? 'bg-[#f1f1f1] text-[#0f0f0f]' : 'bg-[#1c1b19] text-white'}`}>{toast.message}</div>}
  </>
}

export function LoginSheet({ dark, reason, onClose }) {
  const { login } = useStore()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [sending, setSending] = useState(false)
  const submit = async (event) => {
    event.preventDefault()
    setSending(true)
    setError(null)
    try { await login(username.trim(), password) } catch (failure) { setError(errorMessage(failure)) } finally { setSending(false) }
  }
  const field = `h-11 w-full rounded-lg border px-3 text-[14px] outline-none ${dark ? 'border-white/20 bg-white/10 text-white placeholder:text-white/40' : 'border-[#dbdbdb] bg-white text-[#111] placeholder:text-[#a3a3a3]'}`
  return <div className="absolute inset-0 z-[85] flex items-end bg-black/50" onClick={onClose}>
    <form role="dialog" aria-modal="true" aria-label="로그인" onSubmit={submit} onClick={(event) => event.stopPropagation()} className={`w-full rounded-t-2xl px-5 pb-8 pt-3 ${dark ? 'bg-[#212121] text-white' : 'bg-white text-[#111]'}`}>
      <div className={`mx-auto mb-3 h-1 w-9 rounded ${dark ? 'bg-white/30' : 'bg-[#dbdbdb]'}`} />
      <div className="flex items-center justify-between"><strong className="text-[17px]">로그인</strong><button type="button" onClick={onClose} aria-label="닫기"><Icon name="close" size={21} /></button></div>
      <p className={`mt-1 text-[12px] leading-5 ${dark ? 'text-white/60' : 'text-[#737373]'}`}>{reason || '로그인하면 팔로우·좋아요·저장과 학습 기록을 남길 수 있어요.'}</p>
      <label className="mt-4 block text-[12px] font-semibold">아이디<input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required className={`${field} mt-1`} /></label>
      <label className="mt-3 block text-[12px] font-semibold">비밀번호<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required className={`${field} mt-1`} /></label>
      {error && <p role="alert" className="mt-3 text-[12px] text-[#e5484d]">{error}</p>}
      <button disabled={sending || !username.trim() || !password} className={`mt-4 h-11 w-full rounded-lg text-[14px] font-semibold disabled:opacity-40 ${dark ? 'bg-white text-[#0f0f0f]' : 'bg-[#1c1b19] text-white'}`}>{sending ? '로그인 중…' : '로그인'}</button>
      {API_MODE === 'mock' && <p className={`mt-3 text-center text-[11px] ${dark ? 'text-white/50' : 'text-[#8a8a8a]'}`}>시연 계정 · demo / demo1234 (목업 서버)</p>}
    </form>
  </div>
}
