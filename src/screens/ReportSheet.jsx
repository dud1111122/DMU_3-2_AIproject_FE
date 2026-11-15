import { useState } from 'react'
import Icon from '../components/Icon.jsx'
import { errorMessage } from '../api/errors.js'
import { reportReasons } from '../shared/format.js'
import { useReport } from '../shared/hooks.js'
import { useStore } from '../shared/store.jsx'
import { Sheet } from './ui.jsx'

// 신고는 로그인 회원만 한다. 게시물당 한 번이며 서버가 같은 신고를 다시 받으면 기존 결과를 돌려준다.
export default function ReportSheet({ post, onClose }) {
  const { showToast } = useStore()
  const { report, sending, error } = useReport()
  const [reason, setReason] = useState(null)
  const [detail, setDetail] = useState('')
  const submit = async () => {
    const result = await report(post.id, reason, detail.trim() || undefined)
    if (result) { showToast('신고를 접수했어요. 운영자가 확인해요.'); onClose() }
  }
  return <Sheet title="게시물 신고" onClose={onClose}>
    <p className="pb-2 text-[11px] leading-5 text-[#737373]">AI가 생성한 게시물이에요. 문제가 있으면 사유를 골라 알려 주세요.</p>
    <div role="radiogroup" aria-label="신고 사유" className="border-t border-[#efefef]">{reportReasons.map((item) => <button key={item.code} role="radio" aria-checked={reason === item.code} onClick={() => setReason(item.code)} className="flex h-11 w-full items-center justify-between border-b border-[#efefef] text-left text-[13px]">{item.label}{reason === item.code && <Icon name="check" size={17} strokeWidth={2.4} />}</button>)}</div>
    <label className="mt-3 block text-[12px] font-semibold">상세 내용 (선택)<textarea value={detail} maxLength={500} rows={3} onChange={(event) => setDetail(event.target.value)} className="mt-1 w-full resize-none rounded-lg border border-[#dbdbdb] p-2.5 text-[13px] font-normal outline-none" /></label>
    <p className="mt-1 text-right text-[10px] text-[#8e8e8e]">{detail.length}/500</p>
    {error && <p role="alert" className="mt-1 text-[12px] text-[#e5484d]">{errorMessage(error)}</p>}
    <button disabled={!reason || sending} onClick={submit} className="mt-3 h-11 w-full rounded-lg bg-[#e5484d] text-[14px] font-semibold text-white disabled:opacity-40">{sending ? '접수 중…' : '신고하기'}</button>
  </Sheet>
}
