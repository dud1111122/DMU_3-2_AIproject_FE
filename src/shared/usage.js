import { ApiError } from '../api/errors.js'

// 묶음 보기와 사용량 확인 (기획 §15). 단위는 게시물 1개다.
// 회원의 집계는 서버(/usage)가 갖고, 비회원의 집계는 이 파일이 브라우저 로컬에 최근 31일만 둔다.
// 저장하는 것은 날짜별 개수·예상 초·멈춘 횟수·약속뿐이다. 본 게시물 ID와 실제 체류 시간은 어디에도 두지 않는다.

export const BUNDLE_SIZES = [3, 5, 10]
export const DEFAULT_BUNDLE_SIZE = 5
export const READING_CHARS_PER_MINUTE = 500
export const PLEDGE_MIN = 1
export const PLEDGE_MAX = 100
const KEEP_DAYS = 31

const SIZE_KEY = 'de-shorts:bundle-size'
const DAYS_KEY = 'de-shorts:usage:days' // 비회원 날짜별 집계 { 'YYYY-MM-DD': {count, seconds, stops, pledge, tipShown} }
const FLAGS_KEY = 'de-shorts:usage:flags' // { asked: 'YYYY-MM-DD', tipShown: 'YYYY-MM-DD' } 회원·비회원 공통 (회원의 팁 표시 기록)

// 저장소 접근이 막혀도(사생활 보호 모드 등) 화면은 계속 동작해야 한다.
const safeRead = (key, fallback) => { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback } catch { return fallback } }
const safeWrite = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* 집계 없이 진행한다 */ } }

// ---- 날짜 (KST 달력 기준) ----
export function kstDate(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
}
export function addDays(dateStr, days) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10)
}
// 주는 월요일에 시작한다.
export function weekStart(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dow = (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7
  return addDays(dateStr, -dow)
}
export function monthRange(dateStr) {
  const [y, m] = dateStr.split('-').map(Number)
  return { from: `${dateStr.slice(0, 7)}-01`, to: new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10) }
}

// ---- 묶음 크기 (브라우저 로컬) ----
export function readBundleSize() {
  const value = Number(safeRead(SIZE_KEY, DEFAULT_BUNDLE_SIZE))
  return BUNDLE_SIZES.includes(value) ? value : DEFAULT_BUNDLE_SIZE
}
const sizeListeners = new Set()
export function writeBundleSize(value) {
  if (!BUNDLE_SIZES.includes(value)) return
  safeWrite(SIZE_KEY, value)
  sizeListeners.forEach((listener) => listener(value))
}
export function subscribeBundleSize(listener) {
  sizeListeners.add(listener)
  return () => sizeListeners.delete(listener)
}

// ---- 예상 시간 ----
// 카드 본문 글자 수 ÷ 분당 읽기 글자 수. 실제 체류 시간은 재지 않는다.
export function estimateSeconds(post) {
  const chars = (post.sections || []).reduce((sum, section) => sum + (section.body || '').length, 0)
  return Math.round((chars * 60) / READING_CHARS_PER_MINUTE)
}
// 예상 시간은 정수 분으로 보여 준다. 합계 초를 한 번만 반올림하고, 0보다 조금이라도 있으면 최소 1분이다.
export const minutesOf = (seconds) => ((seconds || 0) <= 0 ? 0 : Math.max(1, Math.round(seconds / 60)))

// ---- 서버 응답 모양 맞추기 ----
const pick = (value) => ({ count: value?.count ?? 0, minutes: value?.minutes ?? 0 })
// 서버의 GET /usage/today 응답이나 묶음·멈춤 응답의 stats를 같은 모양으로 맞춘다.
export function normalizeUsage(raw) {
  return {
    date: raw?.date ?? null,
    pledgedCount: raw?.pledgedCount ?? null,
    needsPledge: Boolean(raw?.needsPledge),
    today: pick(raw?.today),
    week: pick(raw?.week),
    month: pick(raw?.month),
    stopsThisWeek: raw?.stopsThisWeek ?? 0,
  }
}
export const normalizeStats = (raw) => ({ today: pick(raw?.today), week: pick(raw?.week), month: pick(raw?.month), stopsThisWeek: raw?.stopsThisWeek ?? 0 })

// 약속을 넘겼는지. 막지는 않고, "더보기"를 누르면 3초 대기를 거칠지 정할 때만 쓴다.
export const overPledge = (view) => view?.pledgedCount != null && view.today.count > view.pledgedCount

// ---- 비회원 로컬 집계 ----
const blankDay = () => ({ count: 0, seconds: 0, stops: 0, pledge: null, tipShown: false })
const isObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value)

// 31일보다 오래된 날짜는 읽을 때마다 버린다.
function readGuestDays(today = kstDate()) {
  const stored = safeRead(DAYS_KEY, {})
  const oldest = addDays(today, -(KEEP_DAYS - 1))
  return Object.fromEntries(Object.entries(isObject(stored) ? stored : {}).filter(([date]) => date >= oldest && date <= today))
}
function writeGuestDays(days) { safeWrite(DAYS_KEY, days) }
function sumRange(days, from, to) {
  let count = 0
  let seconds = 0
  let stops = 0
  for (const [date, day] of Object.entries(days)) {
    if (date < from || date > to) continue
    count += day.count || 0
    seconds += day.seconds || 0
    stops += day.stops || 0
  }
  return { count, seconds, stops }
}

export function guestSummary(today = kstDate()) {
  const days = readGuestDays(today)
  const day = { ...blankDay(), ...days[today] }
  const week = weekStart(today)
  const weekSum = sumRange(days, week, addDays(week, 6))
  const month = monthRange(today)
  const monthSum = sumRange(days, month.from, month.to)
  return {
    date: today,
    pledgedCount: day.pledge ?? null,
    needsPledge: day.pledge == null && !askedToday(today),
    today: { count: day.count, minutes: minutesOf(day.seconds) },
    week: { count: weekSum.count, minutes: minutesOf(weekSum.seconds) },
    month: { count: monthSum.count, minutes: minutesOf(monthSum.seconds) },
    stopsThisWeek: weekSum.stops,
  }
}

export function guestAddBundle(count, seconds, today = kstDate()) {
  const days = readGuestDays(today)
  const day = { ...blankDay(), ...days[today] }
  days[today] = { ...day, count: day.count + count, seconds: day.seconds + seconds }
  writeGuestDays(days)
}

export function guestAddStop(today = kstDate()) {
  const days = readGuestDays(today)
  const day = { ...blankDay(), ...days[today] }
  days[today] = { ...day, stops: day.stops + 1 }
  writeGuestDays(days)
}

// 같은 날에는 한 번만 정한다. 이미 정했으면 false.
export function guestSetPledge(count, today = kstDate()) {
  const days = readGuestDays(today)
  const day = { ...blankDay(), ...days[today] }
  if (day.pledge != null) return false
  days[today] = { ...day, pledge: count }
  writeGuestDays(days)
  return true
}

// ---- 공통 플래그 (약속을 물었는지, 팁을 보였는지) ----
const readFlags = () => { const flags = safeRead(FLAGS_KEY, {}); return isObject(flags) ? flags : {} }
export function askedToday(today = kstDate()) { return readFlags().asked === today }
export function markAskedToday(today = kstDate()) { safeWrite(FLAGS_KEY, { ...readFlags(), asked: today }) }

// 시간 팁은 하루 한 번이다. 회원은 플래그에, 비회원은 날짜별 집계에 기록한다.
export function tipShownToday(isMember, today = kstDate()) {
  if (isMember) return readFlags().tipShown === today
  return Boolean(readGuestDays(today)[today]?.tipShown)
}
export function markTipShown(isMember, today = kstDate()) {
  if (isMember) { safeWrite(FLAGS_KEY, { ...readFlags(), tipShown: today }); return }
  const days = readGuestDays(today)
  days[today] = { ...blankDay(), ...days[today], tipShown: true }
  writeGuestDays(days)
}

// ---- 시간 팁 문구 ----
// 서버 tip은 책 한 권({ title, author, readingMinutes, ... })이거나 없음(null). 이번 주 예상 시간이 정독 시간 이상이면 "정독할 수 있는 시간", 미만이면 "약 N%".
export function tipMessage(tip, week) {
  const book = tip
  if (!book?.title || !(book.readingMinutes > 0)) return null
  const last = book.title.charCodeAt(book.title.length - 1) - 0xac00
  const particle = last >= 0 && last <= 11171 && last % 28 ? '을' : '를'
  const head = `이번 주 ${week.count}개, 약 ${week.minutes}분 봤어요.`
  const title = `『${book.title}』`
  if (week.minutes >= book.readingMinutes) return `${head} ${title}${particle} 정독할 수 있는 시간이에요`
  return `${head} ${title}의 약 ${Math.floor((week.minutes / book.readingMinutes) * 100)}%를 읽을 수 있어요`
}

export function pledgeError() {
  return new ApiError(409, 'PLEDGE_ALREADY_SET', '오늘 약속은 이미 정했어요. 내일 다시 정할 수 있어요.')
}

// 약속을 정하면 묶음 화면이 바로 알 수 있도록 알린다.
const pledgeListeners = new Set()
export function announcePledge(count) { pledgeListeners.forEach((listener) => listener(count)) }
export function subscribePledge(listener) {
  pledgeListeners.add(listener)
  return () => pledgeListeners.delete(listener)
}
