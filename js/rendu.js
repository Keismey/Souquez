// Souquez ! : dessin du jeu (formes simples en attendant la DA).
'use strict';
// ---------- Rendu ----------
let W = 0, H = 0, dpr = 1;
function resize() { const r = cv.getBoundingClientRect(); dpr = Math.min(window.devicePixelRatio || 1, 2); W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr; }
window.addEventListener('resize', resize);
function mix(c1, c2, k) { const a = parseInt(c1.slice(1), 16), b = parseInt(c2.slice(1), 16); const r = Math.round(lerp(a >> 16, b >> 16, k)), g = Math.round(lerp((a >> 8) & 255, (b >> 8) & 255, k)), bl = Math.round(lerp(a & 255, b & 255, k)); return 'rgb(' + r + ',' + g + ',' + bl + ')'; }
// Formes simples en attendant la DA : le monde fait 400 unités de haut, la caméra suit le navire.
let tAmb = 0;
const C = (c) => cx.fillStyle = c;
function rr(x, y, w, h, r) { cx.beginPath(); cx.roundRect ? cx.roundRect(x, y, w, h, r) : cx.rect(x, y, w, h); }
function mate(x, y, bob, tint, run, alarm, idx, dir) {
  // Image de la DA si elle existe : matelot en morceaux animé
  if (ART.equipage.length) { const P = ART.equipage[(idx || 0) % ART.equipage.length]; drawPuppet(P, x, y, alarm ? 'alarm' : run ? 'run' : 'idle', bob, dir || 1, (idx || 0) * 1.7); return; }
  y -= bob * 5 + (run ? Math.abs(Math.sin(tAmb * 18 + x)) * 3 : 0);
  C(tint || '#e9dcc0');
  if (run) { cx.strokeStyle = tint || '#e9dcc0'; cx.lineWidth = 2.5; cx.beginPath(); cx.moveTo(x - 4, y - 12); cx.lineTo(x - 8, y - 22); cx.moveTo(x + 4, y - 12); cx.lineTo(x + 8, y - 22); cx.stroke(); }
  rr(x - 5, y - 15, 10, 13, 4); cx.fill();
  cx.beginPath(); cx.arc(x, y - 19, 5, 0, 7); cx.fill();
  C('#3a2c22'); cx.fillRect(x - 4, y - 21, 8, 2.5);
  if (alarm) { C('#ffd447'); cx.fillRect(x - 1.5, y - 38, 3, 8); cx.fillRect(x - 1.5, y - 28, 3, 3); }
}
function drawShip(sh, guard, pulse, listening) {
  const bob = Math.sin(tAmb * 1.6) * 2 + sh.hurt * 3 * Math.sin(tAmb * 40);
  cx.save(); cx.translate(sh.x, SEA + 6 + bob); cx.scale(0.9, 0.9);
  const N = ART.navire;
  if (N) { // Image de la DA : coque en coupe (largeur en unités ; x, y = coin haut gauche par rapport au navire)
    const w = N.largeur || 330, h = w * N.img.height / N.img.width;
    if (sh.hurt > 0.5) cx.filter = 'sepia(1) saturate(3) hue-rotate(-30deg)';
    cx.drawImage(N.img, N.x ?? -w / 2, N.y ?? 30 - h, w, h); cx.filter = 'none';
  } else {
  // Cheminée et fumée
  C('#3d3f48'); cx.fillRect(-92, -118, 20, 70);
  C('#b5442e'); cx.fillRect(-92, -118, 20, 8);
  for (let i = 0; i < 4; i++) { const k = (tAmb * 0.6 + i / 4) % 1; C('rgba(190,190,195,' + (0.45 * (1 - k)) + ')'); cx.beginPath(); cx.arc(-82 - k * 60, -126 - k * 50, 8 + k * 16, 0, 7); cx.fill(); }
  // Château et capitaine au tambour
  C('#7d6650'); rr(-62, -84, 84, 44, 6); cx.fill();
  C('#2b211a'); for (let i = 0; i < 3; i++) { cx.beginPath(); cx.arc(-44 + i * 24, -62, 6, 0, 7); cx.fill(); }
  C('#5a4636'); cx.fillRect(-68, -88, 96, 6);
  }
  mate(-30, -88, 0, '#f4c86a', false, false, 0);
  const dr = 9 + pulse * 2.5; C('#c98b4f'); cx.beginPath(); cx.arc(-12, -98, dr, 0, 7); cx.fill();
  C('#f2e6c8'); cx.beginPath(); cx.arc(-12, -98, dr - 3, 0, 7); cx.fill();
  if (pulse > 0) { cx.strokeStyle = 'rgba(255,220,140,' + pulse * 0.8 + ')'; cx.lineWidth = 3; cx.beginPath(); cx.arc(-12, -98, dr + (1 - pulse) * 26, 0, 7); cx.stroke(); }
  if (!N) {
  // Coque en coupe
  cx.beginPath(); cx.moveTo(-150, -40); cx.lineTo(160, -40); cx.lineTo(132, 30); cx.lineTo(-124, 30); cx.quadraticCurveTo(-150, 12, -150, -40); cx.closePath();
  C(sh.hurt > 0.5 ? '#a0503a' : '#6a4630'); cx.fill(); cx.strokeStyle = '#2a1a11'; cx.lineWidth = 3; cx.stroke();
  C('#2b1e17'); cx.fillRect(-132, -32, 262, 26); cx.fillRect(-120, -2, 236, 24);
  C('#8a6a4c'); cx.fillRect(-150, -42, 310, 4); cx.fillRect(-134, -6, 266, 4);
  }
  // Pont des canons
  for (let i = 0; i < 2; i++) {
    if (N) { if (sh.recoil[i] > 0.5) { C('rgba(255,200,90,' + sh.recoil[i] + ')'); cx.beginPath(); cx.arc(92 + i * 46, -20, 10 * sh.recoil[i], 0, 7); cx.fill(); } continue; }
    const bx = 62 + i * 46 - sh.recoil[i] * 8;
    C('#4a4d55'); rr(bx - 26, -26, 40, 12, 4); cx.fill();
    C('#2f3138'); cx.fillRect(bx + 10, -24, 14, 8);
    if (sh.recoil[i] > 0.5) { C('rgba(255,200,90,' + sh.recoil[i] + ')'); cx.beginPath(); cx.arc(bx + 30, -20, 10 * sh.recoil[i], 0, 7); cx.fill(); }
  }
  // Salle des machines : la chaudière bat avec le tempo et chauffe avec le combo
  if (!N) {
  const glow = 0.35 + (G ? G.heat : 0) * 0.45 + pulse * 0.2;
  C('#3a2a22'); rr(-100, 0, 50, 20, 5); cx.fill();
  C('rgba(255,150,60,' + glow + ')'); cx.beginPath(); cx.arc(-75, 10, 7 + pulse * 2, 0, 7); cx.fill();
  // Proue : figure de proue
  C('#c9a14a'); cx.beginPath(); cx.moveTo(160, -40); cx.lineTo(178, -52); cx.lineTo(170, -36); cx.closePath(); cx.fill();
  }
  // Matelots fixes (un par poste) puis l'équipage mobile
  const active = listening && G && G.resp ? ORDER_ZONE[G.resp.cmd] : null;
  FIXED.forEach(([fx2, fy, zn], i) => mate(fx2, fy, active === zn ? pulse : 0, '#f0d9a8', false, false, i + 1));
  const crew = G ? G.crew : newCrew();
  crew.forEach((r, i) => { const run = r.x !== r.tx || r.y !== r.ty; mate(r.x, r.y, !run && active === r.zone ? pulse : 0, null, run, r.panic > 0.9, i + 5, r.tx < r.x ? -1 : 1); });
  // Roue à aubes
  if (!N) {
  cx.save(); cx.translate(-6, 26); cx.rotate(sh.wheel);
  cx.strokeStyle = '#3b2a1e'; cx.lineWidth = 4; cx.beginPath(); cx.arc(0, 0, 26, 0, 7); cx.stroke();
  for (let i = 0; i < 8; i++) { cx.rotate(Math.PI / 4); C('#5c4230'); cx.fillRect(-3, 14, 6, 16); }
  cx.restore();
  }
  // Bouclier quand Protéger est actif
  if (guard) { cx.strokeStyle = 'rgba(120,220,255,.85)'; cx.lineWidth = 5; cx.beginPath(); cx.arc(40, -20, 150, -1.0, 1.0); cx.stroke(); C('rgba(120,220,255,.12)'); cx.beginPath(); cx.arc(40, -20, 150, -1.0, 1.0); cx.lineTo(40, -20); cx.fill(); }
  cx.restore();
}
// Monstre qui attaque hors de l'écran (Crache-Boulons, portée 760) : badge au bord droit,
// à la hauteur du monstre. Pendant l'annonce, il grossit et clignote en rouge comme le monstre lui-même.
function drawOffscreenFoes(cam, VW) {
  let n = 0;
  for (const e of G.mons) {
    if (e.hp <= 0 || e.fade < 1 || e.x - G.ship.x > e.reach || e.x - 60 * e.size - cam < VW) continue; // badge masqué dès que le monstre entre dans le cadre
    const y = SEA - 62 - n++ * 54, x = VW - 44, tele = e.tele ? 1 : 0;
    const r = 18 + tele * (4 + Math.sin(tAmb * 14) * 3);
    cx.save(); cx.translate(x, y);
    if (tele) { C('rgba(255,90,58,' + (0.35 + Math.sin(tAmb * 14) * 0.2) + ')'); cx.beginPath(); cx.arc(0, 0, r + 10, 0, 7); cx.fill(); }
    C('rgba(10,20,24,.82)'); cx.beginPath(); cx.arc(0, 0, r, 0, 7); cx.fill();
    cx.strokeStyle = tele ? '#ff5a3a' : '#f2e6cc'; cx.lineWidth = 2.5; cx.stroke();
    const M = ART.monstres[e.type];
    if (M) { const h = r * 1.4, w = h * M.img.width / M.img.height; cx.save(); cx.beginPath(); cx.arc(0, 0, r - 2, 0, 7); cx.clip(); if (M.regard === 'droite') cx.scale(-1, 1); cx.drawImage(M.img, -w / 2, -h / 2, w, h); cx.restore(); }
    else { C(e.color); cx.beginPath(); cx.ellipse(-2, 0, 11, 8, -0.15, 0, 7); cx.fill(); C(tele ? '#ff5a3a' : '#f0c040'); cx.beginPath(); cx.arc(-6, -2, 2.5 + tele, 0, 7); cx.fill(); }
    // Flèche vers la droite : le monstre est par là
    C(tele ? '#ff5a3a' : '#f2e6cc'); cx.beginPath(); cx.moveTo(r + 4, -7); cx.lineTo(r + 13, 0); cx.lineTo(r + 4, 7); cx.closePath(); cx.fill();
    cx.restore();
  }
}
function drawMonster(e) {
  if (e.fade <= 0) return;
  const M = ART.monstres[e.type];
  if (M) { // Image de la DA : se dresse avant d'attaquer, tremble quand touchée, coule en mourant
    const hh = (M.hauteur || 120) * e.size, ww = hh * M.img.width / M.img.height, x = e.x + (Math.random() - 0.5) * 8 * e.shake;
    cx.save(); cx.globalAlpha = e.fade; cx.translate(x, SEA + 20 + (1 - e.fade) * 80); cx.rotate(e.raise * 0.12);
    if (M.regard === 'droite') cx.scale(-1, 1);
    cx.drawImage(M.img, -ww / 2, -hh, ww, hh);
    if (M.regard === 'droite') cx.scale(-1, 1);
    if (e.tele) { C('rgba(255,90,58,.28)'); cx.beginPath(); cx.arc(-ww * 0.3, -hh * 0.8, 22, 0, 7); cx.fill(); }
    for (let i = 0; i < e.max; i++) { C(i < e.hp ? '#ffd447' : 'rgba(0,0,0,.4)'); cx.beginPath(); cx.arc(-(e.max - 1) * 5 + i * 10, -hh - 10, 3.5, 0, 7); cx.fill(); }
    cx.restore(); return;
  }
  const z = e.size, x = e.x + (Math.random() - 0.5) * 8 * e.shake, sink = (1 - e.fade) * 80;
  cx.save(); cx.globalAlpha = e.fade; cx.translate(x, SEA + 8 + sink);
  const metal = e.color, dark = '#2c3a40';
  // Anneaux du corps
  for (let i = 3; i >= 0; i--) { const r = (16 - i * 2) * z; C(i % 2 ? dark : metal); cx.beginPath(); cx.arc((20 + i * 30) * z, -4 * z + Math.sin(tAmb * 2 + i) * 3, r, Math.PI, 0); cx.fill(); }
  // Cou et tête, qui se dresse avant d'attaquer
  const hy = -(52 + e.raise * 34) * z, hx2 = -24 * z;
  cx.strokeStyle = metal; cx.lineWidth = 18 * z; cx.lineCap = 'round';
  cx.beginPath(); cx.moveTo(8 * z, 0); cx.quadraticCurveTo(10 * z, hy * 0.6, hx2 + 10 * z, hy); cx.stroke();
  C(metal); cx.beginPath(); cx.ellipse(hx2, hy, 24 * z, 16 * z, -0.15, 0, 7); cx.fill();
  C(dark); cx.beginPath(); cx.moveTo(hx2 - 24 * z, hy + 4 * z); cx.lineTo(hx2 + 6 * z, hy + 8 * z); cx.lineTo(hx2 - 18 * z, hy + 16 * z + e.raise * 6 * z); cx.closePath(); cx.fill();
  C('#e8e2d0'); for (let i = 0; i < 3; i++) { cx.beginPath(); cx.moveTo(hx2 - (20 - i * 7) * z, hy + 5 * z); cx.lineTo(hx2 - (17 - i * 7) * z, hy + 11 * z); cx.lineTo(hx2 - (14 - i * 7) * z, hy + 5 * z); cx.fill(); }
  C(e.tele ? '#ff5a3a' : '#f0c040'); cx.beginPath(); cx.arc(hx2 - 6 * z, hy - 5 * z, (3 + e.tele * 2) * z, 0, 7); cx.fill();
  if (e.tele) { C('rgba(255,90,58,.25)'); cx.beginPath(); cx.arc(hx2 - 6 * z, hy - 5 * z, 16 * z, 0, 7); cx.fill(); }
  // Points de vie
  for (let i = 0; i < e.max; i++) { C(i < e.hp ? '#ffd447' : 'rgba(0,0,0,.4)'); cx.beginPath(); cx.arc(hx2 - (e.max - 1) * 5 + i * 10, hy - 32 * z, 3.5, 0, 7); cx.fill(); }
  cx.restore();
}
function frame() {
  requestAnimationFrame(frame);
  if (!W) resize();
  const dt = 1 / 60; tAmb += dt;
  if (G && !G.paused && ctx) update(dt);
  const S = H / 400, VW = W / S;
  const heat = G ? (G.heat ?? 0) : 0.3, pulse = G ? G.pulse : 0;
  const sh = G ? G.ship : { x: 140, tx: 140, hp: SHIP.hull, wheel: tAmb * 0.3, recoil: [0, 0], hurt: 0 };
  const camT = sh.x - VW * 0.36;
  if (G) { if (G.cam === null) G.cam = camT; G.cam = lerp(G.cam, camT, 0.08); }
  const cam = G ? G.cam : camT;
  const shx = G ? (Math.random() - 0.5) * 6 * G.shake : 0;
  cx.setTransform(dpr * S, 0, 0, dpr * S, 0, 0);
  // Ciel de crépuscule, plus chaud quand le rythme tient
  if (ART.fond) { // Image de la DA : fond de mer (couvre l'écran, léger décalage avec la caméra)
    // Le fond glisse en continu du début au port (pas de saut) : il est 15 % plus large que l'écran.
    const F = ART.fond.img, s = Math.max(VW * 1.15 / F.width, 400 / F.height), fw = F.width * s;
    const prog = Math.min(1, Math.max(0, cam / Math.max(1, LEVEL.portX - VW * 0.64)));
    cx.drawImage(F, -prog * (fw - VW), 0, fw, F.height * s);
  } else {
  const sky = cx.createLinearGradient(0, 0, 0, SEA);
  sky.addColorStop(0, mix('#1b2a3d', '#2c3550', heat)); sky.addColorStop(1, mix('#8f6a5a', '#e0955a', heat));
  C(sky); cx.fillRect(0, 0, VW, 400);
  C('rgba(255,214,150,' + (0.35 + heat * 0.4) + ')'); cx.beginPath(); cx.arc(VW * 0.72 - cam * 0.03, SEA - 30, 34, 0, 7); cx.fill();
  for (let i = 0; i < 6; i++) { const x = ((i * 260 - cam * 0.15 + tAmb * 4) % (VW + 300) + VW + 300) % (VW + 300) - 150; C('rgba(40,44,60,.45)'); cx.beginPath(); cx.ellipse(x, 60 + (i % 3) * 40, 120, 18, 0, 0, 7); cx.fill(); }
  // Mer lointaine
  C('#24425a'); cx.fillRect(0, SEA - 4, VW, 400);
  }
  cx.save(); cx.translate(-cam + shx, 0);
  // Fort ennemi au bout de la mer
  const fx = LEVEL.portX, lit = G ? G.totemLit : 0;
  C(lit ? mix('#4a4a52', '#ffd447', lit) : '#4a4a52'); cx.fillRect(fx - 40, SEA - 120, 80, 120); cx.fillRect(fx - 56, SEA - 130, 112, 14);
  C('#2a2a30'); for (let i = 0; i < 3; i++) cx.fillRect(fx - 30 + i * 24, SEA - 100, 10, 16);
  if (G) for (const e of G.mons) drawMonster(e);
  const listening = G && G.mode !== 'calib' && inResp(G.curBeat);
  drawShip(sh, G && guarded(G.curBeat), pulse, listening);
  // Boulets et projectiles
  if (G) for (const s of G.shots) {
    const k = Math.min(1, s.t / s.dur), x = lerp(s.x0, s.x1, k), y = lerp(s.y0, s.y1, k) - Math.sin(k * Math.PI) * (s.mon ? 50 : 60);
    C(s.spit ? '#e0a050' : s.mon ? '#9fe0ff' : '#1d1d22'); cx.beginPath(); cx.arc(x, y, s.spit ? 6 : s.mon ? 8 : 5, 0, 7); cx.fill();
  }
  if (G) for (const p of G.puffs) { const k = p.t / 0.6; C(p.blue ? 'rgba(140,220,255,' + (1 - k) + ')' : 'rgba(255,190,110,' + (1 - k) * 0.9 + ')'); cx.beginPath(); cx.arc(p.x, p.y, (p.big ? 22 : 12) + k * 30, 0, 7); cx.fill(); }
  if (G) for (const f of G.fx) { C('rgba(140,240,140,' + (1 - f.t / 0.9) + ')'); const y = f.y - f.t * 40; cx.fillRect(f.x - 2, y - 7, 4, 14); cx.fillRect(f.x - 7, y - 2, 14, 4); }
  // Vagues de premier plan
  C('rgba(28,62,86,.88)'); cx.beginPath(); cx.moveTo(cam - 50, 400);
  for (let x = Math.floor((cam - 50) / 20) * 20; x <= cam + VW + 50; x += 20) cx.lineTo(x, SEA + 36 + Math.sin(x * 0.05 + tAmb * 2) * 4);
  cx.lineTo(cam + VW + 50, 400); cx.fill();
  cx.strokeStyle = 'rgba(200,230,240,.35)'; cx.lineWidth = 2; cx.beginPath();
  for (let x = Math.floor((cam - 50) / 20) * 20; x <= cam + VW + 50; x += 20) cx.lineTo(x, SEA + 36 + Math.sin(x * 0.05 + tAmb * 2) * 4);
  cx.stroke();
  cx.restore();
  if (G) drawOffscreenFoes(cam, VW);
  // Coque restante, dans le coin haut gauche sous la pause
  cx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const f = sh.hp / SHIP.hull, bx0 = 16, by0 = 70;
  C('rgba(10,20,24,.7)'); rr(bx0, by0, 128, 14, 7); cx.fill();
  C(f > 0.5 ? '#7fd36b' : f > 0.25 ? '#f0b545' : '#e0573d'); rr(bx0 + 3, by0 + 3, 122 * f, 8, 4); cx.fill();
}
