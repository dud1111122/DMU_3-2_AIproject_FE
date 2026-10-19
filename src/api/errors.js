export class ApiError extends Error {
  // meta에는 오류 본문의 나머지 값(예: 429의 resetAt)을 담는다.
  constructor(status, code, message, fields = [], meta = {}) {
    super(message)
    this.status = status
    this.code = code
    this.fields = fields
    this.meta = meta
  }
}

const fallbackMessages = {
  0: '네트워크에 연결할 수 없어요. 잠시 후 다시 시도해 주세요.',
  400: '입력한 내용을 다시 확인해 주세요.',
  401: '로그인이 필요해요.',
  403: '권한이 없어요.',
  404: '찾을 수 없거나 더 이상 볼 수 없는 콘텐츠예요.',
  409: '이미 처리 중인 요청이 있어요. 잠시 후 다시 시도해 주세요.',
  429: '오늘 사용할 수 있는 횟수를 모두 썼어요.',
  502: 'AI 응답을 만들지 못했어요. 다시 시도해 주세요.',
  503: 'AI 기능이 아직 설정되지 않았어요. 게시물 읽기는 계속 할 수 있어요.',
}

// 대담 API 오류 코드는 서버 문구보다 이 문구를 먼저 쓴다. 일부 응답은 영문 메시지를 보낼 수 있다.
const codeMessages = {
  DEBATE_ENDED: '이미 끝난 대담입니다.',
  TURN_LIMIT_REACHED: '발언 한도(12개)에 도달했습니다.',
  REQUEST_IN_PROGRESS: '이전 발언을 만드는 중입니다. 잠시 후 다시 시도해 주세요.',
  DAILY_LIMIT_EXCEEDED: '오늘 대담 횟수(3회)를 모두 사용했습니다.',
  AI_FAILED: 'AI 응답을 만들지 못했습니다. 다시 시도해 주세요.',
  AI_NOT_CONFIGURED: 'AI 설정이 되어 있지 않습니다.',
  STREAM_INTERRUPTED: '응답이 중간에 끊겼어요. 잠시 후 다시 불러와 주세요.',
}

// 입력 검증 실패는 필드별 메시지를 이어 붙인다.
const validationMessage = (error) => error.fields?.map((field) => field?.message).filter(Boolean).join(' ') || error.message || null

export const errorMessage = (error) => {
  if (error?.code === 'VALIDATION_FAILED') return validationMessage(error) || fallbackMessages[400]
  if (codeMessages[error?.code]) return codeMessages[error.code]
  return error?.message || fallbackMessages[error?.status] || '문제가 생겼어요. 다시 시도해 주세요.'
}
export const isStatus = (error, status) => error instanceof ApiError && error.status === status
