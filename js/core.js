/* ============ NASJ core: helpers, sound, state, router, shell, overlays, charts ============ */
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const MIRROR = { 'arrow-right': 'arrow-left', 'arrow-left': 'arrow-right', 'chevron-right': 'chevron-left', 'chevron-left': 'chevron-right', 'arrow-up-right': 'arrow-up-left' };
const I = (n, c = '') => `<i data-lucide="${MIRROR[n] || n}"${c ? ` class="${c}"` : ''}></i>`;
const P = id => PEOPLE[id];
const av = (id, size = '') => `<span class="av ${size}" style="--c:${P(id).c}" aria-hidden="true">${P(id).ini}</span>`;
const stChip = s => s === 'participation'
  ? `<span class="chip" data-tip="شهادات الحضور تُحفظ في السجل ولا تُحسب في التوثيق">${I('ticket')} حضور فقط</span>`
  : `<span class="chip st" data-s="${s}" data-tip="${STATES[s].means}">${I(STATES[s].icon)} ${STATES[s].label}</span>`;
const seal = (s, sm) => `<span class="seal ${sm ? 'seal-sm' : ''}" data-s="${s}" data-tip="${STATES[s].label}: ${STATES[s].means}">${I(STATES[s].icon)}</span>`;
const fmtDate = d => d ? new Date(d + 'T00:00:00').toLocaleDateString('ar-SA-u-ca-gregory-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';
const lvlIdx = l => LEVELS.indexOf(l);
const skill = id => S.skills.find(s => s.id === id);
const stateCount = st => S.skills.filter(s => s.st === st).length;

const head = (eyebrow, title, sub = '', actions = '') => `
  <div class="flex flex-wrap items-end justify-between gap-4 mb-6 md:mb-8" data-rv>
    <div class="min-w-0"><p class="eyebrow mb-2">${eyebrow}</p>
      <h1 class="display text-[clamp(26px,3.2vw,40px)] leading-[1.05] font-semibold">${title}</h1>
      ${sub ? `<p class="mt-2 text-ink2 max-w-[64ch] leading-relaxed">${sub}</p>` : ''}</div>
    ${actions ? `<div class="flex flex-wrap gap-2">${actions}</div>` : ''}
  </div>`;

const stat = (label, value, o = {}) => `
  <div class="card card-pad ${o.go ? 'is-link' : ''}" ${o.go ? `data-go="${o.go}"` : ''} data-rv>
    <div class="flex items-center justify-between gap-2"><p class="text-[13px] text-ink2">${label}</p>${o.icon ? `<span class="text-muted">${I(o.icon, 'w-4 h-4')}</span>` : ''}</div>
    <p class="mt-3 display text-[32px] md:text-[36px] leading-none font-semibold num"><span data-count="${value}">${value}</span>${o.suffix ? `<span class="text-ink2 text-xl">${o.suffix}</span>` : ''}</p>
    ${o.sub ? `<p class="mt-2 text-xs text-muted">${o.sub}</p>` : ''}
  </div>`;

const sectionTitle = (t, right = '') => `<div class="flex items-center justify-between gap-3 mb-4"><h2 class="text-[15px] font-semibold">${t}</h2>${right}</div>`;
const bar = (pct, cls = '') => `<div class="bar ${cls}"><i style="width:${Math.max(0, Math.min(100, pct))}%"></i></div>`;
const empty = (icon, t, s) => `<div class="well p-8 text-center"><span class="text-muted">${I(icon, 'w-6 h-6 mx-auto')}</span><p class="mt-3 font-medium">${t}</p><p class="mt-1 text-sm text-muted">${s}</p></div>`;

/* ---------------- state ---------------- */
const S = {
  role: 'student', page: 'overview', shell: null,
  sound: (() => { try { return localStorage.getItem('nasj-sound') !== 'off'; } catch (e) { return true; } })(),
  skills: SKILLS.map(s => ({ ...s, ev: [...s.ev] })),
  challenges: CHALLENGES.map(c => ({ ...c })),
  queue: QUEUE.map(q => ({ ...q })),
  done: [],
  shortlist: new Set(['reem', 'khalid', 'abdullah']),
  compare: ['reem', 'abdullah', 'khalid'],
  insights: INSIGHTS.slice(),
  contributions: [],
  sessions: SESSIONS.slice(),
  pathDone: false,
  activities: ACTIVITIES.map(a => ({ ...a }))
};

/* ---------------- sound ---------------- */
const SFX = {
  ctx: null, last: 0,
  ensure() { if (!this.ctx) { try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { this.ctx = null; } } return this.ctx; },
  tone(f1, f2, dur, gain, type = 'sine', delay = 0) {
    const c = this.ctx; if (!c) return;
    const t = c.currentTime + delay, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f1, t); o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + 0.02);
  },
  play(kind) {
    if (!S.sound) return;
    const c = this.ensure(); if (!c) return;
    if (c.state === 'suspended') c.resume().catch(() => {});
    if (kind === 'tap') { this.tone(1320, 880, 0.05, 0.045); }
    else if (kind === 'hover') { const n = performance.now(); if (n - this.last < 70) return; this.last = n; this.tone(2600, 2200, 0.018, 0.008); }
    else if (kind === 'open') { this.tone(420, 760, 0.16, 0.03, 'triangle'); }
    else if (kind === 'success') { this.tone(660, 662, 0.16, 0.05); this.tone(990, 992, 0.28, 0.045, 'sine', 0.09); }
    else if (kind === 'toggle') { this.tone(900, 1200, 0.04, 0.035, 'triangle'); }
  }
};

/* ---------------- overlays ---------------- */
function openModal(html, o = {}) {
  const ov = $('#overlay'), dlg = $('#dialog');
  ov.classList.toggle('drawer', !!o.drawer);
  dlg.className = 'dialog' + (o.lg ? ' lg' : '');
  dlg.innerHTML = html;
  ov.classList.add('on'); ov.setAttribute('aria-hidden', 'false');
  icons(); charts(dlg);
  dlg.scrollTop = 0;
  SFX.play('open');
  setTimeout(() => { const f = dlg.querySelector('input,textarea,select,button:not([data-act=closeModal])'); f && f.focus({ preventScroll: true }); }, 60);
}
function closeModal() { const ov = $('#overlay'); ov.classList.remove('on'); ov.setAttribute('aria-hidden', 'true'); }
const modalHead = (eyebrow, title) => `<div class="sticky top-0 z-10 flex items-start justify-between gap-4 px-6 pt-6 pb-4 bg-[var(--surface)]"><div class="min-w-0"><p class="eyebrow mb-1.5">${eyebrow}</p><h2 class="display text-2xl font-semibold leading-tight">${title}</h2></div><button class="btn btn-ghost btn-icon btn-sm" data-act="closeModal" aria-label="إغلاق">${I('x')}</button></div>`;

function toast(msg, icon = 'check-circle-2') {
  const t = document.createElement('div');
  t.className = 'toast'; t.innerHTML = `${I(icon)}<div class="min-w-0">${msg}</div>`;
  $('#toasts').appendChild(t); icons();
  if (!RM && window.gsap) gsap.fromTo(t, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: .45, ease: 'power3.out' });
  setTimeout(() => { if (!RM && window.gsap) gsap.to(t, { y: 10, opacity: 0, duration: .35, onComplete: () => t.remove() }); else t.remove(); }, 3400);
}

/* ---------------- tooltip ---------------- */
const tipEl = () => $('#tip');
function showTip(html, x, y) {
  const t = tipEl(); t.dir = document.documentElement.dir || 'rtl'; t.innerHTML = html; t.classList.add('on');
  const w = t.offsetWidth, h = t.offsetHeight;
  let lx = x + 14, ly = y - h - 12;
  if (lx + w > innerWidth - 8) lx = x - w - 14;
  if (ly < 8) ly = y + 18;
  t.style.left = lx + 'px'; t.style.top = ly + 'px';
}
function hideTip() { tipEl().classList.remove('on'); }

/* ---------------- icons ---------------- */
function icons() { if (window.lucide) lucide.createIcons({ attrs: { 'stroke-width': 1.6 } }); }

/* ---------------- charts (drawn at real width) ---------------- */
const CH = {};
let chartSeq = 0;
function chart(type, cfg, cls = '') { const id = 'ch' + (++chartSeq); CH[id] = { type, cfg }; return `<div class="chart relative ${cls}" data-chart="${id}" style="height:${cfg.h || 200}px" role="img" aria-label="${esc(cfg.label || 'رسم بياني')}"></div>`; }
function charts(root = document) { $$('[data-chart]', root).forEach(el => { const c = CH[el.dataset.chart]; if (!c) return; (c.type === 'line' ? drawLine : drawBars)(el, c.cfg); }); }
let rzT; addEventListener('resize', () => { clearTimeout(rzT); rzT = setTimeout(() => charts(), 160); });

function drawLine(el, c) {
  const W = Math.max(260, el.clientWidth), H = c.h || 200, pl = 32, pr = 14, pt = 12, pb = 26;
  const n = c.labels.length, all = c.series.flatMap(s => s.vals);
  const min = c.min ?? Math.floor(Math.min(...all) / 10) * 10, max = c.max ?? Math.ceil(Math.max(...all) / 10) * 10;
  const x = i => pl + (W - pl - pr) * (n === 1 ? .5 : i / (n - 1)), y = v => pt + (H - pt - pb) * (1 - (v - min) / (max - min || 1));
  let g = '';
  for (let k = 0; k <= 4; k++) { const v = min + (max - min) * k / 4; g += `<line x1="${pl}" x2="${W - pr}" y1="${y(v)}" y2="${y(v)}"/><text x="${pl - 8}" y="${y(v) + 4}" text-anchor="end">${Math.round(v)}</text>`; }
  const step = Math.ceil(n / Math.max(4, Math.floor((W - pl) / 54)));
  let xl = c.labels.map((l, i) => (i % step === 0 || i === n - 1) ? `<text x="${x(i)}" y="${H - 6}" text-anchor="middle">${l}</text>` : '').join('');
  let paths = '', ends = '', dots = '';
  c.series.forEach((s, si) => {
    const d = s.vals.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('');
    if (si === 0) paths += `<path d="${d}L${x(n - 1)},${y(min)}L${x(0)},${y(min)}Z" fill="url(#ga-${el.dataset.chart})"/>`;
    paths += `<path d="${d}" fill="none" stroke="${s.color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" ${s.dash ? 'stroke-dasharray="4 5"' : ''}/>`;
    if (si === 0) ends += `<circle cx="${x(n - 1)}" cy="${y(s.vals[n - 1])}" r="4.5" fill="${s.color}" stroke="var(--surface)" stroke-width="2"/>`;
    dots += `<circle class="hd" data-s="${si}" r="4" fill="${s.color}" stroke="var(--surface)" stroke-width="2" opacity="0"/>`;
  });
  const legend = c.series.length > 1 ? `<div class="absolute left-0 -top-1 flex gap-4 text-xs text-ink2">${c.series.map(s => `<span class="inline-flex items-center gap-2"><span class="inline-block w-4 h-0.5 rounded" style="background:${s.color};${s.dash ? 'background:repeating-linear-gradient(90deg,' + s.color + ' 0 4px,transparent 4px 7px)' : ''}"></span>${s.name}</span>`).join('')}</div>` : '';
  el.innerHTML = `${legend}<svg width="${W}" height="${H}" class="block overflow-visible"><defs><linearGradient id="ga-${el.dataset.chart}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${c.series[0].color}" stop-opacity=".22"/><stop offset="1" stop-color="${c.series[0].color}" stop-opacity="0"/></linearGradient></defs>
    <g class="grid">${g}</g>${xl}${paths}${ends}<line class="xhair" y1="${pt}" y2="${H - pb}"/>${dots}<rect x="${pl}" y="0" width="${W - pl - pr}" height="${H}" fill="transparent"/></svg>`;
  const svg = el.querySelector('svg'), xh = svg.querySelector('.xhair'), hd = $$('.hd', svg);
  svg.addEventListener('pointermove', e => {
    const r = svg.getBoundingClientRect(), px = e.clientX - r.left;
    const i = Math.max(0, Math.min(n - 1, Math.round((px - pl) / ((W - pl - pr) / (n - 1 || 1)))));
    xh.setAttribute('x1', x(i)); xh.setAttribute('x2', x(i));
    hd.forEach(d => { const s = c.series[+d.dataset.s]; d.setAttribute('cx', x(i)); d.setAttribute('cy', y(s.vals[i])); d.setAttribute('opacity', 1); });
    showTip(`<div class="text-muted mb-1">${c.labels[i]}</div>${c.series.map(s => `<div class="flex items-center gap-2"><span class="dot" style="--c:${s.color}"></span>${s.name} <b class="ml-auto pl-3">${s.vals[i]}${c.unit || ''}</b></div>`).join('')}`, e.clientX, e.clientY);
  });
  svg.addEventListener('pointerleave', () => { hd.forEach(d => d.setAttribute('opacity', 0)); hideTip(); });
}

function drawBars(el, c) {
  const W = Math.max(240, el.clientWidth), H = c.h || 180, pl = 28, pr = 6, pt = 10, pb = 24;
  const n = c.vals.length, max = c.max ?? Math.ceil(Math.max(...c.vals) / 5) * 5;
  const slot = (W - pl - pr) / n, bw = Math.max(6, Math.min(34, slot - 6));
  const y = v => pt + (H - pt - pb) * (1 - v / max), base = H - pb;
  let g = '';
  for (let k = 0; k <= 3; k++) { const v = max * k / 3; g += `<line x1="${pl}" x2="${W - pr}" y1="${y(v)}" y2="${y(v)}"/><text x="${pl - 7}" y="${y(v) + 4}" text-anchor="end">${Math.round(v)}</text>`; }
  const step = Math.ceil(n / Math.max(4, Math.floor(W / 46)));
  let bars = '';
  c.vals.forEach((v, i) => {
    const bx = pl + slot * i + (slot - bw) / 2, by = y(v), r = Math.min(4, bw / 2, base - by);
    const hi = c.hi === undefined ? i === n - 1 : c.hi === i;
    bars += `<path d="M${bx},${base}L${bx},${by + r}Q${bx},${by} ${bx + r},${by}L${bx + bw - r},${by}Q${bx + bw},${by} ${bx + bw},${by + r}L${bx + bw},${base}Z" fill="var(--gold)" opacity="${hi ? 1 : .42}"/>`;
    bars += `<rect x="${pl + slot * i}" y="${pt}" width="${slot}" height="${H - pt - pb + 4}" fill="transparent" data-i="${i}"/>`;
    if (i % step === 0 || i === n - 1) bars += `<text x="${bx + bw / 2}" y="${H - 6}" text-anchor="middle">${c.labels[i]}</text>`;
  });
  el.innerHTML = `<svg width="${W}" height="${H}" class="block"><g class="grid">${g}</g>${bars}</svg>`;
  const svg = el.querySelector('svg');
  svg.addEventListener('pointermove', e => { const r = e.target.closest('rect[data-i]'); if (!r) return hideTip(); const i = +r.dataset.i; showTip(`<div class="text-muted mb-0.5">${c.tipPrefix || ''}${c.labels[i]}</div><b>${c.vals[i]}</b> ${c.unit || ''}`, e.clientX, e.clientY); });
  svg.addEventListener('pointerleave', hideTip);
}

const spark = (vals, w = 120, h = 34) => {
  if (!vals.length) return `<svg width="${w}" height="${h}"><line x1="0" x2="${w}" y1="${h - 2}" y2="${h - 2}" stroke="var(--line-2)" stroke-dasharray="3 4"/></svg>`;
  const min = Math.min(...vals) - 6, max = Math.max(...vals) + 4, n = vals.length;
  const x = i => n === 1 ? w / 2 : 4 + (w - 8) * i / (n - 1), y = v => 3 + (h - 6) * (1 - (v - min) / (max - min || 1));
  const d = vals.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('');
  return `<svg width="${w}" height="${h}" aria-hidden="true"><path d="${d}" fill="none" stroke="var(--gold)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${x(n - 1)}" cy="${y(vals[n - 1])}" r="3.5" fill="var(--gold)" stroke="var(--surface)" stroke-width="2"/></svg>`;
};
const ring = (pct, size = 120, label = '') => {
  const r = size / 2 - 7, C = 2 * Math.PI * r;
  return `<div class="relative inline-grid place-items-center" style="width:${size}px;height:${size}px"><svg width="${size}" height="${size}" class="-rotate-90" aria-hidden="true"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" stroke="var(--surface-3)" stroke-width="6" fill="none"/><circle class="ring-fg" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke="var(--gold)" stroke-width="6" fill="none" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - pct / 100)}" data-c="${C}" data-p="${pct}"/></svg><div class="absolute text-center"><p class="display text-[28px] font-semibold leading-none num">${pct}<span class="text-ink2 text-base">%</span></p>${label ? `<p class="text-[11px] text-muted mt-1">${label}</p>` : ''}</div></div>`;
};
const hbars = (rows, o = {}) => `<div class="grid gap-3">${rows.map(([l, v], i) => `
  <div class="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1.5 items-center" data-tip="${esc(l)}: ${o.prefix || ''}${v}${o.unit || ''}">
    <span class="text-sm truncate">${l}</span><span class="text-sm num text-ink2" dir="ltr">${o.prefix || ''}${v}${o.unit || ''}</span>
    <div class="col-span-2 bar ${o.thin ? 'thin' : ''}"><i style="width:${(v / (o.max || Math.max(...rows.map(r => r[1])))) * 100}%;opacity:${o.fade ? 1 - i * .07 : 1}"></i></div>
  </div>`).join('')}</div>`;

/* ---------------- shell ---------------- */
const JUMPS = [
  ['student-passport', 'جواز المهارات', 'badge-check'], ['student-paths', 'محرك مسارات التعلم', 'route'], ['student-hack-mizan', 'مساهمات الهاكاثون', 'zap'],
  ['professor-evaluate-q1', 'واجهة التقييم', 'clipboard-check'], ['company-builder', 'منشئ التحديات', 'wand-sparkles'], ['company-talent', 'اكتشاف المواهب', 'radar'],
  ['club-contributions', 'توثيق المساهمات', 'file-check-2'], ['student-pulse', 'نبض السوق', 'activity']
];
function roleSub(r) { const R = ROLES[r], p = P(R.who); return R.org ? `${p.n} · ${R.org}` : (p.title ? `${p.title}` : `${p.major} · ${p.yr}`); }
function navCount(k) {
  const r = S.role;
  if (r === 'student' && k === 'skills') return S.skills.length;
  if (r === 'student' && k === 'challenges') return S.challenges.filter(c => c.st === 'open').length;
  if (r === 'professor' && k === 'evaluate') return S.queue.length;
  if (r === 'professional' && k === 'reviews') return S.queue.length;
  if (r === 'company' && k === 'shortlist') return S.shortlist.size;
  if (r === 'company' && k === 'submissions') return 87;
  return '';
}
function buildShell() {
  const r = S.role, R = ROLES[r], p = P(R.who);
  const profile = (r === 'student' || r === 'professional') ? `${r}-profile` : `${r}-overview`;
  $('#sideRole').innerHTML = `<button class="w-full card p-3 flex items-center gap-3 text-left is-link" data-go="${profile}">${av(R.who)}<div class="min-w-0"><p class="text-sm font-medium truncate">${p.n}</p><p class="text-xs text-muted truncate">${R.org || p.title || p.major + ' · ' + p.yr}</p></div></button>`;
  $('#sideNav').innerHTML = `<p class="eyebrow px-3 pt-2 pb-2">${{ student: 'مساحة الطالب', professor: 'مساحة الأستاذ', company: 'مساحة الشركة', professional: 'مساحة المهني', club: 'مساحة النادي' }[r]}</p>` + NAV[r].map(([k, l, ic]) => { const n = navCount(k); return `<a class="nav-item" href="#${r}-${k}" data-k="${k}">${I(ic)}<span class="truncate">${l}</span>${n !== '' ? `<span class="count">${n}</span>` : ''}</a>`; }).join('');
  $('#sideFoot').innerHTML = `<button class="nav-item w-full" data-act="toggleMega">${I('repeat-2')}<span>بدّل الدور</span><span class="count">5</span></button><a class="nav-item" href="#home">${I('sparkles')}<span>العودة للمقدمة</span></a>`;
  $('#roleBtn').innerHTML = `${av(R.who, 'av-sm')}<span class="hidden sm:block text-start leading-tight"><span class="block text-[13px]">${R.label}</span></span>${I('chevrons-up-down', 'w-4 h-4 text-muted')}`;
  $('#mega').innerHTML = `<div class="grid md:grid-cols-[1.3fr_1fr] gap-2">
    <div><p class="eyebrow px-3 pt-2 pb-1">بدّل الدور · تجربة بلا تسجيل دخول</p>${Object.entries(ROLES).map(([k, x]) => `
      <button class="role-opt ${k === r ? 'on' : ''}" data-go="${k}-overview" role="menuitem"><span class="role-ico">${I(x.icon)}</span><span class="min-w-0"><span class="flex items-center gap-2 text-sm font-medium">${x.label}${k === r ? `<span class="chip h-5 px-2 text-[10px]">الحالي</span>` : ''}</span><span class="block text-xs text-muted truncate mt-0.5">${roleSub(k)}</span><span class="block text-xs text-ink2 mt-1">${x.blurb}</span></span></button>`).join('')}</div>
    <div class="well p-3 self-start"><p class="eyebrow mb-2 px-1">انتقل إلى ميزة</p>${JUMPS.map(([h, l, ic]) => `<a href="#${h}" class="nav-item h-9 text-[13px]" role="menuitem">${I(ic)}<span>${l}</span><span class="count">${ROLES[h.split('-')[0]].label}</span></a>`).join('')}</div></div>`;
  $('#crumbRole').textContent = `${R.label} · ${R.org || p.n}`;
  setSoundBtn();
  S.shell = r;
}
function setSoundBtn() { const b = $('#soundBtn'); if (!b) return; b.innerHTML = I(S.sound ? 'volume-2' : 'volume-x'); b.setAttribute('aria-pressed', S.sound); icons(); }
function toggleMega(force) {
  const m = $('#mega'), open = force ?? !m.classList.contains('open');
  m.classList.toggle('open', open); $('#roleBtn').setAttribute('aria-expanded', open);
  if (open) { closeSide(); SFX.play('open'); }
}
function openSide() { $('#side').classList.add('open'); $('#scrim').classList.add('on'); }
function closeSide() { $('#side').classList.remove('open'); $('#scrim').classList.remove('on'); }

/* ---------------- router ---------------- */
const VIEWS = { student: {}, professor: {}, company: {}, professional: {}, club: {}, shared: {} };
const ALIAS = { hack: 'hackathons', profile: null, portfolio: 'passport', builder: 'challenges', evaluate: 'evaluate', reviews: 'reviews' };
function parse() {
  const h = decodeURIComponent(location.hash.slice(1));
  if (!h || h === 'home') return { landing: true };
  const i = h.indexOf('-'), role = i < 0 ? h : h.slice(0, i), page = i < 0 ? 'overview' : h.slice(i + 1);
  if (!ROLES[role]) return { landing: true };
  return { role, page };
}
function resolve(role, page) {
  const V = VIEWS[role];
  if (V[page]) return [V[page], null, page];
  if (VIEWS.shared[page]) return [VIEWS.shared[page], null, page];
  const j = page.indexOf('-');
  if (j > 0) { const b = page.slice(0, j), arg = page.slice(j + 1); if (V[b]) return [V[b], arg, b]; if (VIEWS.shared[b]) return [VIEWS.shared[b], arg, b]; }
  return [V.overview, null, 'overview'];
}
let firstApp = true;
function route() {
  const r = parse();
  toggleMega(false); closeSide(); closeModal(); hideTip();
  if (r.landing) { showLanding(); return; }
  showApp();
  S.role = r.role; S.page = r.page;
  if (S.shell !== r.role) buildShell();
  renderPage();
}
function renderPage() {
  const [fn, arg, base] = resolve(S.role, S.page);
  const main = $('#main');
  main.innerHTML = fn(arg);
  const navKey = ALIAS[base] !== undefined && ALIAS[base] !== null ? ALIAS[base] : base;
  $$('#sideNav .nav-item').forEach(a => a.classList.toggle('on', a.dataset.k === navKey));
  const item = NAV[S.role].find(n => n[0] === navKey);
  $('#crumbPage').textContent = item ? item[1] : (base === 'profile' ? 'الملف الشخصي' : base);
  icons(); charts(main);
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  if (!RM && window.gsap) {
    const els = $$('[data-rv]', main).slice(0, 24);
    gsap.fromTo(els, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: .6, ease: 'power3.out', stagger: .035, clearProps: 'transform,opacity' });
    $$('[data-count]', main).forEach(n => { const v = parseFloat(n.dataset.count); if (isNaN(v)) return; const dec = (n.dataset.count.split('.')[1] || '').length; const o = { v: 0 }; gsap.to(o, { v, duration: 1.1, ease: 'power2.out', onUpdate: () => n.textContent = o.v.toFixed(dec) }); });
    $$('.bar > i', main).forEach(b => gsap.fromTo(b, { scaleX: 0 }, { scaleX: 1, duration: .9, ease: 'power3.out', delay: .1 }));
    $$('.ring-fg', main).forEach(c => gsap.fromTo(c, { strokeDashoffset: c.dataset.c }, { strokeDashoffset: c.dataset.c * (1 - c.dataset.p / 100), duration: 1.3, ease: 'power3.out' }));
  }
  if (VIEWS._after) { const f = VIEWS._after; VIEWS._after = null; f(); }
  main.focus({ preventScroll: true });
}
const after = f => { VIEWS._after = f; };
const rerender = () => { const y = scrollY; renderPage(); window.scrollTo(0, y); };

/* ---------------- actions ---------------- */
const ACT = {
  closeModal, openSide, closeSide,
  toggleMega: () => toggleMega(),
  toggleSound: () => { S.sound = !S.sound; try { localStorage.setItem('nasj-sound', S.sound ? 'on' : 'off'); } catch (e) {} setSoundBtn(); if (S.sound) SFX.play('toggle'); toast(S.sound ? 'أصوات الواجهة مفعّلة' : 'أصوات الواجهة متوقفة', S.sound ? 'volume-2' : 'volume-x'); },
  notifs: () => openModal(`${modalHead('الإشعارات', 'آخر المستجدات')}<div class="px-6 pb-6 grid gap-2">${[
    ['sara', 'أكّدت م. سارة المطيري جلسة النقد يوم 18 نوفمبر', 'قبل ساعتين'], ['faisal', 'ترك د. فيصل ملاحظاته على عيّنة الخطوط', 'أمس'], ['rana', 'اطّلعت سنا للمدفوعات على جواز مهاراتك', 'قبل يومين'], ['hessa', 'وثّق نادي الابتكار دورك في أسبوع التقنية', 'قبل 3 أيام']
  ].map(([w, t, d]) => `<div class="well p-3 flex items-center gap-3">${av(w, 'av-sm')}<p class="text-sm flex-1">${t}</p><span class="text-xs text-muted">${d}</span></div>`).join('')}</div>`),
  seg: el => { const g = el.closest('.seg'); $$('button', g).forEach(b => b.classList.toggle('on', b === el)); SFX.play('toggle'); }
};

document.addEventListener('click', e => {
  const a = e.target.closest('[data-act]'), go = e.target.closest('[data-go]'), sc = e.target.closest('[data-scroll]');
  const clickable = e.target.closest('button,a,[data-go],[data-act]');
  if (clickable && !clickable.closest('[data-sfx=none]')) SFX.play('tap');
  if (sc) { e.preventDefault(); const t = document.getElementById(sc.dataset.scroll); t && t.scrollIntoView({ behavior: RM ? 'auto' : 'smooth' }); return; }
  if (a && ACT[a.dataset.act]) { e.preventDefault(); ACT[a.dataset.act](a, e); return; }
  if (go) { e.preventDefault(); const h = '#' + go.dataset.go; if (location.hash === h) route(); else location.hash = h; return; }
  if (!e.target.closest('#roleWrap') && !e.target.closest('#sideFoot')) toggleMega(false);
  if (e.target === $('#overlay')) closeModal();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeModal(); toggleMega(false); closeSide(); hideTip(); } });
document.addEventListener('pointermove', e => { const c = e.target.closest && e.target.closest('.card'); if (!c) return; const r = c.getBoundingClientRect(); c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px'); }, { passive: true });
document.addEventListener('pointerover', e => {
  const t = e.target.closest && e.target.closest('[data-tip]');
  if (t && !t.closest('svg')) { const r = t.getBoundingClientRect(); showTip(esc(t.dataset.tip), r.left + r.width / 2 - 10, r.top); }
  if (e.target.closest && e.target.closest('.nav-item,.role-opt')) SFX.play('hover');
});
document.addEventListener('pointerout', e => { const t = e.target.closest && e.target.closest('[data-tip]'); if (t && !t.contains(e.relatedTarget) && !t.closest('svg')) hideTip(); });
addEventListener('scroll', hideTip, { passive: true });
addEventListener('hashchange', route);
