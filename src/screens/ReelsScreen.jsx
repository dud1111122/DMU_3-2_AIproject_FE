import { useState } from 'react'
import Icon from '../components/Icon.jsx'
import Avatar from '../components/Avatar.jsx'
import { people, reels } from '../data/content.js'

export default function ReelsScreen({ onOpenPerson, onOpenComments }) {
  const [liked, setLiked] = useState({})
  return <div className="reel-feed h-full snap-y snap-mandatory overflow-y-auto bg-black">
    {reels.map((reel) => {
      const person = people.find((item) => item.id === reel.personId)
      return <article key={reel.id} className="relative h-full min-h-[620px] snap-start overflow-hidden bg-black text-white">
        <img src={reel.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/25" />
        <header className="absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-4"><strong className="text-base">릴스</strong><button aria-label="카메라"><Icon name="camera" size={23} /></button></header>
        <div className="absolute bottom-6 left-4 right-[72px]">
          <button onClick={() => onOpenPerson(person)} className="mb-3 flex items-center gap-2.5 text-left"><Avatar person={person} size="sm" /><strong className="text-sm">{person.handle}</strong><span className="rounded-md border border-white/70 px-2 py-1 text-[10px]">팔로우</span></button>
          <h2 className="text-[18px] font-semibold">{reel.title}</h2><p className="mt-1 line-clamp-2 text-[13px] leading-5">{reel.text}</p>
          <p className="mt-2 text-[10px] text-white/75">♫ 오늘의 지식 · 카드뉴스</p>
        </div>
        <div className="absolute bottom-20 right-3 flex flex-col items-center gap-5">
          <button onClick={() => setLiked((value) => ({ ...value, [reel.id]: !value[reel.id] }))} className="flex flex-col items-center gap-1"><Icon name="heart" size={29} filled={liked[reel.id]} className={liked[reel.id] ? 'text-red-500' : ''} /><span className="text-[10px]">{liked[reel.id] ? '3.2만' : reel.likes}</span></button>
          <button onClick={() => onOpenComments({ id: reel.id })} className="flex flex-col items-center gap-1"><Icon name="comment" size={28} /><span className="text-[10px]">106</span></button>
          <button aria-label="리믹스"><Icon name="reel" size={27} /></button><button aria-label="공유"><Icon name="send" size={27} /></button><button aria-label="더 보기"><Icon name="more" size={24} /></button>
        </div>
        <button className="absolute right-4 top-16 grid h-10 w-10 place-items-center rounded-full bg-black/25" aria-label="일시정지"><Icon name="play" size={20} /></button>
      </article>
    })}
  </div>
}
