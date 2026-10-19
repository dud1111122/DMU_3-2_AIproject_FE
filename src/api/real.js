// 실제 백엔드 응답을 README의 프론트 계약 모양으로 바꾼다.
// 백엔드 필드 이름이 바뀌면 이 파일만 고치면 된다. 화면 코드는 계약 모양만 안다.
export function adaptRealApi(raw) {
  let topicCache = null
  const topicList = async () => { topicCache ||= (await raw.topics()).items; return topicCache }

  // 백엔드 목록 항목에는 팔로우 상태와 글 수가 없다. 팔로우는 store가 로그인 후 따로 채우고, 글 수는 피드에서 센다.
  const personaView = (persona, postCounts = null) => ({
    ...persona,
    avatarUrl: persona.avatarUrl ?? null,
    aiPersona: true,
    postCount: persona.postCount ?? postCounts?.get(persona.id) ?? null,
    userState: { authenticated: Boolean(persona.authenticated), following: Boolean(persona.followed) },
  })
  const countPostsByPersona = async () => {
    const page = await raw.feed({ limit: 50 })
    const counts = new Map()
    for (const post of page.items) counts.set(post.persona.id, (counts.get(post.persona.id) || 0) + 1)
    return counts
  }
  const personaPage = async (page) => {
    const counts = await countPostsByPersona()
    return { ...page, items: page.items.map((persona) => personaView(persona, counts)) }
  }
  const meView = async (me) => {
    const topics = await topicList()
    return { ...me, interests: me.interestTopicIds.map((id) => topics.find((topic) => topic.id === id)).filter(Boolean).map(({ id, name }) => ({ id, name })) }
  }
  const quizView = (quiz) => ({
    postId: quiz.postId,
    totalCount: quiz.totalCount,
    questions: quiz.questions.map((question) => ({
      id: question.questionId,
      order: question.pointOrder,
      keyPointId: question.keyPointId,
      text: question.prompt,
      options: question.options.map((option) => ({ order: option.optionOrder, text: option.text })),
    })),
  })
  // 대담은 백엔드 모양을 그대로 쓰고, 아바타 주소만 화면 규칙(avatarUrl)에 맞춘다.
  const debatePersona = (persona) => ({ ...persona, avatarUrl: persona.avatarUrl ?? null })
  const debateSummaryView = (debate) => ({ ...debate, personas: debate.personas.map(debatePersona) })
  const debateView = (debate) => ({ ...debateSummaryView(debate), turns: debate.turns ?? [] })
  const reviewView = (item) => ({
    id: item.id,
    status: item.status,
    reason: item.reason,
    updatedAt: item.updatedAt,
    completedAt: item.completedAt,
    keyPoint: { id: item.keyPointId, text: item.keyPointText },
    post: { id: item.postId, title: item.postTitle, persona: null },
  })
  const conversationView = async (conversation) => {
    const assessment = await raw.conversationAssessment(conversation.id)
    return {
      id: conversation.id,
      post: conversation.post,
      persona: { ...conversation.persona, avatarUrl: conversation.persona.avatarPath ?? null },
      messages: conversation.messages,
      assessments: assessment.items.filter((item) => item.level).map(({ keyPointId, level, feedback, evidenceMessageId, updatedAt }) => ({ keyPointId, level, feedback, evidenceMessageId, updatedAt })),
    }
  }

  return {
    ...raw,
    login: async (username, password) => meView(await raw.login(username, password)),
    me: async () => meView(await raw.me()),
    updateMe: async (changes) => meView(await raw.updateMe(changes)),
    topics: () => topicList(),
    personas: async (query) => personaPage(await raw.personas(query)),
    persona: async (id) => personaView(await raw.persona(id)),
    recommendations: async (topicIds) => {
      const page = await raw.recommendations(topicIds)
      const counts = await countPostsByPersona()
      return { items: page.items.map((persona) => ({ ...personaView(persona, counts), matchCount: persona.matchedTopicCount ?? 0 })), topicIds: topicIds || [] }
    },
    follows: async (query) => { const page = await raw.follows(query); return { ...page, items: page.items.map((persona) => ({ ...persona, aiPersona: true })) } },
    search: async (q, type, query) => {
      const page = await raw.search(q, type, query)
      if (type === 'persona') return personaPage(page)
      return page
    },
    savedPosts: async (query) => {
      const page = await raw.savedPosts(query)
      return { ...page, items: page.items.map((item) => ({ ...item.post, savedAt: item.savedAt })) }
    },
    quiz: async (postId) => quizView(await raw.quiz(postId)),
    submitQuiz: (postId, answers) => raw.submitQuiz(postId, answers),
    reviewItems: async (query) => { const page = await raw.reviewItems(query); return { ...page, items: page.items.map(reviewView) } },
    setReviewStatus: async (id, status) => reviewView(await raw.setReviewStatus(id, status)),
    openConversation: async (postId) => conversationView(await raw.openConversation(postId)),
    conversation: async (id) => conversationView(await raw.conversation(id)),
    guestChat: async (postId, content, history) => {
      const response = await raw.guestChat(postId, content, history)
      return { reply: { role: 'PERSONA', content: response.reply }, assessments: response.assessments }
    },
    createDebate: flatDebateErrors(async (personaIds, topic) => debateView(await raw.createDebate(personaIds, topic))),
    debate: flatDebateErrors(async (id) => debateView(await raw.debate(id))),
    myDebates: flatDebateErrors(async (query) => { const page = await raw.myDebates(query); return { ...page, items: page.items.map(debateSummaryView) } }),
    sendDebateMessage: flatDebateErrors((id, content) => raw.sendDebateMessage(id, content)),
    endDebate: flatDebateErrors(async (id) => debateView(await raw.endDebate(id))),
    streamDebateTurn: flatDebateErrors((id, options) => raw.streamDebateTurn(id, options)),
  }
}

// 백엔드 오류의 추가 정보(429 resetAt, remainingToday)는 error.details에 온다. 화면은 error.meta에서 읽으므로 펼쳐 둔다.
function flatDebateErrors(call) {
  return async (...args) => {
    try {
      return await call(...args)
    } catch (error) {
      if (error?.meta?.details) error.meta = { ...error.meta, ...error.meta.details }
      throw error
    }
  }
}
