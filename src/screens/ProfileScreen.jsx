import { useState } from 'react'
import Icon from '../components/Icon.jsx'
import Avatar from '../components/Avatar.jsx'
import { posts, reels } from '../data/content.js'

export function PersonProfile({ person, onBack, onOpenPost, onOpenMessage, onOpenReels, onOpenMore, followed, onToggleFollow }) {
  const [tab, setTab] = useState('posts')
  const personPosts = posts.filter((post) => post.personId === person.id)
  const personReels = reels.filter((reel) => reel.personId === person.id)
  return <div className="h-full overflow-y-auto pb-20">
    <header className="flex h-[54px] items-center gap-4 px-4"><button onClick={onBack} aria-label="뒤로"><Icon name="back" size={23} /></button><strong className="flex-1 text-[16px]">{person.handle}</strong><button onClick={onOpenMore} aria-label="더 보기"><Icon name="more" size={23} /></button></header>
    <div className="flex items-center gap-6 px-5 py-4"><Avatar person={person} size="lg" /><div className="flex flex-1 justify-around text-center"><div><strong className="block text-[17px]">{person.id === 'nietzsche' ? '12' : '8'}</strong><span className="text-[11px]">게시물</span></div><div><strong className="block text-[17px]">{person.id === 'nietzsche' ? '24.8만' : '8.2만'}</strong><span className="text-[11px]">팔로워</span></div><div><strong className="block text-[17px]">{person.id === 'nietzsche' ? '48' : '31'}</strong><span className="text-[11px]">팔로잉</span></div></div></div>
    <div className="px-4"><strong className="text-[13px]">{person.name}</strong><p className="mt-1 text-[12px] leading-[1.6] text-[#4b4b4b]">{person.bio}<br />{person.era} · {person.field}<br /><span className="text-[#00376b]">de-shorts.kr/{person.id}</span></p></div>
    <div className="flex gap-2 px-4 py-3"><button onClick={() => onToggleFollow(person.id)} className={`h-8 flex-1 rounded-lg text-[12px] font-semibold ${followed ? 'bg-[#efefef] text-black' : 'bg-[#0095f6] text-white'}`}>{followed ? '팔로잉' : '팔로우'}</button><button onClick={onOpenMessage} className="h-8 flex-1 rounded-lg bg-[#efefef] text-[12px] font-semibold">메시지</button><button onClick={onOpenMore} className="grid h-8 w-10 place-items-center rounded-lg bg-[#efefef]" aria-label="추천"><Icon name="plus" size={18} /></button></div>
    <div className="flex h-11 border-y border-[#efefef]"><button onClick={() => setTab('posts')} className={`flex flex-1 items-center justify-center ${tab === 'posts' ? 'border-b-2 border-black' : 'text-[#8e8e8e]'}`} aria-label="게시물 격자"><Icon name="grid" size={20} /></button><button onClick={() => setTab('reels')} className={`flex flex-1 items-center justify-center ${tab === 'reels' ? 'border-b-2 border-black' : 'text-[#8e8e8e]'}`} aria-label="릴스"><Icon name="reel" size={20} /></button><button onClick={() => setTab('tagged')} className={`flex flex-1 items-center justify-center ${tab === 'tagged' ? 'border-b-2 border-black' : 'text-[#8e8e8e]'}`} aria-label="태그된 게시물"><Icon name="camera" size={20} /></button></div>
    {tab === 'posts' && <div className="grid grid-cols-3 gap-[2px]">{personPosts.map((post) => <button key={post.id} onClick={() => onOpenPost(post)} aria-label={`${post.slides[0].title} 게시물 열기`} className="aspect-square overflow-hidden bg-[#eee]"><img className="h-full w-full object-cover" src={post.slides[0].image} alt="" /></button>)}</div>}
    {tab === 'reels' && <div className="grid grid-cols-3 gap-[2px]">{personReels.map((reel) => <button key={reel.id} onClick={onOpenReels} aria-label={`${reel.title} 릴스 보기`} className="relative aspect-[.68] overflow-hidden bg-black"><img className="h-full w-full object-cover" src={reel.image} alt=""/><span className="absolute right-2 top-2 text-white"><Icon name="reel" size={17} /></span></button>)}{!personReels.length && <ProfileEmpty text="아직 릴스가 없어요." />}</div>}
    {tab === 'tagged' && <ProfileEmpty text="태그된 게시물이 아직 없어요." />}
  </div>
}

export function SettingsScreen({ savedCount, followedCount, onOpenSaved, onOpenFollowing, onOpenNotifications, onOpenPrivacy, onOpenAbout }) {
  const rows = [
    ['저장됨', 'bookmark', onOpenSaved], ['관심 인물 관리', 'heart', onOpenFollowing], ['알림', 'comment', onOpenNotifications], ['사용 방법', 'grid', onOpenAbout], ['개인정보 및 표시', 'settings', onOpenPrivacy],
  ]
  return <div className="h-full overflow-y-auto pb-20">
    <header className="flex h-[54px] items-center justify-between px-4"><strong className="text-[18px]">설정 및 활동</strong><button onClick={onOpenAbout} aria-label="메뉴"><Icon name="dots" size={23} /></button></header>
    <div className="mx-4 mt-3 rounded-xl bg-[#f6f6f6] p-4"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-full bg-black text-white"><span className="wordmark text-[18px]">D</span></span><div><strong className="block text-[14px]">de-shorts</strong><span className="text-[11px] text-[#737373]">지식 피드 이용 중</span></div></div><button onClick={onOpenAbout} className="mt-4 h-8 w-full rounded-lg bg-[#e9e9e9] text-[12px] font-semibold">계정 정보</button></div>
    <div className="px-4 pb-1 pt-6"><p className="text-[11px] font-semibold text-[#737373]">내 활동</p></div>
    {rows.map(([label, icon, action], index) => <button key={label} onClick={action} className="flex min-h-[53px] w-full items-center gap-3 px-4 text-left"><Icon name={icon} size={21} strokeWidth={1.7} /><span className="flex-1 text-[13px]">{label}</span>{index === 0 && <span className="text-[11px] text-[#737373]">{savedCount}개</span>}{index === 1 && <span className="text-[11px] text-[#737373]">{followedCount}명</span>}<Icon name="chevron" size={17} className="text-[#8e8e8e]" /></button>)}
    <div className="mx-4 mt-3 border-t border-[#efefef] pt-4"><p className="text-[10px] leading-5 text-[#8e8e8e]">디쇼츠는 인물과 지식 콘텐츠를 연결하는 학습형 피드입니다.<br />버전 0.1 · 소개와 출처는 게시물에서 확인할 수 있어요.</p></div>
  </div>
}

export function SavedScreen({ savedPosts, onBack, onOpenPost }) {
  return <div className="h-full overflow-y-auto pb-20"><header className="flex h-[54px] items-center gap-4 border-b border-[#efefef] px-4"><button onClick={onBack} aria-label="뒤로"><Icon name="back" size={23} /></button><strong className="text-[16px]">저장됨</strong></header>{savedPosts.length ? <div className="grid grid-cols-3 gap-[2px]">{savedPosts.map((post) => <button key={post.id} onClick={() => onOpenPost(post)} className="aspect-square overflow-hidden"><img src={post.slides[0].image} alt="" className="h-full w-full object-cover" /></button>)}</div> : <div className="flex h-[70%] flex-col items-center justify-center px-10 text-center"><Icon name="bookmark" size={38} strokeWidth={1.3} /><h2 className="mt-4 text-[19px] font-semibold">게시물을 저장해 보세요</h2><p className="mt-2 text-[12px] leading-5 text-[#737373]">마음에 드는 지식 카드는 나중에 다시 볼 수 있도록 저장할 수 있어요.</p></div>}</div>
}

export function FollowingScreen({ followedPeople, onBack, onOpenPerson, onToggleFollow }) {
  return <div className="h-full overflow-y-auto pb-20"><header className="flex h-[54px] items-center gap-4 border-b border-[#efefef] px-4"><button onClick={onBack} aria-label="뒤로"><Icon name="back" size={23} /></button><strong className="text-[16px]">관심 인물</strong></header>{followedPeople.map((person) => <div key={person.id} className="flex items-center gap-3 px-4 py-3"><button onClick={() => onOpenPerson(person)}><Avatar person={person} size="md" /></button><button onClick={() => onOpenPerson(person)} className="min-w-0 flex-1 text-left"><strong className="block truncate text-[13px]">{person.handle}</strong><span className="block truncate text-[11px] text-[#737373]">{person.name} · {person.field}</span></button><button onClick={() => onToggleFollow(person.id)} className="rounded-lg bg-[#efefef] px-3 py-2 text-[11px] font-semibold">팔로잉</button></div>)}{!followedPeople.length && <ProfileEmpty text="아직 팔로우한 인물이 없어요." />}</div>
}

function ProfileEmpty({ text }) {
  return <div className="col-span-3 flex min-h-[190px] flex-col items-center justify-center px-8 text-center text-[#737373]"><Icon name="camera" size={32} strokeWidth={1.5} /><p className="mt-3 text-[12px]">{text}</p></div>
}
