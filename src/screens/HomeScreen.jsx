import { useState } from 'react'
import PostCard from '../components/PostCard.jsx'
import { api } from '../api/index.js'
import { usePaged } from '../shared/hooks.js'
import { useStore } from '../shared/store.jsx'
import { Empty, ListState, MemberGate } from './ui.jsx'

// 홈: 피드(최신순, 팔로잉·주제 필터). 카드에서 게시물 상세로는 들어가지 않는다(기획 §4).
export default function HomeScreen({ onOpenPersona, onOpenChat, onOpenMenu, onShare }) {
  const { isMember, topics } = useStore()
  const [filter, setFilter] = useState('all')
  const feed = usePaged((cursor) => {
    if (filter === 'following') return isMember ? api.feed({ cursor, following: true }) : Promise.resolve({ items: [], nextCursor: null })
    return api.feed({ cursor, topicId: filter === 'all' ? undefined : filter })
  }, [filter])
  const chips = [{ key: 'all', label: '전체' }, { key: 'following', label: '팔로잉' }, ...topics.map((topic) => ({ key: topic.id, label: topic.name }))]

  return <div className="pb-4">
    <div role="radiogroup" aria-label="피드 필터" className="no-scrollbar flex gap-2 overflow-x-auto px-3 py-2.5">
      {chips.map((chip) => <button key={chip.key} role="radio" aria-checked={filter === chip.key} onClick={() => setFilter(chip.key)} className={`h-7 shrink-0 rounded-full px-3 text-[11px] font-semibold ${filter === chip.key ? 'bg-[#111] text-white' : 'bg-[#efefef] text-[#111]'}`}>{chip.label}</button>)}
    </div>

    {filter === 'following' && !isMember ? <MemberGate text="팔로우한 페르소나의 게시물은 로그인 후 볼 수 있어요." /> : <ListState list={feed} empty={<Empty icon="home" text={filter === 'following' ? '팔로우한 페르소나의 게시물이 아직 없어요. 돋보기에서 페르소나를 찾아 팔로우해 보세요.' : '아직 게시물이 없어요.'} />}>
      {feed.items.map((post) => <PostCard key={post.id} post={post} onOpenPersona={onOpenPersona} onOpenChat={onOpenChat} onOpenMenu={onOpenMenu} onShare={onShare} />)}
    </ListState>}
  </div>
}
