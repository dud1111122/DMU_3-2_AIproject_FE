import { useState } from 'react'
import Icon from '../components/Icon.jsx'
import Avatar from '../components/Avatar.jsx'
import { messages, people } from '../data/content.js'
import usePersistedState from '../hooks/usePersistedState.js'

export default function DmScreen({ conversation, setConversation, onNewMessage, onRequests }) {
  const [query, setQuery] = useState('')
  const person = conversation ? people.find((item) => item.id === conversation.personId) : null
  if (conversation && person) return <Conversation person={person} onBack={() => setConversation(null)} />
  const visibleMessages = messages.filter((message) => {
    const target = people.find((item) => item.id === message.personId)
    return `${target?.handle} ${target?.name}`.toLowerCase().includes(query.toLowerCase())
  })
  return <div className="h-full overflow-y-auto pb-20">
    <header className="flex h-[54px] items-center justify-between px-4"><button className="flex items-center gap-2 text-[18px] font-bold">de-shorts <span className="text-xs">⌄</span></button><button onClick={onNewMessage} aria-label="새 메시지"><Icon name="plus" size={24} /></button></header>
    <label className="mx-4 flex h-10 items-center gap-2 rounded-xl bg-[#efefef] px-3 text-[#8e8e8e]"><Icon name="search" size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="검색" className="w-full bg-transparent text-sm outline-none placeholder:text-[#8e8e8e]" /></label>
    <div className="flex gap-4 overflow-x-auto px-4 pb-3 pt-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{people.slice(0, 4).map((item, index) => <button key={item.id} onClick={() => setConversation({ personId: item.id })} className="flex w-[68px] shrink-0 flex-col items-center gap-1.5"><span className="relative"><Avatar person={item} size="lg" />{index === 0 && <span className="absolute -right-1 -top-1 rounded-full bg-white px-2 py-1 text-[9px] shadow">오늘의 생각</span>}</span><span className="truncate text-[11px]">{index === 0 ? '내 메모' : item.name.split(' ').at(-1)}</span></button>)}</div>
    <div className="flex items-center justify-between px-4 pb-2 pt-2"><h1 className="text-[16px] font-bold">메시지</h1><button onClick={onRequests} className="text-[12px] font-semibold text-[#737373]">요청</button></div>
    {visibleMessages.map((message) => { const target = people.find((item) => item.id === message.personId); return <button key={message.id} onClick={() => setConversation(message)} className="flex w-full items-center gap-3 px-4 py-3 text-left"><Avatar person={target} size="lg" /><span className="min-w-0 flex-1"><strong className="block text-[14px] font-medium">{target.handle}</strong><span className="mt-1 block truncate text-[12px] text-[#737373]">{message.preview} · {message.time}</span></span>{message.unread && <span className="h-2 w-2 rounded-full bg-[#3797f0]" />}</button> })}
  </div>
}

function Conversation({ person, onBack }) {
  const [text, setText] = useState('')
  const [sent, setSent] = usePersistedState(`de-shorts-fe2:dm:${person.id}`, [])
  const submit = (event) => { event.preventDefault(); if (text.trim()) { setSent((items) => [...items, text.trim()]); setText('') } }
  return <div className="flex h-full flex-col pb-20">
    <header className="flex h-[56px] shrink-0 items-center gap-3 border-b border-[#efefef] px-3"><button onClick={onBack} aria-label="메시지 목록으로"><Icon name="back" size={23} /></button><Avatar person={person} size="sm" /><span className="flex-1"><strong className="block text-[13px]">{person.handle}</strong><small className="text-[10px] text-[#737373]">{person.name}</small></span><button aria-label="대화 정보"><Icon name="dots" size={24} /></button></header>
    <div className="flex flex-1 flex-col justify-end gap-3 overflow-y-auto px-4 py-4"><p className="mx-auto mb-4 max-w-[230px] text-center text-[11px] leading-5 text-[#737373]">{person.name} · {person.era}<br />지식과 생각을 나눠보세요.</p><div className="max-w-[78%] self-start rounded-[20px] bg-[#efefef] px-4 py-2.5 text-[13px]">안녕하세요! 오늘은 어떤 이야기를 나눠볼까요?</div>{sent.map((item, index) => <div key={index} className="max-w-[78%] self-end rounded-[20px] bg-[#3797f0] px-4 py-2.5 text-[13px] text-white">{item}</div>)}</div>
    <form onSubmit={submit} className="mx-3 mb-3 flex min-h-[44px] shrink-0 items-center gap-2 rounded-full border border-[#dbdbdb] px-3"><button type="button" className="grid h-8 w-8 place-items-center rounded-full bg-[#3797f0] text-white" aria-label="카메라"><Icon name="camera" size={17} /></button><input value={text} onChange={(event) => setText(event.target.value)} placeholder="메시지 보내기..." className="min-w-0 flex-1 text-[13px] outline-none" /><button type="submit" disabled={!text.trim()} className="text-[12px] font-semibold text-[#0095f6] disabled:opacity-40">보내기</button></form>
  </div>
}
