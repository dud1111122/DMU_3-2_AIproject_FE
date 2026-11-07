import { useQuiz } from '../../shared/hooks.js'
import { useStore } from '../../shared/store.jsx'
import { Empty, ErrorState, GhostButton, Notice, PrimaryButton, Skeleton, TopBar, useNav } from './ui.jsx'

export default function BasicQuiz({ post }) {
  const nav = useNav()
  const { isMember, promptLogin } = useStore()
  const quiz = useQuiz(post.id)
  const { questions, answers, result } = quiz
  const answered = questions.filter((question) => answers[question.id]).length
  const wrong = result ? result.totalCount - result.correctCount : 0

  return <div className="flex h-full flex-col">
    <TopBar onBack={nav.back} title="이해 확인 퀴즈" />
    <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6 pt-4">
      <button onClick={() => nav.returnToPost(post.id)} className="block w-full text-left">
        <span className="text-[11px] font-semibold text-[#2f5d50]">{post.persona.displayName}의 글</span>
        <strong className="font-basic mt-0.5 block text-[19px] leading-[1.35]">{post.title}</strong>
      </button>
      {isMember
        ? <Notice tone="accent" className="mt-3">결과가 학습 기록에 저장되고, 틀린 문항의 핵심은 학습 탭의 복습에 추가돼요.</Notice>
        : <Notice className="mt-3">로그인하지 않으면 채점 결과가 저장되지 않아요. <button onClick={() => promptLogin('로그인하면 퀴즈 결과와 오답 복습이 저장돼요.')} className="font-semibold underline underline-offset-2">로그인</button></Notice>}

      {result && <section aria-live="polite" className="mt-4 rounded-xl border border-[#e7e3da] bg-white p-4 text-center">
        <p className="text-[12px] text-[#6f6b63]">채점 결과</p>
        <p className="font-basic mt-1 text-[28px] font-bold">{result.correctCount} <span className="text-[16px] text-[#6f6b63]">/ {result.totalCount}</span></p>
        <p className="mt-1 text-[12px] text-[#4a4741]">{wrong === 0 ? '모두 맞혔어요.' : `${wrong}문항을 다시 살펴보세요.`}{result.persisted && wrong > 0 ? ' 복습 목록에 담았어요.' : ''}</p>
        <div className="mt-3 flex justify-center gap-2">
          <GhostButton onClick={quiz.retry} className="h-9 text-[12px]">다시 풀기</GhostButton>
          {result.persisted && wrong > 0 && <PrimaryButton onClick={() => nav.goTab('study')} className="h-9 text-[12px]">복습 보기</PrimaryButton>}
        </div>
      </section>}

      {quiz.loading && <Skeleton rows={3} />}
      {quiz.error && <ErrorState error={quiz.error} onRetry={quiz.reload} />}
      {!quiz.loading && !quiz.error && !questions.length && <Empty title="아직 퀴즈가 없어요" text="이 글에는 준비된 문항이 없어요." />}

      <ol className="mt-2">{questions.map((question, index) => {
        const graded = quiz.resultFor(question.id)
        return <li key={question.id} className="border-b border-[#e7e3da] py-5">
          <fieldset>
            <legend className="text-[14px] font-semibold leading-[1.55]"><span className="font-basic mr-1.5 text-[#2f5d50]">Q{index + 1}.</span>{question.text}</legend>
            <div className="mt-3 space-y-1.5">{question.options.map((option) => {
              const selected = answers[question.id] === option.order
              const isAnswer = graded && graded.correctOptionOrder === option.order
              const missed = graded && selected && !graded.isCorrect
              const style = isAnswer ? 'border-[#2f5d50] bg-[#e8efec] text-[#1f4238]' : missed ? 'border-[#d9796b] bg-[#fdf0ee] text-[#9b2c1f]' : selected ? 'border-[#1c1b19] bg-white font-semibold' : 'border-[#e7e3da] bg-white'
              return <label key={option.order} className={`flex min-h-11 items-center gap-3 rounded-lg border px-3 py-2 text-[13px] leading-[1.5] ${graded ? '' : 'cursor-pointer'} ${style}`}>
                <input type="radio" name={`q-${question.id}`} checked={selected} disabled={Boolean(result)} onChange={() => quiz.choose(question.id, option.order)} className="accent-[#1c1b19]" />
                <span className="flex-1">{option.text}</span>
                {isAnswer && <span className="shrink-0 text-[10px] font-semibold">정답</span>}
                {missed && <span className="shrink-0 text-[10px] font-semibold">내 답</span>}
              </label>
            })}</div>
          </fieldset>
          {graded && <div className={`mt-3 rounded-lg px-3 py-2.5 text-[12px] leading-[1.6] ${graded.isCorrect ? 'bg-[#e8efec] text-[#1f4238]' : 'bg-[#fdf0ee] text-[#7c2a1f]'}`}>
            <strong>{graded.isCorrect ? '맞았어요' : '틀렸어요'}</strong> · {graded.explanation}
          </div>}
        </li>
      })}</ol>
    </div>
    {!result && questions.length > 0 && <div className="shrink-0 border-t border-[#e7e3da] bg-[#fbfaf7] px-4 py-3">
      {quiz.submitError && <Notice tone="error" className="mb-2">{quiz.submitError}</Notice>}
      <PrimaryButton onClick={quiz.submit} disabled={!quiz.canSubmit} className="h-11 w-full text-[14px]">{quiz.submitting ? '채점하는 중…' : answered < questions.length ? `모든 문항에 답해 주세요 (${answered}/${questions.length})` : '제출하고 채점하기'}</PrimaryButton>
    </div>}
  </div>
}
