import { useMemo, useState } from 'react'
import BottomNav from './components/BottomNav.jsx'
import Icon from './components/Icon.jsx'
import HomeScreen from './screens/HomeScreen.jsx'
import ExploreScreen from './screens/ExploreScreen.jsx'
import ReelsScreen from './screens/ReelsScreen.jsx'
import DmScreen from './screens/DmScreen.jsx'
import DetailScreen from './screens/DetailScreen.jsx'
import { FollowingScreen, PersonProfile, SavedScreen, SettingsScreen } from './screens/ProfileScreen.jsx'
import { people, posts } from './data/content.js'
import usePersistedState from './hooks/usePersistedState.js'

export default function App() {
  const [screen, setScreen] = useState('home')
  const [previousScreen, setPreviousScreen] = useState('home')
  const [activeOrigin, setActiveOrigin] = useState('home')
  const [selectedPerson, setSelectedPerson] = useState(null)
  const [selectedPost, setSelectedPost] = useState(null)
  const [conversation, setConversation] = useState(null)
  const [modal, setModal] = useState(null)
  const [savedIds, setSavedIds] = usePersistedState('de-shorts-fe2:saved', [])
  const [likedIds, setLikedIds] = usePersistedState('de-shorts-fe2:liked', [])
  const [followedIds, setFollowedIds] = usePersistedState('de-shorts-fe2:following', ['nietzsche', 'einstein'])
  const savedPosts = useMemo(() => posts.filter((post) => savedIds.includes(post.id)), [savedIds])
  const followedPeople = useMemo(() => people.filter((person) => followedIds.includes(person.id)), [followedIds])

  const navigate = (next) => { setScreen(next); if (['home', 'search', 'reels', 'dm', 'settings'].includes(next)) setActiveOrigin(next); setSelectedPost(null); setSelectedPerson(null); setConversation(null); setModal(null) }
  const openPost = (post) => { setPreviousScreen(screen); setSelectedPost(post); setScreen('detail'); setModal(null) }
  const openPerson = (person) => { if (!person) return; setPreviousScreen(screen); setSelectedPerson(person); setScreen('person'); setModal(null) }
  const back = () => { setScreen(previousScreen); setSelectedPerson(null); setSelectedPost(null); setConversation(null); setModal(null) }
  const toggleSave = (id) => setSavedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  const toggleLike = (id) => setLikedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  const toggleFollow = (id) => setFollowedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  const startConversation = (targetPerson) => { setActiveOrigin('dm'); setPreviousScreen('dm'); setScreen('dm'); setConversation({ personId: targetPerson.id }); setModal(null) }
  const openFollowing = () => { setPreviousScreen('settings'); setScreen('following') }
  const activeTab = ['person', 'detail'].includes(screen) ? activeOrigin : ['saved', 'following'].includes(screen) ? 'settings' : screen
  const person = selectedPerson || people[0]
  const post = selectedPost || posts[0]

  return <main className="flex min-h-[100dvh] items-center justify-center bg-white p-0 sm:p-6">
    <div className="phone-frame relative h-[100dvh] w-full overflow-hidden bg-white sm:h-[min(850px,calc(100dvh-48px))] sm:w-[402px] sm:rounded-[44px] sm:border-[8px] sm:border-[#181818] sm:shadow-[0_22px_70px_rgba(0,0,0,.16)]">
      <div className="phone-inner relative flex h-full flex-col overflow-hidden bg-white">
        <div className="phone-status flex h-[25px] items-center justify-between px-6 text-[10px] font-semibold"><span>9:41</span><span className="flex items-center gap-1"><span className="status-bars">▂▄▆</span><span>◖</span><span className="battery"><i /></span></span></div>
        <div className="relative min-h-0 flex-1 overflow-hidden">
          {screen === 'home' && <HomeScreen onOpenPerson={openPerson} onOpenStory={(target) => setModal({ type: 'story', person: target })} onAddStory={() => setModal({ type: 'create-story' })} onOpenPost={openPost} onOpenComments={(target) => setModal({ type: 'comments', post: target })} savedIds={savedIds} likedIds={likedIds} onToggleSave={toggleSave} onToggleLike={toggleLike} onOpenActivity={(label) => setModal({ type: 'notice', label })} />}
          {screen === 'search' && <ExploreScreen onOpenPost={openPost} onOpenPerson={openPerson} />}
          {screen === 'reels' && <ReelsScreen onOpenPerson={openPerson} onOpenComments={(target) => setModal({ type: 'comments', post: target })} />}
          {screen === 'dm' && <DmScreen conversation={conversation} setConversation={setConversation} onNewMessage={() => setModal({ type: 'new-message' })} onRequests={() => setModal({ type: 'message-requests' })} />}
          {screen === 'settings' && <SettingsScreen savedCount={savedIds.length} followedCount={followedIds.length} onOpenSaved={() => { setPreviousScreen('settings'); setScreen('saved') }} onOpenFollowing={openFollowing} onOpenNotifications={() => setModal({ type: 'notice', label: '알림' })} onOpenPrivacy={() => setModal({ type: 'notice', label: '개인정보 및 표시' })} onOpenAbout={() => setModal({ type: 'notice', label: '디쇼츠 설정' })} />}
          {screen === 'following' && <FollowingScreen followedPeople={followedPeople} onBack={back} onOpenPerson={openPerson} onToggleFollow={toggleFollow} />}
          {screen === 'person' && <PersonProfile person={person} onBack={back} onOpenPost={openPost} onOpenMessage={() => startConversation(person)} onOpenReels={() => navigate('reels')} onOpenMore={() => setModal({ type: 'notice', label: '프로필 메뉴' })} followed={followedIds.includes(person.id)} onToggleFollow={toggleFollow} />}
          {screen === 'detail' && <DetailScreen post={post} person={people.find((item) => item.id === post.personId)} onBack={back} onOpenPerson={openPerson} onOpenComments={(target) => setModal({ type: 'comments', post: target })} saved={savedIds.includes(post.id)} onToggleSave={toggleSave} liked={likedIds.includes(post.id)} onToggleLike={toggleLike} followed={followedIds.includes(post.personId)} onToggleFollow={toggleFollow} />}
          {screen === 'saved' && <SavedScreen savedPosts={savedPosts} onBack={back} onOpenPost={openPost} />}
        </div>
        <BottomNav active={activeTab} onNavigate={navigate} />
        {modal && <Modal modal={modal} onClose={() => setModal(null)} onOpenPerson={openPerson} onStartConversation={startConversation} />}
      </div>
      <div className="phone-side-button" />
    </div>
  </main>
}

function Modal({ modal, onClose, onOpenPerson, onStartConversation }) {
  if (modal.type === 'story') return <div className="absolute inset-0 z-50 flex items-center justify-center bg-black p-5 text-white"><div className="absolute inset-x-4 top-5 h-1 rounded bg-white/40"><span className="block h-full w-[64%] rounded bg-white" /></div><div className="absolute left-4 top-9 flex items-center gap-2"><Icon name="back" size={21} className="cursor-pointer"/><img src={modal.person.avatar} className="h-8 w-8 rounded-full object-cover"/><strong className="text-xs">{modal.person.handle}</strong><span className="text-[10px] text-white/70">5시간</span></div><button onClick={onClose} className="absolute right-4 top-9" aria-label="스토리 닫기"><Icon name="close" size={23}/></button><div className="max-w-[290px] text-center"><p className="text-xs tracking-[.2em] text-white/70">오늘의 인물</p><h2 className="mt-3 text-3xl font-semibold">{modal.person.name}</h2><p className="mt-3 text-sm leading-6">{modal.person.bio}</p><button onClick={() => onOpenPerson(modal.person)} className="mt-7 rounded-full border border-white/80 px-5 py-2 text-sm">프로필 보기</button></div><div className="absolute inset-x-4 bottom-6 h-10 rounded-full border border-white/50 px-4 py-2 text-sm text-white/70">메시지 보내기...</div></div>
  if (modal.type === 'comments') return <CommentsModal onClose={onClose} />
  if (modal.type === 'new-message') return <div className="absolute inset-0 z-50 flex items-end bg-black/35" onClick={onClose}><div className="max-h-[76%] w-full overflow-y-auto rounded-t-2xl bg-white px-4 pb-7 pt-5" onClick={(event) => event.stopPropagation()}><div className="mb-3 flex items-center justify-between"><strong className="text-[15px]">새 메시지</strong><button onClick={onClose} aria-label="닫기"><Icon name="close" size={21}/></button></div><p className="mb-2 text-[11px] text-[#737373]">대화를 시작할 인물</p>{people.map((target) => <button key={target.id} onClick={() => onStartConversation(target)} className="flex w-full items-center gap-3 border-t border-[#efefef] py-3 text-left"><img src={target.avatar} alt="" className="h-10 w-10 rounded-full object-cover"/><span><strong className="block text-[13px]">{target.handle}</strong><span className="text-[11px] text-[#737373]">{target.name}</span></span></button>)}</div></div>
  if (modal.type === 'message-requests') return <div className="absolute inset-0 z-50 flex items-end bg-black/35" onClick={onClose}><div className="w-full rounded-t-2xl bg-white px-5 pb-8 pt-6" onClick={(event) => event.stopPropagation()}><div className="mb-3 flex items-center justify-between"><strong className="text-[15px]">메시지 요청</strong><button onClick={onClose} aria-label="닫기"><Icon name="close" size={21}/></button></div><p className="py-8 text-center text-[12px] text-[#737373]">새 메시지 요청이 없어요.</p></div></div>
  if (modal.type === 'create-story') return <div className="absolute inset-0 z-50 flex items-end bg-black/35" onClick={onClose}><div className="w-full rounded-t-2xl bg-white px-5 pb-8 pt-6" onClick={(event) => event.stopPropagation()}><div className="mb-3 flex items-center justify-between"><strong className="text-[15px]">스토리 만들기</strong><button onClick={onClose} aria-label="닫기"><Icon name="close" size={21}/></button></div><p className="text-[12px] text-[#737373]">오늘의 인물이나 주제를 짧게 소개하는 스토리를 준비해보세요.</p><button onClick={onClose} className="mt-5 h-10 w-full rounded-lg bg-[#0095f6] text-[13px] font-semibold text-white">확인</button></div></div>
  return <div className="absolute inset-0 z-50 flex items-end bg-black/35" onClick={onClose}><div className="w-full rounded-t-2xl bg-white px-5 pb-8 pt-6" onClick={(event) => event.stopPropagation()}><div className="mb-3 flex items-center justify-between"><strong className="text-[15px]">{modal.label}</strong><button onClick={onClose} aria-label="닫기"><Icon name="close" size={21}/></button></div><p className="text-[12px] leading-5 text-[#737373]">인물과 지식 카드뉴스를 둘러보고, 마음에 드는 게시물을 저장해 다시 읽어보세요.</p><button onClick={onClose} className="mt-5 h-10 w-full rounded-lg bg-[#0095f6] text-[13px] font-semibold text-white">확인</button></div></div>
}

function CommentsModal({ onClose }) {
  const [comment, setComment] = useState('')
  const [comments, setComments] = useState([])
  const submit = (event) => { event.preventDefault(); if (comment.trim()) { setComments((items) => [...items, comment.trim()]); setComment('') } }
  return <div className="absolute inset-0 z-50 flex items-end bg-black/40" onClick={onClose}><div className="relative max-h-[72%] w-full rounded-t-2xl bg-white px-4 pb-6 pt-4" onClick={(event) => event.stopPropagation()}><div className="mx-auto mb-4 h-1 w-9 rounded bg-[#dbdbdb]"/><div className="mb-4 flex items-center justify-between"><strong className="text-[15px]">댓글</strong><button onClick={onClose} aria-label="닫기"><Icon name="close" size={21}/></button></div><div className="max-h-56 space-y-4 overflow-y-auto py-3">{comments.length ? comments.map((item, index) => <p key={index} className="text-[12px] leading-5"><strong className="mr-2">de-shorts</strong>{item}</p>) : <><p className="text-center text-[12px] text-[#737373]">아직 댓글이 없어요.</p><p className="text-center text-[11px] text-[#a1a1a1]">이 게시물에 대한 생각을 나눠보세요.</p></>}</div><form className="mt-5 flex items-center gap-2 border-t border-[#efefef] pt-3" onSubmit={submit}><input value={comment} onChange={(event) => setComment(event.target.value)} className="h-9 flex-1 text-[13px] outline-none" placeholder="댓글 달기..."/><button disabled={!comment.trim()} className="text-[12px] font-semibold text-[#0095f6] disabled:opacity-40">게시</button></form></div></div>
}
