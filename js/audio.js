// WebAudio 합성 사운드 5종. 외부 파일 없음.
let ctx = null, master = null, muted = false;

function ac() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0.45;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function setMuted(m) { muted = m; }
export function isMuted() { return muted; }

function osc(type, f0, f1, t0, dur, peak, curve = 'exp') {
  const c = ac();
  const o = c.createOscillator(), g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, t0);
  if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g); g.connect(master);
  o.start(t0); o.stop(t0 + dur + 0.02);
}

let noiseBuf = null;
function noise(t0, dur, peak, f0, f1, q = 1.2) {
  const c = ac();
  if (!noiseBuf) {
    noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const src = c.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
  const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = q;
  bp.frequency.setValueAtTime(f0, t0);
  bp.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t0 + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(bp); bp.connect(g); g.connect(master);
  src.start(t0); src.stop(t0 + dur + 0.02);
}

// 구구 — 시작할 때
export function coo() {
  if (muted) return; const t = ac().currentTime;
  osc('sine', 340, 250, t, 0.11, 0.5);
  osc('sine', 330, 240, t + 0.13, 0.14, 0.45);
}

// 휙 — 니어미스. intensity 0~1 (가까울수록 큼)
export function whoosh(intensity) {
  if (muted) return; const t = ac().currentTime;
  noise(t, 0.13, 0.25 + 0.4 * intensity, 700 + 600 * intensity, 2600 + 1800 * intensity, 1.6);
}

// 띠링 — 콤보
export function ding(combo) {
  if (muted) return; const t = ac().currentTime;
  const f = 620 * Math.pow(1.09, Math.min(combo, 9));
  osc('square', f, f, t, 0.07, 0.16);
  osc('square', f * 1.5, f * 1.5, t + 0.05, 0.09, 0.12);
}

// 쪼기 — 부스러기
export function peck() {
  if (muted) return; const t = ac().currentTime;
  osc('triangle', 210, 140, t, 0.05, 0.35);
}

// 푸드덕 — 사망
export function flap() {
  if (muted) return; const t = ac().currentTime;
  for (let i = 0; i < 4; i++) noise(t + i * 0.07, 0.09, 0.5 - i * 0.08, 320, 180, 0.8);
  osc('sawtooth', 180, 40, t + 0.05, 0.5, 0.25);
}
