import Icon from './Icon.jsx'

const tabs = [
  { id: 'home', label: '홈', icon: 'home' },
  { id: 'search', label: '검색', icon: 'search' },
  { id: 'debates', label: '토론', icon: 'debate' },
  { id: 'learning', label: '학습', icon: 'book' },
  { id: 'me', label: '내 정보', icon: 'user' },
]

export default function BottomNav({ active, onNavigate }) {
  return <nav aria-label="주요 메뉴" className="relative z-30 grid h-[54px] w-full shrink-0 grid-cols-5 items-center border-t border-[#dbdbdb] bg-white px-2">
    {tabs.map((tab) => <button key={tab.id} type="button" data-guide={`ig-tab-${tab.id}`} onClick={() => onNavigate(tab.id)} className="flex h-full flex-col items-center justify-center text-[#111]" aria-label={tab.label} aria-current={active === tab.id ? 'page' : undefined}>
      <Icon name={tab.icon} size={25} strokeWidth={active === tab.id ? 2.4 : 1.8} filled={active === tab.id && tab.id === 'home'} />
    </button>)}
  </nav>
}
