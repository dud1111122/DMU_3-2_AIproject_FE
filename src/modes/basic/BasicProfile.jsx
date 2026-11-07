import { api } from '../../api/index.js'
import { useApi, usePaged } from '../../shared/hooks.js'
import AiBadge from '../../shared/AiBadge.jsx'
import { AI_DISCLOSURE } from '../../shared/format.js'
import Icon from '../../components/Icon.jsx'
import { ErrorState, FollowButton, LoadMore, Monogram, Notice, PostRow, SectionTitle, Skeleton, TopBar, useNav } from './ui.jsx'

export default function BasicProfile({ personaId }) {
  const nav = useNav()
  const persona = useApi(() => api.persona(personaId), [personaId])
  const posts = usePaged((cursor) => api.personaPosts(personaId, { cursor }), [personaId])
  const p = persona.data

  return <div className="pb-8">
    <TopBar onBack={nav.back} title="인물" />
    {!p && (persona.loading ? <Skeleton rows={2} /> : <ErrorState error={persona.error} onRetry={persona.reload} />)}
    {p && <>
      <div className="px-5 pt-6 text-center">
        <div className="mx-auto w-fit"><Monogram name={p.displayName} src={p.avatarUrl} size="h-20 w-20 text-[28px]" /></div>
        <h1 className="font-basic mt-4 text-[26px] font-bold text-balance">{p.displayName}</h1>
        <p className="mt-1 flex items-center justify-center gap-1.5 text-[12px] text-[#6f6b63]">@{p.username}<AiBadge />{p.followerCount != null && <span className="text-[#6f6b63]">· 팔로워 {p.followerCount}명</span>}</p>
        {p.era && <p className="mt-1 text-[12px] text-[#6f6b63]">{p.era}</p>}
        <p className="mt-4 text-[14px] leading-[1.7] text-[#3d3a35]">{p.bio}</p>
        <div className="mt-3 flex flex-wrap justify-center gap-1.5">{p.topics.map((topic) => <button key={topic.id} onClick={() => nav.openTopic(topic)} className="rounded-full bg-[#efece4] px-2.5 py-1 text-[11px] text-[#4a4741]">#{topic.name}</button>)}</div>
        <div className="mt-5 flex gap-2">
          <FollowButton target={p} name={p.displayName} className="h-10 flex-1 text-[13px]" />
          <button onClick={() => nav.startDebate(p.id)} className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-[#2f5d50] text-[13px] font-semibold text-white"><Icon name="comment" size={17} />토론 시작</button>
        </div>
        <Notice className="mt-4 text-left">{p.aiDisclosure || AI_DISCLOSURE} {p.displayName}의 관점과 말투를 재현했어요.</Notice>
      </div>

      <section className="px-5 pt-7" aria-labelledby="profile-posts">
        <SectionTitle id="profile-posts" right={<span className="pb-0.5 text-[11px] text-[#6f6b63]">{p.postCount}편</span>}>게시한 글</SectionTitle>
        {posts.loading && !posts.items.length && <Skeleton rows={2} />}
        {posts.error && !posts.items.length && <ErrorState compact error={posts.error} onRetry={posts.reload} />}
        {!posts.loading && !posts.error && !posts.items.length && <p className="py-10 text-center text-[13px] text-[#6f6b63]">아직 게시한 글이 없어요.</p>}
        {posts.items.map((post) => <PostRow key={post.id} post={post} onOpen={nav.openPost} showSave={false} />)}
        <LoadMore list={posts} />
      </section>
    </>}
  </div>
}
