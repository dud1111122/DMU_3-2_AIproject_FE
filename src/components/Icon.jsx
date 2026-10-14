const paths = {
  home: <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z" /></>,
  search: <><circle cx="10.8" cy="10.8" r="7.2" /><path d="m16.3 16.3 4.3 4.3" /></>,
  reel: <><rect x="3" y="3" width="18" height="18" rx="5" /><path d="m10 8 6 4-6 4z" /></>,
  send: <><path d="m21 3-7.2 18-3.8-7-7-3.8z" /><path d="M21 3 10 14" /></>,
  heart: <path d="M20.8 8.8c0 5.1-8.8 11.2-8.8 11.2S3.2 13.9 3.2 8.8a4.7 4.7 0 0 1 8.8-2.2 4.7 4.7 0 0 1 8.8 2.2Z" />,
  comment: <><path d="M20 11.4a7.4 7.4 0 0 1-7.7 7.1 8.8 8.8 0 0 1-3.8-.8L4 19l1.2-3.7a6.7 6.7 0 0 1-1.1-3.9 7.4 7.4 0 0 1 7.8-7.1 7.4 7.4 0 0 1 8.1 7.1Z" /></>,
  bookmark: <path d="M6 4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21l-6-4-6 4z" />,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  more: <><circle cx="5" cy="12" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="19" cy="12" r="1" fill="currentColor" /></>,
  back: <><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></>,
  close: <><path d="m18 6-12 12M6 6l12 12" /></>,
  grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1a1.8 1.8 0 0 1-2.5 2.5l-.1-.1a1.8 1.8 0 0 0-3 .9v.2a1.8 1.8 0 0 1-3.6 0v-.2a1.8 1.8 0 0 0-3-.9l-.1.1a1.8 1.8 0 0 1-2.5-2.5l.1-.1a1.8 1.8 0 0 0-.9-3h-.2a1.8 1.8 0 0 1 0-3.6h.2a1.8 1.8 0 0 0 .9-3l-.1-.1a1.8 1.8 0 0 1 2.5-2.5l.1.1a1.8 1.8 0 0 0 3-.9v-.2a1.8 1.8 0 0 1 3.6 0v.2a1.8 1.8 0 0 0 3 .9l.1-.1a1.8 1.8 0 0 1 2.5 2.5l-.1.1a1.8 1.8 0 0 0 .9 3h.2a1.8 1.8 0 0 1 0 3.6h-.2a1.8 1.8 0 0 0-.9 3Z" /></>,
  dots: <><circle cx="12" cy="5" r=".8" fill="currentColor" /><circle cx="12" cy="12" r=".8" fill="currentColor" /><circle cx="12" cy="19" r=".8" fill="currentColor" /></>,
  play: <path d="m9 6 9 6-9 6z" fill="currentColor" stroke="none" />,
  chevron: <path d="m9 18 6-6-6-6" />,
  check: <path d="m5 12 4 4L19 6" />,
  camera: <><path d="M4 7h3l1.5-2h7L17 7h3v12H4z" /><circle cx="12" cy="13" r="3.5" /></>,
  layers: <><rect x="4" y="4" width="13" height="13" rx="2" /><path d="M8 20h10a2 2 0 0 0 2-2V8" /></>,
}

export default function Icon({ name, size = 24, strokeWidth = 1.8, className = '', filled = false }) {
  return <svg aria-hidden="true" className={className} width={size} height={size} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>
}
