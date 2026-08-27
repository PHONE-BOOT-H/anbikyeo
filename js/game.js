import { T } from './tuning.js';
import * as SP from './sprites.js';
import * as A from './audio.js';

const rand = (a, b) => a + Math.random() * (b - a);
const lerp = (a, b, k) => a + (b - a) * k;

export class Game {
  constructor(canvas, hooks) {
    this.cv = canvas;
    this.g = canvas.getContext('2d');
    this.hooks = hooks; // { onDeath(stats) }
    this.state = 'idle';
    this.scrollOff = 0;
    this.keys = {};
    this.pointerX = null;
    this.equipped = [];
    this.chick = false;
    this.shake = 0;
    this.peds = []; this.crumbs = []; this.parts = []; this.pops = [];
    this._input();
    this.lastT = performance.now();
    requestAnimationFrame(this._frame.bind(this));
  }

  _input() {
    window.addEventListener('keydown', e => {
      if (['ArrowLeft', 'ArrowRight', 'a', 'd'].includes(e.key)) { this.keys[e.key] = true; e.preventDefault(); }
    });
    window.addEventListener('keyup', e => { this.keys[e.key] = false; });
    const toX = e => {
      const r = this.cv.getBoundingClientRect();
      return (e.clientX - r.left) / r.width * T.W;
    };
    this.cv.addEventListener('pointerdown', e => { this.down = true; this.pointerX = toX(e); });
    window.addEventListener('pointermove', e => { if (this.down) this.pointerX = toX(e); });
    window.addEventListener('pointerup', () => { this.down = false; this.pointerX = null; });
  }

  start(equipped, chick) {
    this.equipped = equipped; this.chick = chick;
    this.state = 'play';
    this.t = 0; this.score = 0; this.combo = 1; this.maxCombo = 1;
    this.comboT = 0; this.slowmoT = 0; this.crumbEaten = 0;
    this.px = T.W / 2; this.vx = 0; this.animT = 0;
    this.peds = []; this.crumbs = []; this.parts = []; this.pops = [];
    this.spawnT = 0.5; this.crumbT = rand(...T.CRUMB_EVERY);
    this.deathT = 0;
    // 첫 화면 공백 방지 — 위쪽에 미리 행인 배치
    for (let i = 0; i < 3; i++) {
      this._spawnPed();
      const p = this.peds[this.peds.length - 1];
      p.y = -80 - i * 150; p.baseX = p.x = rand(40, T.W - 40);
    }
    A.coo();
  }

  // ── 판정 ──
  _spawnPed() {
    const t = this.t;
    const entries = Object.entries(T.PED);
    let sum = 0; const ws = entries.map(([k, v]) => (sum += v.weight(t)));
    let r = Math.random() * sum, type = entries[0][0];
    for (let i = 0; i < ws.length; i++) if (r <= ws[i]) { type = entries[i][0]; break; }
    const cfg = T.PED[type];
    let x = rand(34, T.W - 34);
    for (let i = 0; i < 4; i++) { // 스폰 겹침 완화
      if (!this.peds.some(p => p.y < 40 && Math.abs(p.x - x) < 44)) break;
      x = rand(34, T.W - 34);
    }
    const k = Math.min(1, t / T.SPAWN_RAMP);
    const mul = 1 + T.SPEED_RAMP_MAX * k;
    this.peds.push({
      type, cfg, x, baseX: x, y: -70,
      vy: rand(...cfg.vy) * mul,
      swayAmp: cfg.sway, phase: rand(0, 6.28),
      minD: Infinity, passed: false, frame: rand(0, 2),
    });
  }

  _nearMiss(p) {
    const intensity = Math.max(0, 1 - p.minD / T.NEAR_DIST);
    const bonus = Math.ceil(T.NEAR_BONUS * Math.max(0.15, intensity) * p.cfg.mul) * this.combo;
    this.score += bonus;
    this.combo = Math.min(this.combo + 1, T.COMBO_MAX);
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    this.comboT = T.COMBO_WINDOW;
    this.slowmoT = T.SLOWMO_MS / 1000;
    this.shake = Math.max(this.shake, T.SHAKE_NEAR * (0.5 + intensity));
    A.whoosh(intensity);
    if (this.combo >= 3) A.ding(this.combo);
    this.pops.push({ x: this.px, y: T.PIGEON_Y - 34, txt: `+${bonus}`, sub: this.combo >= 3 ? `배짱 x${this.combo - 1}` : null, life: 0.9 });
    for (let i = 0; i < 3; i++) this._feather(this.px, T.PIGEON_Y, 60);
  }

  _feather(x, y, sp) {
    this.parts.push({
      x, y, vx: rand(-sp, sp), vy: rand(-sp * 1.2, -sp * 0.2),
      rot: rand(0, 6.28), vr: rand(-4, 4), life: rand(0.7, 1.4),
    });
  }

  _die() {
    if (this.state !== 'play') return;
    this.state = 'dying';
    this.deathT = 0;
    this.shake = T.SHAKE_DEATH;
    A.flap();
    for (let i = 0; i < 18; i++) this._feather(this.px, T.PIGEON_Y, 150);
  }

  grade(score) {
    let g = T.GRADES[0][1], idx = 0;
    T.GRADES.forEach(([min, label], i) => { if (score >= min) { g = label; idx = i; } });
    return { label: g, idx };
  }

  // ── 루프 ──
  _frame(now) {
    let dt = Math.min((now - this.lastT) / 1000, 1 / 30);
    this.lastT = now;
    let ts = 1;
    if (this.state === 'play' && this.slowmoT > 0) { ts = T.SLOWMO_SCALE; this.slowmoT -= dt; }
    if (this.state === 'dying') ts = this.deathT < T.DEATH_SLOWMO_MS / 1000 ? T.SLOWMO_SCALE : 1;
    const wdt = dt * ts;

    if (this.state === 'play') this._update(wdt, dt);
    else if (this.state === 'dying') {
      this.deathT += dt;
      this._updateWorld(wdt);
      if (this.deathT > 1.15) {
        this.state = 'result';
        this.hooks.onDeath({
          score: Math.floor(this.score),
          maxCombo: this.maxCombo,
          crumbs: this.crumbEaten,
          grade: this.grade(Math.floor(this.score)),
          time: this.t,
        });
      }
    } else {
      this.scrollOff += T.SCROLL * 0.4 * dt; // 타이틀 뒤 배경
    }
    this.shake *= Math.exp(-7 * dt);
    this._draw();
    requestAnimationFrame(this._frame.bind(this));
  }

  _update(wdt, dt) {
    this.t += wdt;
    this.score += T.SURVIVE_PER_SEC * wdt;
    this.scrollOff += T.SCROLL * wdt;

    // 이동 — 키보드
    const left = this.keys.ArrowLeft || this.keys.a, right = this.keys.ArrowRight || this.keys.d;
    const want = (right ? 1 : 0) - (left ? 1 : 0);
    if (want !== 0) this.vx += want * T.PIGEON_ACCEL * dt;
    else this.vx *= Math.exp(-14 * dt);
    this.vx = Math.max(-T.PIGEON_SPEED, Math.min(T.PIGEON_SPEED, this.vx));
    this.px += this.vx * dt;
    // 이동 — 드래그 (속도 상한 있어서 순간이동 치트 불가)
    if (this.pointerX != null) {
      const d = this.pointerX - this.px;
      const step = Math.sign(d) * Math.min(Math.abs(d), T.PIGEON_SPEED * 1.5 * dt);
      this.px += step;
      this.vx = step / Math.max(dt, 0.001) * 0.5;
    }
    this.px = Math.max(16, Math.min(T.W - 16, this.px));
    this.animT += dt * (0.6 + Math.min(1, Math.abs(this.vx) / 200));

    // 콤보 창
    if (this.comboT > 0) { this.comboT -= wdt; if (this.comboT <= 0) this.combo = 1; }

    // 스폰
    const k = Math.min(1, this.t / T.SPAWN_RAMP);
    this.spawnT -= wdt;
    if (this.spawnT <= 0) {
      this._spawnPed();
      this.spawnT = lerp(T.SPAWN_START, T.SPAWN_END, k) * rand(0.75, 1.25);
    }
    this.crumbT -= wdt;
    if (this.crumbT <= 0) {
      this.crumbs.push({ x: rand(30, T.W - 30), y: -20 });
      this.crumbT = rand(...T.CRUMB_EVERY);
    }

    this._updateWorld(wdt);

    // 충돌·니어미스
    const py = T.PIGEON_Y;
    for (const p of this.peds) {
      const dx = p.x - this.px, dy = p.y - py;
      const ad = Math.hypot(dx, dy);
      if (Math.abs(dy) < 60) p.minD = Math.min(p.minD, ad);
      if (Math.abs(dx) < (p.cfg.w / 2 + T.PIGEON_HALF_W) * T.HIT_SHRINK &&
          Math.abs(dy) < (p.cfg.h / 2 + T.PIGEON_HALF_H) * T.HIT_SHRINK) { this._die(); return; }
      if (!p.passed && dy > 58) { p.passed = true; if (p.minD < T.NEAR_DIST) this._nearMiss(p); }
    }
    // 부스러기
    for (const c of this.crumbs) {
      if (!c.eaten && Math.hypot(c.x - this.px, c.y - py) < 18) {
        c.eaten = true;
        this.score += T.CRUMB_SCORE; this.crumbEaten++;
        A.peck();
        this.pops.push({ x: c.x, y: c.y - 12, txt: `+${T.CRUMB_SCORE}`, sub: null, life: 0.7 });
      }
    }
    this.crumbs = this.crumbs.filter(c => !c.eaten && c.y < T.H + 30);
  }

  _updateWorld(wdt) {
    for (const p of this.peds) {
      p.y += p.vy * wdt;
      if (p.swayAmp) p.x = p.baseX + Math.sin(p.y * 0.018 + p.phase) * p.swayAmp;
      p.frame += wdt * 6;
    }
    this.peds = this.peds.filter(p => p.y < T.H + 90);
    const k = Math.min(1, this.t / T.SPAWN_RAMP);
    for (const c of this.crumbs) c.y += T.SCROLL * (1 + T.SPEED_RAMP_MAX * k) * wdt;
    for (const f of this.parts) {
      f.life -= wdt; f.x += f.vx * wdt; f.y += f.vy * wdt;
      f.vy += 220 * wdt; f.vx *= Math.exp(-1.5 * wdt); f.rot += f.vr * wdt;
    }
    this.parts = this.parts.filter(f => f.life > 0);
    for (const p of this.pops) { p.life -= wdt; p.y -= 34 * wdt; }
    this.pops = this.pops.filter(p => p.life > 0);
  }

  // ── 렌더 ──
  _draw() {
    const g = this.g;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.imageSmoothingEnabled = false;
    if (this.shake > 0.3) g.translate(rand(-this.shake, this.shake), rand(-this.shake, this.shake));

    // 보도블럭
    g.fillStyle = '#a2a2aa'; g.fillRect(-16, -16, T.W + 32, T.H + 32);
    g.fillStyle = '#93939b';
    const bs = 44, off = this.scrollOff % bs;
    for (let y = -bs; y < T.H + bs; y += bs) {
      g.fillRect(-16, y + off, T.W + 32, 2);
      const shift = (Math.floor((y - off) / bs) % 2) * (bs / 2);
      for (let x = -bs; x < T.W + bs; x += bs) g.fillRect(x + shift, y + off, 2, bs);
    }
    // 점자 유도블록 (한국 보도 시그니처)
    g.fillStyle = '#c9a83a';
    g.fillRect(T.W / 2 - 76, 0, 22, T.H);
    g.fillStyle = '#b8982f';
    for (let y = -bs; y < T.H + bs; y += 11) {
      for (let x = 0; x < 3; x++) g.fillRect(T.W / 2 - 72 + x * 7, y + off % 11 * 1 + (this.scrollOff % 11), 4, 4);
    }
    // 연석
    g.fillStyle = '#7b7b83'; g.fillRect(-16, -16, 30, T.H + 32); g.fillRect(T.W - 14, -16, 30, T.H + 32);

    // 부스러기
    for (const c of this.crumbs) g.drawImage(SP.crumb, Math.round(c.x - 4), Math.round(c.y - 3), 8, 6);

    // 엔티티 y 정렬 (아래 = 앞)
    const ents = [];
    if (this.state !== 'idle') ents.push({ y: T.PIGEON_Y, kind: 'pigeon' });
    for (const p of this.peds) ents.push({ y: p.y, kind: 'ped', p });
    ents.sort((a, b) => a.y - b.y);
    for (const e of ents) {
      if (e.kind === 'pigeon') this._drawPigeon(g);
      else this._drawPed(g, e.p);
    }

    // 깃털
    for (const f of this.parts) {
      g.save();
      g.translate(f.x, f.y); g.rotate(f.rot);
      g.globalAlpha = Math.min(1, f.life);
      g.drawImage(SP.feather, -5, -4, 10, 8);
      g.restore();
    }
    g.globalAlpha = 1;

    // 점수 팝
    g.textAlign = 'center';
    for (const p of this.pops) {
      g.globalAlpha = Math.min(1, p.life * 2);
      g.font = '16px Galmuri11, sans-serif';
      g.fillStyle = '#1c1c22'; g.fillText(p.txt, p.x + 1, p.y + 1);
      g.fillStyle = '#fff'; g.fillText(p.txt, p.x, p.y);
      if (p.sub) {
        g.font = '12px Galmuri11, sans-serif';
        g.fillStyle = '#f2c94c'; g.fillText(p.sub, p.x, p.y + 15);
      }
    }
    g.globalAlpha = 1;

    // HUD
    if (this.state === 'play' || this.state === 'dying') {
      g.font = '30px Galmuri11, sans-serif';
      g.fillStyle = 'rgba(28,28,34,.55)'; g.fillText(Math.floor(this.score), T.W / 2 + 2, 52);
      g.fillStyle = '#fff'; g.fillText(Math.floor(this.score), T.W / 2, 50);
      if (this.combo > 1) {
        const w = 110 * (this.comboT / T.COMBO_WINDOW);
        g.fillStyle = 'rgba(28,28,34,.4)'; g.fillRect(T.W / 2 - 57, 62, 114, 8);
        g.fillStyle = '#f2c94c'; g.fillRect(T.W / 2 - 55, 64, w, 4);
        g.font = '13px Galmuri11, sans-serif';
        g.fillStyle = '#1c1c22'; g.fillText(`배짱 x${this.combo}`, T.W / 2 + 1, 84);
        g.fillStyle = '#f2c94c'; g.fillText(`배짱 x${this.combo}`, T.W / 2, 83);
      }
    }
  }

  _drawPigeon(g) {
    const dead = this.state === 'dying' || this.state === 'result';
    g.save();
    g.translate(Math.round(this.px), T.PIGEON_Y);
    if (dead) {
      g.scale(1.25, 0.45); // 밟힘
      g.rotate(0.3);
    } else {
      g.rotate(Math.sin(this.animT * 9) * 0.055 + this.vx / 3200);
    }
    // 그림자
    g.fillStyle = 'rgba(0,0,0,.18)';
    g.beginPath(); g.ellipse(0, 13, 13, 4, 0, 0, 6.29); g.fill();
    SP.drawPigeon(g, 'back', this.equipped, this.chick, Math.floor(this.animT * 6), 0, 0, 2);
    g.restore();
  }

  _drawPed(g, p) {
    const spr = SP.peds[p.type][Math.floor(p.frame) % 2];
    const w = spr.width * 2, h = spr.height * 2;
    g.fillStyle = 'rgba(0,0,0,.15)';
    g.beginPath(); g.ellipse(p.x, p.y + p.cfg.h / 2, p.cfg.w / 2 + 3, 4, 0, 0, 6.29); g.fill();
    // 히트박스 하단 정렬: 발 위치 = p.y + h/2
    g.drawImage(spr, Math.round(p.x - w / 2), Math.round(p.y + p.cfg.h / 2 - h), w, h);
  }
}
