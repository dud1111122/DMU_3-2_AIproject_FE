import Icon from '../components/Icon.jsx'
import Stories from '../components/Stories.jsx'
import PostCard from '../components/PostCard.jsx'
import { people, posts } from '../data/content.js'

export default function HomeScreen({ onOpenPerson, onOpenStory, onAddStory, onOpenPost, onOpenComments, savedIds, likedIds, onToggleSave, onToggleLike, onOpenActivity }) {
  return <div className="h-full overflow-y-auto pb-20">
    <header className="flex h-[54px] items-center justify-between px-4">
      <button className="wordmark" onClick={() => window.scrollTo(0, 0)} aria-label="디쇼츠 홈">디쇼츠</button>
      <div className="flex items-center gap-4">
        <button onClick={() => onOpenActivity('새 게시물')} aria-label="새 게시물 만들기"><Icon name="plus" size={26} strokeWidth={2} /></button>
        <button onClick={() => onOpenActivity('알림')} aria-label="알림"><Icon name="heart" size={25} /></button>
      </div>
    </header>
    <Stories onOpen={onOpenStory} onAddStory={onAddStory} />
    {posts.map((post) => <PostCard key={post.id} post={post} person={people.find((person) => person.id === post.personId)} saved={savedIds.includes(post.id)} liked={likedIds.includes(post.id)} onToggleSave={onToggleSave} onToggleLike={onToggleLike} onOpenPerson={onOpenPerson} onOpenPost={onOpenPost} onOpenComments={onOpenComments} />)}
  </div>
}
