import { useEffect, useState } from 'react'
import { api } from '../../api/index.js'
import { errorMessage } from '../../api/errors.js'
import { useApi, useDebate, useDebates, usePaged, useReviewItems } from '../../shared/hooks.js'
import { useStore } from '../../shared/store.jsx'
import { AI_DISCLOSURE, debateStatusLabel, formatDate, formatDateTime, reviewReasonLabels } from '../../shared/format.js'
import { AiBadge, Avatar, Chip, Empty, ErrorState, Loading, MemberOnly, PillButton, Screen, TileGrid } from './ui.jsx'

const nothing = () => Promise.resolve({ items: [], nextCursor: null })

// 검색: 쇼츠·채널·주제 탭. 검색어가 없으면 추천 채널과 주제를 보여 준다.
export function SearchScreen({ onBack, onOpenChannel, onOpenPost, onTopic }) {
  const { topics } = useStore()
  const [input, setInput] = useState('')
  const [tab, setTab] = useState('post')
  const [query, setQuery] = useState('')
  useEffect(() => { const timer = setTimeout(() => setQuery(input.trim()), 250); return () => clearTimeout(timer) }, [input])
  const results = usePaged((cursor) => query ? api.search(query, tab, { cursor }) : nothing(), [query, tab])
  const people = useApi(() => api.personas(), [])
  const tabs = [['post', '쇼츠'], ['persona', '채널'], ['topic', '주제']]

  const header = <label className="flex h-10 min-w-0 flex-1 items-center rounded-full bg-[#272727] px-4">
    <span className="sr-only">디쇼츠 검색</span>
    <input autoFocus value={input} onChange={(event) => setInput(event.target.value)} placeholder="인물, 주제, 쇼츠 검색" className="w-full bg-transparent text-[14px] outline-none placeholder:text-[#aaa]" />
    {input && <button onClick={() => setInput('')} aria-label="검색어 지우기" className="shrink-0 text-[#aaa]">✕</button>}
  </label>

  return <Screen title={null} onBack={onBack} headerExtra={<div className="flex min-w-0 flex-1 pl-1">{header}</div>}>
    {!query && <div className="pb-10">
      <section className="pt-3">
        <h2 className="px-4 pb-1 text-[14px] font-bold">주제</h2>
        <div className="flex flex-wrap gap-2 px-4 pt-2">{topics.map((topic) => <Chip key={topic.id} onClick={() => onTopic(topic)}>{topic.name}</Chip>)}</div>
      </section>
      <section className="pt-5">
        <h2 className="px-4 pb-1 text-[14px] font-bold">추천 채널</h2>
        {people.loading && <Loading className="py-6" />}
        {people.error && <ErrorState error={people.error} onRetry={people.reload} className="py-6" />}
        {(people.data?.items || []).map((persona) => <PersonaRow key={persona.id} persona={persona} onOpen={onOpenChannel} />)}
      </section>
    </div>}

    {query && <div className="pb-10">
      <div role="tablist" aria-label="검색 종류" className="flex gap-2 px-4 pt-3">{tabs.map(([id, label]) => <Chip key={id} active={tab === id} onClick={() => setTab(id)} role="tab">{label}</Chip>)}</div>
      {results.loading && !results.items.length && <Loading className="py-12" />}
      {results.error && <ErrorState error={results.error} onRetry={results.reload} className="py-12" />}
      {!results.loading && !results.error && !results.items.length && <Empty title={`‘${query}’ 검색 결과가 없습니다`} body="검색어를 바꾸거나 다른 탭을 확인해 보세요." className="py-14" />}
      {results.items.length > 0 && tab === 'post' && <div className="px-1 pt-3"><TileGrid posts={results.items} onOpen={(post, list) => onOpenPost(post.id, list)} columns={2} /></div>}
      {results.items.length > 0 && tab === 'persona' && <div className="pt-2">{results.items.map((persona) => <PersonaRow key={persona.id} persona={persona} onOpen={onOpenChannel} />)}</div>}
      {results.items.length > 0 && tab === 'topic' && <div className="flex flex-wrap gap-2 px-4 pt-3">{results.items.map((topic) => <Chip key={topic.id} onClick={() => onTopic(topic)}>{topic.name}</Chip>)}</div>}
      {results.hasMore && <div className="flex justify-center py-4"><PillButton onClick={results.loadMore} disabled={results.loading}>더 보기</PillButton></div>}
    </div>}
  </Screen>
}

export function PersonaRow({ persona, onOpen, action = true, detail }) {
  const { isFollowing, toggleFollow } = useStore()
  const following = isFollowing(persona)
  return <div className="flex items-center gap-3 px-4 py-2">
    <button onClick={() => onOpen(persona.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
      <Avatar persona={persona} size={44} />
      <span className="min-w-0"><span className="flex items-center gap-1.5"><strong className="truncate text-[14px] font-medium">{persona.displayName}</strong><AiBadge /></span><span className="block truncate text-[12px] text-[#aaa]">@{persona.username}{detail ? ` · ${detail}` : ''}</span>{persona.bio && <span className="line-clamp-1 block text-[12px] text-[#888]">{persona.bio}</span>}</span>
    </button>
    {action && <button onClick={() => toggleFollow(persona)} aria-pressed={following} className={`h-8 shrink-0 rounded-full px-3 text-[13px] font-medium ${following ? 'bg-white/20' : 'bg-white text-[#0f0f0f]'}`}>{following ? '구독중' : '구독'}</button>}
  </div>
}

// 인물 채널: 소개·주제·AI 안내·구독·토론 시작, 그리고 이 인물의 쇼츠 격자.
export function ChannelScreen({ personaId, onBack, onOpenPost, onDebate }) {
  const persona = useApi(() => api.persona(personaId), [personaId])
  const posts = usePaged((cursor) => api.personaPosts(personaId, { cursor }), [personaId])
  const { isFollowing, toggleFollow } = useStore()
  const data = persona.data
  return <Screen title={data?.displayName || ''} onBack={onBack}>
    {persona.loading && <Loading className="py-16" />}
    {persona.error && <ErrorState error={persona.error} onRetry={persona.reload} className="py-16" />}
    {data && <>
      <div className="px-4 pb-3 pt-2">
        <div className="flex items-center gap-4"><Avatar persona={data} size={72} /><div className="min-w-0"><p className="flex items-center gap-1.5"><span className="truncate text-[20px] font-bold">{data.displayName}</span><AiBadge /></p><p className="text-[12px] text-[#aaa]">@{data.username} · 쇼츠 {data.postCount}개</p></div></div>
        <p className="mt-3 text-[13px] leading-5 text-[#ccc]">{data.bio}</p>
        {data.topics.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{data.topics.map((topic) => <span key={topic.id} className="rounded-full bg-white/10 px-2.5 py-1 text-[12px]">{topic.name}</span>)}</div>}
        <p className="mt-3 text-[12px] leading-5 text-[#888]">{data.aiDisclosure}</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button onClick={() => toggleFollow(data)} aria-pressed={isFollowing(data)} className={`h-9 rounded-full text-[14px] font-medium ${isFollowing(data) ? 'bg-[#272727] text-white' : 'bg-white text-[#0f0f0f]'}`}>{isFollowing(data) ? '구독중' : '구독'}</button>
          <button onClick={() => onDebate(data.id)} className="h-9 rounded-full bg-white/10 text-[14px] font-medium">토론 시작</button>
        </div>
      </div>
      <div className="border-b border-white/15 px-4"><span className="inline-block border-b-2 border-white pb-2.5 pt-2 text-[14px] font-medium">쇼츠</span></div>
      {posts.loading && !posts.items.length && <Loading className="py-10" />}
      {posts.error && <ErrorState error={posts.error} onRetry={posts.reload} className="py-10" />}
      {!posts.loading && !posts.error && !posts.items.length && <Empty title="아직 올린 쇼츠가 없어요" className="py-12" />}
      {posts.items.length > 0 && <TileGrid posts={posts.items} onOpen={(post, list) => onOpenPost(post.id, list)} />}
      {posts.hasMore && <div className="flex justify-center py-4"><PillButton onClick={posts.loadMore} disabled={posts.loading}>더 보기</PillButton></div>}
    </>}
  </Screen>
}

export function SavedScreen({ onBack, onOpenPost }) {
  const { isMember, promptLogin } = useStore()
  const saved = usePaged((cursor) => isMember ? api.savedPosts({ cursor }) : nothing(), [isMember])
  return <Screen title="저장한 쇼츠" onBack={onBack}>
    {!isMember ? <MemberOnly icon="bookmark" title="저장은 로그인 후 쓸 수 있어요" body="로그인하면 마음에 드는 쇼츠를 모아 볼 수 있어요." onLogin={() => promptLogin('저장은 로그인 후 사용할 수 있어요.')} /> : <>
      {saved.loading && !saved.items.length && <Loading className="py-16" />}
      {saved.error && <ErrorState error={saved.error} onRetry={saved.reload} />}
      {!saved.loading && !saved.error && !saved.items.length && <Empty icon="bookmark" title="저장한 쇼츠가 없어요" body="쇼츠에서 저장을 누르면 여기에 모여요." className="py-16" />}
      {saved.items.length > 0 && <TileGrid posts={saved.items} onOpen={(post, list) => onOpenPost(post.id, list)} />}
      {saved.hasMore && <div className="flex justify-center py-4"><PillButton onClick={saved.loadMore} disabled={saved.loading}>더 보기</PillButton></div>}
    </>}
  </Screen>
}

export function FollowingScreen({ onBack, onOpenChannel }) {
  const { isMember, promptLogin } = useStore()
  const follows = usePaged((cursor) => isMember ? api.follows({ cursor }) : nothing(), [isMember])
  return <Screen title="구독 채널" onBack={onBack}>
    {!isMember ? <MemberOnly icon="heart" title="구독은 로그인 후 쓸 수 있어요" body="로그인하면 좋아하는 인물을 구독하고 모아 볼 수 있어요." onLogin={() => promptLogin('팔로우는 로그인 후 사용할 수 있어요.')} /> : <>
      {follows.loading && !follows.items.length && <Loading className="py-16" />}
      {follows.error && <ErrorState error={follows.error} onRetry={follows.reload} />}
      {!follows.loading && !follows.error && !follows.items.length && <Empty icon="heart" title="구독한 채널이 없어요" body="추천 채널이나 인물 채널에서 구독해 보세요." className="py-16" />}
      <div className="py-2">{follows.items.map((persona) => <PersonaRow key={persona.id} persona={persona} onOpen={onOpenChannel} />)}</div>
      {follows.hasMore && <div className="flex justify-center py-4"><PillButton onClick={follows.loadMore} disabled={follows.loading}>더 보기</PillButton></div>}
    </>}
  </Screen>
}

// 복습: 퀴즈 오답과 대화에서 놓친 학습 포인트. 완료하면 목록에서 빠지고 완료 탭에서 볼 수 있다.
export function ReviewScreen({ onBack, onOpenPost }) {
  const { isMember, promptLogin } = useStore()
  const [status, setStatus] = useState('OPEN')
  const review = useReviewItems(status)
  const items = review.items.filter((item) => item.status === status)
  const tabs = [['OPEN', '복습 필요'], ['DONE', '완료']]
  return <Screen title="복습" onBack={onBack}>
    {!isMember ? <MemberOnly icon="book" title="복습은 로그인 후 쓸 수 있어요" body="퀴즈에서 틀린 문항과 대화에서 놓친 포인트가 로그인 후 여기에 모여요." onLogin={() => promptLogin('복습 기록은 로그인 후 사용할 수 있어요.')} /> : <>
      <div role="tablist" className="flex gap-2 px-4 pt-3">{tabs.map(([id, label]) => <Chip key={id} active={status === id} onClick={() => setStatus(id)} role="tab">{label}</Chip>)}</div>
      {review.loading && !review.items.length && <Loading className="py-16" />}
      {review.error && <ErrorState error={review.error} onRetry={review.reload} />}
      {!review.loading && !review.error && !items.length && <Empty icon="book" title={status === 'OPEN' ? '복습할 항목이 없어요' : '완료한 복습이 없어요'} body={status === 'OPEN' ? '퀴즈에서 틀리거나 대화에서 놓친 포인트가 생기면 여기에 나타나요.' : ''} className="py-16" />}
      <ul className="space-y-3 px-4 py-3">{items.map((item) => <li key={item.id} className="rounded-xl bg-white/10 p-3.5">
        <p className="flex items-center gap-2 text-[12px] text-[#aaa]"><span className="rounded bg-white/15 px-1.5 py-px text-[11px] text-white">{reviewReasonLabels[item.reason]}</span>{formatDate(item.updatedAt)}{item.status === 'DONE' && item.completedAt ? ` · ${formatDate(item.completedAt)} 완료` : ''}</p>
        <p className="mt-2 text-[14px] font-medium leading-5">{item.keyPoint.text}</p>
        <p className="mt-1.5 truncate text-[12px] text-[#aaa]">{item.post.persona.displayName} · {item.post.title}</p>
        <div className="mt-3 flex gap-2">
          <PillButton onClick={() => onOpenPost(item.post.id)} className="flex-1 !px-2">쇼츠 보기</PillButton>
          <PillButton light onClick={() => review.setStatus(item, status === 'OPEN' ? 'DONE' : 'OPEN')} className="flex-1 !px-2">{status === 'OPEN' ? '복습 완료' : '다시 복습'}</PillButton>
        </div>
      </li>)}</ul>
      {review.hasMore && <div className="flex justify-center pb-6"><PillButton onClick={review.loadMore} disabled={review.loading}>더 보기</PillButton></div>}
    </>}
  </Screen>
}

// 토론: 두 페르소나와 논제로 대담을 만든다. 발언은 화면에서 하나씩 이어 만들고, 결과는 AI 재구성 가상 대화임을 항상 표시한다.
export function DebateScreen({ onBack, initialPersonaId, onOpenChannel }) {
  const { topics, isMember, promptLogin } = useStore()
  const people = useApi(() => isMember ? api.follows({ limit: 50 }) : Promise.resolve({ items: [] }), [isMember])
  const debates = useDebates()
  const [picked, setPicked] = useState(initialPersonaId ? [String(initialPersonaId)] : [])
  const [topic, setTopic] = useState('')
  const [viewingId, setViewingId] = useState(null)
  const [formError, setFormError] = useState(null)
  const personaList = people.data?.items || []
  const pick = (id) => setPicked((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length < 2 ? [...current, id] : current)

  const explain = (error) => {
    if (error?.status === 503) return 'AI 기능이 아직 설정되지 않았어요. 대담은 AI 설정 후 만들 수 있어요.'
    return errorMessage(error)
  }

  const submit = async () => {
    if (!isMember) { promptLogin('토론은 로그인 후 만들 수 있어요.'); return }
    const value = topic.trim()
    if (picked.length !== 2) { setFormError('토론할 페르소나를 두 명 골라 주세요.'); return }
    if (!value || value.length > 200) { setFormError('논제는 1~200자로 입력해 주세요.'); return }
    setFormError(null)
    debates.clearError()
    const result = await debates.create(picked, value)
    if (result) setViewingId(result.id)
  }

  if (viewingId) return <ShortsDebateLive key={viewingId} debateId={viewingId} onBack={() => setViewingId(null)} onOpenChannel={onOpenChannel} />

  return <Screen key="form" title="토론" onBack={onBack}>
    <div className="px-4 pb-10 pt-2">
      <p className="rounded-lg bg-white/10 px-3 py-2 text-[12px] leading-5 text-[#ccc]">두 AI 페르소나가 논제에 대해 주고받는 AI 재구성 가상 대화예요. 발언은 하나씩 만들고, 마치면 쟁점 요약을 만들어요.</p>
      {!isMember && <p className="mt-2 text-[12px] leading-5 text-[#aaa]">토론은 로그인 후 만들고 볼 수 있어요. <button onClick={() => promptLogin('토론은 로그인 후 만들 수 있어요.')} className="text-[#3ea6ff] underline">로그인</button></p>}

      <h2 className="mt-5 text-[14px] font-bold">페르소나 2명 고르기</h2>
      {people.loading && <Loading className="py-4" />}
      {people.error && <ErrorState error={people.error} onRetry={people.reload} className="py-4" />}
      {!isMember && <p className="py-3 text-[12px] leading-5 text-[#aaa]">팔로우한 인물로 토론을 만들려면 로그인해 주세요.</p>}
      {isMember && !people.loading && !people.error && !personaList.length && <p className="py-3 text-[12px] leading-5 text-[#aaa]">팔로우한 인물이 없어요. 인물을 팔로우하면 여기서 토론을 만들 수 있어요.</p>}
      <div className="mt-2 space-y-1">{personaList.map((persona) => {
        const on = picked.includes(String(persona.id))
        const full = !on && picked.length >= 2
        return <button key={persona.id} onClick={() => pick(String(persona.id))} aria-pressed={on} disabled={full} className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left disabled:opacity-40 ${on ? 'border-white bg-white/10' : 'border-white/15'}`}>
          <Avatar persona={persona} size={36} />
          <span className="min-w-0 flex-1"><span className="flex items-center gap-1.5 text-[14px] font-medium">{persona.displayName}<AiBadge /></span><span className="block truncate text-[12px] text-[#aaa]">{persona.topics.map((item) => item.name).join(' · ')}</span></span>
          {on && <span className="text-[12px] font-semibold">선택</span>}
        </button>
      })}</div>

      <h2 className="mt-5 text-[14px] font-bold">논제</h2>
      <label className="mt-2 block">
        <span className="sr-only">논제 입력</span>
        <input value={topic} onChange={(event) => setTopic(event.target.value)} maxLength={200} placeholder="예: 행복은 노력으로 얻을 수 있는가" className="h-11 w-full rounded-xl border border-white/20 bg-white/10 px-3 text-[14px] outline-none placeholder:text-[#888]" />
      </label>
      <p className="mt-1 text-right text-[11px] text-[#777]">{topic.length}/200</p>
      <div className="mt-2 flex flex-wrap gap-1.5">{topics.map((item) => <button key={item.id} onClick={() => setTopic(item.name)} className="rounded-full bg-white/10 px-2.5 py-1 text-[12px]">{item.name}</button>)}</div>

      {(formError || debates.error) && <p role="alert" className="mt-3 rounded-lg bg-[#3a1f1f] px-3 py-2 text-[13px] leading-5 text-[#ffd1d1]">{formError || explain(debates.error)}</p>}
      <PillButton light onClick={submit} disabled={debates.creating} className="mt-4 w-full">{debates.creating ? '대담을 만드는 중… 잠시 기다려 주세요' : '토론 만들기'}</PillButton>

      {isMember && <>
        <h2 className="mt-8 text-[14px] font-bold">내 토론</h2>
        {debates.loadingMine && !debates.myDebates.length && <Loading className="py-6" />}
        {!debates.loadingMine && !debates.myDebates.length && <p className="py-6 text-center text-[13px] text-[#aaa]">아직 만든 토론이 없어요.</p>}
        <ul className="mt-2 space-y-2">{debates.myDebates.map((item) => <li key={item.id}><button onClick={() => setViewingId(item.id)} className="w-full rounded-xl bg-white/10 px-3.5 py-3 text-left">
          <span className="block text-[14px] font-medium leading-5">{item.topic}</span>
          <span className="mt-0.5 block text-[12px] text-[#aaa]">{item.personas.map((persona) => persona.displayName).join(' × ')} · 발언 {item.turnCount}개 · {debateStatusLabel(item.status)} · {formatDate(item.createdAt)}</span>
        </button></li>)}</ul>
      </>}
    </div>
  </Screen>
}

// 대담 한 편을 이어 가는 화면: 다음 발언·자동 진행·메시지·마침을 훅 하나로 다룬다.
function ShortsDebateLive({ debateId, onBack, onOpenChannel }) {
  const live = useDebate(debateId)
  const { debate, loading, loadError, draft, busy, failure, autoPlaying, canAct, canEnd } = live
  const [message, setMessage] = useState('')
  if (!debate) return <Screen title="토론" onBack={onBack}>{loading ? <Loading /> : <ErrorState error={loadError} onRetry={live.reload} />}</Screen>

  const nameOf = (id) => debate.personas.find((persona) => persona.id === id)?.displayName ?? '인물'
  const composerDisabled = !canAct || busy !== null
  const submit = async (event) => {
    event.preventDefault()
    if (await live.sendMessage(message)) setMessage('')
  }

  return <Screen title="토론" onBack={onBack}>
    <div className="px-4 pb-10 pt-2">
      <p className="text-[12px] text-[#aaa]">{debate.personas.map((persona) => persona.displayName).join(' × ')} · {debateStatusLabel(debate.status)} · 발언 {debate.turnCount}/{debate.turnLimit}</p>
      <h2 className="mt-1 text-[17px] font-bold leading-6">{debate.topic}</h2>
      <p className="mt-3 rounded-lg bg-white/10 px-3 py-2 text-[12px] leading-5 text-[#ccc]">{debate.personas[0]?.aiDisclosure || AI_DISCLOSURE} AI가 재구성한 가상 대화예요. 실제 인물이 말했거나 직접 인용한 내용이 아니에요.</p>

      <ol className="mt-4 space-y-4">{debate.turns.map((turn) => <li key={turn.order} className={`pl-3 ${turn.speakerType === 'USER' ? 'border-l-2 border-[#3ea6ff]' : 'border-l-2 border-white/20'}`}>
        <p className="text-[12px] text-[#aaa]">{turn.speakerType === 'USER' ? <span className="font-medium text-white">나</span> : <><span className="font-medium text-white">{nameOf(turn.personaId)}</span> · AI 재구성</>}</p>
        <p className="mt-1 whitespace-pre-wrap text-[14px] leading-6">{turn.body}</p>
      </li>)}
      {draft && <li role="status" className="border-l-2 border-white/20 pl-3"><p className="text-[12px] text-[#aaa]">발언을 만드는 중…</p><p className="mt-1 whitespace-pre-wrap text-[14px] leading-6">{draft.text || '…'}</p></li>}
      </ol>

      {failure && <p role="alert" className="mt-3 rounded-lg bg-[#3a1f1f] px-3 py-2 text-[13px] leading-5 text-[#ffd1d1]">
        {failure.kind === 'stopped' ? '발언 읽기를 멈췄어요. 만드는 중인 발언은 서버에 저장돼요.' : errorMessage(failure.error)}
        {failure.kind === 'end' && <button onClick={() => live.endDebate()} className="ml-2 underline">요약 다시 만들기</button>}
        {(failure.kind === 'stopped' || failure.kind === 'load') && <button onClick={live.refresh} className="ml-2 underline">다시 불러오기</button>}
      </p>}

      {debate.status === 'ACTIVE' ? <div className="mt-4 space-y-2">
        {debate.turnCount >= debate.turnLimit && <p className="text-[12px] text-[#aaa]">발언 한도(12개)에 도달했어요. {busy === 'end' ? '요약을 만들고 있어요.' : '대담을 마치면 쟁점 요약을 볼 수 있어요.'}</p>}
        <div className="flex gap-2">
          {autoPlaying
            ? <PillButton light onClick={live.pauseAuto} className="flex-1">자동 진행 멈추기</PillButton>
            : <>
              <PillButton light onClick={() => live.nextTurn()} disabled={!canAct || busy !== null} className="flex-1">다음 발언</PillButton>
              <PillButton onClick={live.startAuto} disabled={!canAct || busy !== null} className="flex-1">자동 진행</PillButton>
            </>}
          {busy === 'turn' && <PillButton onClick={live.stopReading}>멈추기</PillButton>}
        </div>
        <form onSubmit={submit} className="flex items-center gap-2">
          <input value={message} onChange={(event) => { setMessage(event.target.value.slice(0, 300)); if (autoPlaying) live.pauseAuto() }} disabled={composerDisabled} aria-label="메시지" placeholder="내 생각을 보내 보세요" className="h-9 min-w-0 flex-1 rounded-full bg-white/10 px-3 text-[13px] outline-none placeholder:text-[#888] disabled:opacity-40" />
          <PillButton type="submit" disabled={composerDisabled || !message.trim()}>보내기</PillButton>
        </form>
        <p className="text-right text-[11px] text-[#777]">{message.length}/300</p>
        <PillButton light onClick={() => live.endDebate()} disabled={!canEnd} className="w-full">{busy === 'end' ? '요약을 만드는 중…' : '대담 마치기'}</PillButton>
        {debate.turnCount === 0 && <p className="text-center text-[11px] text-[#777]">발언이 하나 이상 있어야 대담을 마칠 수 있어요.</p>}
      </div> : <p className="mt-4 text-center text-[12px] text-[#aaa]">종료된 대담이에요.</p>}

      {debate.summary && <div className="mt-5 rounded-xl bg-white/10 p-3.5"><p className="text-[13px] font-semibold">쟁점 요약</p><p className="mt-1.5 whitespace-pre-wrap text-[13px] leading-6 text-[#ddd]">{debate.summary}</p></div>}
      <div className="mt-5 grid grid-cols-2 gap-2">
        {debate.personas.map((persona) => <button key={persona.id} onClick={() => onOpenChannel(persona.id)} className="h-9 rounded-full bg-white/10 text-[13px]">{persona.displayName} 채널</button>)}
      </div>
    </div>
  </Screen>
}

export function RecommendScreen({ onBack, onOpenChannel }) {
  const { topics, interestIds, toggleInterest, isMember } = useStore()
  const key = interestIds.join(',')
  const rec = useApi(() => api.recommendations(isMember ? undefined : interestIds), [key])
  return <Screen title="관심 주제·추천 채널" onBack={onBack}>
    <div className="pb-10">
      <section className="px-4 pt-3">
        <h2 className="text-[14px] font-bold">관심 주제</h2>
        <p className="mt-1 text-[12px] leading-5 text-[#aaa]">{isMember ? '고른 주제는 계정에 저장돼요.' : '비회원은 이 브라우저에만 저장돼요. 로그인하면 계정에 남아요.'}</p>
        <div className="mt-3 flex flex-wrap gap-2">{topics.map((topic) => <Chip key={topic.id} active={interestIds.includes(topic.id)} onClick={() => toggleInterest(topic.id)}>{topic.name}</Chip>)}</div>
      </section>
      <section className="pt-6">
        <h2 className="px-4 text-[14px] font-bold">{interestIds.length ? '관심 주제와 겹치는 추천 채널' : '추천 채널 전체'}</h2>
        {!interestIds.length && <p className="px-4 pt-1 text-[12px] text-[#aaa]">관심 주제를 고르면 맞춤 순서로 바뀌어요.</p>}
        {rec.loading && <Loading className="py-8" />}
        {rec.error && <ErrorState error={rec.error} onRetry={rec.reload} className="py-8" />}
        <div className="pt-2">{(rec.data?.items || []).map((persona) => <PersonaRow key={persona.id} persona={persona} onOpen={onOpenChannel} detail={interestIds.length ? `겹치는 관심 주제 ${persona.matchCount}개` : undefined} />)}</div>
        {rec.data && interestIds.length > 0 && !rec.data.items.length && <Empty title="겹치는 추천 채널이 아직 없어요" body="다른 주제를 함께 골라 보세요." className="py-10" />}
      </section>
    </div>
  </Screen>
}

// 계정: 표시 이름과 소개를 고친다. 로그아웃은 이 화면에서 한다.
export function AccountScreen({ onBack }) {
  const { user, isMember, promptLogin, updateProfile, logout, showToast } = useStore()
  const [displayName, setDisplayName] = useState(user?.displayName || '')
  const [bio, setBio] = useState(user?.bio || '')
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  if (!isMember) return <Screen title="계정" onBack={onBack}>
    <MemberOnly icon={null} title="로그인이 필요해요" body="로그인하면 팔로우·좋아요·저장과 복습, 내 토론을 쓸 수 있어요." onLogin={() => promptLogin('로그인하면 계정 기능을 쓸 수 있어요.')} />
  </Screen>

  const save = async () => {
    const name = displayName.trim()
    if (!name) { setError('표시 이름을 입력해 주세요.'); return }
    setSaving(true); setError(null)
    try { await updateProfile({ displayName: name, bio: bio.trim() }); showToast('프로필을 저장했어요.') } catch (failure) { setError(errorMessage(failure)) } finally { setSaving(false) }
  }
  const field = 'mt-1 w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 text-[14px] outline-none'
  return <Screen title="계정" onBack={onBack}>
    <div className="space-y-4 px-4 pb-10 pt-3">
      <p className="text-[12px] text-[#aaa]">@{user.username}</p>
      <label className="block text-[12px] text-[#ccc]">표시 이름<input value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={30} className={field} /></label>
      <label className="block text-[12px] text-[#ccc]">소개<textarea value={bio} onChange={(event) => setBio(event.target.value)} rows={3} maxLength={200} className={`${field} resize-none`} /></label>
      {error && <p role="alert" className="text-[12px] text-[#ff8a8a]">{error}</p>}
      <PillButton light onClick={save} disabled={saving} className="w-full">{saving ? '저장하는 중…' : '프로필 저장'}</PillButton>
      <PillButton onClick={async () => { await logout(); onBack() }} className="w-full">로그아웃</PillButton>
    </div>
  </Screen>
}
