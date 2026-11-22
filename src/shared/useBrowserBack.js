import { useEffect, useRef } from 'react'

// 화면 스택 깊이를 브라우저 기록과 맞춘다(기획 §4 공통 화면 동작).
// - 화면이 쌓이면 그만큼 history.pushState로 기록을 쌓는다.
// - 브라우저·안드로이드 뒤로 가기가 오면 onBack()으로 화면을 한 칸 닫는다.
// - 화면 안 '뒤로'나 탭 전환으로 깊이가 줄면 쌓아 둔 기록도 그만큼 되돌린다.
// 주소는 바꾸지 않으므로 새로 고치면 그 모드의 첫 화면에서 시작한다.
// depth는 1부터(첫 화면만 있을 때 1), onBack은 한 칸 뒤로 가는 함수다.
export default function useBrowserBack(depth, onBack) {
  const backRef = useRef(onBack)
  backRef.current = onBack
  const pushed = useRef(0) // 우리가 쌓아 둔 기록 칸 수
  const skip = useRef(0)   // 우리가 되돌려서 생긴 popstate는 화면을 닫지 않는다

  useEffect(() => {
    const target = Math.max(0, depth - 1)
    if (target > pushed.current) {
      for (let i = pushed.current; i < target; i += 1) window.history.pushState({ deShortsDepth: i + 1 }, '')
      pushed.current = target
    } else if (target < pushed.current) {
      const drop = pushed.current - target
      pushed.current = target
      skip.current += drop
      window.history.go(-drop)
    }
  }, [depth])

  useEffect(() => {
    const onPopState = () => {
      if (skip.current > 0) { skip.current -= 1; return }
      if (pushed.current > 0) { pushed.current -= 1; backRef.current() }
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])
}
