export const people = [
  { id: 'nietzsche', name: '프리드리히 니체', handle: 'nietzsche.notes', era: '1844–1900', field: '철학', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=180&q=85', bio: '익숙한 가치에 질문을 던진 독일의 철학자.' },
  { id: 'socrates', name: '소크라테스', handle: 'socrates.dialogues', era: '기원전 470–399', field: '철학', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=180&q=85', bio: '질문과 대화를 통해 생각을 살핀 아테네의 철학자.' },
  { id: 'einstein', name: '알베르트 아인슈타인', handle: 'einstein.archive', era: '1879–1955', field: '과학', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=180&q=85', bio: '시간과 공간에 대한 새로운 관점을 제시한 물리학자.' },
  { id: 'davinci', name: '레오나르도 다빈치', handle: 'leonardo.sketchbook', era: '1452–1519', field: '예술 · 과학', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=180&q=85', bio: '예술과 과학을 넘나들며 관찰을 기록한 르네상스 인물.' },
  { id: 'curie', name: '마리 퀴리', handle: 'marie.curie.lab', era: '1867–1934', field: '과학', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=180&q=85', bio: '방사능 연구의 길을 연 과학자.' },
  { id: 'keynes', name: '존 메이너드 케인스', handle: 'keynes.economics', era: '1883–1946', field: '경제', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=180&q=85', bio: '경제 위기와 정부의 역할을 새롭게 논한 경제학자.' },
]

const image = (id, width = 900) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=88`

export const posts = [
  {
    id: 'p1', personId: 'nietzsche', type: 'carousel', likes: '2,481', date: '10월 1일',
    caption: '“신은 죽었다”는 말은 무엇을 뜻할까요? 한 문장만 떼어 읽기보다, 니체가 살던 시대와 함께 살펴봅니다. 오늘의 카드에서 그 맥락을 만나보세요.',
    tags: ['니체', '철학 읽기', '근대'],
    slides: [
      { title: '“신은 죽었다”', subtitle: '니체는 왜 이렇게 썼을까?', image: image('photo-1519681393784-d120267933ba') },
      { title: '믿음의 기반이 흔들리다', subtitle: '19세기 유럽에서는 과학과 역사 연구가 빠르게 발전하며 오래된 권위와 가치가 질문받기 시작했습니다.', image: image('photo-1464822759023-fed622ff2c3b') },
      { title: '이 문장은 선언이자 질문', subtitle: '니체는 단순히 종교를 부정하기보다, 기존 가치가 힘을 잃은 뒤 무엇을 기준으로 살아갈지 묻습니다.', image: image('photo-1470770841072-f978cf4d019e') },
      { title: '우리의 가치 만들기', subtitle: '그의 질문은 지금도 이어집니다. 내가 당연하다고 여기는 기준은 어디에서 왔을까요?', image: image('photo-1470252649378-9c29740c9fa8') },
    ],
    source: '프리드리히 니체, 『즐거운 학문』 §125 · Stanford Encyclopedia of Philosophy',
  },
  {
    id: 'p2', personId: 'einstein', type: 'carousel', likes: '1,209', date: '9월 29일',
    caption: '시간은 모두에게 똑같이 흐를까요? 상대성 이론은 시간과 공간을 서로 분리된 배경으로만 볼 수 없다고 말합니다.',
    tags: ['아인슈타인', '물리학', '상대성 이론', '우주'],
    slides: [
      { title: '시간은 누구에게나 같을까?', subtitle: '움직임과 중력에 따라 시간의 흐름은 달라질 수 있습니다.', image: image('photo-1462331940025-496dfbfc7564') },
      { title: '빛의 속도는 기준이 된다', subtitle: '특수 상대성 이론은 빛의 속도가 관찰자와 관계없이 일정하다는 생각에서 출발합니다.', image: image('photo-1451187580459-43490279c0fa') },
      { title: '시간과 공간은 함께 변한다', subtitle: '서로 다른 속도로 움직이는 관찰자는 시간 간격과 거리 측정을 다르게 할 수 있습니다.', image: image('photo-1534796636912-3b95b3ab5986') },
    ],
    source: 'Albert Einstein, “On the Electrodynamics of Moving Bodies” (1905) · Einstein Papers Project',
  },
  {
    id: 'p3', personId: 'curie', type: 'carousel', likes: '984', date: '9월 27일',
    caption: '마리 퀴리는 실험실에서 무엇을 발견했을까요? 방사능 연구와 두 원소의 발견을 따라갑니다.',
    tags: ['마리 퀴리', '과학사', '방사능'],
    slides: [
      { title: '보이지 않는 방사선', subtitle: '퀴리는 우라늄 광석이 내는 방사선의 세기를 꾸준히 측정했습니다.', image: image('photo-1532094349884-543bc11b234d') },
      { title: '폴로늄과 라듐', subtitle: '1898년 퀴리 부부는 폴로늄과 라듐이라는 새 원소를 발표했습니다.', image: image('photo-1518152006812-edab29b069ac') },
      { title: '연구를 이어간 사람', subtitle: '그의 연구는 물질의 구조에 대한 이해를 바꾸었고, 과학 연구의 역사에도 큰 흔적을 남겼습니다.', image: image('photo-1532187863486-abf9dbad1b69') },
    ],
    source: 'Nobel Prize, Marie Curie – Biographical · Musée Curie',
  },
]

export const messages = [
  { id: 'm1', personId: 'socrates', preview: '좋은 질문이네요. 그럼 정의란 무엇일까요?', time: '방금', unread: true },
  { id: 'm2', personId: 'davinci', preview: '관찰 노트에 새 그림을 남겼습니다.', time: '2시간', unread: false },
  { id: 'm3', personId: 'keynes', preview: '경제는 결국 사람의 선택을 다루죠.', time: '1일', unread: false },
]

export const reels = [
  { id: 'r1', personId: 'nietzsche', image: image('photo-1519681393784-d120267933ba', 1000), title: '니체의 질문', text: '당연한 가치가 흔들린 뒤, 우리는 무엇을 기준으로 살아갈 수 있을까요?', likes: '3.1만' },
  { id: 'r2', personId: 'einstein', image: image('photo-1462331940025-496dfbfc7564', 1000), title: '시간과 우주', text: '빛의 속도가 일정하다면, 시간과 공간은 어떻게 달라질까요?', likes: '8,420' },
]
