import { people } from '../data/content.js'
import Avatar from './Avatar.jsx'

const names = ['내 스토리', 'nietzsche', 'socrates', 'einstein', 'curie', 'davinci']

export default function Stories({ onOpen, onAddStory }) {
  return <div className="flex gap-4 overflow-x-auto border-b border-[#efefef] px-4 pb-4 pt-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
    {names.map((name, index) => {
      const person = people.find((entry) => entry.id === name)
      return <button key={name} onClick={() => index === 0 ? onAddStory() : onOpen(person)} className="flex w-[70px] shrink-0 flex-col items-center gap-1.5">
        <Avatar person={person} size="lg" story={index > 0} own={index === 0} />
        <span className="w-full truncate text-center text-[11px] text-[#262626]">{index === 0 ? '내 스토리' : person?.handle.split('.')[0]}</span>
      </button>
    })}
  </div>
}
