import { useEffect, useState } from 'react'
import PhoneFrame from '../../shared/PhoneFrame.jsx'
import ModeSheet from '../../shared/ModeSheet.jsx'
import useNavStack from '../../shared/useNavStack.js'
import { usePaged } from '../../shared/hooks.js'
import { useStore } from '../../shared/store.jsx'
import { api } from '../../api/index.js'
import { MainFeed, PostPlayer } from './ShortsFeed.jsx'
import { AccountScreen, ChannelScreen, DebateScreen, FollowingScreen, RecommendScreen, ReviewScreen, SavedScreen, SearchScreen } from './ShortsScreens.jsx'
import { ChatScreen, QuizScreen } from './ShortsStudy.jsx'
import { InfoSheet, MenuSheet, ReportSheet } from './ShortsSheets.jsx'
import './shorts.css'

// 쇼츠 모드 최상위 화면. 피드는 항상 맨 아래에 남기고, 검색·채널·학습 등은 스택으로 그 위에 연다.
export default function ShortsApp({ onChangeMode }) {
  const nav = useNavStack({ screen: 'feed' })
  const { current } = nav
  const onRoot = !nav.canGoBack
  const { isMember, showToast, promptLogin } = useStore()
  const [filter, setFilter] = useState('all') // 'all' | 'following' | 토픽 ID
  const [sheet, setSheet] = useState(null)

  // 로그아웃하면 팔로우 피드는 볼 수 없으니 전체로 돌린다.
  useEffect(() => { if (filter === 'following' && !isMember) setFilter('all') }, [filter, isMember])

  const feed = usePaged((cursor) => {
    if (filter === 'following' && !isMember) return Promise.resolve({ items: [], nextCursor: null, filter })
    const scope = filter === 'following' ? { following: true } : filter === 'all' ? {} : { topicId: filter }
    return api.feed({ ...scope, cursor }).then((page) => ({ ...page, filter }))
  }, [filter])

  const go = (entry) => { setSheet(null); nav.push(typeof entry === 'string' ? { screen: entry } : entry) }
  const openChannel = (personaId) => go({ screen: 'channel', personaId })
  const openPost = (postId, posts = null) => go({ screen: 'player', postId, posts })
  const openMenu = (post) => setSheet({ type: 'menu', post: post || null })
  const openReport = (post) => { if (!isMember) { promptLogin('신고는 로그인 후 사용할 수 있어요.'); return } setSheet({ type: 'report', post }) }
  const pickTopic = (topic) => { setFilter(String(topic.id)); nav.reset({ screen: 'feed' }) }

  const share = async (post) => {
    const text = `${post.title} · ${post.persona.displayName} | 디쇼츠`
    try { await navigator.clipboard.writeText(text); showToast('공유할 문구를 복사했어요') } catch { showToast('복사하지 못했어요. 다시 시도해 주세요') }
  }
  // 피드·플레이어가 공유하는 동작. 카드 안의 버튼이 이 객체를 그대로 받는다.
  const actions = {
    onQuiz: (post) => go({ screen: 'quiz', post }),
    onChat: (post) => go({ screen: 'chat', post }),
    onInfo: (post) => setSheet({ type: 'info', post }),
    onShare: share,
    onChannel: (persona) => openChannel(persona.id),
  }
  const closeSheet = () => setSheet(null)

  let screen = null
  if (current.screen === 'player') screen = <PostPlayer key={`${current.postId}`} postId={current.postId} posts={current.posts} feedItems={feed.items} onBack={nav.back} onSearch={() => go('search')} onMenu={openMenu} actions={actions} />
  if (current.screen === 'search') screen = <SearchScreen onBack={nav.back} onOpenChannel={openChannel} onOpenPost={openPost} onTopic={pickTopic} />
  if (current.screen === 'channel') screen = <ChannelScreen key={current.personaId} personaId={current.personaId} onBack={nav.back} onOpenPost={openPost} onDebate={(personaId) => go({ screen: 'debates', personaId })} />
  if (current.screen === 'saved') screen = <SavedScreen onBack={nav.back} onOpenPost={openPost} />
  if (current.screen === 'following') screen = <FollowingScreen onBack={nav.back} onOpenChannel={openChannel} />
  if (current.screen === 'review') screen = <ReviewScreen onBack={nav.back} onOpenPost={openPost} />
  if (current.screen === 'debates') screen = <DebateScreen key={String(current.personaId || '')} onBack={nav.back} initialPersonaId={current.personaId} onOpenChannel={openChannel} />
  if (current.screen === 'recommend') screen = <RecommendScreen onBack={nav.back} onOpenChannel={openChannel} />
  if (current.screen === 'account') screen = <AccountScreen onBack={nav.back} />
  if (current.screen === 'quiz') screen = <QuizScreen key={current.post.id} post={current.post} onBack={nav.back} />
  if (current.screen === 'chat') screen = <ChatScreen key={current.post.id} post={current.post} onBack={nav.back} />

  return <PhoneFrame dark screenClassName="bg-black text-white">
    <div className="shorts-root relative min-h-0 flex-1 overflow-hidden">
      {/* 피드는 다른 화면을 열어도 유지해, 돌아왔을 때 보던 게시물과 카드 위치를 지킨다. */}
      <div className={`absolute inset-0 ${onRoot ? '' : 'invisible'}`} aria-hidden={!onRoot}>
        <MainFeed feed={feed} filter={filter} onFilter={setFilter} active={onRoot && !sheet} onSearch={() => go('search')} onMenu={openMenu} onRecommend={() => go('recommend')} actions={actions} />
      </div>
      {!onRoot && screen && <div className="absolute inset-0 bg-[#0f0f0f]">{screen}</div>}

      {sheet?.type === 'menu' && <MenuSheet post={sheet.post} onClose={closeSheet} go={go} onReport={() => openReport(sheet.post)} onMode={() => setSheet({ type: 'mode' })} />}
      {sheet?.type === 'mode' && <ModeSheet dark current="shorts" onSelect={onChangeMode} onClose={closeSheet} />}
      {sheet?.type === 'info' && <InfoSheet post={sheet.post} onClose={closeSheet} onOpenChannel={(persona) => { closeSheet(); openChannel(persona.id) }} onQuiz={() => go({ screen: 'quiz', post: sheet.post })} onChat={() => go({ screen: 'chat', post: sheet.post })} />}
      {sheet?.type === 'report' && <ReportSheet post={sheet.post} onClose={closeSheet} />}
    </div>
  </PhoneFrame>
}
