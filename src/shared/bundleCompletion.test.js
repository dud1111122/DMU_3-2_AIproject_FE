import test from 'node:test'
import assert from 'node:assert/strict'
import { createBundleCompletionLedger } from './bundleCompletion.js'
import { guestAddBundle, guestSummary } from './usage.js'

const bundle = { day: '2026-11-17', viewer: 'guest', scope: 'all|guest', start: 0, postIds: ['1', '2', '3'] }

test('navigation back reuses a completed bundle without another aggregate or API write', async () => {
  const once = createBundleCompletionLedger()
  let writes = 0
  const complete = async () => { writes += 1; return { stats: { today: { count: 3 } } } }
  await once(bundle, complete).promise
  const revisited = once({ ...bundle, postIds: [...bundle.postIds] }, complete)
  assert.equal(revisited.reused, true)
  assert.equal((await revisited.promise).stats.today.count, 3)
  assert.equal(writes, 1)
})

test('StrictMode and concurrent readers claim once before a pending request runs', async () => {
  const once = createBundleCompletionLedger()
  let writes = 0
  let resolve
  const response = new Promise((done) => { resolve = done })
  const complete = () => { writes += 1; return response }
  const readers = Array.from({ length: 6 }, () => once(bundle, complete))
  assert.equal(readers.filter((reader) => !reader.reused).length, 1)
  assert.ok(readers.every((reader) => reader.promise === readers[0].promise))
  await Promise.resolve()
  assert.equal(writes, 1)
  resolve({ stats: { today: { count: 3 } } })
  await Promise.all(readers.map((reader) => reader.promise))
})

test('explicit next bundles and newly loaded content can each be counted', async () => {
  const once = createBundleCompletionLedger()
  let count = 0
  const complete = () => { count += 3 }
  await once(bundle, complete).promise
  await once({ ...bundle, start: 3 }, complete).promise
  await once({ ...bundle, postIds: ['4', '5', '6'] }, complete).promise
  await once(bundle, complete).promise
  assert.equal(count, 9)
})

test('guest, different member accounts, filters and KST dates have independent completions', async () => {
  const once = createBundleCompletionLedger()
  let writes = 0
  const complete = () => { writes += 1 }
  for (const entry of [bundle, { ...bundle, viewer: 'member:1' }, { ...bundle, viewer: 'member:2' },
    { ...bundle, scope: 'following|guest' }, bundle, { ...bundle, day: '2026-11-18' }]) {
    await once(entry, complete).promise
  }
  assert.equal(writes, 5)
})

test('an ambiguous request failure remains a failure without a duplicate retry', async () => {
  const once = createBundleCompletionLedger()
  let writes = 0
  const failure = new Error('Connection lost after server accepted request')
  const complete = () => { writes += 1; throw failure }
  await assert.rejects(once(bundle, complete).promise, (error) => error === failure)
  await assert.rejects(once(bundle, complete).promise, (error) => error === failure)
  assert.equal(writes, 1)
})

test('guest navigation updates only daily aggregate storage, with no post IDs persisted', async () => {
  const stored = new Map()
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: { getItem: (key) => stored.get(key) ?? null, setItem: (key, value) => stored.set(key, value) },
  })
  try {
    const once = createBundleCompletionLedger()
    const complete = () => guestAddBundle(3, 120, bundle.day)
    await once(bundle, complete).promise
    await once(bundle, complete).promise
    assert.equal(guestSummary(bundle.day).today.count, 3)
    assert.deepEqual(JSON.parse(stored.get('de-shorts:usage:days')), {
      '2026-11-17': { count: 3, seconds: 120, stops: 0, pledge: null, tipShown: false },
    })
    assert.equal(stored.size, 1)
  } finally {
    if (original === undefined) delete globalThis.localStorage
    else Object.defineProperty(globalThis, 'localStorage', original)
  }
})
