import { useState } from 'react'

export default function useNavStack(initial) {
  const [stack, setStack] = useState([initial])
  return {
    root: stack[0],
    current: stack[stack.length - 1],
    canGoBack: stack.length > 1,
    push: (entry) => setStack((items) => [...items, entry]),
    back: () => setStack((items) => items.length > 1 ? items.slice(0, -1) : items),
    reset: (entry) => setStack([entry]),
  }
}
