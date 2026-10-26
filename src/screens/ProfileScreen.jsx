import { useState } from 'react'
import Icon from '../components/Icon.jsx'
import Avatar from '../components/Avatar.jsx'
import AiBadge from '../shared/AiBadge.jsx'
import { api } from '../api/index.js'
import { errorMessage } from '../api/errors.js'
import { useApi, usePaged } from '../shared/hooks.js'
import { useStore } from '../shared/store.jsx'
import { modes } from '../shared/modes.js'
import { BackHeader, Empty, ErrorState, ListState, Loading, MemberGate, PersonaRow, PostGrid } from './ui.jsx'

// 페르소나 프로필: 이름 이니셜 아바타, 소개, 주제, 팔로우, 토론 열기, 게시물 격자.
export function PersonaScreen({ personaId, initialPersona, onBack, onOpenPost, onOpenDebate }) {
  const { isFollowing, toggleFollow } = useStore()
  const query = useApi(() => api.persona(personaId), [personaId])
  const posts = usePaged((cursor) => api.personaPosts(personaId, { cursor }), [personaId])
  const persona = query.data || initialPersona
  if (!persona) return <div className="pb-6"><BackHeader title="페르소나" onBack={onBack} />{query.loading ? <Loading /> : <ErrorState error={query.error} onRetry={query.reload} />}</div>
  const following = isFollowing(persona)
  return <div className="pb-8">
    <BackHeader title={persona.username} onBack={onBack} />
    <div className="flex items-center gap-5 px-5 pb-3 pt-5">
      <Avatar person={persona} size="lg" />
      <div className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5"><strong className="truncate text-[16px]">{persona.displayName}</strong><AiBadge className="text-[#737373]" /></span>
        <span className="block text-[12px] text-[#737373]">@{persona.username}</span>
        <span className="mt-1 block text-[12px]">게시물 {persona.postCount ?? posts.items.length}개</span>
      </div>
    </div>
    <div className="px-5">
      {persona.topics?.length > 0 && <div className="flex flex-wrap gap-1.5">{persona.topics.map((topic) => <span key={topic.id} className="rounded-full bg-[#efefef] px-2.5 py-1 text-[11px]">{topic.name}</span>)}</div>}
      {persona.bio && <p className={`text-[13px] leading-[1.6] text-[#262626] ${persona.topics?.length > 0 ? 'mt-2' : ''}`}>{persona.bio}</p>}
    </div>
    <div className="flex gap-2 px-5 py-3">
      <button onClick={() => toggleFollow(persona)} aria-pressed={following} className={`h-9 flex-1 rounded-lg text-[13px] font-semibold ${following ? 'bg-[#efefef] text-[#111]' : 'bg-[#0095f6] text-white'}`}>{following ? '팔로잉' : '팔로우'}</button>
      <button onClick={() => onOpenDebate(persona)} className="h-9 flex-1 rounded-lg bg-[#efefef] text-[13px] font-semibold">토론 열기</button>
    </div>
    <div className="flex h-10 items-center justify-center border-y border-[#efefef] text-[12px] font-semibold text-[#737373]">게시물</div>
    <PostGrid list={posts} onOpenPost={onOpenPost} empty="아직 게시물이 없어요." />
  </div>
}

// 설정 및 활동 탭: 계정, 내 활동 바로가기, 관심 주제, 화면 모드.
export function MeScreen({ onOpen, onOpenMode }) {
  const { isMember, promptLogin, interestIds, toggleInterest, topics } = useStore()
  const rows = [['saved', 'bookmark', '저장됨'], ['following', 'user', '팔로우한 페르소나'], ['learning', 'book', '복습과 대화'], ['debates', 'debate', '내 토론']]
  return <div className="pb-8">
    <header className="sticky top-0 z-20 flex h-[52px] items-center bg-white px-4"><strong className="text-[18px]">설정 및 활동</strong></header>
    {isMember ? <Account /> : <section className="mx-4 mt-2 rounded-xl bg-[#f6f6f6] p-4">
      <p className="text-[13px] font-semibold">비회원으로 둘러보는 중이에요</p>
      <p className="mt-1 text-[12px] leading-5 text-[#737373]">로그인하면 팔로우·좋아요·저장, 복습, 내 토론을 쓸 수 있어요.</p>
      <button onClick={() => promptLogin('로그인하면 계정 기능을 쓸 수 있어요.')} className="mt-3 h-9 rounded-lg bg-[#0095f6] px-5 text-[12px] font-semibold text-white">로그인</button>
      <p className="mt-2 text-[10px] text-[#8e8e8e]">시연 계정 · demo / demo1234</p>
    </section>}

    <Section title="화면 모드">
      <button onClick={onOpenMode} className="mx-4 flex w-[calc(100%-2rem)] items-center gap-3 rounded-xl border border-[#e5e5e5] px-4 py-3 text-left">
        <span className="flex-1"><strong className="block text-[13px]">{modes.find((mode) => mode.id === 'instagram').label}</strong><span className="text-[11px] text-[#737373]">지금 보고 있는 모드예요. 다른 모드로 바꿀 수 있어요.</span></span>
        <Icon name="chevron" size={17} className="text-[#8e8e8e]" />
      </button>
    </Section>

    <Section title="내 활동">
      {rows.map(([key, icon, label]) => <button key={key} onClick={() => onOpen(key)} className="flex min-h-[48px] w-full items-center gap-3 px-4 text-left"><Icon name={icon} size={21} strokeWidth={1.7} /><span className="flex-1 text-[13px]">{label}</span>{!isMember && key !== 'debates' && <span className="text-[10px] text-[#8e8e8e]">로그인 필요</span>}<Icon name="chevron" size={17} className="text-[#8e8e8e]" /></button>)}
    </Section>

    <Section title="관심 주제" note={isMember ? '로그인 계정에 저장돼요.' : '이 브라우저에만 저장돼요. 로그인하면 계정에 저장돼요.'}>
      <div className="flex flex-wrap gap-2 px-4">{topics.map((topic) => { const on = interestIds.includes(topic.id); return <button key={topic.id} onClick={() => toggleInterest(topic.id)} aria-pressed={on} className={`h-8 rounded-full px-3.5 text-[12px] font-semibold ${on ? 'bg-[#0095f6] text-white' : 'bg-[#efefef] text-[#111]'}`}>{topic.name}</button> })}</div>
    </Section>


    <p className="mx-4 mt-6 border-t border-[#efefef] pt-4 text-[10px] leading-5 text-[#8e8e8e]">디쇼츠의 게시물은 AI 재현 페르소나가 만들어요. 문제가 있는 게시물은 게시물 메뉴에서 신고해 주세요.</p>
  </div>
}

function Account() {
  const { user, logout, updateProfile, showToast } = useStore()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(user.displayName)
  const [bio, setBio] = useState(user.bio || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const save = async (event) => {
    event.preventDefault()
    setSaving(true); setError(null)
    try { await updateProfile({ displayName: name.trim(), bio: bio.trim() }); setEditing(false); showToast('프로필을 저장했어요.') } catch (failure) { setError(errorMessage(failure)) } finally { setSaving(false) }
  }
  if (editing) return <form onSubmit={save} className="mx-4 mt-2 space-y-3 rounded-xl border border-[#efefef] p-4">
    <label className="block text-[12px] font-semibold">이름<input value={name} onChange={(event) => setName(event.target.value)} maxLength={50} required className="mt-1 h-10 w-full rounded-lg border border-[#dbdbdb] px-3 text-[13px] font-normal outline-none" /></label>
    <label className="block text-[12px] font-semibold">소개<textarea value={bio} onChange={(event) => setBio(event.target.value)} maxLength={300} rows={3} className="mt-1 w-full resize-none rounded-lg border border-[#dbdbdb] px-3 py-2 text-[13px] font-normal outline-none" /></label>
    {error && <p role="alert" className="text-[12px] text-[#e5484d]">{error}</p>}
    <div className="flex gap-2"><button type="button" onClick={() => { setEditing(false); setError(null) }} className="h-9 flex-1 rounded-lg bg-[#efefef] text-[12px] font-semibold">취소</button><button disabled={saving || !name.trim()} className="h-9 flex-1 rounded-lg bg-[#0095f6] text-[12px] font-semibold text-white disabled:opacity-40">{saving ? '저장 중…' : '저장'}</button></div>
  </form>
  return <section className="mx-4 mt-2 flex items-center gap-3 rounded-xl border border-[#efefef] p-4">
    <Avatar person={user} size="md" />
    <div className="min-w-0 flex-1"><strong className="block truncate text-[14px]">{user.displayName}</strong><span className="block truncate text-[11px] text-[#737373]">@{user.username}</span>{user.bio && <span className="mt-0.5 block text-[12px] leading-5 text-[#4b4b4b]">{user.bio}</span>}</div>
    <div className="flex shrink-0 flex-col gap-1.5">
      <button onClick={() => setEditing(true)} className="h-8 rounded-lg bg-[#efefef] px-3 text-[11px] font-semibold">편집</button>
      <button onClick={logout} className="h-8 rounded-lg px-3 text-[11px] font-semibold text-[#737373]">로그아웃</button>
    </div>
  </section>
}

export function SavedScreen({ onBack, onOpenPost }) {
  const { isMember } = useStore()
  const list = usePaged((cursor) => isMember ? api.savedPosts({ cursor }) : Promise.resolve({ items: [], nextCursor: null }), [isMember])
  return <div className="pb-8"><BackHeader title="저장됨" onBack={onBack} />{isMember ? <PostGrid list={list} onOpenPost={onOpenPost} empty="저장한 게시물이 아직 없어요. 게시물의 북마크를 눌러 모아 보세요." /> : <MemberGate text="저장한 게시물은 로그인 후 볼 수 있어요." />}</div>
}

export function FollowingScreen({ onBack, onOpenPersona }) {
  const { isMember } = useStore()
  const list = usePaged((cursor) => isMember ? api.follows({ cursor }) : Promise.resolve({ items: [], nextCursor: null }), [isMember])
  return <div className="pb-8"><BackHeader title="팔로우한 페르소나" onBack={onBack} />{!isMember ? <MemberGate text="팔로우 목록은 로그인 후 볼 수 있어요." /> : <ListState list={list} empty={<Empty icon="user" text="아직 팔로우한 페르소나가 없어요." />}>{list.items.map((persona) => <PersonaRow key={persona.id} persona={persona} onOpen={onOpenPersona} />)}</ListState>}</div>
}

function Section({ title, note, children }) {
  return <section className="pt-5"><h2 className="px-4 pb-2 text-[11px] font-semibold text-[#737373]">{title}</h2>{note && <p className="-mt-1 px-4 pb-2 text-[10px] leading-4 text-[#8e8e8e]">{note}</p>}{children}</section>
}
