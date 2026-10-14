export default function Avatar({ person, size = 'md', story = false, own = false, onClick }) {
  const sizes = { xs: 'h-8 w-8', sm: 'h-10 w-10', md: 'h-12 w-12', lg: 'h-[74px] w-[74px]' }
  return <button type="button" onClick={onClick} className={`relative shrink-0 rounded-full ${story ? 'story-ring p-[2px]' : ''}`} aria-label={`${person?.name || '내'} 프로필 보기`}>
    <span className={`block overflow-hidden rounded-full bg-gray-200 ${sizes[size] || sizes.md} ${story ? 'border-2 border-white' : ''}`}>
      {person?.avatar ? <img src={person.avatar} alt="" className="h-full w-full object-cover" /> : <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-200 to-pink-100 text-lg font-bold text-gray-600">D</span>}
    </span>
    {own && <span className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-sky-500 text-white">+</span>}
  </button>
}
