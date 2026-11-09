import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Icon from '../../components/Icon.jsx'
import { api } from '../../api/index.js'
import { useApi } from '../../shared/hooks.js'
import { useStore } from '../../shared/store.jsx'
import ShortItem from './ShortItem.jsx'
import { Chip, Empty, ErrorState, Loading, PillButton } from './ui.jsx'

// 세로 스냅 스크롤 플레이어. 위아래는 게시물, 좌우는 같은 게시물의 카드다.
export function ShortsPlayer({ posts, startIndex = 0, active = true, topOffset = 56, hasMore, loadingMore, moreError, onLoadMore, onActiveChange, onRestart, ...actions }) {
  const ref = useRef(null)
  const [index, setIndex] = useState(startIndex)
  const [cards, setCards] = useState({})
  const post = posts[index]

  useLayoutEffect(() => { if (ref.current) ref.current.scrollTop = startIndex * ref.current.clientHeight }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (active) ref.current?.focus({ preventScroll: true }) }, [active])
  useEffect(() => { onActiveChange?.(post || null) }, [post?.id]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (hasMore && !loadingMore && !moreError && index >= posts.length - 3) onLoadMore?.() }, [index, posts.length, hasMore, loadingMore, moreError]) // eslint-disable-line react-hooks/exhaustive-deps

  const pageCount = posts.length + 1
  const onScroll = (event) => { const el = event.currentTarget; setIndex(Math.min(pageCount - 1, Math.round(el.scrollTop / el.clientHeight))) }
  const scrollToPage = (page) => { const el = ref.current; if (el) el.scrollTo({ top: Math.max(0, Math.min(pageCount - 1, page)) * el.clientHeight, behavior: 'smooth' }) }
  const setCard = (postId, value) => setCards((current) => ({ ...current, [postId]: value }))
  const onKeyDown = (event) => {
    if (event.target !== event.currentTarget && /^(INPUT|TEXTAREA)$/.test(event.target.tagName)) return
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); scrollToPage(index + (event.key === 'ArrowDown' ? 1 : -1)) }
    if ((event.key === 'ArrowRight' || event.key === 'ArrowLeft') && post) {
      event.preventDefault()
      const current = cards[post.id] || 0
      setCard(post.id, Math.max(0, Math.min(post.sections.length - 1, current + (event.key === 'ArrowRight' ? 1 : -1))))
    }
  }

  return <div ref={ref} onScroll={onScroll} onKeyDown={onKeyDown} tabIndex={0} aria-label="쇼츠 피드. 위아래 화살표로 게시물, 좌우 화살표로 카드를 넘겨요." className="no-scrollbar h-full snap-y snap-mandatory overflow-y-scroll overscroll-contain outline-none">
    {posts.map((item, itemIndex) => <ShortItem key={item.id} post={item} card={cards[item.id] || 0} onCard={(value) => setCard(item.id, value)} near={Math.abs(itemIndex - index) <= 1} topOffset={topOffset} {...actions} />)}
    <section className="flex h-full snap-start snap-always flex-col items-center justify-center bg-[#0f0f0f] px-8 text-center">
      {hasMore || loadingMore ? <Loading label="쇼츠를 더 불러오는 중…" />
        : moreError ? <ErrorState error={moreError} onRetry={onLoadMore} />
          : <Empty icon="check" title="여기까지 모두 봤어요" body="다른 주제를 고르거나 검색해서 새로운 인물을 만나 보세요." action={<PillButton light className="mt-5" onClick={() => { scrollToPage(0); onRestart?.() }}>처음으로</PillButton>} />}
    </section>
  </div>
}

export function FeedHeader({ onBack, onSearch, onMenu, children }) {
  return <div className="pointer-events-none absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-black/40 to-transparent pb-2">
    <header className="flex h-12 items-center">
      {onBack ? <button onClick={onBack} aria-label="뒤로" className="pointer-events-auto grid h-12 w-12 place-items-center"><Icon name="back" size={24} /></button>
        : <span className="shorts-shadow pl-4 text-[20px] font-bold tracking-[-.04em]">디쇼츠</span>}
      <button onClick={onSearch} aria-label="디쇼츠 검색" className="shorts-icon-shadow pointer-events-auto ml-auto grid h-12 w-12 place-items-center"><Icon name="search" size={24} /></button>
      <button onClick={onMenu} aria-label="추가 메뉴" className="shorts-icon-shadow pointer-events-auto ml-0 mr-2 grid h-8 w-8 place-items-center rounded-full"><Icon name="dots" size={24} strokeWidth={2.4} /></button>
    </header>
    {children}
  </div>
}

const CHIPS_TOP = 96

export function MainFeed({ feed, filter, onFilter, active, onSearch, onMenu, onRecommend, actions }) {
  const { topics, isMember, requireMember } = useStore()
  const [activePost, setActivePost] = useState(null)
  const chips = [{ id: 'all', name: '전체' }, { id: 'following', name: '팔로우' }, ...topics]
  const choose = (id) => {
    if (id === 'following' && !requireMember('팔로우한 채널의 쇼츠는 로그인 후 볼 수 있어요.')) return
    onFilter(id)
  }
  const filterName = chips.find((chip) => chip.id === filter)?.name

  // 로그인·로그아웃으로 피드를 다시 불러오는 동안에도 보던 목록과 위치를 유지한다. (usePaged는 재조회 때 목록을 비운다)
  const fresh = feed.extra?.filter === filter
  const kept = useRef({ filter: null, items: [] })
  if (fresh && feed.items.length) kept.current = { filter, items: feed.items }
  const items = fresh && feed.items.length ? feed.items : kept.current.filter === filter ? kept.current.items : []
  const settled = fresh && !feed.loading

  let body
  if (items.length) body = <ShortsPlayer key={filter} posts={items} active={active} topOffset={CHIPS_TOP + 4} hasMore={fresh && feed.hasMore} loadingMore={feed.loading} moreError={fresh ? feed.error : null} onLoadMore={feed.loadMore} onActiveChange={setActivePost} {...actions} />
  else if (feed.error) body = <ErrorState error={feed.error} onRetry={feed.reload} className="h-full justify-center" />
  else if (!settled) body = <Loading className="h-full" />
  else body = filter === 'following'
    ? <Empty icon="heart" className="h-full justify-center" title="구독한 채널의 쇼츠가 없어요" body={isMember ? '관심 주제로 추천 채널을 찾아 구독해 보세요.' : ''} action={<PillButton light className="mt-5" onClick={onRecommend}>추천 채널 보기</PillButton>} />
    : <Empty icon="grid" className="h-full justify-center" title={`‘${filterName}’ 쇼츠가 아직 없어요`} body="다른 주제를 골라 보세요." action={<PillButton light className="mt-5" onClick={() => onFilter('all')}>전체 보기</PillButton>} />

  return <div className="relative h-full">
    {body}
    <FeedHeader onSearch={onSearch} onMenu={() => onMenu(activePost)}>
      <div role="toolbar" aria-label="피드 필터" className="shorts-chips no-scrollbar pointer-events-auto flex h-10 items-center gap-2 overflow-x-auto px-4">
        {chips.map((chip) => <Chip key={chip.id} active={filter === chip.id} onClick={() => choose(chip.id)}>{chip.name}</Chip>)}
      </div>
    </FeedHeader>
  </div>
}

// 검색·채널·저장함·복습에서 연 게시물. 넘겨받은 목록(또는 이미 불러온 피드)에 있으면 그 목록에서 이어 보고, 없으면 게시물 하나를 불러온다.
export function PostPlayer({ postId, posts, feedItems, onBack, onSearch, onMenu, actions }) {
  const list = posts?.some((post) => post.id === postId) ? posts : feedItems.some((post) => post.id === postId) ? feedItems : null
  const single = useApi(() => list ? Promise.resolve(null) : api.post(postId), [postId, Boolean(list)])
  const [activePost, setActivePost] = useState(null)
  const shown = list || (single.data ? [single.data] : null)

  return <div className="relative h-full bg-black">
    {shown ? <ShortsPlayer posts={shown} startIndex={Math.max(0, shown.findIndex((post) => post.id === postId))} onActiveChange={setActivePost} {...actions} />
      : single.error ? <ErrorState error={single.error} onRetry={single.reload} className="h-full justify-center" />
        : <Loading className="h-full" />}
    <FeedHeader onBack={onBack} onSearch={onSearch} onMenu={() => onMenu(activePost)} />
  </div>
}
