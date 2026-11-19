/* ============ Landing: 3D weave intro + sections ============ */
const Weave = (() => {
  let renderer, scene, camera, group, threads = [], knots, dust, knotMat, raf = 0, running = false, ok = false;
  const st = { p: 0 }, mouse = { x: 0, y: 0 }, sm = { x: 0, y: 0 };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), ease = t => t * t * (3 - 2 * t), lerp = (a, b, t) => a + (b - a) * t;
  const rnd = (a, b) => a + Math.random() * (b - a);

  function sprite() {
    const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,240,210,1)'); gr.addColorStop(.25, 'rgba(226,184,102,.85)'); gr.addColorStop(1, 'rgba(226,184,102,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64); const t = new THREE.CanvasTexture(c); return t;
  }

  function init() {
    const canvas = $('#weave');
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    } catch (e) { $('#hero').classList.add('hero-fallback'); return false; }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setClearColor(0x0A0A0C, 1);
    scene = new THREE.Scene(); scene.fog = new THREE.FogExp2(0x0A0A0C, 0.0105);
    camera = new THREE.PerspectiveCamera(38, 1, 0.1, 500);
    group = new THREE.Group(); scene.add(group);

    const mob = innerWidth < 700;
    const NW = mob ? 22 : 34, NF = mob ? 16 : 24, SEG = mob ? 110 : 160, gap = 2.2, A = 0.6;
    const total = NW + NF;
    const make = (kind, i) => {
      const pos = new Float32Array(SEG * 3), geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const warp = kind === 'warp', bright = warp && i % 6 === 3;
      const mat = new THREE.LineBasicMaterial({ color: warp ? 0xE2B866 : 0x9DB0D8, transparent: true, opacity: warp ? (bright ? .9 : .5) : .3, blending: THREE.AdditiveBlending, depthWrite: false });
      const line = new THREE.Line(geo, mat); group.add(line);
      const d = new THREE.Vector3(rnd(-1, 1), rnd(-1, 1), rnd(-.6, .6)).normalize();
      const n1 = new THREE.Vector3().crossVectors(d, new THREE.Vector3(0, 0, 1)).normalize(), n2 = new THREE.Vector3().crossVectors(d, n1).normalize();
      return { kind, i, pos, geo, mat, SEG, d, n1, n2,
        c: new THREE.Vector3(rnd(-22, 22), rnd(-14, 14), rnd(-20, 12)), L: rnd(50, 95), R1: rnd(2.5, 7), R2: rnd(2, 6), f1: rnd(.6, 1.8), f2: rnd(.4, 1.4), ph1: rnd(0, 6.28), ph2: rnd(0, 6.28), w: rnd(.15, .4),
        delay: warp ? (i / NW) * .32 : .12 + (i / NF) * .34 };
    };
    for (let i = 0; i < NW; i++) threads.push(make('warp', i));
    for (let j = 0; j < NF; j++) threads.push(make('weft', j));
    Object.assign(st, { NW, NF, gap, A });

    // evidence knots at a few crossings
    const kp = [];
    for (let i = 0; i < NW; i++) for (let j = 0; j < NF; j++) if ((i + j) % 2 === 0 && Math.random() < .07) kp.push((i - (NW - 1) / 2) * gap, (j - (NF - 1) / 2) * gap, A * 1.05);
    kp.push(0, 0, A * 1.05); // a centre knot for the zoom
    const kg = new THREE.BufferGeometry(); kg.setAttribute('position', new THREE.Float32BufferAttribute(kp, 3));
    knotMat = new THREE.PointsMaterial({ size: 1.5, map: sprite(), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
    knots = new THREE.Points(kg, knotMat); group.add(knots);

    const dp = []; for (let k = 0; k < (mob ? 350 : 750); k++) dp.push(rnd(-90, 90), rnd(-55, 55), rnd(-80, 40));
    const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.Float32BufferAttribute(dp, 3));
    dust = new THREE.Points(dg, new THREE.PointsMaterial({ size: .16, color: 0xB3B0A9, transparent: true, opacity: .4, depthWrite: false }));
    scene.add(dust);

    addEventListener('resize', size); size();
    addEventListener('pointermove', e => { mouse.x = e.clientX / innerWidth - .5; mouse.y = e.clientY / innerHeight - .5; }, { passive: true });
    document.addEventListener('visibilitychange', () => document.hidden ? stop() : (!$('#landing').hidden && start()));
    ok = true; return true;
  }
  function size() { if (!renderer) return; const w = innerWidth, h = $('#hero').clientHeight || innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); if (!running) frame(performance.now()); }

  function update(time) {
    const t = time * .001, p = st.p, { NW, NF, gap, A } = st;
    for (const th of threads) {
      const local = ease(clamp((p - th.delay) / .5, 0, 1)), pos = th.pos;
      for (let s = 0; s < th.SEG; s++) {
        const u = s / (th.SEG - 1);
        // loose silk strand
        const a = Math.sin(6.283 * th.f1 * u + th.ph1 + t * th.w) * th.R1, b = Math.cos(6.283 * th.f2 * u + th.ph2 + t * th.w * .8) * th.R2, along = (u - .5) * th.L;
        const cx = th.c.x + th.d.x * along + th.n1.x * a + th.n2.x * b;
        const cy = th.c.y + th.d.y * along + th.n1.y * a + th.n2.y * b;
        const cz = th.c.z + th.d.z * along + th.n1.z * a + th.n2.z * b;
        // woven fabric (plain weave over-under)
        let wx, wy, wz;
        if (th.kind === 'warp') { wx = (th.i - (NW - 1) / 2) * gap; wy = (u - .5) * (NF + 4) * gap; wz = A * Math.cos(Math.PI * (th.i + wy / gap + (NF - 1) / 2)); }
        else { wy = (th.i - (NF - 1) / 2) * gap; wx = (u - .5) * (NW + 4) * gap; wz = -A * Math.cos(Math.PI * (th.i + wx / gap + (NW - 1) / 2)); }
        wz += Math.sin(t * .6 + wx * .12 + wy * .08) * .35;
        pos[s * 3] = lerp(cx, wx, local); pos[s * 3 + 1] = lerp(cy, wy, local); pos[s * 3 + 2] = lerp(cz, wz, local);
      }
      th.geo.attributes.position.needsUpdate = true;
    }
    const q = ease(clamp(p / .82, 0, 1)), z2 = ease(clamp((p - .8) / .2, 0, 1));
    camera.position.set(sm.x * 4, -sm.y * 3, lerp(lerp(96, 40, q), 13, z2));
    camera.lookAt(0, 0, 0);
    group.rotation.set(lerp(-.55, -.1, q) + sm.y * .08, lerp(.32, 0, q) + sm.x * .12, lerp(.2, 0, q));
    knotMat.opacity = clamp((p - .55) / .25, 0, 1) * (.75 + Math.sin(t * 2.2) * .25);
    knotMat.size = lerp(1.2, 2.2, z2);
    dust.rotation.y = t * .01; dust.position.z = q * 18;
  }
  function frame(time) {
    sm.x += (mouse.x - sm.x) * .04; sm.y += (mouse.y - sm.y) * .04;
    update(time); renderer.render(scene, camera);
  }
  function loop(time) { if (!running) return; frame(time); raf = requestAnimationFrame(loop); }
  function start() { if (!ok && !init()) return; if (running) return; running = true; raf = requestAnimationFrame(loop); }
  function stop() { running = false; cancelAnimationFrame(raf); }
  return { start, stop, st, get ok() { return ok; }, renderOnce: () => ok && frame(performance.now()) };
})();

/* ============ 3D network hero: skills meet evidence (after the عضد homepage hero) ============ */
const Net = (() => {
  const COL = { design: '#E879B9', eng: '#8C9BFF', data: '#3FB8C4', pro: '#A98BF5', biz: '#F0A35E' };
  const SK = [['UI Design', 'design'], ['Python', 'eng'], ['User Research', 'design'], ['Data Analysis', 'data'], ['Leadership', 'pro'], ['Graphic Design', 'design'],
    ['Cloud', 'eng'], ['Communication', 'pro'], ['Product Thinking', 'biz'], ['Arabic NLP', 'data'], ['Project Management', 'biz'], ['Frontend', 'eng']];
  const EV = [['Company challenge', '#F0A35E'], ['Hackathon', '#3FB8C4'], ['Professor rubric', '#8C9BFF'], ['Club project', '#A98BF5'], ['Mentor review', '#E879B9'], ['Volunteering', '#5CCB98']];
  let renderer, scene, camera, group, layer, sec, cv, glowTex, dotTex, haloSprite, ptrLines;
  let nodes = [], links = [], seals = [], W = 0, H = 0, raf = 0, running = false, ok = false, vis = true, next = 700, seed = 11;
  const mouse = { x: -9, y: -9, on: false, w: new THREE.Vector3() }, sm = { x: 0, y: 0 };
  const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const v = new THREE.Vector3(), plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), ray = new THREE.Raycaster();
  const tex = (inner, outer) => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, inner); gr.addColorStop(outer, 'rgba(255,255,255,.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); };
  const disc = () => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); g.fillStyle = '#fff'; g.beginPath(); g.arc(32, 32, 26, 0, 6.283); g.fill(); return new THREE.CanvasTexture(c); };

  function init() {
    sec = $('#top'); cv = $('#netCanvas'); layer = $('#netLayer');
    try { renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true }); } catch (e) { return false; }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.setClearColor(0x0A0A0C, 1);
    scene = new THREE.Scene(); scene.fog = new THREE.Fog(0x0A0A0C, 34, 62);
    camera = new THREE.PerspectiveCamera(35, 1, .1, 200); camera.position.set(0, 0, 40);
    group = new THREE.Group(); scene.add(group);
    glowTex = tex('rgba(255,255,255,1)', .18); dotTex = disc();
    haloSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xA98BF5, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    haloSprite.scale.set(9, 9, 1); scene.add(haloSprite);
    const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(24 * 6), 3)); pg.setAttribute('color', new THREE.BufferAttribute(new Float32Array(24 * 6), 3));
    ptrLines = new THREE.LineSegments(pg, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: .55, blending: THREE.AdditiveBlending, depthWrite: false })); scene.add(ptrLines);
    // background depth dust
    const dp = []; for (let i = 0; i < 420; i++) dp.push((rnd() - .5) * 90, (rnd() - .5) * 50, -rnd() * 40);
    const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.Float32BufferAttribute(dp, 3));
    scene.add(new THREE.Points(dg, new THREE.PointsMaterial({ size: .12, color: 0xB3B0A9, transparent: true, opacity: .35, depthWrite: false })));
    layout();
    new ResizeObserver(() => { layout(); if (!running) frame(performance.now()); }).observe(sec);
    sec.addEventListener('pointermove', e => { const r = cv.getBoundingClientRect(); mouse.x = (e.clientX - r.left) / r.width * 2 - 1; mouse.y = -((e.clientY - r.top) / r.height) * 2 + 1; mouse.on = true; }, { passive: true });
    sec.addEventListener('pointerleave', () => { mouse.on = false; });
    sec.addEventListener('pointerdown', e => { if (e.target.closest('a,button,input')) return; clickLink(); }, { passive: true });
    try { new IntersectionObserver(es => { vis = es[0].isIntersecting; }).observe(sec); } catch (e) {}
    document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else if (!$('#landing').hidden) start(); });
    ok = true; return true;
  }

  function layout() {
    const r = sec.getBoundingClientRect(); W = r.width; H = r.height;
    renderer.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix();
    nodes.forEach(n => { n.el && n.el.remove(); n.sprite && group.remove(n.sprite); n.glow && group.remove(n.glow); });
    links.forEach(l => group.remove(l.line, l.dot)); links = []; seals.forEach(s => s.el.remove()); seals = [];
    nodes = []; layer.innerHTML = ''; seed = 11;
    const halfH = Math.tan(THREE.MathUtils.degToRad(17.5)) * 40, halfW = halfH * camera.aspect, wide = W > 760;
    const R = wide ? { x0: -halfW * .02, x1: halfW * .8, y0: -halfH * .72, y1: halfH * .7 } : { x0: -halfW * .6, x1: halfW * .6, y0: halfH * .4, y1: halfH * .84 };
    const place = (kind, label, color, minD) => {
      for (let k = 0; k < 80; k++) {
        const x = R.x0 + rnd() * (R.x1 - R.x0), y = R.y0 + rnd() * (R.y1 - R.y0), z = (rnd() - .5) * (wide ? 12 : 6);
        if (nodes.every(o => Math.hypot(o.base.x - x, o.base.y - y) > minD) || k === 79) { const n = { kind, label, color, base: new THREE.Vector3(x, y, z), pos: new THREE.Vector3(x, y, z), ph: rnd() * 6.28, sp: .3 + rnd() * .45, amp: .35 + rnd() * .55, n: 0, busy: false }; nodes.push(n); return n; }
      }
    };
    const nE = wide ? EV.length : 3, nS = wide ? SK.length : 6;
    EV.slice(0, nE).forEach(([l, c]) => { const n = place('e', l, c, wide ? 6.2 : 3.6); n.el = document.createElement('div'); n.el.className = 'net-ev'; n.el.style.setProperty('--c', c); n.el.innerHTML = '<i></i><i></i><i></i><b>' + l + '</b>'; layer.appendChild(n.el); });
    SK.slice(0, nS).forEach(([l, cat]) => {
      const c = COL[cat], n = place('s', l, c, wide ? 3.4 : 2.4);
      n.glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: new THREE.Color(c), transparent: true, opacity: .55, depthWrite: false, blending: THREE.AdditiveBlending })); n.glow.scale.set(2.2, 2.2, 1);
      n.sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex, color: new THREE.Color(c), transparent: true, depthWrite: false })); n.sprite.scale.set(.42, .42, 1);
      group.add(n.glow, n.sprite);
      n.el = document.createElement('div'); n.el.className = 'net-label'; n.el.textContent = l; layer.appendChild(n.el);
    });
  }

  function link(a, b, t) {
    if (!a || !b || a.busy || b.n >= 3) return;
    a.busy = true; b.n++;
    const g = new THREE.BufferGeometry(), N = 48; g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
    const col = new Float32Array(N * 3), ca = new THREE.Color(a.color), cb = new THREE.Color(b.color);
    for (let i = 0; i < N; i++) { const c = ca.clone().lerp(cb, i / (N - 1)); col.set([c.r, c.g, c.b], i * 3); }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setDrawRange(0, 0);
    const line = new THREE.Line(g, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: .95, blending: THREE.AdditiveBlending, depthWrite: false }));
    const dot = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffffff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); dot.scale.set(.9, .9, 1);
    group.add(line, dot); links.push({ a, b, t0: t, line, dot, N, done: false });
  }
  function spawn(t) {
    const S = nodes.filter(n => n.kind === 's' && !n.busy), E = nodes.filter(n => n.kind === 'e' && n.n < 3); if (!S.length || !E.length) return;
    const a = S[(rnd() * S.length) | 0]; let b = E[0], bd = 1e9; E.forEach(e => { const d = a.pos.distanceTo(e.pos) + rnd() * 9; if (d < bd) { bd = d; b = e; } }); link(a, b, t);
  }
  function clickLink() {
    if (!ok) return; const p = mouse.w;
    const S = nodes.filter(n => n.kind === 's' && !n.busy).sort((x, y) => x.pos.distanceTo(p) - y.pos.distanceTo(p));
    const E = nodes.filter(n => n.kind === 'e' && n.n < 3).sort((x, y) => x.pos.distanceTo(p) - y.pos.distanceTo(p));
    if (S[0] && E[0]) { link(S[0], E[0], performance.now()); SFX.play('tap'); }
  }
  const curve = (a, b) => { const m = a.pos.clone().add(b.pos).multiplyScalar(.5); m.y += 1.6; m.z += 2.2; return new THREE.QuadraticBezierCurve3(a.pos, m, b.pos); };
  const toScreen = p => { v.copy(p).applyMatrix4(group.matrixWorld).project(camera); return [(v.x + 1) / 2 * W, (1 - v.y) / 2 * H, v.z]; };

  function frame(t) {
    const s = t / 1000;
    sm.x += ((mouse.on ? mouse.x : 0) - sm.x) * .05; sm.y += ((mouse.on ? mouse.y : 0) - sm.y) * .05;
    group.rotation.set(-sm.y * .12 + Math.sin(s * .13) * .04, sm.x * .2 + Math.sin(s * .09) * .12, 0);
    group.updateMatrixWorld();
    // pointer in world (z=0 plane, group space approx)
    ray.setFromCamera({ x: mouse.x, y: mouse.y }, camera); ray.ray.intersectPlane(plane, mouse.w);
    haloSprite.position.copy(mouse.w); haloSprite.material.opacity += ((mouse.on ? .32 : 0) - haloSprite.material.opacity) * .1;
    // float + repel
    nodes.forEach(n => {
      const tx = n.base.x + Math.sin(s * n.sp + n.ph) * n.amp, ty = n.base.y + Math.cos(s * n.sp * .9 + n.ph) * n.amp, tz = n.base.z + Math.sin(s * n.sp * .7 + n.ph * 2) * n.amp;
      let fx = 0, fy = 0; if (mouse.on) { const dx = n.pos.x - mouse.w.x, dy = n.pos.y - mouse.w.y, d = Math.hypot(dx, dy); if (d < 4.5) { const f = (4.5 - d) / 4.5 * 1.6; fx = dx / (d || 1) * f; fy = dy / (d || 1) * f; } }
      n.pos.x += (tx + fx - n.pos.x) * .08; n.pos.y += (ty + fy - n.pos.y) * .08; n.pos.z += (tz - n.pos.z) * .08;
      if (n.sprite) { n.sprite.position.copy(n.pos); n.glow.position.copy(n.pos); const k = n.busy ? .58 : .42; n.sprite.scale.set(k, k, 1); n.glow.material.opacity = n.busy ? .9 : .5; }
    });
    // pointer lines to near skills
    const pa = ptrLines.geometry.attributes.position, pc = ptrLines.geometry.attributes.color; let li = 0;
    if (mouse.on) nodes.forEach(n => { if (li >= 24) return; const d = Math.hypot(n.pos.x - mouse.w.x, n.pos.y - mouse.w.y); if (d < 6.5) { v.copy(n.pos).applyMatrix4(group.matrixWorld); const c = new THREE.Color(n.color).multiplyScalar(1 - d / 6.5); pa.setXYZ(li * 2, mouse.w.x, mouse.w.y, 0); pa.setXYZ(li * 2 + 1, v.x, v.y, v.z); pc.setXYZ(li * 2, 0, 0, 0); pc.setXYZ(li * 2 + 1, c.r, c.g, c.b); li++; } });
    ptrLines.geometry.setDrawRange(0, li * 2); pa.needsUpdate = true; pc.needsUpdate = true;
    // links
    links.forEach(l => {
      const age = (t - l.t0) / 1000, grow = Math.min(1, age / .9), fade = age > 5 ? Math.max(0, 1 - (age - 5) / .7) : 1;
      if (fade <= 0) { l.dead = true; return; }
      const cu = curve(l.a, l.b), pts = cu.getPoints(l.N - 1), arr = l.line.geometry.attributes.position.array;
      pts.forEach((p, i) => arr.set([p.x, p.y, p.z], i * 3)); l.line.geometry.attributes.position.needsUpdate = true;
      l.line.geometry.setDrawRange(0, Math.max(2, Math.round(l.N * grow))); l.line.material.opacity = .95 * fade;
      if (grow < 1) l.dot.position.copy(cu.getPoint(grow)); else { l.dot.position.copy(cu.getPoint((age * .55) % 1)); l.dot.scale.set(.6, .6, 1); }
      l.dot.material.opacity = fade;
      if (grow >= 1 && !l.done) {
        l.done = true; const el = l.b.el.querySelectorAll('i')[Math.min(2, l.b.n - 1)]; el && el.classList.add('f');
        l.b.el.classList.remove('pulse'); void l.b.el.offsetWidth; l.b.el.classList.add('pulse');
        const se = document.createElement('div'); se.className = 'net-seal'; se.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/><path d="m9 12 2 2 4-4"/></svg>' + l.a.label + ' · verified';
        layer.appendChild(se); seals.push({ el: se, t0: t, p: cu.getPoint(.5) });
      }
    });
    if (links.some(l => l.dead)) { links.filter(l => l.dead).forEach(l => { l.a.busy = false; const dots = l.b.el.querySelectorAll('i.f'); dots.length && dots[dots.length - 1].classList.remove('f'); l.b.n = Math.max(0, l.b.n - 1); group.remove(l.line, l.dot); l.line.geometry.dispose(); }); links = links.filter(l => !l.dead); }
    // HTML layer: labels, evidence cards, seals
    nodes.forEach(n => {
      const [x, y, z] = toScreen(n.pos), depth = THREE.MathUtils.clamp((n.pos.z + 8) / 16, 0, 1), sc = .82 + depth * .3;
      if (n.kind === 'e') { n.el.style.transform = `translate3d(${x - 20}px,${y - 20}px,0) scale(${sc})`; n.el.style.opacity = .55 + depth * .45; }
      else { n.el.style.transform = `translate3d(${x}px,${y + 14}px,0) translateX(-50%) scale(${sc})`; n.el.style.opacity = (n.busy ? 1 : .5 + depth * .35); }
    });
    seals = seals.filter(sl => { const a = (t - sl.t0) / 2400; if (a >= 1) { sl.el.remove(); return false; } const [x, y] = toScreen(sl.p), k = a < .12 ? a / .12 : 1 - (a - .12) / .88, pop = .85 + Math.min(1, a * 7) * .15; sl.el.style.opacity = Math.max(0, k); sl.el.style.transform = `translate3d(${x}px,${y - 18 - a * 26}px,0) translate(-50%,-50%) scale(${pop})`; return true; });
    renderer.render(scene, camera);
  }
  function loop(t) { if (!running) return; raf = requestAnimationFrame(loop); if (!vis) return; if (t > next && links.length < 4) { spawn(t); next = t + 1300 + rnd() * 900; } frame(t); }
  function start() { if (!ok && !init()) return; if (running) return; running = true; raf = requestAnimationFrame(loop); }
  function stop() { running = false; cancelAnimationFrame(raf); }
  function still() { if (!ok && !init()) return; const t = performance.now(); for (let i = 0; i < 3; i++) spawn(t - 2000); links.forEach(l => l.t0 = t - 2500); frame(t); }
  return { start, stop, still, get ok() { return ok; } };
})();

let landingReady = false;
function initLanding() {
  if (landingReady) return; landingReady = true;
  // roles bento (English)
  const EN_ROLES = {
    student: ['Student', 'Reem Al-Otaibi · Information Systems', 'md:col-span-4 md:row-span-2', ['Personal dashboard and skill gaps', 'Learning Path Engine with checkpoints', 'Skill Passport with a public portfolio']],
    professor: ['Professor', 'Dr. Faisal Al-Qahtani · HCI', 'md:col-span-2', ['Rubric-based evaluation', 'Theory linked to real challenges']],
    company: ['Company', 'Rana Al-Fahad · Sana Payments', 'md:col-span-2', ['Challenge builder wizard', 'Search verified passports']],
    professional: ['Professional', 'Eng. Sara Al-Mutairi · Nakhla Studio', 'md:col-span-3', ['Publish workplace insights', 'Mentor and review projects']],
    club: ['Club', 'Hessa Al-Rashid · Al-Noor Innovation Club', 'md:col-span-3', ['Record who did what', 'Turn activities into evidence']]
  };
  $('#roleBento').innerHTML = Object.entries(EN_ROLES).map(([k, [label, who, span, caps]]) => { const big = k === 'student'; return `
    <div class="card card-pad ${span} flex flex-col ${big ? 'min-h-[340px] md:p-8' : ''}">
      <div class="flex items-center gap-3"><span class="role-ico">${I(ROLES[k].icon)}</span><div><p class="font-medium">${label}</p><p class="text-xs text-muted">${who}</p></div></div>
      ${big ? `<p class="mt-8 display text-[clamp(32px,3.6vw,52px)] leading-[1] max-w-[14ch]">The student is the centre of the <em class="text-gold">weave.</em></p>` : ''}
      <ul class="mt-6 grid gap-2 text-sm text-ink2">${caps.map(c => `<li class="flex gap-2"><i data-lucide="check" class="w-4 h-4 text-gold mt-0.5 flex-none"></i><span>${c}</span></li>`).join('')}</ul>
      <div class="mt-auto pt-6"><a class="btn ${big ? 'btn-primary' : ''} btn-sm" href="#${k}-overview">Enter as ${label.toLowerCase()} <i data-lucide="arrow-right"></i></a></div>
    </div>`; }).join('');
  // ladder (English)
  const EN_ST = {
    declared: ['Declared', 'The student claims the skill. Nothing has been tested yet.', 'A claim on the profile', 'Python: claimed, no test yet'],
    assessed: ['Assessed', 'A practical assessment was completed and scored.', 'A completed practical assessment', 'Graphic Design: placement scored 58'],
    evaluated: ['Evaluated', 'A qualified professor or professional reviewed the work.', 'A rubric review by a qualified evaluator', 'User Research: reviewed by Dr. Faisal, 74'],
    verified: ['Verified', 'Score, evaluator and independent evidence criteria are all met.', 'Score ≥ 70 + evaluator + evidence from 2 sources', 'UI Design: 86, three independent sources']
  };
  $('#ladder').innerHTML = STATE_ORDER.map((s, i) => { const [label, means, need, ex] = EN_ST[s]; return `
    <div class="card card-pad flex gap-4 items-start" style="margin-inline-start:${i * 4}%">
      <span class="seal" data-s="${s}" data-tip="${label}: ${means}"><i data-lucide="${STATES[s].icon}"></i></span>
      <div class="min-w-0 flex-1"><div class="flex flex-wrap items-center gap-2"><p class="font-medium">${label}</p><span class="mono text-[11px] text-muted">0${i + 1}</span></div>
      <p class="text-sm text-ink2 mt-1">${means}</p>
      <div class="mt-3 grid sm:grid-cols-2 gap-2 text-xs"><div class="well px-3 py-2"><span class="text-muted">Needs</span><p class="mt-0.5">${need}</p></div><div class="well px-3 py-2"><span class="text-muted">Example</span><p class="mt-0.5">${ex}</p></div></div></div>
    </div>`; }).join('') + `<div class="well p-4 flex gap-3 items-start text-sm text-ink2"><i data-lucide="ticket" class="w-4 h-4 mt-0.5 text-muted flex-none"></i><p>Participation certificates stay on the record as context. On their own they never move a skill past Declared.</p></div>`;
  icons();

  // kinetic type
  $$('.split').forEach(h => { const acc = h.dataset.accent; h.innerHTML = h.textContent.trim().split(' ').map(w => `<span class="inline-block overflow-hidden align-bottom py-[.12em] -my-[.12em] pe-[.06em]"><span class="word">${w === acc ? `<em class="text-gold">${w}</em>` : w}</span></span>`).join(' '); });

  if (!window.gsap || !window.THREE) { $('#hero').classList.add('hero-fallback'); return; }
  gsap.registerPlugin(ScrollTrigger);
  if (RM) {
    Net.still(); Weave.start(); Weave.st.p = 1; Weave.renderOnce(); Weave.stop();
    $$('.beat-3,.beat-4').forEach(b => b.style.display = 'none');
    return;
  }
  Net.start(); Weave.start();
  // run each WebGL scene only while its section is on screen
  try { new IntersectionObserver(es => es.forEach(e => { if (e.target.id === 'top') e.isIntersecting ? Net.start() : Net.stop(); else e.isIntersecting ? Weave.start() : Weave.stop(); })).observe($('#top')); } catch (e) {}
  try { new IntersectionObserver(es => es.forEach(e => { e.isIntersecting ? Weave.start() : Weave.stop(); })).observe($('#hero')); } catch (e) {}
  gsap.from('.net-copy .word', { yPercent: 110, duration: 1.4, ease: 'expo.out', stagger: .09, delay: .15 });
  gsap.from('.net-copy p, .net-copy .pe, .net-copy .net-legend', { y: 18, opacity: 0, duration: 1, ease: 'power3.out', stagger: .08, delay: .5 });
  gsap.to('.scroll-hint', { autoAlpha: 0, scrollTrigger: { trigger: '#top', start: 'top top', end: '+=120', scrub: true } });
  gsap.set('.beat-3,.beat-4', { autoAlpha: 0, y: 30 });

  const tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: '#hero', start: 'top top', end: '+=260%', pin: true, scrub: 1.1, anticipatePin: 1 } });
  tl.to(Weave.st, { p: 1, duration: 1 }, 0)
    .to('.beat-2', { autoAlpha: 0, y: -30, duration: .08, ease: 'power2.in' }, .3)
    .to('.beat-3', { autoAlpha: 1, y: 0, duration: .08, ease: 'power2.out' }, .38)
    .to('.beat-3', { autoAlpha: 0, y: -30, duration: .08, ease: 'power2.in' }, .62)
    .to('.beat-4', { autoAlpha: 1, y: 0, duration: .1, ease: 'power2.out' }, .74);

  gsap.fromTo('.journey-line', { strokeDashoffset: 1 }, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: '#journey', start: 'top 70%', end: 'bottom 60%', scrub: 1 } });
  $$('[data-stagger]').forEach(g => gsap.from(g.children, { y: 34, duration: 1, ease: 'power3.out', stagger: .07, scrollTrigger: { trigger: g, start: 'top 88%', once: true } }));
  // magnetic primary buttons
  $$('#landing .btn-primary').forEach(b => {
    b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); gsap.to(b, { x: (e.clientX - r.left - r.width / 2) * .18, y: (e.clientY - r.top - r.height / 2) * .25, duration: .4, ease: 'power3.out' }); });
    b.addEventListener('pointerleave', () => gsap.to(b, { x: 0, y: 0, duration: .6, ease: 'elastic.out(1,.5)' }));
  });
}

function setDoc(lang, dir) { const h = document.documentElement; if (h.lang !== lang) h.lang = lang; if (h.dir !== dir) h.dir = dir; }
function showLanding() {
  const L = $('#landing'), A = $('#app'), wasHidden = L.hidden;
  setDoc('en', 'ltr');
  A.hidden = true; L.hidden = false;
  initLanding();
  if (window.ScrollTrigger) { ScrollTrigger.getAll().forEach(t => t.enable()); ScrollTrigger.refresh(); }
  if (!RM) { Net.ok && Net.start(); }
  if (wasHidden) window.scrollTo(0, 0);
}
function showApp() {
  const L = $('#landing'), A = $('#app');
  setDoc('ar', 'rtl');
  if (!L.hidden) { Weave.stop(); Net.stop(); if (window.ScrollTrigger) ScrollTrigger.getAll().forEach(t => t.disable(false)); L.hidden = true; }
  A.hidden = false;
}
