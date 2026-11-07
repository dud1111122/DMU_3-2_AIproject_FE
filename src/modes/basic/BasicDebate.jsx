import { useEffect, useRef, useState } from 'react'
import { api } from '../../api/index.js'
import { errorMessage, isStatus } from '../../api/errors.js'
import { useDebate, useDebates, usePaged } from '../../shared/hooks.js'
import { useStore } from '../../shared/store.jsx'
import { AI_DISCLOSURE, debateStatusLabel, formatDateTime } from '../../shared/format.js'
import { Empty, ErrorState, GhostButton, Monogram, Notice, PrimaryButton, SectionTitle, Skeleton, TopBar, useNav } from './ui.jsx'
import AiBadge from '../../shared/AiBadge.jsx'

const TOPIC_MAX = 200
const MESSAGE_MAX = 300

export function BasicDebates({ preset }) {
  const nav = useNav()
  const { topics, isMember, promptLogin, aiConfigured } = useStore()
  const { myDebates, loadingMine, create, creating, error, clearError } = useDebates()
  const personas = usePaged((cursor) => isMember ? api.follows({ cursor }) : Promise.resolve({ items: [], nextCursor: null }), [isMember])
  const [picked, setPicked] = useState([])
  const [topic, setTopic] = useState('')

  // 인물 프로필의 “토론 시작”으로 들어오면 그 인물을 첫 번째 자리에 넣는다.
  useEffect(() => { if (preset?.personaId) setPicked([preset.personaId]) }, [preset?.at, preset?.personaId])

  const togglePick = (id) => {
    clearError()
    setPicked((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length >= 2 ? [current[1], id] : [...current, id])
  }
  const names = picked.map((id) => personas.items.find((persona) => persona.id === id)?.displayName ?? '')
  const trimmed = topic.trim()
  const topicOk = trimmed.length >= 1 && trimmed.length <= TOPIC_MAX
  const canCreate = picked.length === 2 && topicOk && !creating && aiConfigured

  const submit = async (event) => {
    event.preventDefault()
    if (!isMember) { promptLogin('토론은 로그인 후 만들 수 있어요.'); return }
    if (!canCreate) return
    const debate = await create(picked, trimmed)
    if (debate) {
      setPicked([])
      setTopic('')
      nav.openDebate(debate)
    }
  }

  return <div className="pb-8">
    <TopBar large title="토론" />
    <div className="px-5 pt-4">
      {!isMember && <Notice tone="warn">토론은 로그인 후 만들고 볼 수 있어요. <button onClick={() => promptLogin('토론은 로그인 후 만들 수 있어요.')} className="font-semibold underline underline-offset-2">로그인</button></Notice>}
      {!aiConfigured && <Notice tone="warn" className="mt-2">AI 기능이 아직 설정되지 않아 새 토론을 만들 수 없어요. 만들어 둔 토론은 볼 수 있어요.</Notice>}

      <form onSubmit={submit} className="mt-5" aria-labelledby="debate-make">
        <SectionTitle id="debate-make">새 토론 만들기</SectionTitle>
        <p className="mt-2 text-[11px] leading-5 text-[#6f6b63]">인물 두 명과 논제를 고르면 대담이 시작돼요. 발언은 다음 발언이나 자동 진행으로 하나씩 만들어요.</p>

        <fieldset className="mt-3">
          <legend className="text-[12px] font-semibold">인물 2명 <span className="font-normal text-[#6f6b63]">({picked.length}/2)</span></legend>
          <div className="mt-2 flex gap-2">
            {[0, 1].map((slot) => <div key={slot} className="flex h-12 min-w-0 flex-1 items-center gap-2 rounded-lg border border-dashed border-[#cfc9bd] bg-white px-2.5 text-[12px]">
              {names[slot] ? <><Monogram name={names[slot]} size="h-7 w-7 text-[11px]" /><span className="min-w-0 flex-1 truncate font-semibold">{names[slot]}</span></> : <span className="text-[#a39e93]">{slot + 1}번 인물</span>}
            </div>)}
          </div>
          <div className="mt-2.5 space-y-0">
            {personas.loading && !personas.items.length && <Skeleton rows={2} />}
            {personas.error && !personas.items.length && <ErrorState compact error={personas.error} onRetry={personas.reload} />}
            {!isMember && <p className="py-3 text-[12px] leading-5 text-[#6f6b63]">팔로우한 인물로 토론을 만들려면 로그인해 주세요.</p>}
            {isMember && !personas.loading && !personas.error && !personas.items.length && <p className="py-3 text-[12px] leading-5 text-[#6f6b63]">팔로우한 인물이 없어요. 인물을 팔로우하면 여기서 토론을 만들 수 있어요.</p>}
            {personas.items.map((persona) => {
              const on = picked.includes(persona.id)
              return <label key={persona.id} className={`flex min-h-12 cursor-pointer items-center gap-3 border-b border-[#e7e3da] py-2 ${on ? 'font-semibold' : ''}`}>
                <input type="checkbox" checked={on} onChange={() => togglePick(persona.id)} className="h-4 w-4 accent-[#1c1b19]" />
                <span className="min-w-0 flex-1 text-[13px]">{persona.displayName} <AiBadge className="ml-1 align-middle text-[#6f6b63]" /></span>
              </label>
            })}
            {personas.hasMore && <GhostButton onClick={personas.loadMore} className="mt-2 h-9 w-full text-[12px]">인물 더 보기</GhostButton>}
          </div>
        </fieldset>

        <label className="mt-5 block text-[12px] font-semibold">논제
          <input value={topic} onChange={(event) => { setTopic(event.target.value.slice(0, TOPIC_MAX)); clearError() }} maxLength={TOPIC_MAX} placeholder="예: 좋은 삶에 돈이 필요한가" className="mt-1 h-11 w-full rounded-lg border border-[#d9d4c9] bg-white px-3 text-[14px] font-normal outline-none placeholder:text-[#a39e93]" />
        </label>
        <div className="mt-2 flex flex-wrap gap-1.5" aria-label="주제 제안">{topics.map((item) => <button type="button" key={item.id} onClick={() => setTopic(`${item.name}의 기준은 무엇인가`)} className="h-7 rounded-full bg-[#efece4] px-2.5 text-[11px] text-[#3d3a35]">{item.name}</button>)}</div>
        <p className="mt-1 text-right text-[10px] text-[#6f6b63]">{trimmed.length}/{TOPIC_MAX}</p>

        {error && <CreateError error={error} onLogin={() => promptLogin('로그인 후 다시 시도할 수 있어요.')} />}
        <PrimaryButton type="submit" disabled={isMember && !canCreate} className="mt-4 h-11 w-full text-[14px]">{creating ? '대담을 만드는 중…' : '토론 만들기'}</PrimaryButton>
      </form>

      {isMember && <section className="mt-9" aria-labelledby="debate-mine">
        <SectionTitle id="debate-mine">내 토론</SectionTitle>
        {loadingMine && !myDebates.length && <Skeleton rows={2} />}
        {!loadingMine && !myDebates.length && <Empty title="아직 만든 토론이 없어요" text="위에서 인물 두 명과 논제를 고르면 여기에 모여요." />}
        {myDebates.map((debate) => <button key={debate.id} onClick={() => nav.openDebate(debate)} className="flex w-full items-center gap-3 border-b border-[#e7e3da] py-3.5 text-left">
          <span className="min-w-0 flex-1">
            <strong className="block truncate text-[14px]">{debate.topic}</strong>
            <span className="mt-0.5 block truncate text-[11px] text-[#6f6b63]">{debate.personas.map((persona) => persona.displayName).join(' · ')} · 발언 {debate.turnCount}개 · {formatDateTime(debate.createdAt)}</span>
          </span>
          <span className={`shrink-0 text-[11px] font-semibold ${debate.status === 'ENDED' ? 'text-[#6f6b63]' : 'text-[#2f5d50]'}`}>{debateStatusLabel(debate.status)}</span>
        </button>)}
      </section>}
      {!isMember && <p className="mt-8 text-center text-[11px] text-[#6f6b63]">토론은 로그인 후 만들고 볼 수 있어요.</p>}
    </div>
  </div>
}

function CreateError({ error, onLogin }) {
  if (isStatus(error, 401)) return <div role="alert" className="mt-3"><Notice tone="error">로그인이 필요해요. <button onClick={onLogin} className="font-semibold underline underline-offset-2">로그인</button></Notice></div>
  return <div role="alert" className="mt-3"><Notice tone={isStatus(error, 503) ? 'warn' : 'error'}>{errorMessage(error)}</Notice></div>
}

// 대담 화면: 발언은 한 번에 하나씩 스트림으로 붙고, 자동 진행·메시지·마침은 같은 잠금을 거친다.
export function BasicDebateView({ debateId, active = true }) {
  const nav = useNav()
  const { isMember, promptLogin } = useStore()
  const live = useDebate(debateId)
  const { debate, loading, loadError, draft, busy, failure, autoPlaying, canAct, canEnd } = live
  const [message, setMessage] = useState('')
  const endRef = useRef(null)

  // 다른 화면으로 가려지면 자동 진행을 멈춘다(현재 발언은 끝까지 받는다).
  useEffect(() => { if (!active) live.pauseAuto() }, [active]) // eslint-disable-line react-hooks/exhaustive-deps
  // 새 발언이나 스트림 글자가 오면 아래로 따라간다.
  useEffect(() => { endRef.current?.scrollIntoView?.({ block: 'end' }) }, [debate?.turns?.length, draft?.text])

  const persona = (id) => debate?.personas.find((item) => item.id === id)
  const ended = debate?.status === 'ENDED'
  const limitReached = Boolean(debate) && debate.turnCount >= debate.turnLimit
  const ending = busy === 'end'
  const composerDisabled = !canAct || busy !== null

  const submitMessage = async (event) => {
    event.preventDefault()
    if (await live.sendMessage(message)) setMessage('')
  }

  return <div className="pb-8">
    <TopBar onBack={nav.back} title="토론" />
    <div className="px-5 pt-4">
      {!isMember && <div className="space-y-3">
        <Notice tone="warn">대담은 로그인 후 볼 수 있어요.</Notice>
        <PrimaryButton onClick={() => promptLogin('대담은 로그인 후 볼 수 있어요.')} className="w-full">로그인</PrimaryButton>
      </div>}

      {isMember && loading && !debate && <Skeleton rows={2} />}
      {isMember && !debate && !loading && loadError && <ErrorState error={loadError} onRetry={live.reload} />}

      {isMember && debate && <>
        <p className="text-[11px] font-semibold text-[#2f5d50]">논제 · {debateStatusLabel(debate.status)}</p>
        <h1 className="font-basic mt-1 text-[22px] font-bold leading-[1.35] text-balance">{debate.topic}</h1>
        <div className="mt-3 flex flex-wrap gap-1.5">{debate.personas.map((item) => <span key={item.id} className="flex items-center gap-1.5 rounded-full border border-[#d9d4c9] bg-white py-1 pl-1 pr-2.5 text-[12px] font-semibold"><Monogram name={item.displayName} src={item.avatarUrl} size="h-5 w-5 text-[9px]" />{item.displayName}<AiBadge className="text-[#6f6b63]" /></span>)}</div>
        <p className="mt-2 text-[11px] text-[#6f6b63]" aria-live="polite">발언 {debate.turnCount}/{debate.turnLimit}개</p>

        <div className="mt-4 space-y-2">
          <Notice tone="accent">{debate.personas[0]?.aiDisclosure || AI_DISCLOSURE} AI가 재구성한 가상의 대화예요. 실제 발언이 아니에요.</Notice>
        </div>

        <ol className="mt-5 space-y-4" aria-label="대화">
          {debate.turns.map((turn) => <TurnBubble key={turn.order} turn={turn} persona={persona(turn.personaId)} />)}
          {draft && <DraftBubble text={draft.text} />}
        </ol>
        {!debate.turns.length && !draft && <p className="py-8 text-center text-[12px] text-[#6f6b63]">아직 발언이 없어요. 다음 발언을 만들거나 메시지를 보내 시작해 보세요.</p>}
        <div ref={endRef} />

        {failure && <FailureNotice failure={failure} onDismiss={live.clearFailure} onRefresh={live.refresh} onEnd={live.endDebate} onLogin={() => promptLogin('로그인 후 다시 시도할 수 있어요.')} />}

        {ended ? <Notice tone="soft" className="mt-6">종료된 대담이에요. 더 이상 발언을 만들 수 없어요.</Notice> : <div className="mt-6 space-y-3">
          {limitReached && <Notice tone="accent">발언 한도({debate.turnLimit}개)에 도달했어요. {ending ? '쟁점 요약을 만들고 있어요.' : '대담을 마치면 쟁점 요약을 볼 수 있어요.'}</Notice>}
          <div className="flex gap-2">
            {autoPlaying
              ? <GhostButton onClick={live.pauseAuto} className="h-10 flex-1">자동 진행 멈추기</GhostButton>
              : <>
                <GhostButton onClick={() => live.nextTurn()} disabled={!canAct || busy !== null} className="h-10 flex-1">다음 발언</GhostButton>
                <GhostButton onClick={live.startAuto} disabled={!canAct || busy !== null} className="h-10 flex-1">자동 진행</GhostButton>
              </>}
            {busy === 'turn' && <GhostButton onClick={live.stopReading} className="h-10 px-3">읽기 멈추기</GhostButton>}
          </div>
          <form onSubmit={submitMessage} aria-label="메시지 보내기" className="space-y-1.5">
            <textarea value={message} onChange={(event) => { setMessage(event.target.value.slice(0, MESSAGE_MAX)); if (autoPlaying) live.pauseAuto() }} disabled={composerDisabled} rows={2} placeholder="대담에 내 생각을 보내 보세요" aria-label="메시지" className="w-full resize-none rounded-lg border border-[#d9d4c9] bg-white px-3 py-2 text-[14px] outline-none placeholder:text-[#a39e93] disabled:opacity-50" />
            <div className="flex items-center justify-between">
              <span className={`text-[10px] ${message.length >= MESSAGE_MAX ? 'text-[#9b2c1f]' : 'text-[#6f6b63]'}`} aria-live="polite">{message.length}/{MESSAGE_MAX}</span>
              <PrimaryButton type="submit" disabled={composerDisabled || !message.trim()} className="h-9 px-4 text-[12px]">{busy === 'message' ? '보내는 중…' : '보내기'}</PrimaryButton>
            </div>
          </form>
          <GhostButton onClick={() => live.endDebate()} disabled={!canEnd} className="h-10 w-full">{ending ? '요약을 만드는 중…' : '대담 마치기'}</GhostButton>
          {debate.turnCount === 0 && <p className="text-center text-[11px] text-[#6f6b63]">발언이 하나 이상 있어야 대담을 마칠 수 있어요.</p>}
        </div>}

        {debate.summary && <section className="mt-6 rounded-xl bg-[#f1eee7] p-4" aria-labelledby="debate-summary">
          <h2 id="debate-summary" className="text-[12px] font-semibold">쟁점 요약</h2>
          <p className="mt-1.5 whitespace-pre-line text-[13px] leading-[1.7] text-[#3d3a35]">{debate.summary}</p>
        </section>}

        <div className="mt-8 flex gap-2 border-t border-[#e7e3da] pt-4">
          {debate.personas.map((item) => <GhostButton key={item.id} onClick={() => nav.openPersona(item.id)} className="h-9 flex-1 text-[12px]">{item.displayName} 프로필</GhostButton>)}
        </div>
      </>}
    </div>
  </div>
}

function TurnBubble({ turn, persona }) {
  if (turn.speakerType === 'USER') return <li className="flex flex-col items-end">
    <span className="text-[11px] text-[#6f6b63]">나</span>
    <p className="mt-1 max-w-[85%] whitespace-pre-line rounded-2xl rounded-br-sm bg-[#1c1b19] px-3.5 py-2.5 text-[14px] leading-[1.6] text-white">{turn.body}</p>
  </li>
  return <li className="flex items-start gap-2.5">
    <Monogram name={persona?.displayName ?? '인'} src={persona?.avatarUrl} size="h-8 w-8 text-[12px]" />
    <div className="min-w-0 max-w-[85%]">
      <span className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">{persona?.displayName ?? '인물'}<AiBadge className="text-[#6f6b63]" /><span className="font-normal text-[#6f6b63]">AI 재구성</span></span>
      <p className="mt-1 whitespace-pre-line rounded-2xl rounded-tl-sm border border-[#e7e3da] bg-white px-3.5 py-2.5 text-[14px] leading-[1.7] text-[#2f2d29]">{turn.body}</p>
    </div>
  </li>
}

// 스트림 중인 발언. 글자가 오기 전에는 말줄임 점 세 개를 보여 준다. turn 이벤트가 오면 목록의 발언으로 바뀐다.
function DraftBubble({ text }) {
  return <li className="flex items-start gap-2.5" role="status" aria-live="polite">
    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[#e2ddd2] bg-[#f1eee7] text-[12px] text-[#6f6b63]" aria-hidden="true">…</span>
    <div className="min-w-0 max-w-[85%]">
      <span className="text-[11px] text-[#6f6b63]">AI가 발언을 만드는 중</span>
      <p className="mt-1 whitespace-pre-line rounded-2xl rounded-tl-sm border border-dashed border-[#d9d4c9] bg-white px-3.5 py-2.5 text-[14px] leading-[1.7] text-[#2f2d29]">
        {text || <span className="inline-flex gap-1 py-1" aria-hidden="true">{[0, 1, 2].map((dot) => <span key={dot} className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#a39e93]" style={{ animationDelay: `${dot * 150}ms` }} />)}</span>}
        {text && <span className="ml-0.5 animate-pulse text-[#a39e93]" aria-hidden="true">▍</span>}
      </p>
    </div>
  </li>
}

// 발언·메시지·마침 실패를 한곳에서 안내한다. 요약 실패는 다시 만들기 버튼을 준다.
function FailureNotice({ failure, onDismiss, onRefresh, onEnd, onLogin }) {
  const { kind, error } = failure
  const dismiss = <button onClick={onDismiss} className="ml-2 font-semibold underline underline-offset-2">닫기</button>
  if (kind === 'stopped') return <div role="status" className="mt-4"><Notice tone="soft">발언 읽기를 멈췄어요. 만드는 중인 발언은 서버에 저장되니 잠시 뒤 다시 불러와 주세요. <button onClick={onRefresh} className="font-semibold underline underline-offset-2">다시 불러오기</button></Notice></div>
  if (isStatus(error, 401)) return <div role="alert" className="mt-4"><Notice tone="error">로그인이 필요해요. <button onClick={onLogin} className="font-semibold underline underline-offset-2">로그인</button></Notice></div>
  if (kind === 'end') return <div role="alert" className="mt-4"><Notice tone="error">{errorMessage(error)} <button onClick={onEnd} className="font-semibold underline underline-offset-2">요약 다시 만들기</button></Notice></div>
  return <div role="alert" className="mt-4"><Notice tone="error">{errorMessage(error)}{kind === 'load' && <button onClick={onRefresh} className="ml-2 font-semibold underline underline-offset-2">다시 불러오기</button>}{kind !== 'load' && dismiss}</Notice></div>
}
