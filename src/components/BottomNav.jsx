import Icon from './Icon.jsx'

const tabs = [
  { id: 'home', label: '홈', icon: 'home' },
  { id: 'search', label: '검색', icon: 'search' },
  { id: 'reels', label: '릴스', icon: 'reel' },
  { id: 'dm', label: '메시지', icon: 'send' },
  { id: 'settings', label: '설정' },
]

export default function BottomNav({ active, onNavigate }) {
  return <nav aria-label="주요 메뉴" className="relative z-30 grid h-[66px] w-full shrink-0 grid-cols-5 items-center border-t border-[#dbdbdb] bg-white px-2 pb-[env(safe-area-inset-bottom)]">
    {tabs.map((tab) => <button key={tab.id} type="button" onClick={() => onNavigate(tab.id)} className="flex h-full flex-col items-center justify-center gap-0.5 text-[#111]" aria-label={tab.label} aria-current={active === tab.id ? 'page' : undefined}>
      {tab.id === 'settings' ? <Icon name="settings" size={24} strokeWidth={active === tab.id ? 2.4 : 1.9} /> : <Icon name={tab.icon} size={25} strokeWidth={active === tab.id ? 2.4 : 1.9} filled={active === tab.id && tab.id === 'home'} className={active === tab.id ? 'scale-[1.02]' : ''} />}
      <span className="sr-only">{tab.label}</span>
    </button>)}
  </nav>
}
