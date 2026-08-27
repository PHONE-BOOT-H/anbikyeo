// 전 에셋 코드 드로잉. 픽셀맵 → 오프스크린 캔버스, 정수배 확대(스무딩 off)로 사용.
const PAL = {
  K: '#1c1c22', D: '#565663', L: '#9a9aa8', W: '#c9c9d4',
  G: '#3fae6b', P: '#8a56b8', O: '#e08a2e', Y: '#f2c94c',
  B: '#17171c', J: '#4a3020', j: '#6b4a2e', R: '#d24632',
  S: '#f1c27d', N: '#2c3e57', T: '#f4f4f6', C: '#7fd6f2',
  H: '#2a2a30', V: '#4a7c59',
};

function mk(rows) {
  const w = rows[0].length, h = rows.length;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const ch = rows[y][x];
    if (ch !== '.' && PAL[ch]) { g.fillStyle = PAL[ch]; g.fillRect(x, y, 1, 1); }
  }
  return c;
}

// ── 비둘기 (게임: 뒷모습, 위를 보고 걸음) ──
const PB_BODY = [
  '......KKKK......',
  '.....KLLLLK.....',
  '.....KGPGPK.....',
  '......KLLK......',
  '....KKLLLLKK....',
  '...KLLLLLLLLK...',
  '..KDLLLLLLLLDK..',
  '..KDLLLLLLLLDK..',
  '..KDLLLLLLLLDK..',
  '..KDDLLLLLLDDK..',
  '...KDDLLLLDDK...',
  '....KDDDDDDK....',
  '.....KDDDDK.....',
  '.....KDDDDK.....',
];
export const pigeonBack = [
  mk([...PB_BODY, '..OO..KDDK......', '.......KK.......']),
  mk([...PB_BODY, '......KDDK..OO..', '.......KK.......']),
];

// ── 비둘기 (타이틀·카드: 앞모습) ──
export const pigeonFront = mk([
  '......KKKK......',
  '.....KLLLLK.....',
  '....KLBLLBLK....',
  '.....KLOOLK.....',
  '....KGPGPGPK....',
  '...KLLLLLLLLK...',
  '..KDLWWWWWWLDK..',
  '..KDLWWWWWWLDK..',
  '..KDLLWWWWLLDK..',
  '..KDLLLLLLLLDK..',
  '...KLLLLLLLLK...',
  '....KLLLLLLK....',
  '.....KLLLLK.....',
  '......KKKK......',
  '....OO....OO....',
  '................',
]);

// ── 닭둘기 (히든 스킨 — 비만) ──
export const chickFront = mk([
  '......KKKK......',
  '.....KLLLLK.....',
  '....KLBLLBLK....',
  '.....KLOOLK.....',
  '...KLLLLLLLLK...',
  '..KLLLLLLLLLLK..',
  '.KDLWWWWWWWWLDK.',
  '.KDLWWWWWWWWLDK.',
  '.KDLWWWWWWWWLDK.',
  '.KDLLWWWWWWLLDK.',
  '.KDLLLLLLLLLLDK.',
  '..KLLLLLLLLLLK..',
  '...KLLLLLLLLK...',
  '....KKKKKKKK....',
  '....OO....OO....',
  '................',
]);
const CB_BODY = [
  '......KKKK......',
  '.....KLLLLK.....',
  '.....KLLLLK.....',
  '......KLLK......',
  '...KKLLLLLLKK...',
  '..KLLLLLLLLLLK..',
  '.KDLLLLLLLLLLDK.',
  '.KDLLLLLLLLLLDK.',
  '.KDLLLLLLLLLLDK.',
  '.KDDLLLLLLLLDDK.',
  '..KDDLLLLLLDDK..',
  '...KDDDDDDDDK...',
  '....KDDDDDDK....',
  '.....KDDDDK.....',
];
export const chickBack = [
  mk([...CB_BODY, '..OO..KDDK......', '.......KK.......']),
  mk([...CB_BODY, '......KDDK..OO..', '.......KK.......']),
];

// ── 코스메틱 레이어 (16×16, 비둘기와 같은 좌표계) ──
const E = '................';
export const cosmetics = {
  sunglasses: {
    front: mk([E, E, '...BBBBBBBBBB...', E, E, E, E, E, E, E, E, E, E, E, E, E]),
    back:  mk([E, '....B......B....', E, E, E, E, E, E, E, E, E, E, E, E, E, E]),
  },
  chain: {
    front: mk([E, E, E, E, E, '....Y..YY..Y....', '.......YY.......', E, E, E, E, E, E, E, E, E]),
    back: null,
  },
  jacket: {
    front: mk([E, E, E, E, E, '...KJ......JK...',
      '..KJJ......JJK..', '..KJj......jJK..', '..KJj......jJK..', '..KJJ......JJK..',
      '...KJJ....JJK...', '....KJ....JK....', E, E, E, E]),
    back: mk([E, E, E, E, E, E,
      '..KJJJJJJJJJJK..', '..KJjjJJJJjjJK..', '..KJJJJJJJJJJK..', '..KJJJJJJJJJJK..',
      '...KJJJJJJJJK...', '....KJJJJJJK....', E, E, E, E]),
  },
  gun: {
    front: mk([E, E, E, E, E, E, E, E, '............BBB.', '.............B..', '.............B..', E, E, E, E, E]),
    back:  mk([E, E, E, E, E, E, E, '.............BB.', '.............B..', '.............B..', E, E, E, E, E, E]),
  },
};

// ── 행인 (앞모습, 아래로 걸어옴) ──
function ped(bodyRows, feetA, feetB) {
  return [mk([...bodyRows, feetA]), mk([...bodyRows, feetB])];
}
export const peds = {
  walker: ped([
    '....KKKK....', '...KHHHHK...', '...KSSSSK...', '....KSSK....',
    '...KNNNNK...', '..KNNNNNNK..', '..KNTTTTNK..', '..KNNNNNNK..',
    '..KNNNNNNK..', '...KNNNNK...', '...KNNNNK...', '...KN..NK...', '...KN..NK...',
  ], '...BB..B....', '....B..BB...'),
  phone: ped([
    '....KKKK....', '...KHHHHK...', '...KHHHHK...', '....KSSK....',
    '...KDDDDK...', '..KDDDDDDK..', '..KDDCCDDK..', '..KDSCCSDK..',
    '..KDDDDDDK..', '...KDDDDK...', '...KDDDDK...', '...KD..DK...', '...KD..DK...',
  ], '...BB..B....', '....B..BB...'),
  runner: ped([
    '....KKKK....', '...KHHHHK...', '...KSSSSK...', '....KSSK....',
    '...KRRRRK...', '..KSRRRRSK..', '..KSRRRRSK..', '...KRRRRK...',
    '...KBBBBK...', '...KS..SK...', '...KS..SK...',
  ], '...TT..T....', '....T..TT...'),
};

// 유모차 = 사람(초록 코트) + 앞 유모차 합성
function mkStrollerFrame(feet) {
  const person = mk([
    '....KKKK....', '...KHHHHK...', '...KSSSSK...', '....KSSK....',
    '...KVVVVK...', '..KVVVVVVK..', '..KVVVVVVK..', '..KVVVVVVK..',
    '...KVVVVK...', '...KV..VK...', feet,
  ]);
  const cart = mk([
    '..KKKKKKKKKKKKKKKK..',
    '.KNNNNNNNNNNNNNNNNK.',
    '.KNNNNNNNNNNNNNNNNK.',
    '..KKKKKKKKKKKKKKKK..',
    '...KDDDDDDDDDDDDK...',
    '...KDDDDDDDDDDDDK...',
    '....KKKKKKKKKKKK....',
    '.....B........B.....',
    '....BBB......BBB....',
    '....BBB......BBB....',
  ]);
  const c = document.createElement('canvas');
  c.width = 20; c.height = 22;
  const g = c.getContext('2d');
  g.drawImage(person, 4, 0);
  g.drawImage(cart, 0, 12);
  return c;
}
peds.stroller = [mkStrollerFrame('...KV..VK...'), mkStrollerFrame('...KV..VK...')];

// ── 소품 ──
export const crumb = mk(['.jO.', 'Ojjj', '.Oj.']);
export const feather = mk(['..W..', '.WLW.', '.WLW.', '..L..']);

// 비둘기 합성 렌더: view 'back'|'front', equipped 배열, chick 여부
export function drawPigeon(g, view, equipped, chick, frame, x, y, scale) {
  const base = view === 'back'
    ? (chick ? chickBack : pigeonBack)[frame % 2]
    : (chick ? chickFront : pigeonFront);
  const layers = [base];
  for (const id of equipped) {
    const spr = cosmetics[id] && cosmetics[id][view];
    if (spr) layers.push(spr);
  }
  g.imageSmoothingEnabled = false;
  for (const s of layers) {
    g.drawImage(s, Math.round(x - s.width * scale / 2), Math.round(y - s.height * scale / 2), s.width * scale, s.height * scale);
  }
}
