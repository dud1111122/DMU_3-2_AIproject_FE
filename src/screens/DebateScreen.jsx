import { useState } from 'react'
import Avatar from '../components/Avatar.jsx'
import AiBadge from '../shared/AiBadge.jsx'
import { api } from '../api/index.js'
import { errorMessage, isStatus } from '../api/errors.js'
import { AI_DISCLOSURE, debateStatusLabel } from '../shared/format.js'
import { useDebate, useDebates, usePaged } from '../shared/hooks.js'
import { useStore } from '../shared/store.jsx'
import { AiOffNotice, BackHeader, Empty, ErrorState, LoadMore, Loading, MemberGate } from './ui.jsx'

const MAX_TOPIC = 200
const MAX_MESSAGE = 300

export function DebateHome({ initialPersonas = [], onBack, onOpenDebate }) {
  const { isMember, topics, aiConfigured, requireMember } = useStore()
  const { myDebates, loadingMine, create, creating, error, clearError } = useDebates()
  const personas = usePaged((cursor) => isMember ? api.follows({ cursor }) : Promise.resolve({ items: [], nextCursor: null }), [isMember])
  const [picked, setPicked] = useState(initialPersonas)
  const [topic, setTopic] = useState('')

  const toggle = (persona) => {
    clearError()
    setPicked((current) => current.some((item) => item.id === persona.id)
      ? current.filter((item) => item.id !== persona.id)
      : current.length < 2 ? [...current, persona] : [current[1], persona])
  }
  const submit = async () => {
    if (!requireMember('토론은 로그인 후 만들 수 있어요.')) return
    const debate = await create(picked.map((persona) => persona.id), topic.trim())
    if (debate) onOpenDebate(debate)
  }
  const aiOff = !aiConfigured || isStatus(error, 503)

  return <div className="pb-8">
    {onBack ? <BackHeader title="페르소나 토론" onBack={onBack} /> : <header className="sticky top-0 z-20 bg-white px-4 pb-2 pt-3"><strong className="text-[18px]">페르소나 토론</strong></header>}
    <p className="px-4 pt-3 text-[11px] leading-5 text-[#737373]">페르소나 두 명과 논제를 고르면 대담이 시작돼요. 발언은 다음 발언이나 자동 진행으로 하나씩 만들고, 마치면 쟁점 요약을 만들어요.</p>

    <h2 className="px-4 pb-2 pt-4 text-[12px] font-semibold text-[#737373]">페르소나 {picked.length}/2 선택</h2>
    {personas.loading && !personas.items.length ? <Loading className="py-6" /> : <div className="grid grid-cols-3 gap-2 px-4">
      {personas.items.map((persona) => {
        const on = picked.some((item) => item.id === persona.id)
        return <button key={persona.id} onClick={() => toggle(persona)} aria-pressed={on} className={`flex flex-col items-center gap-1.5 rounded-xl border p-2.5 ${on ? 'border-[#0095f6] bg-[#f0f8ff]' : 'border-[#efefef]'}`}>
          <Avatar person={persona} size="md" />
          <span className="w-full truncate text-center text-[12px] font-semibold">{persona.displayName}</span>
        </button>
      })}
    </div>}
    {!isMember ? <MemberGate text="팔로우한 페르소나로 토론을 만들려면 로그인해 주세요." /> : !personas.loading && !personas.items.length && <Empty text="팔로우한 페르소나가 없어요. 페르소나를 팔로우하면 여기서 토론을 만들 수 있어요." />}
    <LoadMore list={personas} label="페르소나 더 보기" />

    <h2 className="px-4 pb-2 pt-5 text-[12px] font-semibold text-[#737373]">논제</h2>
    <div className="px-4">
      <input value={topic} maxLength={MAX_TOPIC} onChange={(event) => { setTopic(event.target.value); clearError() }} placeholder="예: 도덕은 어디서 오는가" aria-label="논제" className="h-10 w-full rounded-lg bg-[#efefef] px-3 text-[13px] outline-none" />
      <p className="mt-1 text-right text-[10px] text-[#8e8e8e]">{topic.length}/{MAX_TOPIC}</p>
      <div className="mt-1 flex flex-wrap gap-2">{topics.map((item) => <button key={item.id} onClick={() => { setTopic(item.name); clearError() }} className="h-7 rounded-full border border-[#dbdbdb] px-3 text-[11px]">{item.name}</button>)}</div>
    </div>

    <div className="px-4 pt-5">
      <button disabled={isMember && (picked.length !== 2 || !topic.trim() || creating || aiOff)} onClick={submit} className="h-11 w-full rounded-lg bg-[#0095f6] text-[14px] font-semibold text-white disabled:opacity-40">{creating ? '대담을 만드는 중…' : '토론 만들기'}</button>
      {aiOff && <AiOffNotice className="mt-3" />}
      {error && !aiOff && <p role="alert" className="mt-3 rounded-lg bg-[#fef2f2] px-3 py-2 text-[11px] leading-5 text-[#b42318]">{errorMessage(error)}</p>}
      {!isMember && <p className="mt-3 text-center text-[11px] leading-5 text-[#737373]">토론은 로그인 후 만들고 볼 수 있어요.</p>}
    </div>

    <h2 className="px-4 pb-1 pt-6 text-[15px] font-bold">내 토론</h2>
    {!isMember ? <MemberGate text="내 토론은 로그인 후 볼 수 있어요." /> : loadingMine && !myDebates.length ? <Loading className="py-6" /> : myDebates.length
      ? myDebates.map((debate) => <button key={debate.id} onClick={() => onOpenDebate(debate)} className="flex w-full items-center gap-3 px-4 py-3 text-left">
        <span className="flex -space-x-2">{debate.personas.map((persona) => <Avatar key={persona.id} person={persona} size="sm" className="border-2 border-white" />)}</span>
        <span className="min-w-0 flex-1"><strong className="block truncate text-[13px]">{debate.topic}</strong><span className="block truncate text-[11px] text-[#737373]">{debate.personas.map((persona) => persona.displayName).join(' × ')} · 발언 {debate.turnCount}개 · {debateStatusLabel(debate.status)}</span></span>
      </button>)
      : <p className="px-4 py-4 text-[12px] text-[#737373]">아직 만든 토론이 없어요.</p>}
  </div>
}

// 대담 화면: 발언 스트림, 자동 진행, 메시지, 마침을 훅 하나로 다룬다.
export function DebateView({ debateId, onBack }) {
  const { isMember } = useStore()
  const live = useDebate(debateId)
  const { debate, loading, loadError, draft, busy, failure, autoPlaying, canAct, canEnd } = live
  const [message, setMessage] = useState('')

  if (!isMember) return <div className="pb-8"><BackHeader title="페르소나 토론" onBack={onBack} /><MemberGate text="대담은 로그인 후 볼 수 있어요." /></div>
  if (!debate) return <div className="pb-8"><BackHeader title="페르소나 토론" onBack={onBack} />{loading ? <Loading className="py-10" /> : <ErrorState error={loadError} onRetry={live.reload} />}</div>

  const personas = debate.personas
  const nameOf = (id) => personas.find((persona) => persona.id === id)?.displayName ?? '인물'
  const ended = debate.status === 'ENDED'
  const ending = busy === 'end'
  const composerDisabled = !canAct || busy !== null
  const submit = async (event) => {
    event.preventDefault()
    if (await live.sendMessage(message)) setMessage('')
  }

  return <div className="pb-8">
    <BackHeader title={debate.topic} sub={`${personas.map((persona) => persona.displayName).join(' × ')} · ${debateStatusLabel(debate.status)} · 발언 ${debate.turnCount}/${debate.turnLimit}`} onBack={onBack} />
    <p className="mx-4 mt-3 rounded-lg bg-[#f6f6f6] px-3 py-2 text-[11px] leading-5 text-[#737373]">{personas[0]?.aiDisclosure || AI_DISCLOSURE} AI가 두 페르소나의 관점을 바탕으로 재구성한 가상 토론이에요. 실제 두 인물이 나눈 대화가 아니며 직접 인용이 아니에요.</p>

    <div className="mt-2 flex flex-col gap-3 px-4 py-3">
      {debate.turns.map((turn) => {
        const user = turn.speakerType === 'USER'
        const speaker = personas.find((persona) => persona.id === turn.personaId)
        const bubble = <div className={`flex min-w-0 flex-col ${user ? 'items-end' : 'items-start'}`}>
          <span className="mb-1 flex items-center gap-1.5 text-[10px] text-[#737373]">{user ? <strong>나</strong> : <><strong>{nameOf(turn.personaId)}</strong><AiBadge /><span>AI 재구성</span></>}</span>
          <p className={`whitespace-pre-line rounded-[18px] px-3.5 py-2.5 text-[13px] leading-[1.55] ${user ? 'bg-[#3797f0] text-white' : 'bg-[#efefef]'}`}>{turn.body}</p>
        </div>
        return user
          ? <div key={turn.order} className="flex max-w-[90%] flex-col items-end self-end">{bubble}</div>
          : <div key={turn.order} className="flex max-w-[90%] items-start gap-2 self-start"><Avatar person={speaker} size="sm" className="mt-4" />{bubble}</div>
      })}
      {draft && <div role="status" className="flex max-w-[90%] flex-col items-start self-start">
        <span className="mb-1 text-[10px] text-[#737373]">발언을 만드는 중…</span>
        <p className="whitespace-pre-line rounded-[18px] bg-[#efefef] px-3.5 py-2.5 text-[13px] leading-[1.55]">{draft.text || '…'}</p>
      </div>}
    </div>

    {failure && <div role="alert" className="mx-4 rounded-lg bg-[#fef2f2] px-3 py-2 text-[11px] leading-5 text-[#b42318]">
      {failure.kind === 'stopped' ? '발언 읽기를 멈췄어요. 만드는 중인 발언은 서버에 저장돼요.' : errorMessage(failure.error)}
      {failure.kind === 'end' && <button onClick={() => live.endDebate()} className="ml-2 font-semibold underline underline-offset-2">요약 다시 만들기</button>}
      {(failure.kind === 'stopped' || failure.kind === 'load') && <button onClick={live.refresh} className="ml-2 font-semibold underline underline-offset-2">다시 불러오기</button>}
    </div>}

    {ended ? <p className="mx-4 mt-4 text-center text-[12px] text-[#737373]">종료된 대담이에요.</p> : <div className="mx-4 mt-4 space-y-2">
      {debate.turnCount >= debate.turnLimit && <p className="text-[11px] text-[#737373]">발언 한도({debate.turnLimit}개)에 도달했어요. {ending ? '요약을 만들고 있어요.' : '대담을 마치면 쟁점 요약을 볼 수 있어요.'}</p>}
      <div className="flex gap-2">
        {autoPlaying
          ? <button onClick={live.pauseAuto} className="h-9 flex-1 rounded-lg bg-[#efefef] text-[12px] font-semibold">자동 진행 멈추기</button>
          : <>
            <button onClick={() => live.nextTurn()} disabled={!canAct || busy !== null} className="h-9 flex-1 rounded-lg bg-[#0095f6] text-[12px] font-semibold text-white disabled:opacity-40">다음 발언</button>
            <button onClick={live.startAuto} disabled={!canAct || busy !== null} className="h-9 flex-1 rounded-lg bg-[#efefef] text-[12px] font-semibold disabled:opacity-40">자동 진행</button>
          </>}
        {busy === 'turn' && <button onClick={live.stopReading} className="h-9 rounded-lg bg-[#efefef] px-3 text-[12px] font-semibold">멈추기</button>}
      </div>
      <form onSubmit={submit} className="flex flex-col gap-1">
        <textarea value={message} onChange={(event) => { setMessage(event.target.value.slice(0, MAX_MESSAGE)); if (autoPlaying) live.pauseAuto() }} disabled={composerDisabled} rows={2} aria-label="메시지" placeholder="대화에 내 생각을 보내 보세요" className="w-full resize-none rounded-lg bg-[#efefef] px-3 py-2 text-[13px] outline-none disabled:opacity-50" />
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[#8e8e8e]">{message.length}/{MAX_MESSAGE}</span>
          <button type="submit" disabled={composerDisabled || !message.trim()} className="h-8 rounded-lg bg-[#0095f6] px-4 text-[12px] font-semibold text-white disabled:opacity-40">{busy === 'message' ? '보내는 중…' : '보내기'}</button>
        </div>
      </form>
      <button onClick={() => live.endDebate()} disabled={!canEnd} className="h-9 w-full rounded-lg border border-[#dbdbdb] text-[12px] font-semibold disabled:opacity-40">{ending ? '요약을 만드는 중…' : '대담 마치기'}</button>
      {debate.turnCount === 0 && <p className="text-center text-[11px] text-[#737373]">발언이 하나 이상 있어야 대담을 마칠 수 있어요.</p>}
    </div>}

    {debate.summary && <section className="mx-4 mt-4 rounded-xl border border-[#efefef] p-4"><h2 className="text-[12px] font-semibold">쟁점 요약</h2><p className="mt-2 whitespace-pre-line text-[12px] leading-5">{debate.summary}</p></section>}
  </div>
}
