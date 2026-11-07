import InstagramApp from './InstagramApp.jsx'
import BasicApp from './modes/basic/BasicApp.jsx'
import ShortsApp from './modes/shorts/ShortsApp.jsx'
import usePersistedState from './hooks/usePersistedState.js'
import { AppProviders } from './shared/store.jsx'

export default function App() {
  // 화면 모드는 기획대로 이 브라우저의 로컬 저장소에만 둔다.
  const [mode, setMode] = usePersistedState('de-shorts:mode', 'basic')
  return <AppProviders>
    {mode === 'shorts' ? <ShortsApp onChangeMode={setMode} /> : mode === 'instagram' ? <InstagramApp onChangeMode={setMode} /> : <BasicApp onChangeMode={setMode} />}
  </AppProviders>
}
