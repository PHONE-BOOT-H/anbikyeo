// 공유 카드 1080×1350 — 유일한 바이럴 루프.
import { drawPigeon } from './sprites.js';

export function renderCard(stats, equipped, chick) {
  const c = document.createElement('canvas');
  c.width = 1080; c.height = 1350;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;

  // 아스팔트 배경
  g.fillStyle = '#1e1e24'; g.fillRect(0, 0, 1080, 1350);
  // 횡단보도 스트라이프 (하단, 원근 느낌)
  g.save();
  g.globalAlpha = 0.16; g.fillStyle = '#fff';
  for (let i = 0; i < 6; i++) {
    const y = 780 + i * 100, sh = 46 + i * 6;
    g.fillRect(0, y, 1080, sh);
  }
  g.restore();
  // 비네트
  const v = g.createRadialGradient(540, 620, 200, 540, 675, 900);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.5)');
  g.fillStyle = v; g.fillRect(0, 0, 1080, 1350);

  // 텍스트 가독 패널
  g.fillStyle = 'rgba(20,20,26,.62)';
  g.fillRect(60, 850, 960, 400);

  g.textAlign = 'center';
  g.fillStyle = '#f2c94c';
  g.font = '86px Galmuri11, sans-serif';
  g.fillText('안 비켜!', 540, 150);
  g.fillStyle = '#9a9aa8';
  g.font = '38px Galmuri11, sans-serif';
  g.fillText('비둘기 배짱 측정 결과', 540, 215);

  // 비둘기 (앞모습, 코스메틱 착용)
  g.save();
  g.translate(540, 560);
  g.fillStyle = 'rgba(0,0,0,.35)';
  g.beginPath(); g.ellipse(0, 218, 190, 40, 0, 0, 6.29); g.fill();
  drawPigeon(g, 'front', equipped, chick, 0, 0, 0, 28);
  g.restore();

  // 등급
  g.fillStyle = '#fff';
  g.font = '54px Galmuri11, sans-serif';
  g.fillText('배짱', 540, 920);
  g.fillStyle = '#f2c94c';
  g.font = '150px Galmuri11, sans-serif';
  g.fillText(stats.grade.label, 540, 1055);

  g.fillStyle = '#e6e6ec';
  g.font = '52px Galmuri11, sans-serif';
  g.fillText(`${stats.score.toLocaleString()}점`, 540, 1150);
  g.fillStyle = '#9a9aa8';
  g.font = '36px Galmuri11, sans-serif';
  g.fillText(`최고 콤보 x${stats.maxCombo} · 부스러기 ${stats.crumbs}개`, 540, 1210);
  g.fillStyle = '#9a9aa8';
  g.fillText('너는 몇 등급이냐', 540, 1275);
  g.fillStyle = '#6f6f77';
  g.font = '30px Galmuri11, sans-serif';
  g.fillText('phone-boot-h.github.io/anbikyeo', 540, 1322);
  return c;
}

export async function shareCard(canvas, stats) {
  const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
  const file = new File([blob], 'anbikyeo.png', { type: 'image/png' });
  const text = `배짱 ${stats.grade.label} (${stats.score.toLocaleString()}점) — 안 비켜!`;
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: '안 비켜!', text }); return 'shared'; }
    catch { /* 사용자가 취소 */ }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'anbikyeo.png';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  return 'downloaded';
}
