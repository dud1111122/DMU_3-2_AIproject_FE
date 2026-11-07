import { useState } from 'react'
import { api, API_MODE } from '../../api/index.js'
import { errorMessage } from '../../api/errors.js'
import { usePaged } from '../../shared/hooks.js'
import { useStore } from '../../shared/store.jsx'
import { modes } from '../../shared/modes.js'
import { reviewReasonLabels } from '../../shared/format.js'
import { BundleSizeSelect } from '../../shared/UsageComponents.jsx'
import Icon from '../../components/Icon.jsx'
import { BIcon, Empty, ErrorState, GhostButton, LoadMore, Notice, PersonaRow, PostRow, PrimaryButton, SectionTitle, Skeleton, TopBar, useNav } from './ui.jsx'

// 내 정보 탭: 계정, 보관함 바로가기, 화면 모드를 한곳에 둔다.
export function BasicMe({ onChangeMode }) {
  const nav = useNav()
  const { user, isMember, sessionStatus, login, logout, updateProfile, showToast, promptLogin, topics, interestIds } = useStore()
  const [editing, setEditing] = useState(false)

  return <div className="pb-8">
    <TopBar large title="내 정보" />
    <div className="px-5 pt-4">
      {sessionStatus === 'loading' && <Skeleton rows={1} />}
      {sessionStatus !== 'loading' && !isMember && <section className="rounded-2xl border border-[#e7e3da] bg-white p-5" aria-labelledby="me-guest">
        <h2 id="me-guest" className="font-basic text-[18px] font-bold text-balance">로그인하지 않은 상태예요</h2>
        <p className="mt-2 text-[12px] leading-5 text-[#6f6b63]">로그인하면 팔로우·좋아요·저장과 퀴즈 기록, 복습, 토론 기록을 남길 수 있어요. 지금은 글 읽기·퀴즈·대화를 체험할 수 있어요. 토론은 로그인 후 만들 수 있어요.</p>
        <PrimaryButton onClick={() => promptLogin('로그인하면 팔로우·저장·복습 기록을 남길 수 있어요.')} className="mt-4 w-full">로그인</PrimaryButton>
        {API_MODE === 'mock' && <p className="mt-2 text-center text-[11px] text-[#6f6b63]">시연 계정 · demo / demo1234</p>}
      </section>}

      {isMember && <section className="rounded-2xl border border-[#e7e3da] bg-white p-5" aria-labelledby="me-account">
        {editing ? <ProfileForm user={user} onCancel={() => setEditing(false)} onSave={async (changes) => { await updateProfile(changes); setEditing(false); showToast('프로필을 저장했어요.') }} />
          : <>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 id="me-account" className="font-basic truncate text-[20px] font-bold text-balance">{user.displayName}</h2>
                <p className="mt-0.5 text-[12px] text-[#6f6b63]">@{user.username}</p>
              </div>
              <GhostButton onClick={() => setEditing(true)} className="h-8 shrink-0 px-3 text-[12px]">수정</GhostButton>
            </div>
            {user.bio ? <p className="mt-3 text-[13px] leading-[1.7] text-[#3d3a35]">{user.bio}</p> : <p className="mt-3 text-[12px] text-[#a39e93]">소개를 적어 보세요.</p>}
            <button onClick={() => nav.push('recommend')} className="mt-4 flex w-full items-center justify-between border-t border-[#efece4] pt-3 text-left text-[13px]">
              <span>관심 주제 <span className="text-[#6f6b63]">{interestIds.length}개</span></span><Icon name="chevron" size={17} className="text-[#a39e93]" />
            </button>
            <button onClick={async () => { await logout() }} className="mt-2 h-9 w-full rounded-full border border-[#d9d4c9] text-[12px] font-semibold text-[#3d3a35]">로그아웃</button>
          </>}
      </section>}

      <section className="mt-7" aria-labelledby="me-library">
        <SectionTitle id="me-library">보관함</SectionTitle>
        <div className="mt-2 divide-y divide-[#e7e3da] rounded-xl border border-[#e7e3da] bg-white">
          <MenuRow icon="bookmark" label="저장한 글" onClick={() => (isMember ? nav.push('saved') : promptLogin('저장한 글은 로그인 후 볼 수 있어요.'))} />
          <MenuRow icon="heart" label="팔로우한 인물" onClick={() => (isMember ? nav.push('follows') : promptLogin('팔로우한 인물은 로그인 후 볼 수 있어요.'))} />
          <MenuRow icon="book" label="복습" onClick={() => (isMember ? nav.goTab('study') : promptLogin('복습은 로그인 후 쓸 수 있어요.'))} />
          <MenuRow icon="debate" label="내 토론" onClick={() => (isMember ? nav.goTab('debate') : promptLogin('내 토론은 로그인 후 볼 수 있어요.'))} />
        </div>
      </section>

      <section className="mt-7" aria-labelledby="me-bundle">
        <SectionTitle id="me-bundle">묶음 보기</SectionTitle>
        <p className="mt-2 text-[11px] leading-5 text-[#6f6b63]">홈 피드와 쇼츠에서 한 번에 볼 게시물 수예요. 묶음을 다 보면 멈출지 정할 수 있어요. 이 기기에 저장돼요.</p>
        <div className="mt-3"><BundleSizeSelect theme="basic" /></div>
      </section>

      <section className="mt-7" aria-labelledby="me-mode">
        <SectionTitle id="me-mode">화면 모드</SectionTitle>
        <p className="mt-2 text-[11px] leading-5 text-[#6f6b63]">모드를 바꿔도 같은 글과 저장·좋아요·팔로우 상태가 그대로 유지돼요.</p>
        <div className="mt-3 space-y-2">{modes.map((mode) => <button key={mode.id} onClick={() => mode.id !== 'basic' && onChangeMode(mode.id)} aria-pressed={mode.id === 'basic'} className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left ${mode.id === 'basic' ? 'border-[#1c1b19] bg-white' : 'border-[#e7e3da]'}`}>
          <span className="flex-1"><strong className="block text-[14px]">{mode.label}</strong><span className="text-[12px] text-[#6f6b63]">{mode.description}</span></span>
          {mode.id === 'basic' ? <span className="flex items-center gap-1 text-[11px] font-semibold text-[#2f5d50]"><Icon name="check" size={16} strokeWidth={2.4} />사용 중</span> : <Icon name="chevron" size={18} className="text-[#a39e93]" />}
        </button>)}</div>
      </section>

      <p className="mt-8 border-t border-[#e7e3da] pt-4 text-[11px] leading-5 text-[#6f6b63]">디쇼츠는 AI 페르소나가 쓴 지식 글을 보여줘요. 글마다 출처와 AI 표시를 확인해 주세요.<br />{topics.length ? `주제 ${topics.length}개` : ''} · 버전 0.1</p>
    </div>
  </div>
}

function MenuRow({ icon, label, onClick }) {
  return <button onClick={onClick} className="flex h-[52px] w-full items-center gap-3 px-4 text-left">
    <BIcon name={icon} size={19} /><span className="flex-1 text-[14px]">{label}</span><Icon name="chevron" size={17} className="text-[#a39e93]" />
  </button>
}

function ProfileForm({ user, onCancel, onSave }) {
  const [displayName, setDisplayName] = useState(user.displayName)
  const [bio, setBio] = useState(user.bio || '')
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try { await onSave({ displayName: displayName.trim(), bio: bio.trim() }) } catch (failure) { setError(errorMessage(failure)) } finally { setSaving(false) }
  }
  const field = 'mt-1 w-full rounded-lg border border-[#d9d4c9] bg-white px-3 text-[14px] font-normal outline-none'
  return <form onSubmit={submit} aria-label="프로필 수정">
    <label className="block text-[12px] font-semibold">이름<input value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={50} required className={`${field} h-11`} /></label>
    <label className="mt-3 block text-[12px] font-semibold">소개<textarea value={bio} onChange={(event) => setBio(event.target.value.slice(0, 300))} rows={3} maxLength={300} className={`${field} resize-none py-2.5`} /></label>
    <p className="mt-1 text-right text-[10px] text-[#6f6b63]">{bio.length}/300</p>
    {error && <Notice tone="error" className="mt-2">{error}</Notice>}
    <div className="mt-3 flex gap-2">
      <GhostButton type="button" onClick={onCancel} className="h-10 flex-1">취소</GhostButton>
      <PrimaryButton type="submit" disabled={saving || !displayName.trim()} className="h-10 flex-1">{saving ? '저장 중…' : '저장'}</PrimaryButton>
    </div>
  </form>
}

export function BasicSaved() {
  const nav = useNav()
  const saved = usePaged((cursor) => api.savedPosts({ cursor }), [])
  return <div className="pb-8">
    <TopBar onBack={nav.back} title="저장한 글" />
    <div className="px-5">
      {saved.loading && !saved.items.length && <Skeleton rows={3} />}
      {saved.error && !saved.items.length && <ErrorState error={saved.error} onRetry={saved.reload} />}
      {!saved.loading && !saved.error && !saved.items.length && <Empty title="저장한 글이 없어요" text="글에서 책갈피를 누르면 여기에서 다시 열 수 있어요." />}
      {saved.items.map((post) => <PostRow key={post.id} post={post} onOpen={nav.openPost} />)}
      <LoadMore list={saved} />
    </div>
  </div>
}

export function BasicFollows() {
  const nav = useNav()
  const follows = usePaged((cursor) => api.follows({ cursor }), [])
  return <div className="pb-8">
    <TopBar onBack={nav.back} title="팔로우한 인물" />
    <div className="px-5">
      {follows.loading && !follows.items.length && <Skeleton rows={3} />}
      {follows.error && !follows.items.length && <ErrorState error={follows.error} onRetry={follows.reload} />}
      {!follows.loading && !follows.error && !follows.items.length && <Empty title="팔로우한 인물이 없어요" text="인물 프로필에서 팔로우하면 그 인물의 새 글을 홈의 ‘팔로우’ 필터에서 볼 수 있어요." />}
      {follows.items.map((persona) => <PersonaRow key={persona.id} persona={persona} onOpen={nav.openPersona} meta={`@${persona.username} · 글 ${persona.postCount}`} />)}
      <LoadMore list={follows} />
    </div>
  </div>
}
