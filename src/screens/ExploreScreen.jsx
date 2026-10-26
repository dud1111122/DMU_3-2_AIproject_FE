import { useEffect, useMemo, useState } from 'react'
import Icon from '../components/Icon.jsx'
import { api } from '../api/index.js'
import { useApi, usePaged } from '../shared/hooks.js'
import { useStore } from '../shared/store.jsx'
import { Empty, ListState, PersonaRow, PostRow } from './ui.jsx'

const searchTabs = [['post', '게시물'], ['persona', '계정'], ['topic', '주제']]
const none = { items: [], nextCursor: null }

// 돋보기 기본 화면: 팔로우한 인물의 게시물 → 팔로우 인물·관심 주제와 겹치는 게시물 → 나머지 순으로 섞어 보여준다.
export default function ExploreScreen({ onOpenPost, onOpenPersona }) {
  const { isMember, interestIds, isFollowing } = useStore()
  const [input, setInput] = useState('')
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState('post')
  useEffect(() => { const timer = setTimeout(() => setQuery(input.trim()), 300); return () => clearTimeout(timer) }, [input])

  const searching = query.length > 0
  const results = usePaged((cursor) => searching ? api.search(query, tab, { cursor }) : Promise.resolve(none), [query, tab])
  const feed = usePaged((cursor) => api.feed({ cursor, limit: 50 }), [])
  const personas = useApi(() => api.personas({ limit: 50 }), [])

  const followedIds = useMemo(() => (personas.data?.items || []).filter((persona) => isFollowing(persona)).map((persona) => persona.id), [personas.data, isFollowing])
  const followedTopicIds = useMemo(() => {
    const followed = (personas.data?.items || []).filter((persona) => followedIds.includes(persona.id))
    return new Set([...followed.flatMap((persona) => persona.topics.map((topic) => topic.id)), ...interestIds])
  }, [personas.data, followedIds, interestIds])
  const followedKey = followedIds.join(',')

  const ranked = useMemo(() => {
    const scored = feed.items.map((post) => {
      const byFollow = followedIds.includes(post.persona.id)
      const byTopic = !byFollow && post.topics.some((topic) => followedTopicIds.has(topic.id))
      return { post, score: byFollow ? 2 : byTopic ? 1 : 0, reason: byFollow ? '팔로잉' : byTopic ? '관심 주제' : null }
    })
    return scored.sort((a, b) => b.score - a.score || b.post.publishedAt.localeCompare(a.post.publishedAt))
  }, [feed.items, followedKey, followedTopicIds]) // eslint-disable-line react-hooks/exhaustive-deps

  const pickTopic = (topic) => { setInput(topic.name); setQuery(topic.name); setTab('post') }
  const hint = isMember && followedIds.length ? '팔로우한 인물과 관심 주제가 겹치는 게시물을 섞어 보여드려요.' : isMember ? '인물을 팔로우하면 비슷한 게시물을 더 보여드려요.' : interestIds.length ? '내 관심 주제와 겹치는 게시물을 섞어 보여드려요. 로그인하면 팔로우한 인물도 반영돼요.' : '내 정보에서 관심 주제를 고르면 비슷한 게시물을 더 보여드려요.'

  return <div className="pb-4">
    <div className="sticky top-0 z-10 bg-white px-4 pb-2 pt-3">
      <label className="flex h-10 items-center gap-2 rounded-xl bg-[#efefef] px-3 text-[#8e8e8e]"><Icon name="search" size={19} /><input value={input} onChange={(event) => setInput(event.target.value)} placeholder="페르소나·주제·게시물 검색" aria-label="검색어" className="w-full bg-transparent text-[14px] text-[#262626] outline-none placeholder:text-[#8e8e8e]" /></label>
      {searching && <div role="tablist" aria-label="검색 종류" className="mt-3 flex gap-2">{searchTabs.map(([key, label]) => <button key={key} role="tab" aria-selected={tab === key} onClick={() => setTab(key)} className={`h-8 rounded-lg px-3.5 text-[12px] font-semibold ${tab === key ? 'bg-[#111] text-white' : 'bg-[#efefef] text-[#111]'}`}>{label}</button>)}</div>}
    </div>

    {searching ? <div className="px-3">
      <ListState list={results} empty={<Empty icon="search" text={`‘${query}’ 검색 결과가 없어요.`} />}>
        {tab === 'post' && results.items.map((post) => <PostRow key={post.id} post={post} onOpen={onOpenPost} />)}
        {tab === 'persona' && results.items.map((persona) => <PersonaRow key={persona.id} persona={persona} onOpen={onOpenPersona} />)}
        {tab === 'topic' && results.items.map((item) => <button key={item.id} onClick={() => pickTopic(item)} className="flex w-full items-center justify-between px-4 py-3 text-left text-[14px]"><span>{item.name}</span><Icon name="chevron" size={18} className="text-[#8e8e8e]" /></button>)}
      </ListState>
    </div> : <>
      <p className="px-4 pb-2 pt-1 text-[11px] leading-5 text-[#737373]">{hint}</p>
      <ListState list={feed} empty={<Empty icon="grid" text="아직 게시물이 없어요." />}>
        <div className="grid grid-cols-3 gap-[2px]">{ranked.map(({ post, reason }) => <RecTile key={post.id} post={post} reason={reason} onOpen={onOpenPost} />)}</div>
      </ListState>
    </>}
  </div>
}

function RecTile({ post, reason, onOpen }) {
  const image = post.sections.find((section) => section.image)?.image
  return <button onClick={() => onOpen(post)} aria-label={`${post.title} 게시물 열기`} className="group relative aspect-square overflow-hidden bg-[#f1ede4] text-left">
    {image && <img src={image.url} alt="" loading="lazy" onError={(event) => { event.currentTarget.style.display = 'none' }} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />}
    <span className={`absolute inset-0 flex items-end p-2 text-[11px] font-semibold leading-[1.3] ${image ? 'bg-gradient-to-t from-black/55 to-transparent text-white' : 'text-[#3d3a35]'}`}><span className="line-clamp-3">{post.title}</span></span>
    {reason && <span className="absolute left-1.5 top-1.5 rounded-full bg-white/90 px-1.5 py-0.5 text-[9px] font-semibold text-[#0095f6]">{reason}</span>}
  </button>
}
