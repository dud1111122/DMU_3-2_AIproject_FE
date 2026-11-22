import { useState } from 'react'
import useBrowserBack from './useBrowserBack.js'

export default function useNavStack(initial) {
  const [stack, setStack] = useState([initial])
  const back = () => setStack((items) => items.length > 1 ? items.slice(0, -1) : items)
  // 쌓인 화면 수를 브라우저 기록과 맞춘다. 기획 §4.
  useBrowserBack(stack.length, back)
  return {
    root: stack[0],
    current: stack[stack.length - 1],
    canGoBack: stack.length > 1,
    push: (entry) => setStack((items) => [...items, entry]),
    back,
    reset: (entry) => setStack([entry]),
  }
}
