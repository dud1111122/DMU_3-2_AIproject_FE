import { useEffect, useRef, useState } from 'react'
import PhoneFrame from '../../shared/PhoneFrame.jsx'
import useBrowserBack from '../../shared/useBrowserBack.js'
import Guide from '../../shared/Guide.jsx'
import { guideSteps, useGuide } from '../../shared/guide.js'
import { PledgeGate } from '../../shared/PledgeSheet.jsx'
import { BIcon, NavContext, SheetRootContext } from './ui.jsx'
import BasicHome from './BasicHome.jsx'
import BasicArticle from './BasicArticle.jsx'
import BasicQuiz from './BasicQuiz.jsx'
import BasicChat from './BasicChat.jsx'
import { BasicExplore, BasicTopic, BasicRecommend } from './BasicExplore.jsx'
import BasicProfile from './BasicProfile.jsx'
import { BasicDebates, BasicDebateView } from './BasicDebate.jsx'
import BasicStudy from './BasicStudy.jsx'
import { BasicMe, BasicSaved, BasicFollows } from './BasicLibrary.jsx'

const tabs = [
  { id: 'home', label: '홈', icon: 'home' },
  { id: 'explore', label: '탐색', icon: 'search' },
  { id: 'debate', label: '토론', icon: 'debate' },
  { id: 'study', label: '학습', icon: 'book' },
  { id: 'me', label: '내 정보', icon: 'user' },
]
const fullScreens = ['chat', 'quiz']

// 탭마다 화면 스택을 따로 두고, 다녀간 화면은 숨겨 둔 채 유지해 뒤로 가도 스크롤·불러온 목록이 남는다.
export default function BasicApp({ onChangeMode }) {
  const [guideOpen, closeGuide] = useGuide('basic')
  const [tab, setTab] = useState('home')
  const [stacks, setStacks] = useState({ home: [{ screen: 'home', key: 0 }] })
  const [sheetRoot, setSheetRoot] = useState(null)
  const [debatePreset, setDebatePreset] = useState(null)
  const seq = useRef(1)
  const entry = (screen, props = {}) => ({ screen, ...props, key: seq.current++ })
  const stack = stacks[tab]
  const current = stack[stack.length - 1]

  const push = (screen, props) => setStacks((all) => ({ ...all, [tab]: [...all[tab], entry(screen, props)] }))
  const back = () => setStacks((all) => ({ ...all, [tab]: all[tab].length > 1 ? all[tab].slice(0, -1) : all[tab] }))
  const goTab = (id, next) => { setTab(id); setStacks((all) => ({ ...all, [id]: next ? [entry(id), entry(next.screen, next)] : all[id] || [entry(id)] })) }
  const selectTab = (id) => id === tab ? setStacks((all) => ({ ...all, [id]: all[id].slice(0, 1) })) : goTab(id)
  // 지금 탭에 쌓인 화면 수를 브라우저 기록과 맞춘다. 기획 §4.
  useBrowserBack(stack.length, back)

  const nav = {
    push, back, goTab,
    openPost: (postId) => push('post', { postId }),
    openPersona: (personaId) => push('persona', { personaId }),
    openTopic: (topic) => push('topic', { topic }),
    openQuiz: (post) => push('quiz', { post }),
    openChat: (post) => push('chat', { post }),
    openDebate: (debate) => push('debateView', { debateId: debate.id }),
    openRecommend: () => push('recommend'),
    // 퀴즈·채팅에서 글로 돌아갈 때, 바로 전 화면이 그 글이면 새로 쌓지 않는다.
    returnToPost: (postId) => {
      const previous = stack[stack.length - 2]
      if (previous?.screen === 'post' && previous.postId === postId) back()
      else push('post', { postId })
    },
    startDebate: (personaId) => { setDebatePreset({ personaId, at: Date.now() }); setTab('debate'); setStacks((all) => ({ ...all, debate: [entry('debate')] })) },
  }

  // active: 지금 보이는 탭의 맨 위 화면인지. 숨겨 둔 대담은 자동 진행을 멈추는 데 쓴다.
  const render = (item, active) => {
    switch (item.screen) {
      case 'home': return <BasicHome />
      case 'explore': return <BasicExplore />
      case 'debate': return <BasicDebates preset={debatePreset} />
      case 'study': return <BasicStudy />
      case 'me': return <BasicMe onChangeMode={onChangeMode} />
      case 'post': return <BasicArticle postId={item.postId} />
      case 'quiz': return <BasicQuiz post={item.post} />
      case 'chat': return <BasicChat post={item.post} />
      case 'persona': return <BasicProfile personaId={item.personaId} />
      case 'topic': return <BasicTopic topic={item.topic} />
      case 'recommend': return <BasicRecommend />
      case 'debateView': return <BasicDebateView debateId={item.debateId} active={active} />
      case 'saved': return <BasicSaved />
      case 'follows': return <BasicFollows />
      default: return null
    }
  }

  return <PhoneFrame screenClassName="font-basic break-keep bg-[#fbfaf7] text-[#1c1b19]">
    <NavContext.Provider value={nav}>
      <SheetRootContext.Provider value={sheetRoot}>
        <div className="relative min-h-0 flex-1">
          {Object.entries(stacks).map(([id, items]) => items.map((item, index) => <div key={`${id}-${item.key}`} hidden={id !== tab || index !== items.length - 1} className="absolute inset-0 overflow-y-auto overscroll-y-none">
            {render(item, id === tab && index === items.length - 1)}
          </div>))}
        </div>
        {!fullScreens.includes(current.screen) && <nav aria-label="주요 메뉴" className="grid h-[60px] shrink-0 grid-cols-5 border-t border-[#e7e3da] bg-[#fbfaf7]">
          {tabs.map((item) => <button key={item.id} data-guide={`tab-${item.id}`} onClick={() => selectTab(item.id)} aria-current={tab === item.id ? 'page' : undefined} className={`flex flex-col items-center justify-center gap-1 ${tab === item.id ? 'text-[#1c1b19]' : 'text-[#6f6b63]'}`}>
            <BIcon name={item.icon} size={21} strokeWidth={tab === item.id ? 2.2 : 1.8} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>)}
        </nav>}
        <div ref={setSheetRoot} />
        <PledgeGate theme="basic" />
        {guideOpen && tab === 'home' && stack.length === 1 && <Guide mode="basic" steps={guideSteps.basic} onClose={closeGuide} />}
      </SheetRootContext.Provider>
    </NavContext.Provider>
  </PhoneFrame>
}
