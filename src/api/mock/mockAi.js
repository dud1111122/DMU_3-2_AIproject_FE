// 실제 AI 대신 학습 포인트와 사용자 답변의 단어 겹침으로 답변·평가를 흉내 낸다.
const words = (text) => text.replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter((word) => word.length >= 2)
const stem = (word) => word.slice(0, Math.min(2, word.length))
const isQuestion = (text) => /[?？]\s*$/.test(text.trim()) || /(무엇|뭐|왜|어떻게|어떤|뜻)/.test(text)
const clip = (text, max) => text.length > max ? `${text.slice(0, max - 1)}…` : text

function coverage(content, keyPoint) {
  const target = [...new Set(words(keyPoint.text).map(stem))]
  const said = words(content).map(stem)
  return target.filter((item) => said.includes(item)).length / Math.max(1, target.length)
}

export function chatReply({ persona, post, content, previous = {} }) {
  const voice = persona.mock
  const scored = post.keyPoints.map((keyPoint) => ({ keyPoint, score: coverage(content, keyPoint) })).sort((a, b) => b.score - a.score)
  const best = scored[0]
  const pending = post.keyPoints.find((keyPoint) => previous[keyPoint.id] !== 'UNDERSTOOD' && keyPoint.id !== best.keyPoint.id) || post.keyPoints.find((keyPoint) => previous[keyPoint.id] !== 'UNDERSTOOD')
  const followUp = pending ? `그럼 다음으로, “${clip(pending.text, 40)}”에 대해서는 어떻게 설명하겠어요?` : voice.ask
  const section = post.sections.find((item) => item.order === best.keyPoint.sectionOrder) || post.sections[0]

  if (isQuestion(content) && best.score < 0.35) {
    return { content: `${voice.opener} 게시물에서 핵심은 이것이에요. ${best.keyPoint.text} 카드 ${section.order}의 내용을 다시 보면 도움이 될 거예요. 이제 이 내용을 당신의 말로 설명해 보겠어요?`, assessments: [] }
  }
  if (best.score >= 0.35) {
    return { content: `${voice.opener} 잘 짚었어요. “${clip(best.keyPoint.text, 50)}”라는 핵심을 정확히 이해했어요. ${followUp}`, assessments: [{ keyPointId: best.keyPoint.id, level: 'UNDERSTOOD', feedback: '핵심 내용을 자신의 말로 설명했어요.' }] }
  }
  if (best.score >= 0.15) {
    return { content: `${voice.opener} 방향은 맞아요. 다만 “${clip(best.keyPoint.text, 50)}”라는 점까지 함께 설명하면 더 정확해요. 힌트: ${clip(section.body, 80)}`, assessments: [{ keyPointId: best.keyPoint.id, level: 'PARTIAL', feedback: '일부 내용은 맞지만 핵심 근거가 빠졌어요.' }] }
  }
  const missed = pending || post.keyPoints[0]
  const hintSection = post.sections.find((item) => item.order === missed.sectionOrder) || post.sections[0]
  return { content: `${voice.opener} 이 부분은 게시물과 조금 다르게 이해한 것 같아요. 카드 ${hintSection.order}을 다시 보세요. 힌트: ${clip(hintSection.body, 80)} ${voice.ask}`, assessments: content.trim().length >= 4 ? [{ keyPointId: missed.id, level: 'MISSED', feedback: '게시물의 핵심과 다르게 이해했어요. 복습 목록에서 다시 살펴보세요.' }] : [] }
}

// 목업 대담: 발언 한 개(index는 AI 발언 순번, 0부터)와 쟁점 요약을 만든다.
export function debateBody(speaker, other, topic, index) {
  if (index === 0) return clip(`“${topic}”라는 물음에 저는 이렇게 답하고 싶습니다. ${speaker.mock.stance}`, 120)
  if (index % 2 === 1) return clip(`${other.displayName}의 말에도 일리가 있습니다. 하지만 ${speaker.mock.challenge}`, 120)
  return clip(`정리하자면, ${speaker.mock.closing}`, 120)
}

export function debateSummary(a, b, topic) {
  return `${a.displayName}: ${a.mock.stance} / ${b.displayName}: ${b.mock.stance} 쟁점은 “${topic}”을 판단할 기준을 어디에 둘 것인가입니다.`
}
