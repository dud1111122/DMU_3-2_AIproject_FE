import { useEffect, useRef, useState } from 'react'
import Icon from '../../components/Icon.jsx'
import { useFullPost, useQuiz, useStudyChat } from '../../shared/hooks.js'
import { useStore } from '../../shared/store.jsx'
import { assessmentLabels } from '../../shared/format.js'
import { errorMessage } from '../../api/errors.js'
import { Avatar, AiBadge, ErrorState, Loading, PillButton, Screen } from './ui.jsx'

const LOGIN_NOTE = '제출 기록을 저장하고, 틀린 문항은 복습에 추가해요.'

// 게시물의 학습 포인트를 4지선다로 확인한다. 정답·해설은 제출 뒤에만 보인다.
function QuizView({ post, onBack }) {
  const quiz = useQuiz(post.id)
  const { isMember, promptLogin } = useStore()
  const { questions, answers, choose, canSubmit, submit, submitting, submitError, result, resultFor, retry, loading, error, reload } = quiz
  const keyPointText = (id) => post.keyPoints.find((item) => item.id === id)?.text
  const answered = questions.filter((question) => answers[question.id]).length

  return <Screen title="학습 퀴즈" onBack={onBack}>
    <div className="px-4 pb-10 pt-2">
      <p className="text-[12px] text-[#aaa]">{post.persona.displayName} · {post.title}</p>
      <p className="mt-2 rounded-xl bg-white/10 p-3 text-[12px] leading-5 text-[#ccc]">
        {isMember ? LOGIN_NOTE : '비회원은 채점 결과만 보여 주고 기록은 남지 않아요.'}
        {!isMember && <button onClick={() => promptLogin('퀴즈 기록과 복습은 로그인 후 남길 수 있어요.')} className="ml-1 text-[#3ea6ff] underline">로그인</button>}
      </p>

      {loading && <Loading />}
      {error && !loading && <ErrorState error={error} onRetry={reload} />}
      {!loading && !error && questions.length === 0 && <p className="py-16 text-center text-[14px] text-[#aaa]">이 게시물에는 아직 퀴즈가 없어요.</p>}

      {questions.map((question, index) => {
        const graded = resultFor(question.id)
        return <fieldset key={question.id} className="mt-5">
          <legend className="text-[15px] font-semibold leading-6">{index + 1}. {question.text}</legend>
          {keyPointText(question.keyPointId) && <p className="mt-1 text-[12px] text-[#888]">핵심: {keyPointText(question.keyPointId)}</p>}
          <div className="mt-2 space-y-2">
            {question.options.map((option) => {
              const picked = answers[question.id] === option.order
              const correct = graded && graded.correctOptionOrder === option.order
              const wrongPick = graded && picked && !graded.isCorrect
              const tone = correct ? 'border-[#3ea6ff] bg-[#3ea6ff]/15' : wrongPick ? 'border-[#ff4e45] bg-[#ff4e45]/15' : picked ? 'border-white bg-white/10' : 'border-white/15'
              return <button key={option.order} disabled={Boolean(result)} onClick={() => choose(question.id, option.order)} aria-pressed={picked} className={`flex min-h-11 w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left text-[14px] leading-5 disabled:cursor-default ${tone}`}>
                <span className="mt-px w-4 shrink-0 font-semibold">{option.order}</span><span className="flex-1">{option.text}</span>
                {correct && <span className="shrink-0 text-[12px] font-semibold text-[#8ec5ff]">정답</span>}
                {wrongPick && <span className="shrink-0 text-[12px] font-semibold text-[#ff8a84]">내 답</span>}
              </button>
            })}
          </div>
          {graded && <p className={`mt-2 text-[13px] leading-5 ${graded.isCorrect ? 'text-[#8ec5ff]' : 'text-[#ff8a84]'}`}>{graded.isCorrect ? '맞았어요. ' : '틀렸어요. '}<span className="text-[#ddd]">{graded.explanation}</span></p>}
        </fieldset>
      })}

      {questions.length > 0 && !result && <div className="sticky bottom-0 -mx-4 mt-6 bg-[#0f0f0f] px-4 pb-4 pt-3 shadow-[0_-8px_16px_#0f0f0f]">
        {submitError && <p role="alert" className="mb-2 text-[12px] text-[#ff8a84]">{submitError}</p>}
        <PillButton light onClick={submit} disabled={!canSubmit} className="w-full">{submitting ? '채점하는 중…' : `답 제출 (${answered}/${questions.length})`}</PillButton>
      </div>}

      {result && <div className="mt-6 rounded-xl bg-white/10 p-4">
        <p className="text-[18px] font-bold">{result.correctCount}/{result.totalCount} 정답</p>
        <p className="mt-1 text-[12px] leading-5 text-[#bbb]">{result.persisted ? '제출 기록을 저장했어요. 틀린 문항은 복습에 추가돼요.' : '비회원 결과라 기록되지 않았어요.'}</p>
        <PillButton light onClick={retry} className="mt-3 w-full">다시 풀기</PillButton>
      </div>}
    </div>
  </Screen>
}

// 대화는 게시물 기준이다. 회원은 서버에 남고, 비회원은 이 화면이 열려 있는 동안만 유지된다.
function ChatView({ post, onBack }) {
  const chat = useStudyChat(post.id)
  const { isMember, promptLogin, aiConfigured } = useStore()
  const [text, setText] = useState('')
  const listRef = useRef(null)
  const persona = post.persona
  const aiOff = !aiConfigured || chat.error?.status === 503
  const tooLong = text.length > 2000

  useEffect(() => { const el = listRef.current; if (el) el.scrollTop = el.scrollHeight }, [chat.messages.length, chat.sending])

  const send = async () => {
    const value = text.trim()
    if (!value || chat.sending || aiOff || tooLong) return
    const ok = await chat.send(value)
    if (ok) setText('')
  }

  return <div className="flex h-full flex-col bg-[#0f0f0f] text-white">
    <header className="flex h-12 shrink-0 items-center pr-2">
      <button onClick={onBack} aria-label="뒤로" className="grid h-12 w-12 shrink-0 place-items-center"><Icon name="back" size={24} /></button>
      <Avatar persona={persona} size={28} />
      <div className="ml-2 min-w-0 flex-1"><p className="flex items-center gap-1.5 text-[14px] font-medium"><span className="truncate">{persona.displayName}</span><AiBadge /></p><p className="truncate text-[11px] text-[#aaa]">{post.title}</p></div>
    </header>

    {!isMember && <p className="mx-4 mb-2 rounded-lg bg-white/10 px-3 py-2 text-[12px] leading-5 text-[#ccc]">비회원 대화는 이 화면에만 있어요. 화면을 나가거나 새로고침하면 사라지고 기록되지 않아요. <button onClick={() => promptLogin('대화를 기록하려면 로그인해 주세요.')} className="text-[#3ea6ff] underline">로그인</button></p>}

    {post.keyPoints.length > 0 && <details className="mx-4 mb-2 rounded-lg bg-white/5 px-3 py-2 text-[12px]">
      <summary className="cursor-pointer text-[#ccc]">핵심 포인트 {post.keyPoints.length}개 · 이해 상태</summary>
      <ul className="mt-2 space-y-2">{post.keyPoints.map((keyPoint) => {
        const assessment = chat.assessments[keyPoint.id]
        return <li key={keyPoint.id} className="flex items-start gap-2 leading-5">
          <span className="min-w-0 flex-1 text-[#ddd]">{keyPoint.text}</span>
          {assessment && <span className={`shrink-0 rounded px-1.5 py-px text-[11px] font-medium ${assessment.level === 'UNDERSTOOD' ? 'bg-[#2f6b46] text-[#cdf5d9]' : assessment.level === 'PARTIAL' ? 'bg-[#6b5a2f] text-[#fbe8b0]' : 'bg-[#6b2f2f] text-[#ffd1d1]'}`} title={assessment.feedback || ''}>{assessmentLabels[assessment.level]}</span>}
        </li>
      })}</ul>
    </details>}

    <div ref={listRef} className="no-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-2" aria-live="polite">
      {chat.loading && <Loading label="대화를 불러오는 중…" className="py-10" />}
      {!chat.loading && !chat.messages.length && !chat.error && <p className="py-10 text-center text-[13px] leading-5 text-[#aaa]">{persona.displayName}에게 이 게시물의 내용을 물어보세요.<br />질문과 힌트, 조언을 받을 수 있어요.</p>}
      {chat.messages.map((message) => message.role === 'USER'
        ? <div key={message.id} className="flex justify-end"><p className="max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-[#3ea6ff] px-3 py-2 text-[14px] leading-5 text-[#06121f]">{message.content}</p></div>
        : <div key={message.id} className="flex items-end gap-2"><Avatar persona={persona} size={26} /><p className="max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-bl-sm bg-white/10 px-3 py-2 text-[14px] leading-5">{message.content}</p></div>)}
      {chat.sending && <p className="text-[12px] text-[#aaa]">{persona.displayName} AI가 답하는 중…</p>}
      {chat.error && !chat.sending && <div role="alert" className="rounded-lg bg-[#3a1f1f] px-3 py-2 text-[13px] leading-5">
        <p>{aiOff ? 'AI 기능이 아직 설정되지 않았어요. 게시물 읽기는 계속 할 수 있어요.' : errorMessage(chat.error)}</p>
        {!aiOff && <p className="mt-1 text-[12px] text-[#ffb3b3]">입력한 내용은 그대로 남아 있어요. 다시 보내 주세요.</p>}
        {chat.messages.length === 0 && !aiOff && <button onClick={chat.reload} className="mt-2 text-[#3ea6ff] underline">대화 다시 불러오기</button>}
      </div>}
    </div>

    <div className="shrink-0 border-t border-white/10 px-4 pb-4 pt-2">
      <label className="flex items-end gap-2">
        <span className="sr-only">{persona.displayName}에게 메시지 보내기</span>
        <textarea value={text} onChange={(event) => setText(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); send() } }} rows={2} disabled={aiOff || chat.loading} placeholder={aiOff ? 'AI 기능 설정 후 이용할 수 있어요' : '질문이나 생각을 입력해 주세요'} className="min-h-11 flex-1 resize-none rounded-xl bg-[#272727] px-3 py-2.5 text-[14px] leading-5 outline-none placeholder:text-[#888] disabled:opacity-50" />
        <button onClick={send} disabled={!text.trim() || chat.sending || aiOff || tooLong || chat.loading} className="h-11 shrink-0 rounded-xl bg-white px-4 text-[14px] font-semibold text-[#0f0f0f] disabled:opacity-40">{chat.sending ? '보내는 중' : '보내기'}</button>
      </label>
      <p className={`mt-1 text-right text-[11px] ${tooLong ? 'text-[#ff8a84]' : 'text-[#777]'}`}>{text.length}/2000</p>
    </div>
  </div>
}

// 목록에서 열면 게시물에 학습 포인트·문헌이 없어서 상세를 먼저 불러온다.
export function QuizScreen({ post, onBack }) {
  const full = useFullPost(post)
  if (!full.post) return <Screen title="학습 퀴즈" onBack={onBack}>{full.error ? <ErrorState error={full.error} onRetry={full.reload} /> : <Loading />}</Screen>
  return <QuizView post={full.post} onBack={onBack} />
}

export function ChatScreen({ post, onBack }) {
  const full = useFullPost(post)
  if (!full.post) return <Screen title="AI와 대화" onBack={onBack}>{full.error ? <ErrorState error={full.error} onRetry={full.reload} /> : <Loading />}</Screen>
  return <ChatView post={full.post} onBack={onBack} />
}
