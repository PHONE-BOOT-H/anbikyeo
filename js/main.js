import { T } from './tuning.js';
import { Game } from './game.js';
import { renderCard, shareCard } from './card.js';
import { drawPigeon } from './sprites.js';
import * as A from './audio.js';
import { load, save } from './save.js';

const $ = id => document.getElementById(id);
const cv = $('game');
cv.width = T.W; cv.height = T.H;

let S = save({}); // 기본값 채움
A.setMuted(!!S.muted);

// ── 화면 맞춤 ──
function fit() {
  const scale = Math.min(innerWidth / T.W, innerHeight / T.H);
  const w = Math.floor(T.W * scale), h = Math.floor(T.H * scale);
  const wrap = $('wrap');
  wrap.style.width = w + 'px'; wrap.style.height = h + 'px';
}
addEventListener('resize', fit); fit();

// ── 코스메틱 ──
function unlocked(id) {
  if (id === 'chick') return S.crumbs >= T.CHICK_CRUMBS;
  const u = T.UNLOCKS.find(u => u.id === id);
  return u && S.total >= u.total;
}
function equippedList() { return (S.equipped || []).filter(unlocked); }

function drawPreview() {
  const pc = $('preview');
  const g = pc.getContext('2d');
  g.clearRect(0, 0, pc.width, pc.height);
  drawPigeon(g, 'front', equippedList(), !!S.chick && unlocked('chick'), 0, pc.width / 2, pc.height / 2, 7);
}

function renderChips() {
  const box = $('chips');
  box.innerHTML = '';
  const items = [...T.UNLOCKS.map(u => ({ id: u.id, name: u.name, cond: `누적 ${u.total.toLocaleString()}점` })),
    { id: 'chick', name: '닭둘기', cond: `부스러기 ${T.CHICK_CRUMBS}개` }];
  for (const it of items) {
    const b = document.createElement('button');
    b.className = 'chip';
    const on = it.id === 'chick' ? !!S.chick : (S.equipped || []).includes(it.id);
    if (!unlocked(it.id)) { b.classList.add('locked'); b.textContent = `${it.name} — ${it.cond}`; }
    else {
      b.textContent = it.name;
      if (on) b.classList.add('on');
      b.onclick = () => {
        if (it.id === 'chick') S = save({ chick: !S.chick });
        else {
          const eq = new Set(S.equipped || []);
          eq.has(it.id) ? eq.delete(it.id) : eq.add(it.id);
          S = save({ equipped: [...eq] });
        }
        renderChips(); drawPreview();
      };
    }
    box.appendChild(b);
  }
}

// ── 게임 ──
let lastStats = null;
const game = new Game(cv, {
  onDeath(stats) {
    lastStats = stats;
    S = save({
      best: Math.max(S.best, stats.score),
      total: S.total + stats.score,
      crumbs: S.crumbs + stats.crumbs,
    });
    showResult(stats);
  },
});

function startGame() {
  $('title').classList.add('hide');
  $('result').classList.add('hide');
  game.start(equippedList(), !!S.chick && unlocked('chick'));
}

function showResult(stats) {
  $('r-grade').textContent = stats.grade.label;
  $('r-score').textContent = `${stats.score.toLocaleString()}점`;
  $('r-detail').textContent = `최고 콤보 x${stats.maxCombo} · 부스러기 ${stats.crumbs}개 · 최고 ${S.best.toLocaleString()}점`;
  // 신규 해금 알림
  const newly = T.UNLOCKS.filter(u => S.total >= u.total && S.total - stats.score < u.total).map(u => u.name);
  if (S.crumbs >= T.CHICK_CRUMBS && S.crumbs - stats.crumbs < T.CHICK_CRUMBS) newly.push('닭둘기');
  $('r-unlock').textContent = newly.length ? `해금: ${newly.join(', ')}` : '';
  $('result').classList.remove('hide');
}

$('start').onclick = startGame;
$('again').onclick = startGame;
$('to-title').onclick = () => {
  $('result').classList.add('hide');
  renderChips(); drawPreview(); showBest();
  $('title').classList.remove('hide');
};
$('share').onclick = async () => {
  if (!lastStats) return;
  const c = renderCard(lastStats, equippedList(), !!S.chick && unlocked('chick'));
  const how = await shareCard(c, lastStats);
  $('share').textContent = how === 'downloaded' ? '저장됨' : '카드 공유';
  setTimeout(() => { $('share').textContent = '카드 공유'; }, 1500);
};
function muteLabel() { $('mute').textContent = A.isMuted() ? '소리 켜기' : '소리 끄기'; }
$('mute').onclick = () => { A.setMuted(!A.isMuted()); S = save({ muted: A.isMuted() }); muteLabel(); };

addEventListener('keydown', e => {
  if (e.key === ' ' || e.key === 'Enter') {
    if (!$('result').classList.contains('hide') || !$('title').classList.contains('hide')) {
      e.preventDefault(); startGame();
    }
  }
});

function showBest() {
  $('best').textContent = S.best > 0 ? `최고 기록 ${S.best.toLocaleString()}점` : '';
}

// 폰트 로드 후 프리뷰 다시 (픽셀 폰트 늦게 떠도 게임은 동작)
if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawPreview);

renderChips(); drawPreview(); showBest(); muteLabel();
