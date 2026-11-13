export default function AiBadge({ className = '', label = 'AI' }) {
  return <span title="실제 인물이 아닌 AI 재현 페르소나예요" className={`inline-flex shrink-0 items-center rounded-full border border-current px-1.5 py-px text-[9px] font-semibold leading-[14px] opacity-80 ${className}`}>{label}</span>
}
