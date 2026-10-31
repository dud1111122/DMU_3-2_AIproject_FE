import { useQuiz } from '../shared/hooks.js'
import { useStore } from '../shared/store.jsx'
import { BackHeader, ErrorState, Loading, usePost } from './ui.jsx'

// 답을 모두 고른 뒤 한 번에 제출한다. 채점은 서버가 하고, 정답·해설은 제출 결과에서만 받는다.
export default function QuizScreen({ postId, initialPost, onBack, onOpenChat }) {
  const { isMember } = useStore()
  const { post } = usePost(postId, initialPost)
  const quiz = useQuiz(postId)
  if (quiz.loading && !quiz.questions.length) return <div className="pb-6"><BackHeader title="이해 확인" onBack={onBack} /><Loading /></div>
  if (quiz.error) return <div className="pb-6"><BackHeader title="이해 확인" onBack={onBack} /><ErrorState error={quiz.error} onRetry={quiz.reload} /></div>

  const { questions, answers, choose, result, resultFor, canSubmit, submit, submitting, submitError, retry } = quiz
  const answered = questions.filter((question) => answers[question.id]).length
  const persisted = result ? result.persisted : isMember

  return <div className="pb-8">
    <BackHeader title="이해 확인" sub={post?.title} onBack={onBack} />
    <p className={`mx-4 mt-3 rounded-lg px-3 py-2 text-[11px] leading-5 ${persisted ? 'bg-[#eef6ff] text-[#1d4f8a]' : 'bg-[#f6f6f6] text-[#737373]'}`}>{persisted ? '오답은 복습에 추가돼요. 학습 탭의 복습에서 다시 볼 수 있어요.' : '기록이 저장되지 않아요. 로그인하면 시도 결과와 오답이 복습에 남아요.'}</p>

    {questions.map((question, index) => {
      const res = resultFor(question.id)
      return <section key={question.id} aria-labelledby={`quiz-${question.id}`} className="mx-4 mt-4 rounded-xl border border-[#efefef] p-4">
        <p className="text-[11px] font-semibold text-[#0095f6]">문제 {index + 1} / {questions.length}</p>
        <h2 id={`quiz-${question.id}`} className="mt-1 text-[14px] font-semibold leading-5">{question.text}</h2>
        <div role="radiogroup" aria-label={`문제 ${index + 1} 보기`} className="mt-3 space-y-2">{question.options.map((option) => {
          const picked = answers[question.id] === option.order
          const correct = res && option.order === res.correctOptionOrder
          const wrong = res && picked && !res.isCorrect
          const tone = correct ? 'border-[#16a34a] bg-[#f0fdf4]' : wrong ? 'border-[#dc2626] bg-[#fef2f2]' : picked ? 'border-[#111] bg-[#f6f6f6]' : 'border-[#e5e5e5]'
          return <button key={option.order} role="radio" aria-checked={picked} disabled={Boolean(result)} onClick={() => choose(question.id, option.order)} className={`flex w-full items-start gap-2.5 rounded-lg border px-3 py-2.5 text-left text-[13px] leading-5 disabled:cursor-default ${tone}`}>
            <span className={`mt-px grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[10px] font-semibold ${picked ? 'border-[#111] bg-[#111] text-white' : 'border-[#c7c7c7]'}`}>{option.order}</span>
            <span className="min-w-0 flex-1">{option.text}</span>
          </button>
        })}</div>
        {res && <p className="mt-3 text-[12px] leading-5 text-[#4b4b4b]"><strong className={res.isCorrect ? 'text-[#16a34a]' : 'text-[#dc2626]'}>{res.isCorrect ? '정답' : '오답'}</strong> · {res.explanation}</p>}
      </section>
    })}

    <div className="px-4 pt-5">
      {result ? <>
        <p className="text-center text-[14px] font-semibold">{result.totalCount}문제 중 {result.correctCount}문제를 맞혔어요</p>
        <div className="mt-3 flex gap-2">
          <button onClick={retry} className="h-10 flex-1 rounded-lg bg-[#efefef] text-[13px] font-semibold">다시 풀기</button>
          <button onClick={() => onOpenChat(post || { id: postId })} className="h-10 flex-1 rounded-lg bg-[#0095f6] text-[13px] font-semibold text-white">대화로 이어가기</button>
        </div>
      </> : <>
        {submitError && <p role="alert" className="mb-2 text-center text-[12px] text-[#e5484d]">{submitError}</p>}
        <button disabled={!canSubmit} onClick={submit} className="h-11 w-full rounded-lg bg-[#0095f6] text-[14px] font-semibold text-white disabled:opacity-40">{submitting ? '채점 중…' : `제출하기 (${answered}/${questions.length})`}</button>
        {!canSubmit && answered < questions.length && <p className="mt-2 text-center text-[11px] text-[#8e8e8e]">모든 문제에 답하면 제출할 수 있어요.</p>}
      </>}
    </div>
  </div>
}
