// 화면을 나갔다 돌아오거나 StrictMode가 효과를 다시 실행해도 같은 묶음은 한 번만 집계한다.
// 게시물 ID는 현재 페이지의 메모리에만 두며 저장소나 서버에는 기록하지 않는다.
export function createBundleCompletionLedger() {
  let currentDay
  const completions = new Map()

  return ({ day, viewer, scope, start, postIds }, complete) => {
    if (currentDay !== day) {
      completions.clear()
      currentDay = day
    }
    const key = JSON.stringify([viewer, scope, start, postIds.map(String).sort()])
    if (completions.has(key)) return { promise: completions.get(key), reused: true }

    // 부수 효과보다 먼저 등록해야 동시 마운트와 효과 재실행도 하나의 요청을 공유한다.
    const promise = Promise.resolve().then(complete)
    completions.set(key, promise)
    // 실패해도 재전송하지 않는다. 연결 오류라면 서버가 이미 반영했을 수 있다.
    return { promise, reused: false }
  }
}

export const completeBundleOnce = createBundleCompletionLedger()
