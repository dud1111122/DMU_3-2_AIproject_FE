import { useEffect, useState } from 'react'

// 처음 들어온 사용자에게 핵심 흐름을 짚어 주는 안내(가이드). 기획 §4 공통 화면 동작.
// 본 적 있는지는 화면 모드·묶음 크기와 같게 이 브라우저 로컬에만 둔다.

const KEY = (mode) => `de-shorts:guide-seen:${mode}`
export const RESTART_EVENT = 'de-shorts:guide-restart'

// 로컬 저장소를 못 쓰는 브라우저(시크릿 모드 등)에서는 이 탭에서만 기억한다.
const memory = new Set()

export function guideSeen(mode) {
  if (memory.has(mode)) return true
  try { return localStorage.getItem(KEY(mode)) === '1' } catch { return false }
}

export function markGuideSeen(mode) {
  memory.add(mode)
  try { localStorage.setItem(KEY(mode), '1') } catch { /* 로컬 저장소를 못 쓰면 이 탭에서만 기억한다 */ }
}

export function restartGuide(mode) {
  memory.delete(mode)
  try { localStorage.removeItem(KEY(mode)) } catch { /* 위와 같다 */ }
  window.dispatchEvent(new CustomEvent(RESTART_EVENT, { detail: { mode } }))
}

// 가이드가 떠 있는 동안에는 하루 약속 모달을 띄우지 않는다(겹치지 않게).
let running = false
const listeners = new Set()
export function setGuideRunning(value) {
  if (running === value) return
  running = value
  listeners.forEach((listener) => listener(value))
}
export function useGuideRunning() {
  const [value, setValue] = useState(running)
  useEffect(() => {
    listeners.add(setValue)
    setValue(running)
    return () => listeners.delete(setValue)
  }, [])
  return value
}

// 처음 들어온 사용자에게 한 번만 보여주고, '다시 보기'로 또 열 수 있다. 모드마다 따로 센다.
export function useGuide(mode) {
  const [open, setOpen] = useState(() => !guideSeen(mode))
  useEffect(() => {
    const onRestart = (event) => { if (event.detail?.mode === mode) setOpen(true) }
    window.addEventListener(RESTART_EVENT, onRestart)
    return () => window.removeEventListener(RESTART_EVENT, onRestart)
  }, [mode])
  return [open, () => setOpen(false)]
}

// 단계: target은 CSS 선택자이며 없으면 화면 가운데에 설명만 띄운다.
// 화면에 없는 target은 자동으로 건너뛴다(목록이 비었거나 비회원이라 안 보이는 경우).
export const guideSteps = {
  basic: [
    {
      title: '디쇼츠에 오신 걸 환영해요',
      text: '역사 속 인물의 AI 페르소나가 올린 카드 글을 읽고, 퀴즈와 대화로 이해를 확인하는 서비스예요. 잠깐만 둘러볼까요?',
    },
    {
      target: '[data-guide="basic-filter"]',
      title: '관심 있는 주제만 골라요',
      text: '주제를 누르면 그 주제의 글만 모아 봐요. ‘팔로우’는 팔로우한 인물의 글만 보여줘요.',
    },
    {
      target: '[data-guide="basic-card"]',
      title: '글은 카드로 읽어요',
      text: '글을 열면 카드를 한 장씩 넘기며 읽어요. 아래에는 AI가 참고한 문헌이 함께 표시되고, 직접 확인하지 않은 문헌은 ‘미확인’으로 알려줘요.',
    },
    {
      target: '[data-guide="tab-study"]',
      title: '읽고 끝내지 않아요',
      text: '퀴즈로 이해를 확인하고, 글을 쓴 인물과 직접 대화할 수 있어요. 잘못 이해한 부분은 복습함에 모여요.',
    },
    {
      target: '[data-guide="tab-debate"]',
      title: '인물 두 명을 붙여 봐요',
      text: '인물 두 명과 논제를 고르면 그 자리에서 대담이 오가요. 모두 AI가 재구성한 가상 대화이고, 로그인하면 쓸 수 있어요.',
    },
    {
      title: '끝없이 넘기지 않아요',
      text: '정한 개수만큼 보면 잠깐 멈춰서, 오늘 본 글 수와 걸린 시간을 알려드려요. 이어 볼지는 그때 정하면 돼요.',
    },
  ],
  instagram: [
    {
      title: '인스타그램 모드예요',
      text: '같은 글을 피드와 캐러셀로 봐요. 저장·좋아요·팔로우는 다른 모드와 그대로 이어져요.',
    },
    {
      target: '[data-guide="ig-filter"]',
      title: '피드를 골라 봐요',
      text: '전체·팔로잉과 주제로 피드를 바꿀 수 있어요.',
    },
    {
      target: '[data-guide="ig-card"]',
      title: '카드를 좌우로 넘겨요',
      text: '카드를 밀면 다음 장이 나와요. 넘기다 잘못 눌리지 않게 홈에서는 글 상세로 들어가지 않아요. 말풍선을 누르면 이 글로 인물과 대화할 수 있어요.',
    },
    {
      target: '[data-guide="ig-tab-learning"]',
      title: '퀴즈와 복습은 여기에',
      text: '돋보기에서는 추천 글을, 학습에서는 퀴즈 기록과 복습함을 봐요.',
    },
  ],
  shorts: [
    {
      title: '쇼츠 모드예요',
      text: '위아래로 넘기면 다음 글, 좌우로 넘기거나 탭하면 같은 글의 다음 카드로 가요.',
    },
    {
      target: '[data-guide="shorts-filter"]',
      title: '주제로 걸러 봐요',
      text: '전체·팔로우와 주제로 보고 싶은 쇼츠만 모아 볼 수 있어요.',
    },
    {
      title: '오른쪽 버튼으로 더 깊게',
      text: '좋아요·저장·공유와 함께 퀴즈·대화를 바로 열 수 있어요. 글의 출처는 정보 버튼에서 확인해요.',
    },
  ],
}
