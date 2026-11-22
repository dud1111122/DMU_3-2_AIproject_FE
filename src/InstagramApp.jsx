import { useEffect, useRef, useState } from 'react'
import Guide from './shared/Guide.jsx'
import { guideSteps, useGuide } from './shared/guide.js'
import BottomNav from './components/BottomNav.jsx'
import Icon from './components/Icon.jsx'
import ModeSheet from './shared/ModeSheet.jsx'
import PhoneFrame from './shared/PhoneFrame.jsx'
import useNavStack from './shared/useNavStack.js'
import { useStore } from './shared/store.jsx'
import { Sheet, shareText } from './screens/ui.jsx'
import HomeScreen from './screens/HomeScreen.jsx'
import ExploreScreen from './screens/ExploreScreen.jsx'
import DetailScreen from './screens/DetailScreen.jsx'
import QuizScreen from './screens/QuizScreen.jsx'
import ChatScreen from './screens/ChatScreen.jsx'
import LearningScreen from './screens/LearningScreens.jsx'
import { DebateHome, DebateView } from './screens/DebateScreen.jsx'
import { FollowingScreen, MeScreen, PersonaScreen, SavedScreen } from './screens/ProfileScreen.jsx'
import ReportSheet from './screens/ReportSheet.jsx'

// 인스타그램 모드: 하단 탭 5개가 루트이고, 게시물·퀴즈·대화·인물 등은 스택으로 쌓인다.
// 항목에 post 객체가 있으면 먼저 보여 주고, 없으면 화면이 서버에서 불러온다.
export default function InstagramApp({ onChangeMode }) {
  const [guideOpen, closeGuide] = useGuide('instagram')
  const nav = useNavStack({ screen: 'home' })
  const { requireMember, showToast } = useStore()
  const [sheet, setSheet] = useState(null)
  const [modeOpen, setModeOpen] = useState(false)
  const scrollRef = useRef(null)
  const { current } = nav
  useEffect(() => { scrollRef.current?.scrollTo(0, 0) }, [current])

  const go = (entry) => nav.push({ ...entry, _k: Math.random().toString(36).slice(2) })
  const openTab = (screen) => nav.reset({ screen })
  const openPost = (post) => { setSheet(null); go({ screen: 'post', postId: post.id, post: post.sections ? post : null }) }
  const openPersona = (persona) => go({ screen: 'persona', personaId: persona.id, persona })
  const openChat = (post) => go({ screen: 'chat', postId: post.id, post: post.sections ? post : null })
  const openQuiz = (post) => go({ screen: 'quiz', postId: post.id, post: post.sections ? post : null })
  const openDebate = (debate) => go({ screen: 'debate', debateId: debate.id })
  const startDebate = (persona) => go({ screen: 'debates', initialPersonas: [persona] })
  const openMenu = (post) => setSheet({ type: 'menu', post, canOpen: true })
  // 홈에서는 상세로 가는 경로를 두지 않으므로 메뉴에도 '게시물 자세히 보기'를 넣지 않는다. 기획 §4.
  const openHomeMenu = (post) => setSheet({ type: 'menu', post, canOpen: false })
  const openReport = (post) => { setSheet(null); if (requireMember('신고는 로그인 후 사용할 수 있어요.')) setSheet({ type: 'report', post }) }
  const openFromMe = (screen) => (screen === 'learning' || screen === 'debates' ? openTab(screen) : go({ screen }))
  const share = async (post) => {
    try { await navigator.clipboard.writeText(shareText(post)); showToast('공유할 문구를 복사했어요') } catch { showToast('복사하지 못했어요. 다시 시도해 주세요') }
  }

  const immersive = current.screen === 'chat'
  const renderScreen = () => {
    switch (current.screen) {
      case 'home': return <HomeScreen onOpenPersona={openPersona} onOpenChat={openChat} onOpenMenu={openHomeMenu} onShare={share} />
      case 'search': return <ExploreScreen onOpenPost={openPost} onOpenPersona={openPersona} />
      case 'debates': return <DebateHome initialPersonas={current.initialPersonas || []} onBack={nav.canGoBack ? nav.back : null} onOpenDebate={openDebate} />
      case 'learning': return <LearningScreen onOpenPost={openPost} onOpenChat={openChat} />
      case 'me': return <MeScreen onOpen={openFromMe} onOpenMode={() => setModeOpen(true)} />
      case 'post': return <DetailScreen postId={current.postId} initialPost={current.post} onBack={nav.back} onOpenPersona={openPersona} onOpenChat={openChat} onOpenQuiz={openQuiz} onOpenMenu={openMenu} onOpenReport={openReport} onShare={share} />
      case 'quiz': return <QuizScreen postId={current.postId} initialPost={current.post} onBack={nav.back} onOpenChat={openChat} />
      case 'chat': return <ChatScreen postId={current.postId} initialPost={current.post} onBack={nav.back} />
      case 'persona': return <PersonaScreen personaId={current.personaId} initialPersona={current.persona} onBack={nav.back} onOpenPost={openPost} onOpenDebate={startDebate} />
      case 'debate': return <DebateView debateId={current.debateId} onBack={nav.back} />
      case 'saved': return <SavedScreen onBack={nav.back} onOpenPost={openPost} />
      case 'following': return <FollowingScreen onBack={nav.back} onOpenPersona={openPersona} />
      default: return null
    }
  }

  return <PhoneFrame>
    <div ref={scrollRef} className={immersive ? 'flex min-h-0 flex-1 flex-col overflow-hidden' : 'relative min-h-0 flex-1 overflow-y-auto'}>
      <div key={current._k || current.screen} className={immersive ? 'flex min-h-0 flex-1 flex-col' : ''}>{renderScreen()}</div>
    </div>
    {!immersive && <BottomNav active={nav.root.screen} onNavigate={openTab} />}

    {sheet?.type === 'menu' && <Sheet title="게시물 메뉴" onClose={() => setSheet(null)}>
      <button onClick={() => { setSheet(null); openPersona(sheet.post.persona) }} className="flex h-12 w-full items-center gap-3 text-left text-[14px]"><Icon name="user" size={21} />게시자 프로필 보기</button>
      {sheet.canOpen && <button onClick={() => openPost(sheet.post)} className="flex h-12 w-full items-center gap-3 text-left text-[14px]"><Icon name="layers" size={21} />게시물 자세히 보기</button>}
      <button onClick={() => { setSheet(null); share(sheet.post) }} className="flex h-12 w-full items-center gap-3 text-left text-[14px]"><Icon name="send" size={21} />공유 문구 복사</button>
      <button onClick={() => openReport(sheet.post)} className="flex h-12 w-full items-center gap-3 text-left text-[14px] text-[#e5484d]"><Icon name="flag" size={21} />신고하기</button>
    </Sheet>}
    {sheet?.type === 'report' && <ReportSheet post={sheet.post} onClose={() => setSheet(null)} />}
    {guideOpen && current.screen === 'home' && <Guide mode="instagram" steps={guideSteps.instagram} onClose={closeGuide} />}
    {modeOpen && <ModeSheet current="instagram" onSelect={(id) => { setModeOpen(false); onChangeMode(id) }} onClose={() => setModeOpen(false)} />}
  </PhoneFrame>
}
