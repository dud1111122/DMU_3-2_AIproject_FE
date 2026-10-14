import { useMemo, useState } from 'react'
import Icon from '../components/Icon.jsx'
import Avatar from '../components/Avatar.jsx'
import { people, posts } from '../data/content.js'

const tiles = [
  { image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=500&q=85', postId: 'p1', tall: true, title: '니체가 던진 질문' },
  { image: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=500&q=85', postId: 'p2', title: '시간과 우주' },
  { image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=500&q=85', postId: 'p3', title: '과학의 기록' },
  { image: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=500&q=85', postId: 'p1', title: '가치와 삶' },
  { image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=500&q=85', postId: 'p2', tall: true, title: '상대성 이론' },
  { image: 'https://images.unsplash.com/photo-1518152006812-edab29b069ac?auto=format&fit=crop&w=500&q=85', postId: 'p3', title: '마리 퀴리' },
  { image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=500&q=85', postId: 'p1', title: '관점의 전환' },
  { image: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?auto=format&fit=crop&w=500&q=85', postId: 'p2', title: '밤하늘의 물리학' },
  { image: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=500&q=85', postId: 'p3', title: '실험실 노트' },
]

export default function ExploreScreen({ onOpenPost, onOpenPerson }) {
  const [query, setQuery] = useState('')
  const results = useMemo(() => people.filter((person) => `${person.name} ${person.handle} ${person.field}`.toLowerCase().includes(query.toLowerCase())), [query])
  const matchingPosts = useMemo(() => posts.filter((post) => {
    const person = people.find((item) => item.id === post.personId)
    const text = `${person?.name} ${person?.handle} ${post.caption} ${post.tags.join(' ')} ${post.slides.map((slide) => slide.title).join(' ')}`
    return text.toLowerCase().includes(query.toLowerCase())
  }), [query])
  return <div className="h-full overflow-y-auto pb-20">
    <div className="sticky top-0 z-10 bg-white px-4 pb-3 pt-4">
      <label className="flex h-10 items-center gap-2 rounded-xl bg-[#efefef] px-3 text-[#8e8e8e]"><Icon name="search" size={19} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="검색" className="w-full bg-transparent text-[14px] text-[#262626] outline-none placeholder:text-[#8e8e8e]" /></label>
    </div>
    {query ? <div className="px-3 pb-5">
      {results.length > 0 && <><p className="pb-2 pt-1 text-xs font-semibold text-[#737373]">인물</p>
        {results.map((person) => <button key={person.id} onClick={() => onOpenPerson(person)} className="flex w-full items-center gap-3 py-2 text-left"><Avatar person={person} size="md" /><span className="flex-1"><strong className="block text-sm">{person.handle}</strong><span className="text-xs text-[#737373]">{person.name} · {person.field}</span></span><Icon name="chevron" size={18} className="text-[#8e8e8e]" /></button>)}
      </>}
      {matchingPosts.length > 0 && <><p className="pb-2 pt-4 text-xs font-semibold text-[#737373]">게시물</p>
        {matchingPosts.map((post) => { const author = people.find((item) => item.id === post.personId); return <button key={post.id} onClick={() => onOpenPost(post)} className="flex w-full items-center gap-3 border-b border-[#efefef] py-2.5 text-left"><img src={post.slides[0].image} alt="" className="h-12 w-12 rounded object-cover"/><span className="min-w-0 flex-1"><strong className="block truncate text-[13px]">{post.slides[0].title}</strong><span className="block truncate text-[11px] text-[#737373]">{author.handle} · {post.tags.join(' · ')}</span></span><Icon name="chevron" size={18} className="text-[#8e8e8e]" /></button> })}
      </>}
      {!results.length && !matchingPosts.length && <p className="py-6 text-center text-sm text-[#737373]">검색 결과가 없어요.</p>}
    </div> : <div className="grid grid-cols-3 gap-[2px]">
      {tiles.map((tile, index) => <button key={`${tile.postId}-${index}`} onClick={() => onOpenPost(posts.find((post) => post.id === tile.postId))} className={`group relative aspect-square overflow-hidden bg-[#eee] ${tile.tall ? 'row-span-2 aspect-auto' : ''}`} aria-label={tile.title}>
        <img src={tile.image} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        <span className="absolute inset-0 flex items-end bg-gradient-to-t from-black/45 to-transparent p-2 text-left text-[10px] font-semibold text-white">{tile.title}</span>
        <span className="absolute right-2 top-2 text-white drop-shadow"><Icon name="layers" size={18} /></span>
      </button>)}
    </div>}
  </div>
}
