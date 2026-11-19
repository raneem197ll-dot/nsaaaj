/* ============ تجربة الطالب ============ */
const PI = { module: 'book-open', exercise: 'pencil-ruler', checkpoint: 'flag', mentor: 'messages-square', challenge: 'target', resource: 'library', final: 'trophy', assessment: 'clipboard-check' };
const evIcon = t => EVIDENCE_TYPES[t] ? EVIDENCE_TYPES[t][1] : 'file';
const evLabel = t => EVIDENCE_TYPES[t] ? EVIDENCE_TYPES[t][0] : t;
const lvlChip = l => `<span class="chip">${I('signal', '')}${l}</span>`;
const greeting = () => new Date().getHours() < 12 ? 'صباح الخير' : 'مساء الخير';

/* قاعدة التوثيق، محسوبة من السجل */
function criteria(s) {
  const sources = new Set(s.ev.filter(e => !e.excluded && e.t !== 'professor' && e.t !== 'professional').map(e => e.src));
  return [
    ['اكتمال اختبار عملي', s.score !== null],
    ['درجة 70 فأكثر في المستوى المذكور', (s.score ?? 0) >= 70],
    ['مراجعة من مقيّم مؤهل', !!s.evaluator && (s.st === 'evaluated' || s.st === 'verified')],
    ['أدلة من مصدرين مستقلين أو أكثر', sources.size >= 2]
  ];
}
const levelTrack = (cur, req) => { const c = lvlIdx(cur), r = lvlIdx(req); return `<div class="flex gap-1" aria-label="الحالي ${cur}، المطلوب ${req}">${LEVELS.map((l, i) => `<span class="h-1.5 flex-1 rounded-full" style="background:${i <= c ? 'var(--gold)' : 'var(--surface-3)'};${i === r && r > c ? 'box-shadow:inset 0 0 0 1px var(--text-2)' : ''}"></span>`).join('')}</div>`; };

/* ---------- درج تفاصيل المهارة (مشترك) ---------- */
function skillDrawer(id) {
  const s = skill(id), cr = criteria(s), evalr = s.evaluator ? P(s.evaluator) : null;
  const projs = PROJECTS.filter(p => s.projects.includes(p.id));
  CH.skillHist = { type: 'line', cfg: { labels: s.hist.map(h => h[0]), series: [{ name: s.name, vals: s.hist.map(h => h[1]), color: 'var(--gold)' }], h: 150, min: 30, max: 100, unit: ' نقطة' } };
  openModal(`${modalHead(s.cat + ' · سجل المهارة', esc(s.name))}
  <div class="px-6 pb-8 grid gap-6">
    <div class="flex flex-wrap items-center gap-3">${seal(s.st)}${stChip(s.st)}${lvlChip(s.lvl)}${s.score !== null ? `<span class="chip num">${I('gauge')}الدرجة ${s.score}/100</span>` : ''}</div>
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
      ${[['الفئة', s.cat], ['المستوى', s.lvl], ['تاريخ الاختبار', fmtDate(s.date)], ['المقيّم', evalr ? evalr.n : 'لم تُراجَع بعد']].map(([k, v]) => `<div class="well p-3"><p class="text-xs text-muted">${k}</p><p class="mt-1 leading-snug">${v}</p></div>`).join('')}
    </div>
    <div><p class="eyebrow mb-3">شروط التوثيق</p><div class="grid gap-2">${cr.map(([t, ok]) => `<div class="flex items-center gap-3 text-sm"><span class="${ok ? 'text-good' : 'text-muted'}">${I(ok ? 'circle-check' : 'circle', 'w-4 h-4')}</span><span class="${ok ? '' : 'text-ink2'}">${t}</span></div>`).join('')}</div>
      ${s.missing && s.st !== 'verified' ? `<div class="well mt-3 p-3 text-sm text-ink2 flex gap-2">${I('info', 'w-4 h-4 mt-1 flex-none text-gold')}<span>${s.missing}</span></div>` : ''}</div>
    <div><p class="eyebrow mb-3">الأدلة · ${s.ev.length} سجلات</p>
      ${s.ev.length ? `<div class="grid gap-2">${s.ev.map(e => `<div class="well p-3 flex gap-3 ${e.excluded ? 'opacity-70' : ''}"><span class="role-ico w-9 h-9">${I(evIcon(e.t))}</span><div class="min-w-0 flex-1"><p class="text-sm leading-snug">${esc(e.title)}</p><p class="text-xs text-muted mt-1">${evLabel(e.t)} · ${esc(e.src)} · ${fmtDate(e.d)}</p>${e.excluded ? `<p class="text-xs text-warn mt-1.5 flex items-center gap-1.5">${I('ban', 'w-3.5 h-3.5')}حضور فقط، لا يُحسب في التوثيق.</p>` : ''}${e.pending ? `<p class="text-xs text-sass mt-1.5">بانتظار المراجعة</p>` : ''}</div></div>`).join('')}</div>` : empty('file-search', 'لا توجد أدلة بعد', 'ابدئي باختبار تحديد المستوى لإنشاء أول سجل.')}
    </div>
    ${s.hist.length > 1 ? `<div><p class="eyebrow mb-3">تاريخ التطور</p><div class="chart relative" data-chart="skillHist" style="height:150px"></div></div>` : ''}
    ${projs.length ? `<div><p class="eyebrow mb-3">مشاريع مرتبطة</p><div class="flex flex-wrap gap-2">${projs.map(p => `<span class="chip">${I('folder')}${p.name}</span>`).join('')}</div></div>` : ''}
    ${s.rec.length ? `<div><p class="eyebrow mb-3">كيف تتحسّنين</p><ul class="grid gap-2 text-sm">${s.rec.map(r => `<li class="flex gap-2">${I('arrow-up-right', 'w-4 h-4 text-gold mt-1 flex-none')}<span>${r}</span></li>`).join('')}</ul></div>` : ''}
    <div class="flex flex-wrap gap-2 pt-2 border-t hair"><button class="btn btn-primary mt-4" data-act="addEvidence" data-id="${s.id}">${I('plus')}إضافة دليل</button>${s.path ? `<a class="btn mt-4" href="#student-paths">${I('route')}فتح مسار التعلم</a>` : ''}</div>
  </div>`, { drawer: true });
}
ACT.openSkill = el => skillDrawer(el.dataset.id);
ACT.addEvidence = el => {
  const s = skill(el.dataset.id);
  openModal(`${modalHead('إضافة دليل', esc(s.name))}<form class="px-6 pb-6 grid gap-4" data-form="evidence" data-id="${s.id}">
    <div class="field"><label class="label" for="evType">نوع الدليل</label><select class="select" id="evType">${Object.entries(EVIDENCE_TYPES).map(([k, v]) => `<option value="${k}">${v[0]}</option>`).join('')}</select></div>
    <div class="field"><label class="label" for="evTitle">ماذا يُثبت؟</label><input class="input" id="evTitle" required placeholder="مثال: إعادة تصميم تدفق الحجز واختباره مع 5 مستخدمين"></div>
    <div class="grid sm:grid-cols-2 gap-3"><div class="field"><label class="label" for="evSrc">المصدر</label><input class="input" id="evSrc" required placeholder="الجهة أو الشخص المُصدِر"></div><div class="field"><label class="label" for="evLink">رابط أو اسم الملف</label><input class="input" id="evLink" placeholder="https://" dir="ltr"></div></div>
    <p class="text-xs text-muted">يبقى الدليل الجديد بانتظار المراجعة حتى يراجعه مقيّم. شهادات الحضور تُحفظ ولا تُحسب في التوثيق.</p>
    <div class="flex justify-end gap-2"><button type="button" class="btn btn-ghost" data-act="closeModal">إلغاء</button><button class="btn btn-primary">${I('upload')}إرسال الدليل</button></div></form>`);
};
document.addEventListener('submit', e => {
  const f = e.target.closest('form[data-form]'); if (!f) return; e.preventDefault();
  const h = FORMS[f.dataset.form]; h && h(f);
});
const FORMS = {
  evidence: f => {
    const s = skill(f.dataset.id), t = $('#evType').value;
    s.ev.unshift({ t, title: $('#evTitle').value, src: $('#evSrc').value, d: new Date().toISOString().slice(0, 10), pending: true, excluded: t === 'participation' });
    closeModal(); SFX.play('success'); toast(`أُضيف دليل إلى <b>${esc(s.name)}</b>، وسيبقى بانتظار المراجعة.`); rerender();
  }
};

/* ---------- نظرة عامة ---------- */
VIEWS.student.overview = () => {
  const me = P('reem'), ver = stateCount('verified'), assessed = S.skills.filter(s => s.score !== null).length, dev = S.skills.filter(s => s.path || (s.st !== 'verified' && s.st !== 'declared' && (s.score ?? 0) < 70)).length;
  const readiness = Math.round(CAREER_GAPS.reduce((a, g) => a + Math.min(1, (lvlIdx(g[2]) + 1) / (lvlIdx(g[1]) + 1)), 0) / CAREER_GAPS.length * 100);
  const next = [
    ['flag', 'سلّمي نقطة التحقق 2: هوية المقهى', 'مسار التصميم الجرافيكي · التسليم 22 نوفمبر', 'student-paths'],
    ['badge-check', 'أضيفي مصدرًا مستقلًا لأبحاث المستخدم', 'تحدي مدار الصحية يُكمل التوثيق', 'student-challenges'],
    ['messages-square', 'استعدّي لجلسة النقد مع سارة يوم 18 نوفمبر', 'ارفعي اتجاهات الشعار الثلاثة أولًا', 'student-mentorship'],
    ['refresh-ccw', 'أعيدي اختبار الحالة في React', 'الواجهات الأمامية عند 66، والتوثيق يحتاج 70', 'student-assessments']
  ];
  return `
  ${head(`${greeting()} · ${me.uni}`, `ريم، جاهزيتك لمسار مصممة المنتجات <span class="num" dir="ltr">${readiness}%</span>`, `مهارتان تفصلانك عن ملفك المستهدف: أبحاث المستخدم والتصميم البصري، وكلتاهما قيد التطوير.`, `<a class="btn" href="#student-passport">${I('badge-check')}جواز المهارات</a><a class="btn btn-primary" href="#student-paths">${I('play')}تابعي المسار</a>`)}
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
    ${stat('المهارات المُعلَنة', S.skills.length, { icon: 'sparkles', sub: 'عبر 6 فئات', go: 'student-skills' })}
    ${stat('المهارات المُختبَرة', assessed, { icon: 'clipboard-check', sub: 'أُكمل لها اختبار عملي', go: 'student-assessments' })}
    ${stat('المهارات الموثّقة', ver, { icon: 'badge-check', sub: 'تحققت الشروط الأربعة', go: 'student-passport' })}
    ${stat('قيد التطوير', dev, { icon: 'trending-up', sub: 'دون 70 أو ضمن مسار', go: 'student-paths' })}
  </div>
  <div class="grid lg:grid-cols-12 gap-3 mt-3">
    <div class="card card-pad lg:col-span-4 flex flex-col" data-rv>
      ${sectionTitle('التقدم العام في التعلم')}
      <div class="flex items-center gap-6">${ring(64, 128, 'من خطة 2026')}
        <div class="grid gap-3 text-sm flex-1">${[['مسارات مكتملة', 3], ['مسارات نشطة', 2], ['تحديات منجزة', 4], ['جلسات إرشاد', 9]].map(([k, v]) => `<div class="flex justify-between gap-3"><span class="text-ink2">${k}</span><span class="num font-semibold">${v}</span></div>`).join('')}</div></div>
      <div class="mt-6 grid grid-cols-4 gap-2">${STATE_ORDER.map(s => `<div class="well p-2.5 text-center" data-tip="${STATES[s].means}"><div class="flex justify-center">${seal(s, true)}</div><p class="mt-2 num font-semibold">${stateCount(s)}</p><p class="text-[11px] text-muted">${STATES[s].label}</p></div>`).join('')}</div>
    </div>
    <div class="card card-pad lg:col-span-4" data-rv>
      ${sectionTitle('الخطوات التالية المقترحة', `<span class="chip">${I('wand-sparkles')}مخصّصة لك</span>`)}
      <div class="grid gap-2">${next.map(([ic, t, s, go]) => `<button class="well p-3 flex items-center gap-3 text-start hover:border-[var(--line-2)] transition" data-go="${go}"><span class="role-ico w-9 h-9">${I(ic)}</span><span class="min-w-0 flex-1"><span class="block text-sm font-semibold leading-snug">${t}</span><span class="block text-xs text-muted mt-0.5">${s}</span></span>${I('chevron-right', 'w-4 h-4 text-muted')}</button>`).join('')}</div>
    </div>
    <div class="card card-pad lg:col-span-4" data-rv>
      ${sectionTitle('فجوات المهارات · مصممة منتجات', `<a class="text-xs text-ink2 hover:text-ink" href="#student-pulse">رؤية السوق</a>`)}
      <div class="grid gap-3.5">${CAREER_GAPS.map(([n, req, cur]) => `<div><div class="flex items-center justify-between gap-2 text-sm mb-1.5"><span class="truncate">${n}</span><span class="text-xs ${lvlIdx(cur) >= lvlIdx(req) ? 'text-good' : 'text-warn'}">${lvlIdx(cur) >= lvlIdx(req) ? 'ضمن المستهدف' : `${cur} ← ${req}`}</span></div>${levelTrack(cur, req)}</div>`).join('')}</div>
    </div>
  </div>
  <div class="grid lg:grid-cols-2 gap-3 mt-3">
    <div class="card card-pad" data-rv>${sectionTitle('النشاط الأسبوعي', `<span class="text-xs text-muted">ساعات · آخر 12 أسبوعًا</span>`)}${chart('bars', { labels: ACTIVITY_WEEKS, vals: ACTIVITY_HOURS, unit: 'ساعة', tipPrefix: 'الأسبوع ', h: 190, label: 'ساعات النشاط الأسبوعي' })}</div>
    <div class="card card-pad" data-rv>${sectionTitle('اتجاه الأداء', `<span class="text-xs text-muted">متوسط درجات الاختبارات</span>`)}<div class="pt-5">${chart('line', { labels: TREND_MONTHS, series: [{ name: 'أنتِ', vals: TREND_ME, color: 'var(--gold)' }, { name: 'متوسط الدفعة', vals: TREND_COHORT, color: 'var(--text-2)', dash: true }], h: 190, min: 40, max: 90, label: 'متوسط درجات الاختبارات' })}</div></div>
  </div>
  <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mt-3">
    ${stat('مسارات مكتملة', 3, { icon: 'route', go: 'student-paths' })}${stat('مسارات نشطة', 2, { icon: 'loader', go: 'student-paths' })}${stat('تحديات منجزة', 4, { icon: 'target', go: 'student-challenges' })}
    ${stat('هاكاثونات', HACKS.length, { icon: 'zap', go: 'student-hackathons' })}${stat('مساهمات في مشاريع', PROJECTS.length, { icon: 'folder-kanban', go: 'student-projects' })}${stat('أندية وتطوع', 5, { icon: 'users-round', go: 'student-clubs' })}
  </div>
  <div class="grid lg:grid-cols-3 gap-3 mt-3">
    <div class="card card-pad" data-rv>${sectionTitle('هذا الشهر حسب النشاط', `<span class="text-xs text-muted">ساعات</span>`)}${hbars([['وحدات التعلم', 22], ['العمل التطبيقي', 18], ['الاختبارات', 6], ['الإرشاد', 4], ['الأندية والتطوع', 9]], { unit: ' س' })}</div>
    <div class="card card-pad" data-rv>${sectionTitle('مسارات التعلم النشطة')}<div class="grid gap-3">${['gd', 'da'].map(k => { const p = PATHS[k], pct = S.pathDone && k === 'gd' ? 100 : p.pct; return `<a href="#student-paths" class="well p-4 block hover:border-[var(--line-2)] transition"><div class="flex items-center gap-3"><span class="role-ico w-9 h-9">${I(p.icon)}</span><div class="min-w-0 flex-1"><p class="text-sm font-semibold">${p.name}</p><p class="text-xs text-muted">${p.from} ← ${p.to}</p></div><span class="num text-sm">${pct}%</span></div><div class="mt-3">${bar(pct, 'thin')}</div></a>`; }).join('')}</div></div>
    <div class="card card-pad" data-rv>${sectionTitle('جلسات الإرشاد القادمة', `<a class="text-xs text-ink2 hover:text-ink" href="#student-mentorship">الكل</a>`)}<div class="grid gap-2">${S.sessions.filter(s => s.st === 'upcoming').slice(0, 3).map(s => `<div class="flex items-center gap-3 py-1.5">${av(s.with, 'av-sm')}<div class="min-w-0 flex-1"><p class="text-sm truncate">${s.topic}</p><p class="text-xs text-muted">${P(s.with).n} · ${s.when}</p></div></div>`).join('')}</div></div>
  </div>`;
};

/* ---------- مهاراتي ---------- */
let skillFilter = 'all';
ACT.skillFilter = el => { skillFilter = el.dataset.v; rerender(); };
VIEWS.student.skills = () => {
  const list = S.skills.filter(s => skillFilter === 'all' || s.st === skillFilter);
  const cats = [...new Set(list.map(s => s.cat))];
  return `${head('مهاراتي', 'ما تجيدينه، ومدى ثقتنا فيه.', 'كل مهارة تُظهر حالة توثيقها. افتحي أي مهارة لترَي الأدلة وراءها.', `<button class="btn btn-primary" data-act="declareSkill">${I('plus')}أعلني مهارة</button>`)}
  <div class="flex flex-wrap gap-2 mb-6" data-rv>${['all', ...STATE_ORDER].map(v => `<button class="chip ${skillFilter === v ? 'on' : ''}" data-act="skillFilter" data-v="${v}">${v === 'all' ? 'الكل' : STATES[v].label} <span class="num opacity-70">${v === 'all' ? S.skills.length : stateCount(v)}</span></button>`).join('')}</div>
  ${cats.map(c => `<div class="mb-8" data-rv><p class="eyebrow mb-3">${c}</p><div class="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">${list.filter(s => s.cat === c).map(skillCard).join('')}</div></div>`).join('') || empty('search', 'لا مهارات في هذه الحالة', 'اختاري تصفية أخرى.')}`;
};
const skillCard = s => `<button class="card card-pad is-link text-start" data-act="openSkill" data-id="${s.id}">
  <div class="flex items-start justify-between gap-3"><div class="min-w-0"><p class="font-semibold">${s.name}</p><p class="text-xs text-muted mt-1">${s.lvl} · ${s.ev.length} أدلة</p></div>${seal(s.st, true)}</div>
  <div class="mt-5 flex items-end justify-between gap-3"><div><p class="display text-3xl font-bold num leading-none">${s.score ?? '—'}</p><p class="text-xs text-muted mt-1.5">درجة الاختبار</p></div>${spark(s.hist.map(h => h[1]))}</div>
  <div class="mt-4 flex items-center justify-between">${stChip(s.st)}<span class="text-xs text-muted">${s.date ? fmtDate(s.date) : 'لم تُختبر'}</span></div></button>`;
ACT.declareSkill = () => openModal(`${modalHead('إعلان مهارة', 'أضيفي مهارة تريدين إثباتها')}<form class="px-6 pb-6 grid gap-4" data-form="declare">
  <div class="field"><label class="label" for="dsName">اسم المهارة</label><input class="input" id="dsName" required placeholder="مثال: تصميم الحركة"></div>
  <div class="grid sm:grid-cols-2 gap-3"><div class="field"><label class="label" for="dsCat">الفئة</label><select class="select" id="dsCat">${['التصميم', 'الهندسة', 'البيانات', 'الأعمال', 'المهارات المهنية', 'الأدوات'].map(c => `<option>${c}</option>`).join('')}</select></div>
  <div class="field"><label class="label" for="dsLvl">تقديرك لمستواك</label><select class="select" id="dsLvl">${LEVELS.map(l => `<option>${l}</option>`).join('')}</select></div></div>
  <div class="well p-3 text-sm text-ink2 flex gap-2">${I('info', 'w-4 h-4 mt-1 text-gold flex-none')}تبدأ المهارة «مُعلَنة»، وستقترح نَسْج اختبار تحديد مستوى لتتقدّم.</div>
  <div class="flex justify-end gap-2"><button type="button" class="btn btn-ghost" data-act="closeModal">إلغاء</button><button class="btn btn-primary">أعلني المهارة</button></div></form>`);
FORMS.declare = () => { const n = $('#dsName').value.trim(); S.skills.push({ id: 'u' + Date.now(), name: n, cat: $('#dsCat').value, lvl: $('#dsLvl').value, score: null, st: 'declared', date: null, evaluator: null, projects: [], hist: [], ev: [], missing: 'خذي اختبار تحديد المستوى للبدء.', rec: ['خذي اختبار تحديد المستوى لهذه المهارة.'] }); closeModal(); SFX.play('success'); toast(`أُعلنت <b>${esc(n)}</b>. الخطوة التالية: اختبار تحديد المستوى.`); skillFilter = 'all'; rerender(); };

/* ---------- محرك مسارات التعلم ---------- */
VIEWS.student.paths = () => {
  const p = PATHS.gd, done = S.pathDone;
  const steps = [['اختبار تحديد المستوى', 'clipboard-check'], ['المقارنة بالمستهدف', 'git-compare'], ['توليد المسار', 'route'], ['التعلم والتدريب', 'hammer'], ['الإشراف والتغذية الراجعة', 'messages-square'], ['الاختبار النهائي', 'badge-check']];
  const cur = done ? 6 : 3;
  const stages = p.stages.map(st => done ? { ...st, st: 'done', items: st.items.map(i => [i[0], i[1], 'done', i[3]]) } : st);
  return `${head('محرك مسارات التعلم', `${p.name}: من ${p.from} إلى ${p.to}`, 'بُني مسارك من اختبار عملي لتحديد المستوى، والفجوة حتى المستوى المهني، وما تطلبه الشركات على نَسْج.', `<button class="btn" data-act="pathRules">${I('cpu')}كيف وُلّد المسار</button><button class="btn" data-act="newPath">${I('plus')}مسار جديد</button>`)}
  <div class="card card-pad mb-3 overflow-x-auto" data-rv><ol class="flex min-w-[720px] items-start">${steps.map(([t, ic], i) => `<li class="flex-1 flex flex-col items-start relative pe-3">
      <div class="flex items-center w-full"><span class="node ${i < cur ? 'done' : i === cur ? 'now' : ''}" style="width:38px;height:38px">${I(i < cur ? 'check' : ic)}</span>${i < steps.length - 1 ? `<span class="flex-1 h-px mx-2 ${i < cur ? 'bg-[var(--gold)]' : 'bg-[var(--line-2)]'}"></span>` : ''}</div>
      <p class="text-[11px] text-muted mt-3">الخطوة ${i + 1}</p><p class="text-sm mt-0.5 ${i === cur ? 'text-gold font-semibold' : ''}">${t}</p></li>`).join('')}</ol></div>
  <div class="grid lg:grid-cols-12 gap-3">
    <div class="card card-pad lg:col-span-5" data-rv>${sectionTitle('تحليل الفجوة', `<span class="text-xs text-muted">الآن مقابل المستهدف المهني</span>`)}
      <div class="grid gap-4">${p.gaps.map(([n, c, t]) => { const v = done ? Math.max(c, t - 2) : c; return `<div data-tip="${n}: ${v} الآن، والمطلوب ${t}"><div class="flex justify-between text-sm mb-1.5"><span>${n}</span><span class="num text-ink2">${v} <span class="text-muted">/ ${t}</span></span></div><div class="relative h-2 rounded-full bg-[var(--surface-3)]"><span class="absolute inset-y-0 start-0 rounded-full bg-[var(--gold)]" style="width:${v}%"></span><span class="absolute -top-1 -bottom-1 w-0.5 rounded bg-[var(--text)]" style="inset-inline-start:${t}%"></span></div></div>`; }).join('')}</div>
      <p class="mt-5 text-xs text-muted flex items-center gap-2"><span class="inline-block w-0.5 h-3 bg-[var(--text)] rounded"></span>المستهدف مأخوذ من متطلب استوديو نخلة ومراجعة سارة المهنية</p></div>
    <div class="card card-pad lg:col-span-7" data-rv>${sectionTitle('خريطة التقدم', `<span class="chip num">مكتمل ${done ? 100 : p.pct}%</span>`)}
      <div class="grid md:grid-cols-4 gap-4 relative">${stages.map(st => `<div class="relative"><div class="flex items-center gap-2 mb-3"><span class="dot" style="--c:${st.st === 'locked' ? 'var(--surface-3)' : 'var(--gold)'}"></span><p class="text-xs font-semibold ${st.st === 'locked' ? 'text-muted' : ''}">${st.lvl}</p></div>
        <div class="grid gap-2 border-s hair ps-3 ms-1">${st.items.map(([t, k, s, m]) => `<div class="relative ${s === 'locked' ? 'opacity-55' : ''}"><span class="absolute -start-[17px] top-3 w-2 h-2 rounded-full ${s === 'done' ? 'bg-[var(--gold)]' : s === 'now' ? 'bg-[var(--gold)] shadow-[0_0_0_4px_rgba(226,184,102,.18)]' : 'bg-[var(--surface-3)]'}"></span><div class="well p-2.5"><p class="text-[12.5px] leading-snug flex gap-1.5">${I(PI[k] || 'circle', 'w-3.5 h-3.5 mt-1 flex-none text-muted')}<span>${t}</span></p><p class="text-[11px] text-muted mt-1">${s === 'done' ? '✓ ' : ''}${m}</p></div></div>`).join('')}</div></div>`).join('')}</div></div>
  </div>
  <div class="grid sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-3">${[['ما تعرفينه مسبقًا', p.know, 'brain'], ['ما تحتاجين تعلّمه', p.learn, 'book-open'], ['ما تحتاجين التدرّب عليه', p.practice, 'pencil-ruler'], ['كيف ستُقيَّمين', p.assess, 'clipboard-check'], ['الأدلة المطلوب إنتاجها', p.evidence, 'file-check-2']].map(([t, l, ic]) => `<div class="card card-pad" data-rv><span class="text-gold">${I(ic, 'w-5 h-5')}</span><p class="mt-3 font-semibold text-sm">${t}</p><ul class="mt-3 grid gap-2 text-[13px] text-ink2">${l.map(x => `<li class="flex gap-2"><span class="mt-[9px] w-1 h-1 rounded-full bg-[var(--muted)] flex-none"></span>${x}</li>`).join('')}</ul></div>`).join('')}</div>
  <div class="grid md:grid-cols-3 gap-3 mt-3">${[['faisal', 'الأستاذ يشرف', 'الأسس الأكاديمية: نظرية الخطوط، الجشطالت، علم اللون. ويقيّم كل نقطة تحقق.'], ['sara', 'المهنية تقدّم رأي السوق', 'تنقد العمل كما يفعل الاستوديو. الجلسة القادمة 18 نوفمبر.'], ['rana', 'الشركة تحدد التوقعات', 'موجز المقهى من استوديو نخلة يحدد معيار المستوى المتقدم في هذا المسار.']].map(([w, t, d], i) => `<div class="card card-pad flex gap-4" data-rv>${i === 2 ? `<span class="role-ico">${I('building-2')}</span>` : av(w)}<div><p class="text-xs text-muted">${t}</p><p class="font-semibold mt-0.5">${i === 2 ? 'استوديو نخلة' : P(w).n}</p><p class="text-sm text-ink2 mt-2 leading-relaxed">${d}</p></div></div>`).join('')}</div>
  <div class="card card-pad mt-3 flex flex-wrap items-center gap-4 justify-between" data-rv>
    <div class="flex items-center gap-4">${seal(done ? 'verified' : 'assessed')}<div><p class="font-semibold">${done ? 'التصميم الجرافيكي صار «موثّقة» في جوازك' : 'الاختبار النهائي يحدّث جواز مهاراتك'}</p><p class="text-sm text-ink2">${done ? 'الدرجة 82 · قيّمها د. فيصل وم. سارة · 3 سجلات أدلة جديدة' : 'اختصار للتجربة: شغّلي الاختبار النهائي وشاهدي الجواز يتحدّث عند كل الأدوار.'}</p></div></div>
    ${done ? `<a class="btn btn-primary" href="#student-passport">${I('badge-check')}عرض الجواز</a>` : `<button class="btn btn-primary" data-act="finalAssess">${I('play')}محاكاة الاختبار النهائي</button>`}
  </div>
  <div class="mt-8" data-rv>${sectionTitle('كل المسارات')}<div class="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">${Object.values(PATHS).map(x => { const pct = x.id === 'gd' && done ? 100 : x.pct; return `<div class="card card-pad"><div class="flex items-center justify-between"><span class="role-ico w-9 h-9">${I(x.icon)}</span>${pct === 100 ? `<span class="chip st" data-s="verified">${I('check')}مكتمل</span>` : `<span class="chip">${I('loader')}نشط</span>`}</div><p class="mt-4 text-sm font-semibold">${x.name}</p><p class="text-xs text-muted mt-1">${x.from} ← ${x.to}</p><div class="mt-4">${bar(pct, 'thin')}</div></div>`; }).join('')}</div></div>`;
};
ACT.pathRules = () => openModal(`${modalHead('قواعد التجربة', 'كيف وُلّد هذا المسار')}<div class="px-6 pb-6 grid gap-3 text-sm">
  ${[['تحديد المستوى', '0–39 مبتدئ · 40–69 متوسط · 70–84 متقدم · 85 فأكثر جاهزية مهنية. حصلت ريم على 58.'], ['حجم الفجوة', 'فجوة 25 نقطة فأكثر تضيف وحدة وتمرينًا. من 10 إلى 24 تضيف تمرينًا. أقل من 10 تضيف نقطة تحقق فقط.'], ['مدخلات السوق', 'متطلب شركة للمهارة نفسها وبالمستوى نفسه يصبح تحدي المرحلة المتقدمة (استوديو نخلة).'], ['الأشخاص', 'أستاذ يشرف على نقاط التحقق الأكاديمية، ومهني موثّق بمستوى خبير يُطابَق لجلسات النقد.'], ['الخروج', 'مشروع نهائي واختبار نهائي. النجاح بدرجة 70+ ومقيّمَين يرفع المهارة إلى «موثَّقة».']].map(([k, v], i) => `<div class="well p-4 flex gap-3"><span class="num text-xs text-gold mt-1">0${i + 1}</span><div><p class="font-semibold">${k}</p><p class="text-ink2 mt-1 leading-relaxed">${v}</p></div></div>`).join('')}</div>`);
ACT.newPath = () => openModal(`${modalHead('مسار تعلم جديد', 'اختاري مهارة لتطويرها')}<div class="px-6 pb-6 grid gap-4">
  <div class="grid sm:grid-cols-2 gap-2" id="npList">${['أبحاث المستخدم', 'تحليل البيانات', 'بايثون', 'التفكير بالمنتج', 'تصميم الحركة', 'أساسيات الحوسبة السحابية'].map((n, i) => `<button class="well p-4 text-start hover:border-[var(--line-2)] ${i === 0 ? 'border-[var(--gold)]' : ''}" data-act="npPick" data-n="${n}"><p class="text-sm font-semibold">${n}</p><p class="text-xs text-muted mt-1">${['صاعدة في الرعاية الصحية', 'صاعدة في التقنية المالية', 'مستقرة وكثيرة الطلب', 'صاعدة', 'إشارة مبكرة', 'صاعدة'][i]}</p></button>`).join('')}</div>
  <div class="field"><span class="label">المستوى المستهدف</span><div class="seg">${['متوسط', 'متقدم', 'الجاهزية المهنية'].map((l, i) => `<button type="button" class="${i === 1 ? 'on' : ''}" data-act="seg">${l}</button>`).join('')}</div></div>
  <div class="flex justify-end"><button class="btn btn-primary" data-act="npGo">${I('wand-sparkles')}ولّدي المسار</button></div></div>`);
ACT.npPick = el => { $$('#npList button').forEach(b => b.classList.toggle('border-[var(--gold)]', b === el)); $('#npList').dataset.pick = el.dataset.n; };
ACT.npGo = () => { const n = $('#npList').dataset.pick || 'أبحاث المستخدم'; closeModal(); SFX.play('success'); toast(`الخطوة الأولى جاهزة: اختبار تحديد مستوى في <b>${n}</b> مدته 35 دقيقة بانتظارك في اختبارات المهارات.`, 'route'); };
ACT.finalAssess = () => {
  openModal(`${modalHead('الاختبار النهائي · تجربة', 'التصميم الجرافيكي: هوية بصرية')}<div class="px-6 pb-8 grid gap-5" id="faBox">
    ${['استلام المشروع النهائي: هوية المقهى', 'تقييم بالمعايير من د. فيصل القحطاني', 'مراجعة مهنية من م. سارة المطيري', 'التحقق من شروط التوثيق'].map((t, i) => `<div class="flex items-center gap-3 text-sm fa-step opacity-40" data-i="${i}"><span class="fa-ic text-muted">${I('loader-circle', 'w-4 h-4')}</span>${t}</div>`).join('')}
    <div id="faResult"></div></div>`);
  $$('.fa-step').forEach((el, i) => setTimeout(() => { el.classList.remove('opacity-40'); el.querySelector('.fa-ic').innerHTML = I('circle-check', 'w-4 h-4 text-good'); icons(); SFX.play('tap'); }, 450 + i * 520));
  setTimeout(() => {
    const s = skill('gd');
    Object.assign(s, { lvl: 'متقدم', score: 82, st: 'verified', date: '2026-11-14', evaluator: 'faisal', missing: null });
    s.hist.push(['النهائي', 82]);
    s.ev.unshift({ t: 'professional', title: 'مراجعة مهنية: الفكرة 9/10، الصنعة 8/10', src: 'م. سارة المطيري · استوديو نخلة', d: '2026-11-14' },
      { t: 'professor', title: 'التقييم النهائي بالمعايير: 82/100', src: 'د. فيصل القحطاني', d: '2026-11-14' },
      { t: 'upload', title: 'دليل هوية المقهى، بناء الشعار، 3 تطبيقات عملية', src: 'المشروع النهائي لمسار التعلم', d: '2026-11-14' },
      { t: 'link', title: 'الاستجابة لموجز إعادة هوية المقهى', src: 'تحدي استوديو نخلة', d: '2026-11-13' });
    S.pathDone = true;
    $('#faResult').innerHTML = `<div class="well p-5 flex items-center gap-4">${seal('verified')}<div><p class="display text-3xl font-bold num">82<span class="text-base text-ink2">/100</span></p><p class="text-sm text-ink2">متقدم · تحققت الشروط الأربعة</p></div></div><div class="flex justify-end mt-4"><button class="btn btn-primary" data-go="student-passport">${I('badge-check')}عرض الجواز المحدّث</button></div>`;
    icons(); SFX.play('success'); toast('تحدّث جواز المهارات: <b>التصميم الجرافيكي</b> صار «موثَّقة».', 'badge-check');
    buildShell(); rerender();
  }, 450 + 4 * 520 + 200);
};

/* ---------- اختبارات المهارات ---------- */
const ASSESS = [
  { id: 'py', name: 'تحديد المستوى في بايثون', skill: 'py', dur: '40 دقيقة', kind: 'عملي: كتابة 3 دوال واختبارها' },
  { id: 'fe', name: 'الحالة والنماذج في React (إعادة)', skill: 'fe', dur: '45 دقيقة', kind: 'عملي: إصلاح مكوّن نموذج معطّل' },
  { id: 'ba', name: 'مدخل إلى تحليل الأعمال', skill: 'ba', dur: '30 دقيقة', kind: 'سيناريو: كتابة 5 قصص مستخدم من مقابلة' },
  { id: 'ur', name: 'تحليل نتائج البحث', skill: 'ur', dur: '50 دقيقة', kind: 'عملي: تجميع 40 ملاحظة في خريطة' }
];
VIEWS.student.assessments = () => {
  const hist = S.skills.filter(s => s.score !== null).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  return `${head('اختبارات المهارات', 'أظهريها، لا تدّعيها.', 'الاختبارات مهام عملية تُقيَّم بمعايير. الدرجة أول خطوة نحو مهارة موثّقة.')}
  <div class="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">${ASSESS.map(a => { const s = skill(a.skill); return `<div class="card card-pad flex flex-col" data-rv><div class="flex items-center justify-between">${stChip(s.st)}<span class="text-xs text-muted">${a.dur}</span></div><p class="mt-4 font-semibold">${a.name}</p><p class="text-sm text-ink2 mt-1">${a.kind}</p><div class="mt-auto pt-5"><button class="btn btn-sm ${a.skill === 'py' ? 'btn-primary' : ''}" data-act="startAssess" data-id="${a.id}">${I('play')}${s.score !== null ? 'إعادة الاختبار' : 'ابدئي'}</button></div></div>`; }).join('')}</div>
  <div class="card mt-3" data-rv><div class="card-pad pb-0">${sectionTitle('سجل النتائج')}</div><div class="scroll-x"><table class="tbl"><thead><tr><th>المهارة</th><th>التاريخ</th><th>الدرجة</th><th>المستوى</th><th>الحالة</th><th></th></tr></thead><tbody>
    ${hist.map(s => `<tr><td class="font-semibold">${s.name}</td><td class="text-ink2 whitespace-nowrap">${fmtDate(s.date)}</td><td><div class="flex items-center gap-3 min-w-[140px]"><span class="num w-7">${s.score}</span><div class="flex-1">${bar(s.score, 'thin')}</div></div></td><td class="text-ink2">${s.lvl}</td><td>${stChip(s.st)}</td><td class="text-end"><button class="btn btn-ghost btn-sm" data-act="openSkill" data-id="${s.id}">التفاصيل</button></td></tr>`).join('')}</tbody></table></div></div>`;
};
ACT.startAssess = el => {
  const a = ASSESS.find(x => x.id === el.dataset.id);
  openModal(`${modalHead('اختبار عملي · ' + a.dur, a.name)}<div class="px-6 pb-6 grid gap-4">
    <div class="well p-4 text-sm leading-relaxed"><p class="font-semibold mb-2">مهمتك</p>${a.kind}. اعملي بأدواتك ثم ارفعي النتيجة. المعايير هي التي تحدد الدرجة، لا الاختيار من متعدد.</div>
    <div class="grid sm:grid-cols-3 gap-2 text-xs">${['الصحة 40%', 'المنهجية 30%', 'الوضوح 30%'].map(x => `<div class="well p-3">${x}</div>`).join('')}</div>
    <label class="well p-5 border-dashed text-center cursor-pointer block" for="asFile"><span class="text-muted">${I('upload', 'w-5 h-5 mx-auto')}</span><p class="text-sm mt-2">أفلتي عملك هنا أو اختاري ملفًا</p><input type="file" id="asFile" class="sr-only"></label>
    <div id="asOut"></div>
    <div class="flex justify-end gap-2"><button class="btn btn-ghost" data-act="closeModal">لاحقًا</button><button class="btn btn-primary" data-act="submitAssess" data-id="${a.id}">${I('send')}أرسلي للتقييم</button></div></div>`);
};
ACT.submitAssess = el => {
  const a = ASSESS.find(x => x.id === el.dataset.id), s = skill(a.skill);
  const score = { py: 64, fe: 73, ba: 61, ur: 78 }[a.id];
  el.disabled = true; $('#asOut').innerHTML = `<div class="flex items-center gap-2 text-sm text-ink2">${I('loader-circle', 'w-4 h-4 animate-spin')}جارٍ التقييم وفق المعايير…</div>`; icons();
  setTimeout(() => {
    s.score = score; s.date = '2026-11-14'; s.hist.push(['نوفمبر', score]);
    s.ev.unshift({ t: 'assessment', title: `${a.name}: ${score}/100`, src: 'اختبار نَسْج', d: '2026-11-14' });
    if (s.st === 'declared') s.st = 'assessed';
    if (score >= 70 && s.lvl === 'مبتدئ') s.lvl = 'متوسط';
    $('#asOut').innerHTML = `<div class="well p-4 flex items-center gap-4">${seal(s.st)}<div><p class="display text-2xl font-bold num">${score}/100</p><p class="text-sm text-ink2">${s.name} الآن «${STATES[s.st].label}». ${score >= 70 ? 'اطلبي مراجعة مقيّم كخطوة تالية.' : 'تدرّبي وأعيدي الاختبار لتتجاوزي 70.'}</p></div></div>`;
    icons(); SFX.play('success'); toast(`قُيّم الاختبار: <b>${s.name}</b> ${score}/100`, 'clipboard-check');
  }, 1300);
};

/* ---------- التحديات العملية ---------- */
let chFilter = 'الكل';
ACT.chFilter = el => { chFilter = el.dataset.v; rerender(); };
VIEWS.student.challenges = () => {
  const cats = ['الكل', 'التصميم', 'البيانات', 'الهندسة', 'الأعمال'];
  const list = S.challenges.filter(c => chFilter === 'الكل' || c.cat === chFilter);
  return `${head('التحديات العملية', 'موجزات حقيقية من شركات حقيقية.', 'لكل تحدٍّ معايير تقييم، ويُحسب دليلًا مستقلًا للمهارة التي يستهدفها.')}
  <div class="flex flex-wrap gap-2 mb-5" data-rv>${cats.map(c => `<button class="chip ${chFilter === c ? 'on' : ''}" data-act="chFilter" data-v="${c}">${c}</button>`).join('')}</div>
  <div class="grid md:grid-cols-2 xl:grid-cols-3 gap-3">${list.map(c => `<div class="card card-pad flex flex-col" data-rv>
    <div class="flex items-center justify-between gap-2"><span class="text-xs text-muted flex items-center gap-2">${I('building-2', 'w-3.5 h-3.5')}${esc(c.co)}</span>${c.st === 'completed' ? `<span class="chip st" data-s="verified">${I('check')}منجز · ${c.mine.score}</span>` : c.isNew ? `<span class="chip on">جديد</span>` : c.recommended ? `<span class="chip" style="color:var(--gold)">${I('wand-sparkles')}يسد فجوتك</span>` : c.inPath ? `<span class="chip">${I('route')}ضمن مسارك</span>` : `<span class="chip">مفتوح</span>`}</div>
    <p class="mt-4 font-semibold leading-snug">${esc(c.title)}</p>
    <div class="mt-3 flex flex-wrap gap-1.5"><span class="chip">${esc(c.skill)}</span><span class="chip">${c.lvl}</span><span class="chip">${I('clock')}${esc(c.dur)}</span></div>
    <div class="mt-auto pt-5 flex items-center justify-between"><span class="text-xs text-muted num">${c.apps} متقدّمًا · ${c.subs} تسليمًا</span><button class="btn btn-sm" data-act="openChallenge" data-id="${c.id}">عرض الموجز</button></div></div>`).join('')}</div>`;
};
ACT.openChallenge = el => {
  const c = S.challenges.find(x => x.id === el.dataset.id);
  openModal(`${modalHead(c.co + ' · ' + c.lvl, esc(c.title))}<div class="px-6 pb-8 grid gap-6">
    ${c.desc ? `<p class="text-ink2 leading-relaxed">${esc(c.desc)}</p>` : ''}
    <div class="grid grid-cols-3 gap-2 text-sm">${[['المهارة المستهدفة', c.skill], ['المستوى المطلوب', c.lvl], ['المدة', c.dur]].map(([k, v]) => `<div class="well p-3"><p class="text-xs text-muted">${k}</p><p class="mt-1">${esc(v)}</p></div>`).join('')}</div>
    <div><p class="eyebrow mb-3">المخرجات المتوقعة</p><div class="flex flex-wrap gap-2">${c.deliverables.map(d => `<span class="chip">${I('file-check-2')}${esc(d)}</span>`).join('')}</div></div>
    <div><p class="eyebrow mb-3">معايير التقييم</p>${hbars(c.rubric, { unit: '%', max: 40 })}</div>
    <div><p class="eyebrow mb-3">متطلبات التسليم</p><ul class="grid gap-2 text-sm text-ink2">${(c.reqs || ['ملفات PDF أو PNG بحد أقصى 25 ميجابايت', 'رابط واحد لنموذج يعمل أو مستودع', 'مبرر مكتوب مختصر']).map(r => `<li class="flex gap-2">${I('check', 'w-4 h-4 text-gold mt-1')}${esc(r)}</li>`).join('')}</ul></div>
    <div class="flex flex-wrap justify-end gap-2 border-t hair pt-5">${c.st === 'completed' ? `<span class="chip st" data-s="verified">${I('trophy')}درجتك ${c.mine.score} · الترتيب ${c.mine.rank}</span>` : `<button class="btn btn-primary" data-act="joinChallenge" data-id="${c.id}">${I('plus')}انضمّي للتحدي</button>`}</div></div>`, { drawer: true });
};
ACT.joinChallenge = el => { const c = S.challenges.find(x => x.id === el.dataset.id); c.apps++; closeModal(); SFX.play('success'); toast(`انضممتِ إلى <b>${esc(c.title)}</b>. سيُقيَّم تسليمك على ${c.rubric.length} معايير.`, 'target'); rerender(); };

/* ---------- الهاكاثونات ---------- */
VIEWS.student.hackathons = () => `${head('الهاكاثونات', 'حيث أظهرتِ ما تجيدينه تحت الضغط.', 'تسجّل نَسْج دورك الفردي في كل فريق، فتتبع الأدلةُ مساهمتك الفعلية.')}
  <div class="grid lg:grid-cols-2 gap-3">${HACKS.map(h => `<div class="card card-pad ${h.members.length ? 'is-link' : ''}" ${h.members.length ? `data-go="student-hack-${h.id}"` : ''} data-rv>
    <div class="flex items-center justify-between gap-3"><span class="eyebrow">${h.date} · ${h.hours} ساعة</span><span class="chip ${h.top ? 'st' : ''}" data-s="verified">${I('trophy')}${h.result}</span></div>
    <p class="mt-4 display text-2xl font-bold leading-snug">${h.project}</p><p class="text-sm text-ink2 mt-2">${h.name}</p>
    <div class="mt-5 grid grid-cols-3 gap-2 text-sm">${[['الفريق', h.team], ['دوري', h.role], ['عدد الفرق', h.teams]].map(([k, v]) => `<div class="well p-3"><p class="text-xs text-muted">${k}</p><p class="mt-1 leading-snug">${v}</p></div>`).join('')}</div>
    ${h.members.length ? `<div class="mt-5 flex items-center justify-between"><div class="av-stack flex">${h.members.map(m => av(m.who, 'av-sm')).join('')}</div><span class="text-sm text-gold flex items-center gap-1">تفصيل المساهمات ${I('arrow-right', 'w-4 h-4')}</span></div>` : `<p class="mt-5 text-xs text-muted">لم تُسجَّل مساهمات فردية في هذه الفعالية.</p>`}</div>`).join('')}</div>
  <div class="card card-pad mt-3 flex flex-wrap items-center justify-between gap-4" data-rv><div class="flex items-center gap-4"><span class="role-ico">${I('calendar-plus')}</span><div><p class="font-semibold">عطلة بُناة التقنية المالية</p><p class="text-sm text-ink2">5–7 ديسمبر · بقي 40 مقعدًا · التحدي من سنا للمدفوعات</p></div></div><button class="btn btn-primary" data-act="regHack">سجّلي</button></div>`;
ACT.regHack = el => { el.outerHTML = `<span class="chip on">${I('check')}مسجّلة</span>`; icons(); SFX.play('success'); toast('تم تسجيلك في عطلة بُناة التقنية المالية.'); };

VIEWS.student.hack = id => {
  const h = HACKS.find(x => x.id === id) || HACKS[0];
  const allSkills = [...new Set(h.members.flatMap(m => m.skills))];
  const total = h.judge.reduce((a, j) => a + j[1], 0) / h.judge.length;
  const first = n => n.split(' ')[0];
  return `<a href="#student-hackathons" class="inline-flex items-center gap-1.5 text-sm text-ink2 hover:text-ink mb-4">${I('arrow-left', 'w-4 h-4')}الهاكاثونات</a>
  ${head(`${h.name} · ${h.date}`, h.project, h.challenge, `<span class="chip st" data-s="verified">${I('trophy')}${h.result}</span>`)}
  <div class="card card-pad" data-rv>${sectionTitle('توزيع المساهمة', `<span class="text-xs text-muted">اتفق عليه الفريق وأكّده المرشد</span>`)}
    <div class="flex gap-[2px] h-10 rounded-xl overflow-hidden">${h.members.map(m => `<div class="flex items-center px-3 text-[13px] font-semibold num" style="width:${m.share}%;background:${P(m.who).c};color:#17130B" data-tip="${P(m.who).n}: ${m.share}%">${m.share}%</div>`).join('')}</div>
    <div class="mt-3 flex flex-wrap gap-4 text-sm">${h.members.map(m => `<span class="flex items-center gap-2"><span class="dot" style="--c:${P(m.who).c}"></span>${first(P(m.who).n)} · ${m.role}</span>`).join('')}</div></div>
  <div class="grid lg:grid-cols-3 gap-3 mt-3">${h.members.map((m, i) => `<div class="card card-pad" ${m.who === 'reem' ? 'style="border-color:rgba(226,184,102,.45)"' : ''} data-rv>
    <div class="flex items-center gap-3">${av(m.who)}<div class="min-w-0"><p class="font-semibold">${P(m.who).n}${m.who === 'reem' ? ' <span class="text-xs text-gold">(أنتِ)</span>' : ''}</p><p class="text-xs text-muted">الطالب ${['أ', 'ب', 'ج'][i]} · ${m.role}</p></div></div>
    ${[['المسؤوليات', m.resp], ['المهام المنجزة', m.tasks], ['المخرجات', m.out]].map(([t, l]) => `<div class="mt-5"><p class="eyebrow mb-2">${t}</p><ul class="grid gap-1.5 text-[13.5px]">${l.map(x => `<li class="flex gap-2">${I('check', 'w-3.5 h-3.5 mt-1.5 text-gold flex-none')}${x}</li>`).join('')}</ul></div>`).join('')}
    <div class="mt-5"><p class="eyebrow mb-2">المهارات المطبّقة</p><div class="flex flex-wrap gap-1.5">${m.skills.map(s => `<span class="chip">${s}</span>`).join('')}</div></div>
    <div class="mt-4"><p class="eyebrow mb-2">الأدوات</p><p class="text-sm text-ink2" dir="ltr" style="text-align:right">${m.tools.join(' · ')}</p></div>
    <div class="mt-5 well p-3"><div class="flex items-center gap-2 mb-2">${av(m.mentor[0], 'av-sm')}<p class="text-xs text-muted">ملاحظة المرشد · ${P(m.mentor[0]).n}</p></div><p class="text-sm leading-relaxed">«${m.mentor[1]}»</p></div>
    <div class="mt-4 flex items-center gap-2 text-xs text-ink2">${I('badge-check', 'w-4 h-4 text-gold')}الأدلة صدرت لجواز ${first(P(m.who).n)} فقط</div></div>`).join('')}</div>
  <div class="grid lg:grid-cols-12 gap-3 mt-3">
    <div class="card lg:col-span-7" data-rv><div class="card-pad pb-2">${sectionTitle('مصفوفة احتساب المهارات', `<span class="text-xs text-muted">الاحتساب يتبع المساهمة لا عضوية الفريق</span>`)}</div>
      <div class="scroll-x"><table class="tbl"><thead><tr><th>المهارة</th>${h.members.map(m => `<th class="text-center">${first(P(m.who).n)}</th>`).join('')}</tr></thead><tbody>
      ${allSkills.map(s => `<tr><td>${s}</td>${h.members.map(m => `<td class="text-center">${m.skills.includes(s) ? `<span class="inline-flex items-center gap-1 text-gold text-xs">${I('badge-check', 'w-4 h-4')}محتسبة</span>` : `<span class="text-muted">—</span>`}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>
    <div class="card card-pad lg:col-span-5" data-rv>${sectionTitle('تقييم لجنة التحكيم', `<span class="chip num">${total.toFixed(1)} / 10</span>`)}${hbars(h.judge, { max: 10 })}<p class="mt-5 text-xs text-muted">لجنة من 3 محكّمين، بينهم قائد المنتجات في سنا للمدفوعات.</p></div>
  </div>`;
};

/* ---------- الأندية والتطوع ---------- */
VIEWS.student.clubs = () => `${head('الأندية والأنشطة', 'عمل الأندية، موثّقًا كما يجب.', 'يسجّل المنظّمون ما كنتِ مسؤولة عنه وما أنتجتِه، وهذا السجل يصبح دليلًا.')}
  <div class="grid md:grid-cols-2 gap-3">${[['نادي الابتكار بجامعة النور', 'قائدة الفعاليات', 'منذ سبتمبر 2025', 'مسؤوليات موثّقة في 3 فعاليات', 'verified'], ['جمعية التصميم', 'عضوة', 'منذ فبراير 2025', 'حضرت 6 ورش (حضور فقط)', 'participation']].map(([n, r, s, d, st]) => `<div class="card card-pad" data-rv><div class="flex items-center gap-3"><span class="role-ico">${I('users-round')}</span><div class="flex-1 min-w-0"><p class="font-semibold">${n}</p><p class="text-xs text-muted">${r} · ${s}</p></div>${stChip(st)}</div><p class="text-sm text-ink2 mt-4">${d}</p></div>`).join('')}</div>
  <div class="card card-pad mt-3" data-rv>${sectionTitle('أسبوع التقنية 2026 · ما أنجزته ريم فعلًا', `<span class="chip st" data-s="verified">${I('badge-check')}وثّقه النادي</span>`)}
    <div class="grid md:grid-cols-3 gap-3">${[['المسؤوليات', ['امتلاك جدول الأيام الخمسة', 'التنسيق مع 3 رعاة', 'إدارة 12 متطوعًا في 4 فرق فرعية']], ['المخرجات', ['جدول تشغيل لـ 18 جلسة', 'عرض الرعاة واتفاقياتهم', 'تقرير ما بعد الفعالية: 640 حاضرًا، وتقييم 4.6 من 5']], ['المهارات التي يثبتها', ['إدارة المشاريع', 'القيادة', 'التواصل', 'العمل الجماعي']]].map(([t, l], i) => `<div class="well p-4"><p class="eyebrow mb-3">${t}</p>${i === 2 ? `<div class="flex flex-wrap gap-1.5">${l.map(x => `<span class="chip">${x}</span>`).join('')}</div>` : `<ul class="grid gap-2 text-sm">${l.map(x => `<li class="flex gap-2">${I('check', 'w-4 h-4 text-gold mt-1 flex-none')}${x}</li>`).join('')}</ul>`}</div>`).join('')}</div></div>
  <div class="mt-8" data-rv>${sectionTitle('أنشطة مفتوحة')}<div class="grid md:grid-cols-3 gap-3">${S.activities.filter(a => a.st !== 'completed').map(a => `<div class="card card-pad"><div class="flex justify-between items-center"><span class="chip">${a.kind}</span><span class="text-xs text-muted">${a.date}</span></div><p class="mt-4 font-semibold">${esc(a.name)}</p><p class="text-xs text-muted mt-1 num">${a.reg}/${a.cap} مسجّلًا</p><div class="mt-3">${bar(a.reg / a.cap * 100, 'thin')}</div><div class="mt-4 flex flex-wrap gap-1.5">${a.skills.map(s => `<span class="chip">${esc(s)}</span>`).join('')}</div>${a.st === 'open' ? `<button class="btn btn-sm btn-primary mt-4" data-act="regAct" data-id="${a.id}">سجّلي</button>` : ''}</div>`).join('')}</div></div>`;
ACT.regAct = el => { const a = S.activities.find(x => x.id === el.dataset.id); a.reg++; SFX.play('success'); toast(`تم تسجيلك في <b>${esc(a.name)}</b>.`); rerender(); };

VIEWS.student.volunteering = () => `${head('التطوع', `${VOLUNTEER.reduce((a, v) => a + v.hrs, 0)} ساعة تطوع هذا العام.`, 'الساعات وحدها ليست مهارات. المسؤوليات الموثّقة التي يراجعها المنظّم هي المهارات.', `<button class="btn btn-primary" data-act="logVol">${I('plus')}سجّلي تطوعًا</button>`)}
  <div class="grid sm:grid-cols-3 gap-3 mb-3">${stat('إجمالي الساعات', VOLUNTEER.reduce((a, v) => a + v.hrs, 0), { icon: 'clock' })}${stat('سجلات موثّقة', 1, { icon: 'file-check-2', sub: 'تُحسب أدلة' })}${stat('حضور فقط', 1, { icon: 'ticket', sub: 'محفوظة، لا تُحسب' })}</div>
  <div class="grid gap-3">${VOLUNTEER.map(v => `<div class="card card-pad flex flex-wrap items-center gap-4" data-rv><span class="role-ico">${I('hand-heart')}</span><div class="flex-1 min-w-[220px]"><p class="font-semibold">${esc(v.name)}</p><p class="text-xs text-muted mt-1">${esc(v.org)} · ${esc(v.ev)}</p>${v.skills.length ? `<div class="mt-2 flex flex-wrap gap-1.5">${v.skills.map(s => `<span class="chip">${s}</span>`).join('')}</div>` : ''}</div><span class="num text-sm text-ink2">${v.hrs} ساعة</span>${stChip(v.st)}</div>`).join('')}</div>`;
ACT.logVol = () => openModal(`${modalHead('تسجيل تطوع', 'وثّقي ما قمتِ به')}<form class="px-6 pb-6 grid gap-4" data-form="vol"><div class="field"><label class="label" for="vName">النشاط</label><input class="input" id="vName" required></div><div class="grid sm:grid-cols-2 gap-3"><div class="field"><label class="label" for="vOrg">الجهة المنظّمة</label><input class="input" id="vOrg" required></div><div class="field"><label class="label" for="vHrs">الساعات</label><input class="input" id="vHrs" type="number" min="1" value="8"></div></div><div class="field"><label class="label" for="vResp">مسؤولياتك</label><textarea class="textarea" id="vResp" placeholder="ما الذي كنتِ مسؤولة عنه، وما الذي أنتجتِه؟"></textarea></div><p class="text-xs text-muted">يصل للمنظّم طلب لتأكيد مسؤولياتك.</p><div class="flex justify-end gap-2"><button type="button" class="btn btn-ghost" data-act="closeModal">إلغاء</button><button class="btn btn-primary">أرسلي للتأكيد</button></div></form>`);
FORMS.vol = () => { VOLUNTEER.unshift({ name: $('#vName').value, org: $('#vOrg').value, hrs: +$('#vHrs').value || 1, st: 'declared', ev: 'بانتظار تأكيد المنظّم', skills: [] }); closeModal(); SFX.play('success'); toast('سُجّل التطوع، وطُلب من المنظّم تأكيده.'); rerender(); };

/* ---------- الإرشاد ---------- */
const MENTORS = ['sara', 'majed', 'faisal', 'dana'];
VIEWS.student.mentorship = () => `${head('الإرشاد', 'تعلّمي ممن يمارسون العمل.', 'الأساتذة يغطّون النظرية، والخريجون والمهنيون ينقلون ما تتوقعه بيئة العمل الآن.')}
  <div class="grid lg:grid-cols-12 gap-3">
    <div class="card card-pad lg:col-span-7" data-rv>${sectionTitle('الجلسات القادمة')}<div class="grid gap-2">${S.sessions.filter(s => s.st === 'upcoming').map(s => `<div class="well p-4 flex items-center gap-4">${av(s.with)}<div class="min-w-0 flex-1"><p class="text-sm font-semibold">${s.topic}</p><p class="text-xs text-muted mt-0.5">${P(s.with).n} · ${s.when} · ${s.dur} دقيقة</p></div><button class="btn btn-sm" data-act="joinCall">${I('video')}انضمام</button></div>`).join('')}</div>
      <div class="mt-6">${sectionTitle('جلسات سابقة')}<div class="grid gap-2">${S.sessions.filter(s => s.st === 'done').map(s => `<div class="well p-4"><div class="flex items-center gap-3">${av(s.with, 'av-sm')}<p class="text-sm flex-1">${s.topic}</p><span class="text-xs text-muted">${s.when}</span></div><p class="text-sm text-ink2 mt-3 ps-10">«${s.note}»</p></div>`).join('')}</div></div></div>
    <div class="lg:col-span-5 grid gap-3 content-start">${MENTORS.map(m => `<div class="card card-pad flex gap-4 items-center" data-rv>${av(m, 'av-lg')}<div class="min-w-0 flex-1"><p class="font-semibold">${P(m).n}</p><p class="text-xs text-muted">${P(m).title} · ${P(m).org}</p></div><button class="btn btn-sm" data-act="bookMentor" data-id="${m}">احجزي</button></div>`).join('')}</div>
  </div>`;
ACT.joinCall = () => toast('تُفتح المكالمة قبل الجلسة بـ 10 دقائق (تجربة).', 'video');
ACT.bookMentor = el => { const m = el.dataset.id; openModal(`${modalHead('حجز جلسة', P(m).n)}<div class="px-6 pb-6 grid gap-4"><div class="field"><label class="label" for="bkTopic">الموضوع</label><input class="input" id="bkTopic" value="مراجعة ملف الأعمال"></div><div class="field"><span class="label">المواعيد المتاحة</span><div class="seg" id="bkSlots">${['الثلاثاء 17 نوفمبر · 18:00', 'الخميس 19 نوفمبر · 20:00', 'الأحد 22 نوفمبر · 17:30'].map((s, i) => `<button type="button" class="${i === 0 ? 'on' : ''}" data-act="seg">${s}</button>`).join('')}</div></div><div class="flex justify-end"><button class="btn btn-primary" data-act="confirmBook" data-id="${m}">${I('calendar-check')}تأكيد الحجز</button></div></div>`); };
ACT.confirmBook = el => { const when = $('#bkSlots .on').textContent; S.sessions.unshift({ with: el.dataset.id, topic: $('#bkTopic').value || 'جلسة', when, dur: 30, st: 'upcoming', student: 'reem' }); closeModal(); SFX.play('success'); toast(`تم الحجز مع <b>${P(el.dataset.id).n}</b> · ${when}`, 'calendar-check'); rerender(); };

/* ---------- مشاريعي ---------- */
VIEWS.student.projects = () => `${head('مشاريعي', 'أعمال تحمل اسمك ودورك.', 'كل مشروع يُظهر حصتك الفردية، فلا يضخّم العمل الجماعي ما أنجزتِه ولا يخفيه.')}
  <div class="grid md:grid-cols-2 xl:grid-cols-3 gap-3">${PROJECTS.map(p => `<div class="card card-pad flex flex-col ${p.link ? 'is-link' : ''}" ${p.link ? `data-go="${p.link.slice(1)}"` : ''} data-rv><div class="flex justify-between items-center gap-2"><span class="text-xs text-muted truncate">${p.kind}</span>${stChip(p.id === 'cafe' && S.pathDone ? 'verified' : p.st)}</div>
    <p class="mt-4 display text-xl font-bold leading-snug">${p.name}</p><p class="text-sm text-ink2 mt-2">${p.role}</p>
    ${p.share ? `<div class="mt-4"><div class="flex justify-between text-xs mb-1.5"><span class="text-muted">حصتي</span><span class="num">${p.share}%</span></div>${bar(p.share, 'thin')}</div>` : ''}
    <div class="mt-auto pt-5 flex flex-wrap gap-1.5">${p.skills.map(s => `<span class="chip">${s}</span>`).join('')}</div></div>`).join('')}</div>`;

/* ---------- جواز المهارات ---------- */
let ppFilter = 'all', ppQuery = '';
ACT.ppFilter = el => { ppFilter = el.dataset.v; rerender(); };
VIEWS.student.passport = () => {
  const me = P('reem');
  const list = S.skills.filter(s => (ppFilter === 'all' || s.st === ppFilter) && s.name.includes(ppQuery.trim())).sort((a, b) => STATE_ORDER.indexOf(b.st) - STATE_ORDER.indexOf(a.st) || (b.score ?? 0) - (a.score ?? 0));
  const ledger = S.skills.flatMap(s => s.ev.map(e => ({ ...e, skill: s.name }))).sort((a, b) => b.d.localeCompare(a.d));
  const max = Math.max(...STATE_ORDER.map(stateCount));
  return `${head('جواز المهارات', 'أدلة، لا صفات.', 'ملف أدلتك المهنية. كل مهارة تُظهر كيف أُثبتت، ومن قيّمها، ومتى.', `<button class="btn" data-act="copyLink">${I('link-2')}نسخ رابط المشاركة</button><a class="btn btn-primary" href="#student-portfolio">${I('eye')}معاينة الملف العام</a>`)}
  <div class="grid lg:grid-cols-12 gap-3">
    <div class="card card-pad lg:col-span-7 overflow-hidden" data-rv>
      <div class="absolute inset-0 pointer-events-none opacity-[.5] hero-fallback" style="mask-image:linear-gradient(240deg,transparent 40%,#000)"></div>
      <div class="relative flex flex-wrap items-start gap-5">${av('reem', 'av-xl')}<div class="min-w-0 flex-1"><p class="eyebrow">رقم الجواز <span class="num" dir="ltr">NASJ-RO-2026-0412</span></p><p class="display text-3xl font-bold mt-1">${me.n}</p><p class="text-ink2 mt-1">${me.major} · ${me.yr} · ${me.uni}</p><div class="mt-4 flex flex-wrap gap-2"><span class="chip">${I('target')}المستهدف: ${me.target}</span><span class="chip">${I('map-pin')}${me.city}</span><span class="chip">${I('refresh-ccw')}آخر تحديث ${S.pathDone ? 'اليوم' : '2 نوفمبر 2026'}</span></div></div></div>
      <div class="relative mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2">${STATE_ORDER.slice().reverse().map(s => `<div class="well p-3 flex items-center gap-3">${seal(s, true)}<div><p class="num font-bold text-lg leading-none">${stateCount(s)}</p><p class="text-[11px] text-muted mt-1">${STATES[s].label}</p></div></div>`).join('')}</div>
    </div>
    <div class="card card-pad lg:col-span-5" data-rv>${sectionTitle('معنى الشارات')}
      <div class="grid gap-3">${STATE_ORDER.map(s => `<div class="flex items-center gap-3">${seal(s, true)}<div class="min-w-0 flex-1"><p class="text-sm font-semibold">${STATES[s].label}</p><p class="text-xs text-muted leading-snug">${STATES[s].means}</p></div><div class="w-16 h-1.5 rounded-full bg-[var(--surface-3)] overflow-hidden"><span class="block h-full rounded-full bg-[var(--gold)]" style="width:${stateCount(s) / max * 100}%;opacity:${.35 + STATE_ORDER.indexOf(s) * .21}"></span></div></div>`).join('')}</div>
      <p class="mt-4 text-xs text-muted flex gap-2">${I('ticket', 'w-3.5 h-3.5 flex-none mt-0.5')}شهادات الحضور تُحفظ كسياق، ولا توثّق مهارة وحدها.</p></div>
  </div>
  <div class="mt-6 flex flex-wrap items-center gap-3 justify-between" data-rv><div class="flex flex-wrap gap-2">${['all', ...STATE_ORDER.slice().reverse()].map(v => `<button class="chip ${ppFilter === v ? 'on' : ''}" data-act="ppFilter" data-v="${v}">${v === 'all' ? 'كل المهارات' : STATES[v].label}</button>`).join('')}</div>
    <div class="relative w-full sm:w-64"><span class="absolute start-3 top-1/2 -translate-y-1/2 text-muted">${I('search', 'w-4 h-4')}</span><input class="input ps-9" id="ppSearch" placeholder="ابحثي في المهارات" value="${esc(ppQuery)}" aria-label="البحث في المهارات"></div></div>
  <div class="card mt-3" data-rv><div class="scroll-x"><table class="tbl min-w-[880px]"><thead><tr><th>المهارة</th><th>المستوى</th><th>الدرجة</th><th>التوثيق</th><th>الأدلة</th><th>المقيّم</th><th>تاريخ الاختبار</th><th></th></tr></thead><tbody id="ppRows">
    ${list.map(s => `<tr class="cursor-pointer" data-act="openSkill" data-id="${s.id}"><td><div class="flex items-center gap-3">${seal(s.st, true)}<div><p class="font-semibold">${s.name}</p><p class="text-xs text-muted">${s.cat}</p></div></div></td><td class="text-ink2">${s.lvl}</td>
      <td><div class="flex items-center gap-2 min-w-[110px]"><span class="num w-7">${s.score ?? '—'}</span><div class="flex-1">${s.score !== null ? bar(s.score, 'thin') : ''}</div></div></td><td>${stChip(s.st)}</td>
      <td><div class="flex gap-1 text-muted">${s.ev.slice(0, 4).map(e => `<span data-tip="${evLabel(e.t)}${e.excluded ? ' (لا يُحسب)' : ''}" class="${e.excluded ? 'opacity-40' : ''}">${I(evIcon(e.t), 'w-4 h-4')}</span>`).join('') || '<span class="text-xs">لا يوجد</span>'}</div></td>
      <td>${s.evaluator ? `<span class="flex items-center gap-2 text-ink2 text-xs">${av(s.evaluator, 'av-sm')}<span class="truncate max-w-[120px]">${P(s.evaluator).n}</span></span>` : '<span class="text-xs text-muted">—</span>'}</td><td class="text-ink2 text-xs whitespace-nowrap">${fmtDate(s.date)}</td><td class="text-muted">${I('chevron-right', 'w-4 h-4')}</td></tr>`).join('')}</tbody></table></div>
    ${list.length ? '' : `<div class="p-6">${empty('search', 'لا مهارات مطابقة', 'جرّبي تصفية أو بحثًا آخر.')}</div>`}</div>
  <div class="card mt-3" data-rv><div class="card-pad pb-2">${sectionTitle('سجل الأدلة', `<span class="text-xs text-muted num">${ledger.length} سجلًا · لكل سجل مصدر وتاريخ</span>`)}</div><div class="scroll-x"><table class="tbl min-w-[780px]"><thead><tr><th>النوع</th><th>الدليل</th><th>المهارة</th><th>المصدر</th><th>التاريخ</th><th>يُحسب؟</th></tr></thead><tbody>
    ${ledger.slice(0, 14).map(e => `<tr><td><span class="flex items-center gap-2 text-ink2 text-xs whitespace-nowrap">${I(evIcon(e.t), 'w-4 h-4')}${evLabel(e.t)}</span></td><td class="max-w-[320px]">${esc(e.title)}</td><td class="text-ink2">${esc(e.skill)}</td><td class="text-ink2 text-xs">${esc(e.src)}</td><td class="text-xs text-ink2 whitespace-nowrap">${fmtDate(e.d)}</td><td>${e.excluded ? `<span class="chip sem sem-warn">${I('ban')}لا</span>` : e.pending ? `<span class="chip st" data-s="assessed">بانتظار</span>` : `<span class="chip sem sem-good">${I('check')}نعم</span>`}</td></tr>`).join('')}</tbody></table></div></div>`;
};
ACT.copyLink = () => { const url = 'https://nasj.demo/p/reem-alotaibi'; const ok = () => toast(`نُسخ الرابط <span class="mono text-xs" dir="ltr">${url}</span>`, 'link-2'), fb = () => toast(`رابط المشاركة: <span class="mono text-xs" dir="ltr">${url}</span>`, 'link-2'); try { navigator.clipboard.writeText(url).then(ok, fb); } catch (e) { fb(); } };
document.addEventListener('input', e => { if (e.target.id === 'ppSearch') { ppQuery = e.target.value; clearTimeout(window._ppT); window._ppT = setTimeout(() => { rerender(); const i = $('#ppSearch'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 180); } });

/* ---------- معاينة الملف العام ---------- */
let pfVerifiedOnly = true;
ACT.pfToggle = () => { pfVerifiedOnly = !pfVerifiedOnly; rerender(); };
VIEWS.student.portfolio = () => {
  const me = P('reem'), sk = S.skills.filter(s => pfVerifiedOnly ? s.st === 'verified' : s.st !== 'declared');
  return `<div class="flex flex-wrap items-center justify-between gap-3 mb-5" data-rv><a href="#student-passport" class="inline-flex items-center gap-1.5 text-sm text-ink2 hover:text-ink">${I('arrow-left', 'w-4 h-4')}العودة للجواز</a>
    <div class="flex items-center gap-3"><span class="demo-flag">معاينة · ما تراه جهات التوظيف</span><button class="flex items-center gap-2 text-sm text-ink2" data-act="pfToggle"><span class="toggle ${pfVerifiedOnly ? 'on' : ''}"></span>الموثّقة فقط</button></div></div>
  <div class="card overflow-hidden" data-rv>
    <div class="relative h-40 md:h-52 hero-fallback" style="background-color:var(--bg-2)"><div class="absolute inset-0" style="background:radial-gradient(60% 120% at 20% 0%,rgba(226,184,102,.22),transparent 60%)"></div><span class="absolute left-6 bottom-4 logo-ar text-gold/60 text-5xl">نَسْج</span></div>
    <div class="px-6 md:px-10 pb-10 -mt-12 relative">
      <div class="flex flex-wrap items-end gap-5">${av('reem', 'av-xl')}<div class="pb-1"><h2 class="display text-3xl md:text-4xl font-bold">${me.n}</h2><p class="text-ink2 mt-1">تطمح لتكون ${me.target} · ${me.major}، ${me.uni}</p></div><div class="ms-auto flex gap-2"><button class="btn" disabled>${I('download')}السيرة الذاتية</button><button class="btn btn-primary" disabled>${I('mail')}تواصل</button></div></div>
      <p class="mt-6 max-w-[64ch] text-ink2 leading-[1.9]">أصمّم واجهات تجعل المال والوقت أبسط على الطلاب. طالبة في السنة الرابعة بتخصص نظم المعلومات، حصلت على المركز الثاني في هاكاثون النور للذكاء الاصطناعي، وقادت فعاليات أسبوع التقنية 2026.</p>
      <div class="mt-8"><p class="eyebrow mb-3">${pfVerifiedOnly ? 'المهارات الموثّقة' : 'المهارات المُختبَرة والمُقيَّمة والموثّقة'}</p><div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">${sk.map(s => `<div class="well p-4"><div class="flex items-center justify-between">${seal(s.st, true)}<span class="num text-sm">${s.score}</span></div><p class="mt-3 font-semibold text-sm">${s.name}</p><p class="text-xs text-muted mt-1">${s.lvl} · ${s.ev.filter(e => !e.excluded).length} أدلة${s.evaluator ? ' · راجعها ' + P(s.evaluator).n : ''}</p></div>`).join('')}</div></div>
      <div class="mt-8 grid md:grid-cols-3 gap-3">${PROJECTS.slice(0, 3).map(p => `<div class="well p-4"><p class="text-xs text-muted">${p.kind}</p><p class="mt-2 font-semibold">${p.name}</p><p class="text-sm text-ink2 mt-1">الدور: ${p.role}${p.share ? ` · ${p.share}% من العمل` : ''}</p></div>`).join('')}</div>
      <div class="mt-8 grid md:grid-cols-2 gap-3">${[['sara', 'التهيئة هي الأقوى التي رأيتها هذا الأسبوع. حالات فارغة واضحة ونصوص صادقة.'], ['faisal', 'خطة مشروع محكمة وتقرير صادق بعد الفعالية. ريم توثّق قراراتها.']].map(([w, q]) => `<figure class="well p-5"><blockquote class="text-[15px] leading-relaxed">«${q}»</blockquote><figcaption class="mt-4 flex items-center gap-3">${av(w, 'av-sm')}<span class="text-sm">${P(w).n}<span class="block text-xs text-muted">${P(w).title}</span></span></figcaption></figure>`).join('')}</div>
    </div></div>`;
};

/* ---------- المجتمع ---------- */
VIEWS.student.community = () => `${head('المجتمع', 'اسألي وشاركي وتعلّمي علنًا.', 'رؤى من المهنيين، وشروحات من الأساتذة، وأسئلة من طلاب مثلك.', `<button class="btn btn-primary" data-act="askQ">${I('message-circle-question')}اطرحي سؤالًا</button>`)}
  <div class="grid lg:grid-cols-12 gap-3"><div class="lg:col-span-8 grid gap-3 content-start" id="feed">${S.insights.map(insightCard).join('')}</div>
  <div class="lg:col-span-4 grid gap-3 content-start"><div class="card card-pad" data-rv>${sectionTitle('مواضيع رائجة')}<div class="flex flex-wrap gap-2">${['#ملف_الأعمال', '#أنظمة_التصميم', '#SQL', '#تدريب_2027', '#ذكاء_اصطناعي_عربي', '#هاكاثون'].map(t => `<span class="chip">${t}</span>`).join('')}</div></div>
  <div class="card card-pad" data-rv>${sectionTitle('فعاليات هذا الشهر')}<div class="grid gap-3">${[['ورشة السباق التصميمي', '29 نوفمبر · نادي الابتكار'], ['عطلة بُناة التقنية المالية', '5–7 ديسمبر · سنا للمدفوعات'], ['أمسية ملفات الأعمال', '10 ديسمبر · استوديو نخلة']].map(([t, s]) => `<div class="flex gap-3 items-center"><span class="role-ico w-9 h-9">${I('calendar')}</span><div><p class="text-sm">${t}</p><p class="text-xs text-muted">${s}</p></div></div>`).join('')}</div></div></div></div>`;
const insightCard = x => `<article class="card card-pad" data-rv><div class="flex items-center gap-3">${av(x.by)}<div class="min-w-0 flex-1"><p class="text-sm font-semibold">${P(x.by).n}</p><p class="text-xs text-muted truncate">${P(x.by).title || P(x.by).major} · ${P(x.by).org || P(x.by).uni}</p></div><span class="chip">${esc(x.kind)}</span></div>
  <h3 class="mt-4 text-lg font-bold leading-snug" style="font-family:var(--font-display)">${esc(x.title)}</h3><p class="mt-2 text-ink2 leading-[1.85]">${esc(x.body)}</p>
  <div class="mt-4 flex items-center gap-2 text-sm text-muted"><button class="btn btn-ghost btn-sm" data-act="like">${I('heart')}<span class="num">${x.likes}</span></button><button class="btn btn-ghost btn-sm" data-act="like">${I('bookmark')}<span class="num">${x.saves}</span></button><span class="ms-auto text-xs">${x.d}</span></div></article>`;
ACT.like = el => { const n = el.querySelector('.num'); n.textContent = +n.textContent + 1; el.style.color = 'var(--gold)'; SFX.play('toggle'); };
ACT.askQ = () => openModal(`${modalHead('المجتمع', 'اطرحي سؤالًا')}<form class="px-6 pb-6 grid gap-4" data-form="ask"><div class="field"><label class="label" for="qT">السؤال</label><input class="input" id="qT" required placeholder="مثال: كيف أُظهر مهارات البحث دون مشروع لعميل؟"></div><div class="field"><label class="label" for="qB">التفاصيل</label><textarea class="textarea" id="qB"></textarea></div><div class="flex justify-end"><button class="btn btn-primary">انشري السؤال</button></div></form>`);
FORMS.ask = () => { S.insights.unshift({ by: 'reem', kind: 'سؤال', title: $('#qT').value, body: $('#qB').value || 'أبحث عن نصيحة من المهنيين.', likes: 0, saves: 0, d: 'الآن' }); closeModal(); SFX.play('success'); toast('نُشر سؤالك، ووصل إشعار للمرشدين في مجالك.'); rerender(); };

/* ---------- الملف الشخصي ---------- */
VIEWS.student.profile = () => {
  const me = P('reem');
  return `${head('الملف الشخصي', me.n, `${me.major} · ${me.yr} · ${me.uni}`, `<a class="btn" href="#student-portfolio">${I('eye')}المعاينة العامة</a><button class="btn btn-primary" data-act="editProfile">${I('pencil')}تعديل</button>`)}
  <div class="grid lg:grid-cols-12 gap-3">
    <div class="lg:col-span-4 grid gap-3 content-start">
      <div class="card card-pad text-center" data-rv>${av('reem', 'av-xl')}<p class="mt-4 font-semibold text-lg">${me.n}</p><p class="text-sm text-ink2">مسار ${me.target}</p><div class="mt-4 flex justify-center gap-2">${stChip('verified')}<span class="chip num">${stateCount('verified')} موثّقة</span></div></div>
      <div class="card card-pad" data-rv>${sectionTitle('الاهتمامات المهنية')}<div class="flex flex-wrap gap-2">${['تصميم المنتجات', 'التقنية المالية', 'أنظمة التصميم', 'إتاحة الوصول', 'تجربة عربية أولًا'].map(t => `<span class="chip">${t}</span>`).join('')}</div></div>
      <div class="card card-pad" data-rv>${sectionTitle('الإنجازات')}<div class="grid gap-3">${[['trophy', 'المركز الثاني · هاكاثون النور للذكاء الاصطناعي 2026'], ['medal', 'ضمن أفضل 3 · تحدي تهيئة سنا للمدفوعات'], ['award', 'قائمة العميد · 2025 و2026'], ['star', 'قائدة الفعاليات · أسبوع التقنية 2026']].map(([i, t]) => `<div class="flex gap-3 items-center text-sm"><span class="text-gold">${I(i, 'w-4 h-4')}</span>${t}</div>`).join('')}</div></div>
    </div>
    <div class="lg:col-span-8 grid gap-3 content-start">
      <div class="card card-pad" data-rv>${sectionTitle('المهارات وحالة التوثيق', `<a class="text-xs text-ink2 hover:text-ink" href="#student-passport">فتح الجواز</a>`)}<div class="flex flex-wrap gap-2">${S.skills.map(s => `<button class="chip st" data-s="${s.st}" data-act="openSkill" data-id="${s.id}">${I(STATES[s.st].icon)}${s.name}</button>`).join('')}</div></div>
      <div class="card card-pad" data-rv>${sectionTitle('سجل التعلم')}<ol class="relative border-s hair ms-2 grid gap-5">${[['أكتوبر 2026', 'أكملت مسار تصميم الواجهات الاحترافي'], ['أكتوبر 2026', 'أكملت أساسيات إدارة المشاريع'], ['أغسطس 2026', 'أكملت أنظمة Figma'], ['نوفمبر 2026', 'بدأت مسار التصميم الجرافيكي'], ['أكتوبر 2026', 'بدأت أساسيات تحليل البيانات']].map(([d, t]) => `<li class="ps-5 relative"><span class="absolute -start-[5px] top-2 w-2 h-2 rounded-full bg-[var(--gold)]"></span><p class="text-xs text-muted">${d}</p><p class="text-sm mt-0.5">${t}</p></li>`).join('')}</ol></div>
      <div class="card card-pad" data-rv>${sectionTitle('ملف المشاريع ومساهمات الهاكاثون')}<div class="grid sm:grid-cols-2 gap-2">${PROJECTS.map(p => `<div class="well p-3"><p class="text-sm font-semibold">${p.name}</p><p class="text-xs text-muted mt-1">${p.role}${p.share ? ' · ' + p.share + '%' : ''}</p></div>`).join('')}</div></div>
      <div class="card card-pad" data-rv>${sectionTitle('ملاحظات مهنية')}<div class="grid md:grid-cols-2 gap-3">${S.sessions.filter(s => s.note).map(s => `<div class="well p-4"><p class="text-sm leading-relaxed">«${s.note}»</p><p class="text-xs text-muted mt-3">${P(s.with).n} · ${s.when}</p></div>`).join('')}</div></div>
    </div></div>`;
};
ACT.editProfile = () => toast('تعديل الملف معطّل في التجربة.', 'lock');
