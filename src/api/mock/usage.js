import { ApiError } from '../errors.js'
import { seedPosts } from '../../data/posts.js'
import { PLEDGE_MAX, PLEDGE_MIN, addDays, estimateSeconds, kstDate, minutesOf, monthRange, weekStart } from '../../shared/usage.js'

// 묶음 보기·사용량 목업 (기획 §15 API). 회원 집계는 localStorage의 'de-shorts:mock-usage'에 날짜별 집계만 둔다.
// 게시물 ID는 검증에만 쓰고 저장하지 않는다.
//
// server.js 등록 방법: usageRoutes의 각 항목을 `on(method, path, handler)`로 그대로 등록한다.
// handler({ params, query, body, uid }) 는 평범한 객체(데이터)를 돌려주고, 오류는 ApiError를 던진다.
// (상태 코드는 모두 200. 회원 전용 경로는 uid가 없으면 401을 던진다.)
// 이 파일의 mockUsageRequest는 server.js 등록과 상관없이 usage API 호출을 처리한다 (api/index.js가 사용).

const USAGE_KEY = 'de-shorts:mock-usage'
const DB_KEY = 'de-shorts:mock-db' // server.js가 쓰는 목업 DB. 로그인한 회원 uid만 읽는다.
const LATENCY_MS = 250
// 시연용 책 한 권. 관리자 책 관리 화면은 아직 없으므로 목업에서만 고정 값을 쓴다.
const MOCK_BOOK = { title: '하늘과 바람과 별과 시', readingMinutes: 120 }
const MAX_BUNDLE = 10

const postsById = new Map(seedPosts.map((post) => [post.id, post]))
const blank = () => ({ count: 0, seconds: 0, stops: 0, pledge: null, pledgedAt: null, tipShown: false })

function loadAll() { try { const raw = JSON.parse(localStorage.getItem(USAGE_KEY) || '{}'); return raw && typeof raw === 'object' ? raw : {} } catch { return {} } }
function saveAll(all) { try { localStorage.setItem(USAGE_KEY, JSON.stringify(all)) } catch { /* 저장을 못 해도 현재 세션은 계속 동작한다 */ } }
const fail = (status, code, message, fields = []) => { throw new ApiError(status, code, message, fields) }
const needUser = (uid) => uid || fail(401, 'UNAUTHORIZED', '로그인이 필요해요.')

function days(all, uid) { return (all[uid] ||= {}) }
function sumRange(userDays, from, to) {
  let count = 0
  let seconds = 0
  let stops = 0
  for (const [date, day] of Object.entries(userDays)) {
    if (date < from || date > to) continue
    count += day.count
    seconds += day.seconds
    stops += day.stops
  }
  return { count, seconds, stops }
}

// 기간 합계. week는 월~일, month는 KST 달력 기준이다.
function statsFor(userDays, today) {
  const start = weekStart(today)
  const week = sumRange(userDays, start, addDays(start, 6))
  const month = monthRange(today)
  const monthSum = sumRange(userDays, month.from, month.to)
  const view = (sum) => ({ count: sum.count, minutes: minutesOf(sum.seconds) })
  return { today: view({ count: userDays[today]?.count || 0, seconds: userDays[today]?.seconds || 0 }), week: view(week), month: view(monthSum), stopsThisWeek: week.stops }
}

function summaryFor(userDays, today) {
  const day = { ...blank(), ...userDays[today] }
  return { date: today, pledgedCount: day.pledge, needsPledge: day.pledge == null, ...statsFor(userDays, today) }
}

export const usageRoutes = [
  {
    method: 'GET',
    path: '/usage/today',
    handler: ({ uid }) => {
      needUser(uid)
      return summaryFor(days(loadAll(), uid), kstDate())
    },
  },
  {
    method: 'PUT',
    path: '/usage/today/pledge',
    handler: ({ uid, body }) => {
      needUser(uid)
      const value = body?.pledgedCount
      if (!Number.isInteger(value) || value < PLEDGE_MIN || value > PLEDGE_MAX) fail(400, 'VALIDATION_FAILED', '입력한 내용을 다시 확인해 주세요.', [{ field: 'pledgedCount', message: `1~${PLEDGE_MAX} 사이의 숫자를 입력해 주세요.` }])
      const all = loadAll()
      const userDays = days(all, uid)
      const today = kstDate()
      const day = { ...blank(), ...userDays[today] }
      if (day.pledge != null) fail(409, 'PLEDGE_ALREADY_SET', '오늘 약속은 이미 정했어요. 내일 다시 정할 수 있어요.')
      userDays[today] = { ...day, pledge: value, pledgedAt: new Date().toISOString() }
      saveAll(all)
      return summaryFor(userDays, today)
    },
  },
  {
    method: 'POST',
    path: '/usage/bundles',
    handler: ({ uid, body }) => {
      const ids = Array.isArray(body?.postIds) ? body.postIds.map(String) : []
      if (ids.length < 1 || ids.length > MAX_BUNDLE || new Set(ids).size !== ids.length) fail(400, 'VALIDATION_FAILED', '입력한 내용을 다시 확인해 주세요.', [{ field: 'postIds', message: `게시물은 1~${MAX_BUNDLE}개, 중복 없이 골라 주세요.` }])
      // 공개 게시물만 받는다. 목업에는 숨김 게시물이 없으므로 존재 여부만 본다.
      if (ids.some((id) => !postsById.has(id))) fail(400, 'INVALID_POST', '공개된 게시물만 묶음에 담을 수 있어요.')
      const seconds = ids.reduce((sum, id) => sum + estimateSeconds(postsById.get(id)), 0)
      const bundle = { count: ids.length, estimatedSeconds: seconds, estimatedMinutes: minutesOf(seconds) }
      const today = kstDate()

      if (!uid) {
        // 비회원은 저장하지 않는다. 팁 하루 한 번 판단은 FE가 한다.
        return { bundle, tip: MOCK_BOOK }
      }
      const all = loadAll()
      const userDays = days(all, uid)
      const day = { ...blank(), ...userDays[today] }
      userDays[today] = { ...day, count: day.count + ids.length, seconds: day.seconds + seconds }
      const tip = day.tipShown ? null : MOCK_BOOK
      if (tip) userDays[today].tipShown = true
      saveAll(all)
      const stats = statsFor(userDays, today)
      const pledge = userDays[today].pledge
      return { bundle, stats, pledge: { count: pledge, exceeded: pledge != null && stats.today.count > pledge }, tip }
    },
  },
  {
    method: 'POST',
    path: '/usage/stops',
    handler: ({ uid }) => {
      needUser(uid)
      const all = loadAll()
      const userDays = days(all, uid)
      const today = kstDate()
      const day = { ...blank(), ...userDays[today] }
      userDays[today] = { ...day, stops: day.stops + 1 }
      saveAll(all)
      return { stats: statsFor(userDays, today) }
    },
  },
]

// api/index.js가 쓰는 목업 요청 함수. 로그인 회원은 목업 DB의 sessionUserId로 식별한다.
function sessionUid() {
  try {
    const uid = JSON.parse(localStorage.getItem(DB_KEY) || '{}').sessionUserId || null
    return uid && JSON.parse(localStorage.getItem(DB_KEY) || '{}').users?.[uid] ? uid : null
  } catch {
    return null
  }
}

export async function mockUsageRequest(method, path, { body } = {}) {
  await new Promise((resolve) => setTimeout(resolve, LATENCY_MS))
  const route = usageRoutes.find((item) => item.method === method && item.path === path)
  if (!route) throw new ApiError(404, 'NOT_FOUND', '요청한 주소를 찾을 수 없어요.')
  const data = route.handler({ params: {}, query: {}, body, uid: sessionUid() })
  return { status: 200, data: JSON.parse(JSON.stringify(data ?? null)) }
}
