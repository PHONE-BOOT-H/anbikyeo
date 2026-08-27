// 게임필 파라미터 전부 여기. 튜닝 = 이 파일 상수 조정.
export const T = {
  W: 360, H: 640,

  PIGEON_Y: 470,
  PIGEON_SPEED: 430,      // 키보드 최고 속도 px/s
  PIGEON_ACCEL: 2600,
  PIGEON_HALF_W: 11,
  PIGEON_HALF_H: 11,

  HIT_SHRINK: 0.68,       // 히트박스 축소(억울한 죽음 방지)
  NEAR_DIST: 36,          // 니어미스 인정 중심거리
  NEAR_BONUS: 140,        // 거리 0 기준 최대 보너스 (콤보 곱하기 전)
  COMBO_WINDOW: 2.6,      // 초 안에 다음 니어미스 없으면 리셋
  COMBO_MAX: 9,

  SURVIVE_PER_SEC: 12,
  CRUMB_SCORE: 60,
  CRUMB_EVERY: [2.2, 4.6],

  SLOWMO_SCALE: 0.22,
  SLOWMO_MS: 130,
  DEATH_SLOWMO_MS: 650,
  SHAKE_NEAR: 3.5,
  SHAKE_DEATH: 11,

  SPAWN_START: 0.82,      // 스폰 간격(s) 시작
  SPAWN_END: 0.34,        // 최종
  SPAWN_RAMP: 95,         // 이 시간(s)에 걸쳐 도달
  SPEED_RAMP_MAX: 0.85,   // 행인 속도 배수 최종 증가량
  SCROLL: 46,             // 바닥 스크롤 px/s

  PED: {
    walker:   { vy: [95, 135],  sway: 0,  w: 22, h: 26, mul: 1.0,  weight: t => 1.0 },
    phone:    { vy: [68, 92],   sway: 30, w: 22, h: 26, mul: 1.15, weight: t => 0.55 },
    runner:   { vy: [225, 265], sway: 0,  w: 22, h: 26, mul: 1.5,  weight: t => Math.min(0.7, 0.12 + t / 110) },
    stroller: { vy: [58, 78],   sway: 0,  w: 40, h: 30, mul: 1.2,  weight: t => 0.35 },
  },

  GRADES: [
    [0, '9등급'], [300, '8등급'], [650, '7등급'], [1100, '6등급'], [1700, '5등급'],
    [2500, '4등급'], [3600, '3등급'], [5200, '2등급'], [7500, '1등급'], [10500, '무단횡단급'],
  ],

  UNLOCKS: [
    { id: 'sunglasses', name: '선글라스', total: 1000 },
    { id: 'chain',      name: '금목걸이', total: 5000 },
    { id: 'jacket',     name: '가죽자켓', total: 15000 },
    { id: 'gun',        name: '총(장식)', total: 50000 },
  ],
  CHICK_CRUMBS: 500,      // 닭둘기 해금: 부스러기 누적
};
