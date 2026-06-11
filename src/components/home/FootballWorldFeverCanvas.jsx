import { useEffect, useRef } from 'react';
import './FootballWorldFeverCanvas.css';

const BACKGROUND_SRC = '/images/promos/football-world-fever-premium-bg.png';

function easeInOutSine(t) {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function drawFootball(ctx, x, y, radius, rotation) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);

  ctx.shadowColor = 'rgba(255, 235, 165, .85)';
  ctx.shadowBlur = radius * 0.55;

  const ballGrad = ctx.createRadialGradient(-radius * .35, -radius * .45, radius * .12, 0, 0, radius);
  ballGrad.addColorStop(0, '#ffffff');
  ballGrad.addColorStop(.58, '#f8fafc');
  ballGrad.addColorStop(1, '#cbd5e1');

  ctx.fillStyle = ballGrad;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(15, 23, 42, .92)';
  ctx.lineWidth = Math.max(1.6, radius * .08);

  ctx.fillStyle = '#101827';
  ctx.beginPath();
  for (let i = 0; i < 5; i += 1) {
    const a = -Math.PI / 2 + i * Math.PI * 2 / 5;
    const px = Math.cos(a) * radius * .27;
    const py = Math.sin(a) * radius * .27;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();

  for (let i = 0; i < 6; i += 1) {
    const angle = i * Math.PI * 2 / 6 + rotation * .08;
    const px = Math.cos(angle) * radius * .64;
    const py = Math.sin(angle) * radius * .64;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * radius * .31, Math.sin(angle) * radius * .31);
    ctx.lineTo(px, py);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(px, py, radius * .14, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = 'rgba(255,255,255,.78)';
  ctx.lineWidth = Math.max(1, radius * .035);
  ctx.beginPath();
  ctx.arc(-radius * .18, -radius * .18, radius * .84, Math.PI * 1.1, Math.PI * 1.55);
  ctx.stroke();

  ctx.restore();
}

function roundedRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function drawPlayer(ctx, player, side, t, kickPower, scale) {
  const dir = side === 'left' ? 1 : -1;
  const x = player.x;
  const y = player.y;
  const bounce = Math.sin(t * Math.PI * 2 * 1.35 + player.phase) * 4 * scale;
  const lean = Math.sin(t * Math.PI * 2 * 1.2 + player.phase) * 0.055 + dir * kickPower * 0.10;

  ctx.save();
  ctx.translate(x, y + bounce);
  ctx.rotate(lean);
  ctx.scale(scale * dir, scale);

  // shadow
  ctx.save();
  ctx.scale(1 / dir, 1);
  const sh = ctx.createRadialGradient(0, 108, 8, 0, 108, 55);
  sh.addColorStop(0, 'rgba(0,0,0,.42)');
  sh.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = sh;
  ctx.beginPath();
  ctx.ellipse(0, 108, 58, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // legs behind
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#f8fafc';
  ctx.lineWidth = 10;
  ctx.strokeStyle = '#f8fafc';

  const kickAngle = side === 'left'
    ? -0.15 - kickPower * 0.88
    : 0.15 + kickPower * 0.88;
  const backAngle = side === 'left'
    ? 0.42 + kickPower * 0.12
    : -0.42 - kickPower * 0.12;

  function leg(originX, originY, len1, len2, angle, bootFlip) {
    const kneeX = originX + Math.sin(angle) * len1;
    const kneeY = originY + Math.cos(angle) * len1;
    const footX = kneeX + Math.sin(angle * .82) * len2;
    const footY = kneeY + Math.cos(angle * .82) * len2;

    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(kneeX, kneeY);
    ctx.lineTo(footX, footY);
    ctx.stroke();

    ctx.strokeStyle = '#08111f';
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(footX - 4 * bootFlip, footY + 2);
    ctx.lineTo(footX + 17 * bootFlip, footY + 5);
    ctx.stroke();
  }

  leg(-13, 47, 26, 28, backAngle, -1);
  leg(16, 47, 27, 29, kickAngle, 1);

  // arms
  ctx.strokeStyle = '#ffc08b';
  ctx.lineWidth = 11;
  ctx.beginPath();
  ctx.moveTo(-32, -18);
  ctx.quadraticCurveTo(-62, -22 - kickPower * 12, -76, 8 - kickPower * 16);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(32, -18);
  ctx.quadraticCurveTo(60, -36 + kickPower * 8, 78, -66 + kickPower * 10);
  ctx.stroke();

  // body/kit
  const bodyGrad = ctx.createLinearGradient(-40, -32, 42, 44);
  if (side === 'left') {
    bodyGrad.addColorStop(0, '#38bdf8');
    bodyGrad.addColorStop(.22, '#e0f2fe');
    bodyGrad.addColorStop(.48, '#38bdf8');
    bodyGrad.addColorStop(.70, '#e0f2fe');
    bodyGrad.addColorStop(1, '#0ea5e9');
  } else {
    bodyGrad.addColorStop(0, '#fde047');
    bodyGrad.addColorStop(.60, '#facc15');
    bodyGrad.addColorStop(.61, '#16a34a');
    bodyGrad.addColorStop(1, '#22c55e');
  }

  ctx.fillStyle = bodyGrad;
  roundedRect(ctx, -38, -34, 76, 82, 22);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.28)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // shorts
  ctx.fillStyle = side === 'left' ? '#111827' : '#1d4ed8';
  roundedRect(ctx, -36, 39, 72, 34, 13);
  ctx.fill();

  // number
  ctx.save();
  ctx.scale(1 / dir, 1);
  ctx.fillStyle = side === 'left' ? '#ffffff' : '#14532d';
  ctx.font = `900 ${20}px ui-sans-serif, system-ui, Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,.45)';
  ctx.shadowBlur = 4;
  ctx.fillText(side === 'left' ? '10' : '07', 0, 5);
  ctx.restore();

  // neck
  ctx.fillStyle = '#ffc08b';
  roundedRect(ctx, -11, -47, 22, 22, 8);
  ctx.fill();

  // face
  const faceGrad = ctx.createRadialGradient(-10, -86, 5, 0, -73, 42);
  faceGrad.addColorStop(0, '#ffd7ad');
  faceGrad.addColorStop(.75, '#ffc08b');
  faceGrad.addColorStop(1, '#f59e73');
  ctx.fillStyle = faceGrad;
  ctx.beginPath();
  ctx.ellipse(0, -78, 39, 42, 0, 0, Math.PI * 2);
  ctx.fill();

  // hair
  ctx.fillStyle = '#3b2115';
  ctx.beginPath();
  ctx.moveTo(-38, -93);
  ctx.bezierCurveTo(-34, -126, -4, -132, 12, -115);
  ctx.bezierCurveTo(33, -130, 55, -102, 37, -78);
  ctx.bezierCurveTo(20, -95, -12, -88, -38, -93);
  ctx.fill();

  // eyes / smile
  ctx.save();
  ctx.scale(1 / dir, 1);
  ctx.fillStyle = '#111827';
  ctx.beginPath(); ctx.arc(-13, -80, 4.8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(13, -80, 4.8, 0, Math.PI * 2); ctx.fill();

  ctx.strokeStyle = '#7f1d1d';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, -70, 15, 0.15, Math.PI - 0.15);
  ctx.stroke();

  ctx.fillStyle = 'rgba(248,113,113,.32)';
  ctx.beginPath(); ctx.arc(-23, -70, 6, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(23, -70, 6, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  ctx.restore();
}

export default function FootballWorldFeverCanvas() {
  const canvasRef = useRef(null);
  const bgRef = useRef(null);
  const particlesRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { alpha: true });
    if (!canvas || !ctx) return undefined;

    const bg = new Image();
    bg.src = BACKGROUND_SRC;
    bgRef.current = bg;

    let raf = 0;
    let start = performance.now();
    let lastParticle = 0;
    let width = 0;
    let height = 0;
    let dpr = 1;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, Math.floor(rect.width * dpr));
      height = Math.max(1, Math.floor(rect.height * dpr));
      canvas.width = width;
      canvas.height = height;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    const spawnParticles = (x, y, progress, time) => {
      if (time - lastParticle < 26) return;
      lastParticle = time;

      for (let i = 0; i < 3; i += 1) {
        particlesRef.current.push({
          x: x + (Math.random() - .5) * 16,
          y: y + (Math.random() - .5) * 10,
          vx: (Math.random() - .5) * 0.9 + (progress < .5 ? -0.2 : 0.2),
          vy: (Math.random() - .5) * 0.7 - 0.1,
          life: 1,
          size: 1.5 + Math.random() * 3.2,
          hue: Math.random() > .55 ? 198 : 44,
        });
      }
    };

    const drawBackground = (cw, ch, time) => {
      ctx.clearRect(0, 0, cw, ch);

      const img = bgRef.current;
      if (img?.complete && img.naturalWidth) {
        const cover = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
        const iw = img.naturalWidth * cover;
        const ih = img.naturalHeight * cover;
        const parallax = Math.sin(time / 3800) * 7;
        ctx.drawImage(img, (cw - iw) / 2 + parallax, (ch - ih) / 2, iw, ih);
      } else {
        const grad = ctx.createLinearGradient(0, 0, 0, ch);
        grad.addColorStop(0, '#071b38');
        grad.addColorStop(.62, '#03101f');
        grad.addColorStop(1, '#052313');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, cw, ch);
      }

      // dark premium overlay so UI/text feels clean
      const overlay = ctx.createLinearGradient(0, 0, 0, ch);
      overlay.addColorStop(0, 'rgba(2,6,23,.15)');
      overlay.addColorStop(.45, 'rgba(2,6,23,.20)');
      overlay.addColorStop(1, 'rgba(2,6,23,.38)');
      ctx.fillStyle = overlay;
      ctx.fillRect(0, 0, cw, ch);

      // floodlight pulse
      const pulse = .35 + Math.sin(time / 620) * .12;
      const lightL = ctx.createRadialGradient(38, 10, 8, 38, 10, 115);
      lightL.addColorStop(0, `rgba(125,211,252,${pulse})`);
      lightL.addColorStop(1, 'rgba(125,211,252,0)');
      ctx.fillStyle = lightL;
      ctx.fillRect(0, 0, cw * .36, ch * .55);

      const lightR = ctx.createRadialGradient(cw - 38, 10, 8, cw - 38, 10, 115);
      lightR.addColorStop(0, `rgba(96,165,250,${pulse})`);
      lightR.addColorStop(1, 'rgba(96,165,250,0)');
      ctx.fillStyle = lightR;
      ctx.fillRect(cw * .64, 0, cw * .36, ch * .55);
    };

    const drawText = (cw, ch) => {
      const cx = cw / 2;
      const top = ch * .13;

      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const pillW = Math.min(210, cw * .44);
      const pillH = ch < 145 ? 22 : 26;
      roundedRect(ctx, cx - pillW / 2, top, pillW, pillH, pillH / 2);
      ctx.fillStyle = 'rgba(2, 6, 23, .55)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(187, 247, 208, .28)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#bbf7d0';
      ctx.font = `900 ${ch < 145 ? 10 : 12}px ui-sans-serif, system-ui, Arial`;
      ctx.letterSpacing = '2px';
      ctx.fillText('2026 FOOTBALL FEVER', cx, top + pillH / 2 + 1);

      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0,0,0,.55)';
      ctx.shadowBlur = 8;
      ctx.font = `1000 ${Math.max(18, Math.min(32, cw * .043))}px ui-sans-serif, system-ui, Arial`;
      ctx.fillText('Live Kick Pass', cx, top + pillH + (ch < 145 ? 22 : 31));

      ctx.font = `800 ${Math.max(10, Math.min(14, cw * .02))}px ui-sans-serif, system-ui, Arial`;
      ctx.fillStyle = 'rgba(226,232,240,.9)';
      ctx.shadowBlur = 5;
      ctx.fillText('premium football motion banner', cx, top + pillH + (ch < 145 ? 41 : 52));
      ctx.restore();
    };

    const frame = (time) => {
      const elapsed = time - start;
      const cw = canvas.clientWidth;
      const ch = canvas.clientHeight;
      if (!cw || !ch) {
        raf = requestAnimationFrame(frame);
        return;
      }

      drawBackground(cw, ch, elapsed);

      const duration = 2400;
      const loop = (elapsed % duration) / duration;
      const half = loop < .5 ? loop / .5 : (loop - .5) / .5;
      const directionForward = loop < .5;
      const eased = easeInOutSine(half);

      const scale = Math.max(.48, Math.min(.88, cw / 900));
      const leftFoot = { x: cw * .205, y: ch * .635 };
      const rightFoot = { x: cw * .795, y: ch * .635 };

      const startX = directionForward ? leftFoot.x : rightFoot.x;
      const endX = directionForward ? rightFoot.x : leftFoot.x;
      const ballX = lerp(startX, endX, eased);
      const arch = Math.sin(eased * Math.PI);
      const ballY = lerp(leftFoot.y, rightFoot.y, eased) - arch * ch * .31;

      const leftKickPower = directionForward ? Math.max(0, 1 - Math.min(1, half * 5)) : Math.max(0, Math.min(1, (half - .72) * 4.2));
      const rightKickPower = !directionForward ? Math.max(0, 1 - Math.min(1, half * 5)) : Math.max(0, Math.min(1, (half - .72) * 4.2));

      drawText(cw, ch);

      // Motion trail behind ball
      ctx.save();
      ctx.lineCap = 'round';
      for (let i = 0; i < 4; i += 1) {
        const alpha = .42 - i * .08;
        ctx.strokeStyle = i % 2 ? `rgba(250,204,21,${alpha})` : `rgba(56,189,248,${alpha})`;
        ctx.lineWidth = Math.max(2, (7 - i) * scale);
        ctx.beginPath();
        const midX = (startX + endX) / 2;
        const midY = Math.min(leftFoot.y, rightFoot.y) - ch * (.24 + i * .012);
        ctx.moveTo(startX, leftFoot.y - i * 3);
        ctx.quadraticCurveTo(midX, midY, ballX - (directionForward ? 16 : -16) * (i + 1), ballY + i * 4);
        ctx.stroke();
      }
      ctx.restore();

      drawPlayer(ctx, { x: cw * .13, y: ch * .42, phase: 0 }, 'left', elapsed / 1000, leftKickPower, scale);
      drawPlayer(ctx, { x: cw * .87, y: ch * .42, phase: .7 }, 'right', elapsed / 1000, rightKickPower, scale);

      spawnParticles(ballX, ballY, loop, time);
      const particles = particlesRef.current;
      ctx.save();
      for (let i = particles.length - 1; i >= 0; i -= 1) {
        const p = particles[i];
        p.x += p.vx * 4.4;
        p.y += p.vy * 4.4;
        p.life -= .027;

        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.fillStyle = `hsla(${p.hue}, 95%, 68%, ${p.life})`;
        ctx.shadowColor = `hsla(${p.hue}, 95%, 68%, ${p.life})`;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      drawFootball(ctx, ballX, ballY, Math.max(15, Math.min(25, cw * .035)), elapsed / 190);

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <section className="football-world-canvas-card" aria-label="2026 football fever live animation">
      <canvas ref={canvasRef} className="football-world-canvas" />
    </section>
  );
}
