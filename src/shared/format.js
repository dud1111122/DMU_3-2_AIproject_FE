export const formatDate = (iso) => iso ? new Date(iso).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' }) : ''
export const formatDateTime = (iso) => iso ? new Date(iso).toLocaleString('ko-KR', { month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : ''
export const compactCount = (value) => new Intl.NumberFormat('ko-KR', { notation: 'compact', maximumFractionDigits: 1 }).format(value)

export const citationLabel = (section) => section.citationType === 'DIRECT_QUOTE' ? '직접 인용' : 'AI 재구성'
export const AI_DISCLOSURE = '실제 인물이 아닌 AI 재현 페르소나예요. AI 설명에는 오류가 있을 수 있어요.'
export const sourceStatusLabel = (source) => source.verified ? `확인된 문헌${source.checkedAt ? ` · ${formatDate(source.checkedAt)} 확인` : ''}` : 'AI 제안 문헌 · 미확인'

export const assessmentLabels = { UNDERSTOOD: '이해함', PARTIAL: '부분 이해', MISSED: '놓침' }
export const debateStatusLabel = (status) => (status === 'ENDED' ? '종료' : '진행 중')
export const reviewReasonLabels = { QUIZ_WRONG: '퀴즈 오답', CHAT_MISSED: '대화에서 놓침' }
export const reportReasons = [
  { code: 'INACCURATE', label: '사실과 다른 내용' },
  { code: 'FAKE_QUOTE', label: '지어낸 인용' },
  { code: 'HARMFUL', label: '해로운 내용' },
  { code: 'INAPPROPRIATE', label: '부적절한 표현' },
  { code: 'OTHER', label: '기타' },
]

// 받침 유무에 따라 '와/과'처럼 조사를 고른다.
export const withParticle = (word, withoutFinal, withFinal) => {
  const code = word.charCodeAt(word.length - 1) - 0xac00
  return `${word}${code >= 0 && code <= 11171 && code % 28 ? withFinal : withoutFinal}`
}

// 백엔드 문헌의 발행처 표시와 비고를 제목 뒤에 붙인다.
export const sourceDetail = (source) => [source.publicationLabel, source.note].filter(Boolean).join(' · ')
