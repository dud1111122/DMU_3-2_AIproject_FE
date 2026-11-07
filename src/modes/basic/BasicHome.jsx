import { useEffect, useState } from 'react'
import { api } from '../../api/index.js'
import { usePaged } from '../../shared/hooks.js'
import { useStore } from '../../shared/store.jsx'
import { formatDate } from '../../shared/format.js'
import { BundleFeed } from '../../shared/BundleEnd.jsx'
import { useBundleSize } from '../../shared/useUsage.js'
import { Chip, Empty, ErrorState, GhostButton, SafeImage, SaveButton, Skeleton, TopBar, useNav } from './ui.jsx'

export default function BasicHome() {
  const { topics, isMember, sessionStatus, promptLogin, sessionKey } = useStore()
  const nav = useNav()
  const size = useBundleSize()
  const [filter, setFilter] = useState('all')
  // 팔로우 피드는 회원 전용이라 로그아웃하면 전체로 돌린다.
  useEffect(() => { if (filter === 'following' && sessionStatus === 'guest') setFilter('all') }, [filter, sessionStatus])
  const following = filter === 'following' && isMember
  const topicId = filter !== 'all' && filter !== 'following' ? filter : undefined
  // 묶음 보기: 한 번에 묶음 크기만큼만 받는다. scope가 맞는 응답만 화면에 쓴다(필터·로그인 상태가 바뀌면 이전 목록은 버린다).
  const scope = `${filter}|${sessionKey}`
  const feed = usePaged((cursor) => api.feed({ topicId, following, cursor, limit: size }).then((page) => ({ ...page, scope })), [topicId, following])
  const fresh = feed.extra?.scope === scope
  const items = fresh ? feed.items : []
  const list = { items, hasMore: fresh && feed.hasMore, loading: feed.loading || !fresh, error: fresh ? feed.error : null, loadMore: feed.loadMore, reload: feed.reload }

  const chooseFollowing = () => { if (!isMember) { promptLogin('팔로우한 인물의 글만 모아 보려면 로그인해 주세요.'); return } setFilter('following') }

  return <div className="pb-6">
    <TopBar large title="디쇼츠" />
    <div role="group" aria-label="피드 필터" className="no-scrollbar flex gap-1.5 overflow-x-auto border-b border-[#e7e3da] px-4 py-2.5">
      <Chip active={filter === 'all'} onClick={() => setFilter('all')}>전체</Chip>
      <Chip active={filter === 'following'} onClick={chooseFollowing}>팔로우</Chip>
      {topics.map((topic) => <Chip key={topic.id} active={filter === topic.id} onClick={() => setFilter(topic.id)}>{topic.name}</Chip>)}
    </div>
    <div className="px-4 pt-4">
      {list.loading && !items.length && <Skeleton rows={2} card />}
      {feed.error && !items.length && <ErrorState error={feed.error} onRetry={feed.reload} />}
      {!list.loading && !feed.error && !items.length && (filter === 'following'
        ? <Empty title="팔로우한 인물의 글이 없어요" text="인물 프로필에서 팔로우하면 그 인물의 새 글을 여기에서 모아 볼 수 있어요." action={<GhostButton onClick={() => nav.goTab('explore')}>인물 둘러보기</GhostButton>} />
        : <Empty title="아직 게시물이 없어요" text="다른 주제를 골라 보세요." />)}
      {items.length > 0 && <BundleFeed list={list} resetKey={scope} theme="basic" renderPost={(post, index) => <FeedCard key={post.id} post={post} eager={index < 2} onOpen={nav.openPost} />} />}
    </div>
  </div>
}

function FeedCard({ post, eager, onOpen }) {
  const cover = post.sections[0]?.image
  return <article className="mb-4 overflow-hidden rounded-2xl border border-[#e7e3da] bg-white">
    <button onClick={() => onOpen(post.id)} className="block w-full text-left" aria-label={`${post.persona.displayName}의 글 「${post.title}」 열기`}>
      {cover && <SafeImage image={cover} eager={eager} className="aspect-[4/3] w-full" />}
      <div className="px-4 pt-3.5">
        <strong className="text-[13px] font-semibold">{post.persona.displayName}</strong>
        <h2 className="font-basic mt-1 text-[20px] font-bold leading-[1.3] tracking-[-.01em] text-balance">{post.title}</h2>
        <p className={`mt-1.5 text-[13px] leading-[1.6] text-[#4a4741] ${cover ? 'line-clamp-2' : 'line-clamp-4'}`}>{post.summary || post.caption}</p>
      </div>
    </button>
    <div className="flex items-center justify-between px-4 pb-2.5 pt-2 text-[11px] text-[#6f6b63]">
      <span>{formatDate(post.publishedAt)} · 카드 {post.sections.length}장{post.topics.length ? ` · ${post.topics.map((topic) => topic.name).join(' · ')}` : ''}</span>
      <SaveButton post={post} className="h-8 w-8" />
    </div>
  </article>
}
