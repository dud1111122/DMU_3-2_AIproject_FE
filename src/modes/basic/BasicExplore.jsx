import { useEffect, useState } from 'react'
import Icon from '../../components/Icon.jsx'
import { api } from '../../api/index.js'
import { useApi, usePaged } from '../../shared/hooks.js'
import { useStore } from '../../shared/store.jsx'
import { Chip, Empty, ErrorState, LoadMore, Notice, PersonaRow, PostRow, SectionTitle, Skeleton, TopBar, useNav } from './ui.jsx'

const types = [['post', '게시물'], ['persona', '인물'], ['topic', '주제']]

export function BasicExplore() {
  const nav = useNav()
  const { topics } = useStore()
  const [input, setInput] = useState('')
  const [query, setQuery] = useState('')
  const [type, setType] = useState('post')
  // 입력이 멈춘 뒤 검색해 매 글자마다 요청하지 않는다.
  useEffect(() => { const timer = setTimeout(() => setQuery(input.trim()), 300); return () => clearTimeout(timer) }, [input])
  const results = usePaged((cursor) => query ? api.search(query, type, { cursor }) : Promise.resolve({ items: [], nextCursor: null }), [query, type])
  const personas = usePaged((cursor) => api.personas({ cursor }), [])

  return <div className="pb-8">
    <header className="sticky top-0 z-20 border-b border-[#e7e3da] bg-[#fbfaf7] px-5 pb-3 pt-4">
      <h1 className="font-basic text-[24px] font-bold text-balance">탐색</h1>
      <form role="search" onSubmit={(event) => { event.preventDefault(); setQuery(input.trim()) }} className="mt-3 flex h-10 items-center gap-2 rounded-lg border border-[#d9d4c9] bg-white px-3 text-[#6f6b63]">
        <Icon name="search" size={18} />
        <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="인물, 주제, 글 검색" aria-label="검색어" className="w-full bg-transparent text-[14px] text-[#1c1b19] outline-none placeholder:text-[#a39e93]" />
        {input && <button type="button" onClick={() => { setInput(''); setQuery('') }} aria-label="검색어 지우기"><Icon name="close" size={16} /></button>}
      </form>
      {query && <div role="tablist" aria-label="검색 종류" className="mt-2.5 flex gap-1.5">{types.map(([id, label]) => <Chip key={id} active={type === id} pressed={false} onClick={() => setType(id)}><span role="tab" aria-selected={type === id}>{label}</span></Chip>)}</div>}
    </header>

    {query ? <div className="px-5" aria-live="polite">
      {results.loading && !results.items.length && <Skeleton rows={3} />}
      {results.error && !results.items.length && <ErrorState error={results.error} onRetry={results.reload} />}
      {!results.loading && !results.error && !results.items.length && <Empty title={`‘${query}’에 대한 결과가 없어요`} text="다른 검색어를 쓰거나 검색 종류를 바꿔 보세요." />}
      {type === 'post' && results.items.map((post) => <PostRow key={post.id} post={post} onOpen={nav.openPost} />)}
      {type === 'persona' && results.items.map((persona) => <PersonaRow key={persona.id} persona={persona} onOpen={nav.openPersona} meta={`@${persona.username} · 글 ${persona.postCount}`} />)}
      {type === 'topic' && results.items.map((topic) => <TopicRow key={topic.id} topic={topic} onOpen={nav.openTopic} />)}
      <LoadMore list={results} />
    </div> : <div className="px-5">
      <section className="pt-5" aria-labelledby="explore-topics">
        <SectionTitle id="explore-topics">주제</SectionTitle>
        <div className="mt-3 flex flex-wrap gap-1.5">{topics.map((topic) => <Chip key={topic.id} pressed={false} onClick={() => nav.openTopic(topic)}>{topic.name}</Chip>)}</div>
        <button onClick={nav.openRecommend} className="mt-3 flex w-full items-center gap-3 rounded-xl border border-[#e7e3da] bg-white px-4 py-3 text-left">
          <span className="min-w-0 flex-1"><strong className="block text-[13px]">관심 주제로 인물 추천받기</strong><span className="block text-[11px] text-[#6f6b63]">관심 주제와 겹치는 주제가 많은 인물 순으로 보여줘요.</span></span>
          <Icon name="chevron" size={17} className="shrink-0 text-[#a39e93]" />
        </button>
      </section>
      <section className="pt-6" aria-labelledby="explore-personas">
        <SectionTitle id="explore-personas">인물</SectionTitle>
        {personas.loading && !personas.items.length && <Skeleton rows={3} />}
        {personas.error && !personas.items.length && <ErrorState error={personas.error} onRetry={personas.reload} />}
        {personas.items.map((persona) => <PersonaRow key={persona.id} persona={persona} onOpen={nav.openPersona} meta={`${persona.topics.map((topic) => topic.name).join(' · ')} · 글 ${persona.postCount}`} />)}
        <LoadMore list={personas} />
      </section>
    </div>}
  </div>
}

function TopicRow({ topic, onOpen }) {
  return <button onClick={() => onOpen(topic)} className="flex w-full items-center gap-3 border-b border-[#e7e3da] py-3.5 text-left">
    <span className="font-basic grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#e8efec] text-[14px] font-bold text-[#2f5d50]">#</span>
    <strong className="flex-1 text-[14px]">{topic.name}</strong><Icon name="chevron" size={17} className="text-[#a39e93]" />
  </button>
}

export function BasicTopic({ topic }) {
  const nav = useNav()
  const posts = usePaged((cursor) => api.feed({ topicId: topic.id, cursor }), [topic.id])
  const personas = usePaged((cursor) => api.personas({ topicId: topic.id, cursor }), [topic.id])
  return <div className="pb-8">
    <TopBar onBack={nav.back} title={`#${topic.name}`} />
    <div className="px-5">
      <section className="pt-5" aria-labelledby="topic-personas">
        <SectionTitle id="topic-personas">이 주제를 다루는 인물</SectionTitle>
        {personas.loading && !personas.items.length && <Skeleton rows={2} />}
        {personas.error && !personas.items.length && <ErrorState compact error={personas.error} onRetry={personas.reload} />}
        {!personas.loading && !personas.error && !personas.items.length && <p className="py-6 text-center text-[12px] text-[#6f6b63]">아직 연결된 인물이 없어요.</p>}
        {personas.items.map((persona) => <PersonaRow key={persona.id} persona={persona} onOpen={nav.openPersona} meta={`@${persona.username} · 글 ${persona.postCount}`} />)}
        <LoadMore list={personas} />
      </section>
      <section className="pt-6" aria-labelledby="topic-posts">
        <SectionTitle id="topic-posts">게시물</SectionTitle>
        {posts.loading && !posts.items.length && <Skeleton rows={2} />}
        {posts.error && !posts.items.length && <ErrorState compact error={posts.error} onRetry={posts.reload} />}
        {!posts.loading && !posts.error && !posts.items.length && <p className="py-6 text-center text-[12px] text-[#6f6b63]">이 주제의 게시물이 아직 없어요.</p>}
        {posts.items.map((post) => <PostRow key={post.id} post={post} onOpen={nav.openPost} />)}
        <LoadMore list={posts} />
      </section>
    </div>
  </div>
}

export function BasicRecommend() {
  const nav = useNav()
  const { topics, isMember, interestIds, toggleInterest } = useStore()
  const key = interestIds.join(',')
  const recommended = useApi(() => api.recommendations(isMember ? undefined : interestIds), [key, isMember])
  return <div className="pb-8">
    <TopBar onBack={nav.back} title="인물 추천" />
    <div className="px-5 pt-5">
      <SectionTitle id="rec-interests">관심 주제</SectionTitle>
      <p className="mt-2 text-[11px] leading-5 text-[#6f6b63]">{isMember ? '관심 주제는 계정에 저장돼요.' : '로그인하지 않으면 관심 주제 선택이 이 브라우저에만 남아요.'}</p>
      <div role="group" aria-label="관심 주제 선택" className="mt-3 flex flex-wrap gap-1.5">{topics.map((topic) => <Chip key={topic.id} active={interestIds.includes(topic.id)} onClick={() => toggleInterest(topic.id)}>{topic.name}</Chip>)}</div>
      <section className="pt-7" aria-labelledby="rec-list">
        <SectionTitle id="rec-list">{interestIds.length ? '추천 인물' : '모든 인물'}</SectionTitle>
        {!interestIds.length && <Notice className="mt-3">관심 주제를 고르면 겹치는 주제가 많은 인물부터 보여줘요.</Notice>}
        {recommended.loading && <Skeleton rows={3} />}
        {recommended.error && <ErrorState compact error={recommended.error} onRetry={recommended.reload} />}
        {recommended.data && !recommended.data.items.length && <Empty title="겹치는 인물이 없어요" text="다른 주제를 더 골라 보세요." />}
        {recommended.data?.items.map((persona) => <PersonaRow key={persona.id} persona={persona} onOpen={nav.openPersona} meta={`${interestIds.length ? `관심 주제 ${persona.matchCount}개 일치 · ` : ''}${persona.topics.map((topic) => topic.name).join(' · ')}`} />)}
      </section>
    </div>
  </div>
}
