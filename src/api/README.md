# FE 공통 계약 (목업 API · 공유 상태 · 훅)

기획: `기획/기획.md`, API 계약: `기획/BE_Endpoint.md`. 세 모드(기본·인스타그램·쇼츠)는 **아래 모듈만** 통해 데이터를 읽고 쓴다.
`src/data/content.js`, `src/data/personaChat.js`, `src/shared/content.js`, `src/shared/useActivity.js`, `src/shared/usePreferences.js`, `src/shared/useLearning.js`, `src/shared/usePersonaChat.js`는 **옛 구조라 삭제 예정**이다. 새 코드에서 import하지 않는다.

## API (`src/api/index.js`의 `api`)
`VITE_API_MODE=real`이면 실제 서버, 기본은 `src/api/mock/server.js` 목업(250ms 지연). 목업 시연 계정 `demo / demo1234`. `VITE_MOCK_AI=off`로 AI 미설정(503) 상태를 볼 수 있다.
모든 호출은 Promise. 실패 시 `ApiError{status, code, message, meta}` (`src/api/errors.js`, `errorMessage(e)`로 한국어 문구). 목록은 `{ items, nextCursor }`.

| 메서드 | 결과 |
| --- | --- |
| `feed({topicId, following, cursor})` | 게시물 목록, 최신순. `following:true`는 비회원이면 401 |
| `post(id)` | 게시물 (아래 Post) |
| `topics()` | `[{id,name}]` 8개 |
| `personas({q, topicId})`, `persona(id)`, `personaPosts(id)` | Persona / 게시물 목록 |
| `recommendations(topicIds?)` | `{items: Persona+matchCount, topicIds}` 관심 주제 겹침 수 순. 비회원은 topicIds 전달, 회원은 생략 |
| `search(q, type)` | type `post`·`persona`·`topic` |
| `savedPosts()`, `follows()` | 회원 전용 목록 |
| `quiz(postId)` / `submitQuiz(postId, answers)` | 아래 Quiz |
| `reviewItems({status})`, `setReviewStatus(id, status)` | 회원 전용 복습 |
| `openConversation(postId)`, `sendMessage(id, content)`, `guestChat(postId, content, history)` | 채팅 — 직접 쓰지 말고 `useStudyChat` |
| `createDebate(personaIds, topic)`, `myDebates({cursor})`, `debate(id)`, `sendDebateMessage(id, content)`, `endDebate(id)`, `streamDebateTurn(id, {signal, onDelta})` | 대담 (회원 전용) — 화면은 `useDebates`·`useDebate` 권장 |
| `report(postId, reasonCode, detail)` | `useReport` 권장 |
| `login`, `logout`, `me`, `updateMe({displayName,bio})`, `health()` | 계정 — `useStore()` 권장 |

### Post
```js
{ id, persona: {id, username, displayName, aiPersona:true}, title, summary, caption, groundingMode:'MODEL_KNOWLEDGE',
  publishedAt, likeCount, topics:[{id,name}],
  sections:[{ id, order, title|null, body, citationType:'DIRECT_QUOTE'|'RECONSTRUCTION', quoteAttribution|null,
              image: {url, altText, aiGenerated, credit} | null }],
  keyPoints:[{id, order, text, sectionId}],
  sources:[{id, title, author|null, url|null, verified, checkedAt|null}],
  userState:{authenticated, liked, saved, followingPersona} }
```
### Persona
`{ id, username, displayName, era|null, bio, avatarUrl:null, aiPersona:true, aiDisclosure, topics:[{id,name}], postCount, userState:{authenticated, following} }`
아바타는 없다(null). 이니셜/이름으로 표시하고 이미지에 기대지 않는다. `era`도 대부분 null.

### Quiz
`quiz(postId)` → `{ postId, questions:[{id, order, keyPointId, text, options:[{order:1..4, text}]}] }` (정답·해설 없음)
제출 결과 → `{ attemptId|null, persisted, correctCount, totalCount, results:[{questionId, keyPointId, selectedOptionOrder, isCorrect, correctOptionOrder, explanation}] }`

### Review item
`{ id, status:'OPEN'|'DONE', reason:'QUIZ_WRONG'|'CHAT_MISSED', updatedAt, completedAt, keyPoint:{id,text}, post:{id,title,persona} }`

### Debate (회원 전용, 비회원 대담 없음)
대담은 백엔드 모양을 그대로 쓴다. 인물에는 화면용 `avatarUrl`(= `avatarPath`, 없으면 null)이 더해진다. 아바타는 이미지가 있으면 `avatarUrl`, 없으면 이니셜.
```js
// GET /debates/{id}, POST /debates 응답 (POST는 발언 없이 시작)
{ id, status:'ACTIVE'|'ENDED', topic,
  personas:[{id, username, displayName, avatarPath, avatarUrl, aiDisclosure}],
  turns:[{order, speakerType:'PERSONA'|'USER', personaId|null, body, createdAt}],
  summary|null, turnCount, turnLimit:12, remainingTurns, createdAt, endedAt }
// 목록 GET /users/me/debates → { items:[{id, status, topic, personas, turnCount, createdAt}], nextCursor }
```
- `createDebate(personaIds, topic)` → 새 대담(매번 새로 만든다). 횟수 제한 없음.
- `sendDebateMessage(id, content)` → 저장된 USER 발언 (content 1~300자).
- `endDebate(id)` → `ENDED` 대담(요약 포함). 발언이 1개 이상이어야 하고, 요약 AI가 실패하면 502로 대담은 `ACTIVE`로 남는다(다시 시도).
- `streamDebateTurn(id, {signal, onDelta(text)})` → 저장된 AI 발언. `POST /turns`를 `fetch`로 읽는다(`http.js`의 `httpStream`).
  - 사전 오류(404·409·429·503)는 일반 JSON 오류로 `ApiError`가 던져진다.
  - 스트림 중 `error` 이벤트는 `ApiError(code)`로 던져진다. 그때까지 받은 글자는 저장되지 않으므로 버린다.
  - `signal`로 중지하면 `AbortError`가 던져진다. 서버는 계속 만들어 저장하므로 `debate(id)`로 다시 불러온다.
  - 목업 모드(`mockDebateTurn`, `api/index.js`)는 SSE 문자열을 만들지 않고 같은 순서를 직접 흉내 낸다: 목업 문장을 6자 조각으로 나눠 `onDelta`를 부르고, 끝에 저장된 `turn`을 돌려준다. 실제 `text/event-stream` 파싱(`http.js`의 `httpStream`)은 real 모드에서만 쓴다. 목업은 중지(`signal`)·사전 오류(404·409·503)는 같은 방식으로 흉내 내지만, 스트림 중 `error` 이벤트는 흉내 내지 않는다.
- 12번째 발언(AI든 사용자든)이 저장되면 서버가 요약을 만들고 `ENDED`로 바꾼다(목업도 같다). 프런트는 12턴 뒤 `endDebate`를 부르지 않고 `refresh()`로 상태를 다시 읽는다. 요약이 실패했으면 `ACTIVE`(12턴)로 남고, `canEnd`가 true라 `대담 마치기`로 다시 시도한다.
- 스트림 중 `error`가 오면 받은 글자를 버리고, 그 뒤 항상 `refresh()`로 서버 상태를 다시 읽는다(12번째 발언 저장 뒤 요약만 실패한 경우 발언이 목록에 나타나게).

#### 대담 오류 문구 (`errorMessage`는 코드별 문구를 서버 문구보다 먼저 쓴다)
| 코드 | 문구 |
| --- | --- |
| `DEBATE_ENDED` | 이미 끝난 대담입니다. |
| `TURN_LIMIT_REACHED` | 발언 한도(12개)에 도달했습니다. |
| `REQUEST_IN_PROGRESS` | 이전 발언을 만드는 중입니다. 잠시 후 다시 시도해 주세요. |
| `AI_FAILED` | AI 응답을 만들지 못했습니다. 다시 시도해 주세요. |
| `AI_NOT_CONFIGURED` | AI 설정이 되어 있지 않습니다. |
| `VALIDATION_FAILED` (400) | 필드별 메시지(`error.fields`) |
| `STREAM_INTERRUPTED` (클라이언트) | 응답이 중간에 끊겼어요. 잠시 후 다시 불러와 주세요. |

## 대담 화면 상태 (`src/shared/hooks.js`)
- `useDebates()` → `{myDebates, loadingMine, create(personaIds, topic)→debate|null, creating, error, clearError}`. `create`는 비회원이면 `requireMember`로 로그인 안내만 하고 null을 돌려준다.
- `useDebate(debateId)` → `{debate, loading, loadError, reload, refresh, draft:{text}|null, busy:'turn'|'message'|'end'|null, failure:{kind, error}|null, autoPlaying, canAct, canEnd, nextTurn(), startAuto(), pauseAuto(), stopReading(), sendMessage(text)→bool, endDebate()→bool, clearFailure()}`
  - 발언 스트림·자동 진행·메시지·마침은 잠금 하나를 나눠 쓴다. 두 스트림이 동시에 돌지 않는다.
  - 자동 진행은 발언 사이 약간의 틈을 두고 다음 발언을 받는다. 메시지를 보내거나 멈추면 현재 발언이 끝난 뒤 멈춘다. 중지 버튼(`stopReading`)은 바로 읽기를 끊는다.
  - 발언 12개에 닿으면 서버가 요약과 함께 마친다. 화면은 `refresh()`로 다시 읽는다(위 참고).
  - `failure.kind`: `turn`(발언 실패), `message`, `end`(요약 실패 → 다시 만들기), `stopped`(중지 뒤 다시 불러오기 안내), `load`.
  - 화면을 떠나면(언마운트) 진행 중 스트림을 중단하고 자동 진행을 끈다.

## 공유 상태 `useStore()` (`src/shared/store.jsx`, App이 `AppProviders`로 감쌈)
- 세션: `user`, `isMember`, `sessionStatus('loading'|'guest'|'member')`, `login(u,p)`, `logout()`, `updateProfile(changes)`
- 로그인 요구: `requireMember(reason)` → 비회원이면 로그인 시트를 띄우고 false. `promptLogin(reason)`로 직접 띄울 수도 있다.
- 활동 (세 모드 공통, 낙관적 갱신·실패 시 되돌림·비회원은 자동으로 로그인 안내):
  `isLiked(post)`, `isSaved(post)`, `isFollowing(postOrPersona)`, `likeCount(post)`, `toggleLike(post)`, `toggleSave(post)`, `toggleFollow(postOrPersona)`
- `interestIds`, `toggleInterest(topicId)` — 비회원은 브라우저, 회원은 서버
- `topics`, `aiConfigured`, `showToast(message)`
- 로그인 시트와 토스트는 `PhoneFrame`이 자동으로 그린다(`<PhoneFrame dark>`면 어두운 스타일). 모드에서 따로 만들 필요 없음.

## 훅 (`src/shared/hooks.js`)
- `useApi(() => api.x(), deps)` → `{data, error, loading, reload}` (로그인 상태가 바뀌면 자동 재조회)
- `usePaged((cursor) => api.feed({cursor, ...}), deps)` → `{items, loading, error, hasMore, loadMore, reload, extra}`
- `useQuiz(postId)` → `{loading, error, questions, answers, choose(questionId, order), canSubmit, submit, submitting, submitError, result, resultFor(questionId), retry}`
- `useStudyChat(postId)` → `{messages:[{id, role:'USER'|'PERSONA', content}], assessments:{[keyPointId]:{level, feedback}}, loading, sending, error, send(text)→bool, persisted}`
  회원은 게시물당 대화방 하나(서버 저장), 비회원은 화면 메모리만(나가면 사라짐 — 화면에 안내).
- `useReviewItems(status)` → usePaged 결과 + `setStatus(item, 'DONE'|'OPEN')` (비회원은 빈 목록 → 로그인 안내 표시)
- `useReport()` → `{report(postId, reasonCode, detail), sending, error, canReport()}`

## 표시 도우미 (`src/shared/format.js`)
`formatDate`, `formatDateTime`, `compactCount`, `citationLabel(section)`, `AI_DISCLOSURE`, `sourceStatusLabel(source)`, `assessmentLabels`, `debateStatusLabel(status)`('진행 중'|'종료'), `reviewReasonLabels`, `reportReasons`, `withParticle`

## 기획 표시 규칙 (모든 모드 필수)
- 페르소나는 항상 "AI" 표시. 토론 발언은 모두 AI 재구성 가상 대화로 표시.
- 카드: `DIRECT_QUOTE`는 인용 표시 + `quoteAttribution`, 나머지는 "AI 재구성". 이미지 `aiGenerated`면 "AI 생성 이미지", `credit` 표시, `altText`를 alt로. `image=null`이어도 본문만으로 읽힘. 이미지 로딩 실패 시 대체 표시.
- 문헌: `verified=false`는 "AI 제안 문헌 · 미확인", URL 있으면 새 탭 링크.
- 비회원: 팔로우·좋아요·저장·신고·팔로우 피드·저장함·복습·내 토론은 로그인 안내. 퀴즈·채팅은 체험 가능(기록 안 남는다고 안내). 토론은 회원 전용이다.
- 상태: 로딩, 빈 목록, 검색 결과 없음, 네트워크 오류(다시 시도), AI 미설정(`aiConfigured=false` 또는 503) 안내.
- 난이도 개념은 없다. 사용자 게시물 작성·관리자 화면·댓글은 만들지 않는다.

## 게시물 시드 형식 (`src/data/posts.js`의 `seedPosts`)
`{ id, personaId, publishedAt, likeBase, topicIds, title, summary, caption, sections:[{title, body, citationType, quoteAttribution, image}], keyPoints:[{text, sectionOrder}], questions:[{keyPointIndex, text, options:[4개], correctOptionOrder:1..4, explanation}], sources:[{title, author, url, verified, checkedAt}] }`

## 묶음 보기·사용량 (기획 §15, `api.usageToday` 등)
`api/mock/usage.js`가 목업을 맡는다(서버 등록 없이 동작). 실제 서버 모드는 같은 경로로 호출한다.
| 메서드 | HTTP | 결과 |
| --- | --- | --- |
| `usageToday()` | `GET /usage/today` (회원) | `{date, pledgedCount, needsPledge, today:{count,minutes}, week:{count,minutes}, month:{count,minutes}, stopsThisWeek}` |
| `setPledge(n)` | `PUT /usage/today/pledge` `{pledgedCount}` (회원) | 그날 두 번째면 409 `PLEDGE_ALREADY_SET` |
| `completeBundle(postIds)` | `POST /usage/bundles` `{postIds}` (회원·비회원) | `{bundle:{count,estimatedSeconds}, stats, pledge:{count,exceeded}, tip}`. 비회원은 `{bundle, tip}`만 받고 저장되지 않는다. `tip`은 `{book:{title, readingMinutes}}`를 가정하고 FE가 문구를 만든다(서버 모양 확정 필요) |
| `recordStop()` | `POST /usage/stops` (회원) | `{stats}` |

- `stats`는 `{today, week, month, stopsThisWeek}` 모양이다. 비회원 집계는 `shared/usage.js`가 브라우저 로컬에 최근 31일만 둔다.
- 묶음 크기(3·5·10)와 날짜별 로컬 집계는 `shared/usage.js`, 상태 기계는 `shared/useUsage.js`(`useBundleReader`)가 맡는다.
- 목업 등록: `api/mock/usage.js`의 `usageRoutes`를 `server.js`에 `on(method, path, handler)`로 등록할 수 있다. 등록하지 않아도 `api/index.js`는 `mockUsageRequest`로 같은 목업을 쓴다.
