// 페르소나·사용자 모두 사진이 없으므로 이름 첫 글자를 원 안에 그린다. 색은 id로 고정한다.
const tones = ['#f3d9c6', '#d8e4f5', '#dcefd9', '#f3e2b8', '#e9d8f2', '#f5d3dc', '#d5ecec', '#e6e0d3']
const sizes = { xs: 'h-7 w-7 text-[11px]', sm: 'h-9 w-9 text-[14px]', md: 'h-12 w-12 text-[18px]', story: 'h-[60px] w-[60px] text-[22px]', lg: 'h-[78px] w-[78px] text-[28px]' }

export const initialOf = (person) => (person?.displayName || person?.username || '?').trim().charAt(0).toUpperCase()

export default function Avatar({ person, size = 'md', ring = null, onClick, className = '' }) {
  const tone = tones[(Number(person?.id) || (person?.username || '').length) % tones.length]
  const face = <span className={`relative flex items-center justify-center overflow-hidden rounded-full font-semibold text-[#3d3a35] ${sizes[size] || sizes.md} ${ring ? 'border-2 border-white' : ''}`} style={{ background: tone }}>{initialOf(person)}{person?.avatarUrl && <img src={person.avatarUrl} alt="" className="absolute inset-0 h-full w-full object-cover" onError={(event) => { event.currentTarget.style.display = 'none' }} />}</span>
  const ringClass = ring === 'story' ? 'story-ring p-[2px]' : ring === 'muted' ? 'bg-[#dbdbdb] p-[2px]' : ''
  if (!onClick) return <span aria-hidden="true" className={`inline-flex shrink-0 rounded-full ${ringClass} ${className}`}>{face}</span>
  return <button type="button" onClick={onClick} aria-label={`${person?.displayName || '내'} 프로필 보기`} className={`inline-flex shrink-0 rounded-full ${ringClass} ${className}`}>{face}</button>
}
