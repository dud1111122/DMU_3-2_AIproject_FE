// 관리자 사전 준비로 만들어질 30개 게시물의 목업 시드. 형식은 FE/src/api/README.md의 "게시물 시드 형식"을 따른다.
const unsplash = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=85`
const photo = (id, altText) => ({ url: unsplash(id), altText, aiGenerated: false, credit: 'Unsplash · 시연용 임시 이미지' })

export const seedPosts = [
  {
    id: '1', personaId: '2', publishedAt: '2026-11-10T09:00:00+09:00', likeBase: 248, topicIds: ['1'],
    title: '익숙한 가치는 어디서 왔을까',
    summary: '당연하게 여기는 가치에도 만들어진 배경이 있다는 니체의 질문을 따라갑니다.',
    caption: '“원래 그런 거야”라는 말 뒤에는 어떤 역사가 숨어 있을까요? 카드를 넘기며 함께 따져 봐요.',
    sections: [
      { title: '“원래 그런 거야”', body: '우리는 많은 가치를 당연하게 받아들입니다. 니체 페르소나는 그 당연함부터 질문해 보자고 제안합니다.', citationType: 'RECONSTRUCTION', quoteAttribution: null, image: photo('photo-1519681393784-d120267933ba', '별이 가득한 밤하늘 아래 눈 덮인 산') },
      { title: '신은 죽었다', body: '“신은 죽었다.”', citationType: 'DIRECT_QUOTE', quoteAttribution: '프리드리히 니체, 『즐거운 학문』 §125', image: null },
      { title: '선언이 아니라 진단', body: '이 문장은 종교를 금지하자는 주장이라기보다, 사람들이 기대던 가치의 기반이 힘을 잃었다는 진단으로 읽을 수 있습니다.', citationType: 'RECONSTRUCTION', quoteAttribution: null, image: photo('photo-1470770841072-f978cf4d019e', '안개 낀 호숫가의 작은 집') },
      { title: '내 기준은 어디서 왔을까', body: '내가 당연하다고 여기는 기준 하나를 떠올려 보세요. 그 기준은 누가, 왜 만들었을까요?', citationType: 'RECONSTRUCTION', quoteAttribution: null, image: photo('photo-1470252649378-9c29740c9fa8', '해 질 녘 들판') },
    ],
    keyPoints: [
      { text: '당연해 보이는 가치에도 그것을 만든 역사와 배경이 있다.', sectionOrder: 1 },
      { text: '“신은 죽었다”는 종교 금지 주장이 아니라 가치 기반이 흔들렸다는 진단으로 읽을 수 있다.', sectionOrder: 3 },
      { text: '기존 가치가 흔들린 뒤 스스로 기준을 검토하는 태도가 필요하다.', sectionOrder: 4 },
    ],
    questions: [
      { keyPointIndex: 0, text: '이 게시물이 가치에 대해 던지는 질문으로 가장 알맞은 것은?', options: ['가치는 자연법칙처럼 변하지 않는다', '당연한 가치에도 만들어진 배경이 있다', '가치는 개인의 기분일 뿐이다', '가치는 법으로만 정해진다'], correctOptionOrder: 2, explanation: '게시물은 당연해 보이는 가치도 누군가가 만든 역사와 배경이 있다고 설명합니다.' },
      { keyPointIndex: 1, text: '“신은 죽었다”를 이 게시물은 어떻게 읽나요?', options: ['종교 의식을 금지하자는 주장', '신이 실제로 사라졌다는 기록', '사람들이 기대던 가치 기반이 흔들렸다는 진단', '과학이 모든 것을 설명한다는 선언'], correctOptionOrder: 3, explanation: '게시물은 이 문장을 종교 금지 주장보다 가치 기반이 힘을 잃었다는 진단으로 소개합니다.' },
      { keyPointIndex: 2, text: '게시물이 마지막에 권하는 태도는?', options: ['기존 기준을 그대로 따르기', '모든 기준을 버리기', '다수의 의견을 따르기', '내가 따르는 기준을 스스로 검토하기'], correctOptionOrder: 4, explanation: '마지막 카드는 내가 당연하게 여기는 기준이 어디서 왔는지 검토해 보자고 제안합니다.' },
    ],
    sources: [
      { title: '즐거운 학문', author: '프리드리히 니체', url: null, verified: false, checkedAt: null },
      { title: 'Friedrich Nietzsche', author: 'Stanford Encyclopedia of Philosophy', url: 'https://plato.stanford.edu/entries/nietzsche/', verified: false, checkedAt: null },
    ],
  },
  {
    id: '2', personaId: '4', publishedAt: '2026-11-09T09:00:00+09:00', likeBase: 131, topicIds: ['3'],
    title: '빛과 함께 달린다면 무엇을 물을까',
    summary: '빛의 속도가 일정하다는 전제에서 시작한 사고실험을 따라갑니다.',
    caption: '빛을 따라 달리면 빛이 멈춰 보일까요? 사고실험으로 질문을 만들어 봐요.',
    sections: [
      { title: '빛을 따라 달린다면', body: '아인슈타인 페르소나는 “빛과 나란히 달리면 빛은 어떻게 보일까?”라는 사고실험으로 이야기를 시작합니다.', citationType: 'RECONSTRUCTION', quoteAttribution: null, image: photo('photo-1462331940025-496dfbfc7564', '푸른빛 성운') },
      { title: '빛의 속도는 기준이다', body: '특수 상대성 이론은 빛의 속도가 관찰자의 움직임과 관계없이 일정하다는 전제에서 출발합니다.', citationType: 'RECONSTRUCTION', quoteAttribution: null, image: photo('photo-1451187580459-43490279c0fa', '우주에서 본 지구의 불빛') },
      { title: '시간과 거리가 달라진다', body: '빛의 속도가 일정하려면 서로 다르게 움직이는 관찰자는 시간 간격과 거리를 다르게 측정해야 합니다. 이 장면은 사고실험이며 실제 실험 결과를 보여주는 것은 아닙니다.', citationType: 'RECONSTRUCTION', quoteAttribution: null, image: null },
    ],
    keyPoints: [
      { text: '특수 상대성 이론은 빛의 속도가 모든 관찰자에게 일정하다는 전제에서 출발한다.', sectionOrder: 2 },
      { text: '다르게 움직이는 관찰자는 시간 간격과 거리를 다르게 측정할 수 있다.', sectionOrder: 3 },
    ],
    questions: [
      { keyPointIndex: 0, text: '특수 상대성 이론의 출발점이 되는 전제는?', options: ['시간은 누구에게나 같다', '빛의 속도는 관찰자와 관계없이 일정하다', '중력은 존재하지 않는다', '빛은 멈출 수 있다'], correctOptionOrder: 2, explanation: '이론은 빛의 속도가 관찰자의 운동과 관계없이 일정하다는 전제에서 시작합니다.' },
      { keyPointIndex: 1, text: '서로 다르게 움직이는 두 관찰자에게 일어날 수 있는 일은?', options: ['같은 사건의 시간 간격을 다르게 측정한다', '빛의 속도를 서로 다르게 측정한다', '항상 같은 거리를 측정한다', '서로를 볼 수 없다'], correctOptionOrder: 1, explanation: '빛의 속도가 일정하려면 시간 간격과 거리 측정이 관찰자에 따라 달라집니다.' },
    ],
    sources: [
      { title: 'On the Electrodynamics of Moving Bodies', author: 'Albert Einstein', url: null, verified: false, checkedAt: null },
    ],
  },
]
