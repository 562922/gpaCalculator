/* ---------- Config & DOM refs ---------- */
const ARC_START = 225, ARC_END = 315, ARC_CX = 70, ARC_CY = 70, ARC_R = 48;
const GRADES = [
  { label: 'A+', value: 4 }, { label: 'A', value: 4 }, { label: 'A-', value: 3.7 },
  { label: 'B+', value: 3.3 }, { label: 'B', value: 3 }, { label: 'B-', value: 2.7 },
  { label: 'C+', value: 2.3 }, { label: 'C', value: 2 }, { label: 'C-', value: 1.7 },
  { label: 'D+', value: 1.3 }, { label: 'D', value: 1 }, { label: 'D-', value: 0.7 },
  { label: 'F', value: 0 }
];

let semCounter = 0;
const container = document.getElementById('semesters');
const gaugeTemplate = document.getElementById('gaugeTemplate');
const darkToggle = document.getElementById('darkModeToggle');

/* ---------- Dark mode toggle ---------- */
if (darkToggle) {
  darkToggle.addEventListener('click', () => {
    darkToggle.classList.toggle('on');
    darkToggle.setAttribute('aria-checked', darkToggle.classList.contains('on') ? 'true' : 'false');
    document.body.classList.toggle('dark');
  });
  darkToggle.addEventListener('keydown', e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); darkToggle.click(); } });
}

/* ---------- Arc helpers ---------- */
function polar(cx, cy, r, deg) {
  const rad = (deg - 90) * Math.PI / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}
function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polar(cx, cy, endAngle);
  const end = polar(cx, cy, startAngle);
  const largeArc = (endAngle - startAngle + 360) % 360 > 180 ? 1 : 0;
  return `M ${start.x.toFixed(3)} ${start.y.toFixed(3)} A ${r} ${r} 0 ${largeArc} 1 ${end.x.toFixed(3)} ${end.y.toFixed(3)}`;
}

/* ---------- Semester / Row creation ---------- */
function createSemester() {
  semCounter++;
  const id = semCounter;
  const sect = document.createElement('section');
  sect.className = 'semester';
  sect.dataset.id = id;

  sect.innerHTML = `
    <div class="header">
      <div class="title">Semester ${id}</div>
      <div class="controls">
        <div style="display:flex;flex-direction:column;align-items:flex-end;margin-right:6px">
          <div style="font-size:12px;color:var(--muted)">Weighted</div>
          <div class="toggle-switch" role="switch" aria-checked="false" tabindex="0" data-toggle><div class="knob"></div></div>
        </div>
        <button class="circle" data-action="delete-sem" title="Delete semester">×</button>
      </div>
    </div>

    <div class="rows" id="rows-${id}"></div>

    <div class="sem-footer">
      <div class="sem-footer-left">
        <span class="sem-gpa-label">Semester GPA:</span>
        <span id="sem-gpa-${id}" class="sem-gpa-value">0.00</span>
        <button class="add-course-btn" data-action="add-course">+ Add Course</button>
      </div>
      <div></div>
    </div>
  `;

  container.appendChild(sect);

  // initial 4 placeholder rows
  for (let i = 0; i < 4; i++) addCourse(id);

  // event wiring
  sect.querySelector('[data-action="add-course"]').addEventListener('click', () => addCourse(id));
  sect.querySelector('[data-action="delete-sem"]').addEventListener('click', () => { deleteSemester(id); });

  const toggle = sect.querySelector('[data-toggle]');
  toggle.addEventListener('click', () => {
    toggle.classList.toggle('on');
    toggle.setAttribute('aria-checked', toggle.classList.contains('on') ? 'true' : 'false');
    setWeightsEnabled(id, toggle.classList.contains('on'));
    updateAll();
  });
  toggle.addEventListener('keydown', e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle.click(); } });

  attachGaugeToNewest();
  updateAll();
}

function deleteSemester(id) {
  const node = container.querySelector(`.semester[data-id='${id}']`);
  if (node) node.remove();
  attachGaugeToNewest();
  updateAll();
}

function addCourse(semId) {
  const rows = document.getElementById(`rows-${semId}`);
  if (!rows) return;
  const r = document.createElement('div');
  r.className = 'row';

  // build grade options (A+ ... F)
  const gradeOptions = GRADES.map(g => `<option value="${g.value}">${g.label}</option>`).join('');

  r.innerHTML = `
    <input type="text" placeholder="Course name" />
    <select class="grade"><option value="" disabled selected>Grade</option>${gradeOptions}</select>
    <input type="number" class="credits" placeholder="Credits" min="0" />
    <select class="weight" disabled>
      <option value="0">Regular</option>
      <option value="0.5">Honors</option>
      <option value="1">AP/IB</option>
      <option value="0.25">College</option>
    </select>
    <button class="circle" data-action="delete-course" title="Delete course">×</button>
  `;

  rows.appendChild(r);

  // listeners
  r.querySelector('.grade').addEventListener('input', updateAll);
  r.querySelector('.credits').addEventListener('input', updateAll);
  r.querySelector('.weight').addEventListener('change', updateAll);
  r.querySelector('[data-action="delete-course"]').addEventListener('click', () => { r.remove(); updateAll(); });

  // enable/disable weight based on semester toggle
  const sem = container.querySelector(`.semester[data-id='${semId}']`);
  const isOn = sem && sem.querySelector('[data-toggle]').classList.contains('on');
  setWeightsEnabled(semId, isOn);
}

function setWeightsEnabled(semId, enabled) {
  const sem = container.querySelector(`.semester[data-id='${semId}']`);
  if (!sem) return;
  sem.querySelectorAll('.weight').forEach(s => s.disabled = !enabled);
}

/* ---------- Gauge attachment & rendering ---------- */
function attachGaugeToNewest() {
  const sems = Array.from(container.querySelectorAll('.semester'));
  if (sems.length === 0) {
    gaugeTemplate.style.display = 'none';
    gaugeTemplate.setAttribute('aria-hidden', 'true');
    const inBubble = gaugeTemplate.querySelector('.gpa-value');
    if (inBubble) inBubble.remove();
    return;
  }

  // move template into newest semester
  const newest = sems[sems.length - 1];
  newest.appendChild(gaugeTemplate);
  gaugeTemplate.style.display = 'flex';
  gaugeTemplate.style.position = 'absolute';
  gaugeTemplate.style.right = '18px';
  gaugeTemplate.style.bottom = '8px';
  gaugeTemplate.setAttribute('aria-hidden', 'false');

  // ensure only one internal numeric node (inside bubble)
  const oldVal = gaugeTemplate.querySelector('.gpa-value');
  if (oldVal) oldVal.remove();

  const valNode = document.createElement('div');
  valNode.className = 'gpa-value';
  valNode.innerHTML = `<div class="val">0.00</div><div class="muted">Cumulative GPA</div>`;
  gaugeTemplate.appendChild(valNode);
}

function updateAll() {
  let totalQ = 0, totalC = 0;
  container.querySelectorAll('.semester').forEach(sem => {
    let semQ = 0, semC = 0;
    const weighted = sem.querySelector('[data-toggle]')?.classList.contains('on');
    sem.querySelectorAll('.row').forEach(row => {
      const gv = row.querySelector('.grade').value;
      const cv = row.querySelector('.credits').value;
      const wv = parseFloat(row.querySelector('.weight').value) || 0;
      const g = gv === '' ? NaN : parseFloat(gv);
      const c = cv === '' ? NaN : parseFloat(cv);
      if (!isNaN(g) && !isNaN(c) && c > 0) {
        const eff = weighted ? Math.min(5, g + wv) : g;
        semQ += eff * c;
        semC += c;
      }
    });
    const sg = semC ? (semQ / semC).toFixed(2) : '0.00';
    const semGEl = sem.querySelector(`#sem-gpa-${sem.dataset.id}`);
    if (semGEl) semGEl.textContent = sg;
    totalQ += semQ; totalC += semC;
  });

  const cumulative = totalC ? (totalQ / totalC) : 0;
  renderGauge(cumulative);
}

/* ---------- Draw & animate gauge (visual range still 0..4.0) ---------- */
function renderGauge(cumulative) {
  const svg = gaugeTemplate.querySelector('svg');
  if (!svg || gaugeTemplate.style.display === 'none') return;

  const fg = svg.querySelector('.arc-fg');
  const bg = svg.querySelector('.arc-bg');
  const t0 = svg.querySelector('.tick0');
  const t4 = svg.querySelector('.tick4');

  // set tick label to 4.0 (visual scale)
  t4.textContent = '4.0';

  // background arc: full
  bg.setAttribute('d', describeArc(ARC_CX, ARC_CY, ARC_R, ARC_START, ARC_END));
  bg.setAttribute('class', 'arc-bg');

  // compute displayed ratio using 4.0 max (cap display at 4.0)
  const displayedRatio = Math.min(cumulative, 4) / 4;
  const targetAngle = ARC_START + (ARC_END - ARC_START) * displayedRatio;

  // animate arc smoothly
  let current = fg._angle !== undefined ? fg._angle : ARC_START;
  const step = () => {
    current = current + (targetAngle - current) * 0.18;
    fg.setAttribute('d', describeArc(ARC_CX, ARC_CY, ARC_R, ARC_START, current));
    fg._angle = current;
    if (Math.abs(current - targetAngle) > 0.02) requestAnimationFrame(step);
  };
  step();

  // ticks positions
  const p0 = polar(ARC_CX, ARC_CY, ARC_R, ARC_START);
  const p4 = polar(ARC_CX, ARC_CY, ARC_R, ARC_END);
  if (t0) { t0.setAttribute('x', (p0.x - 6).toFixed(2)); t0.setAttribute('y', (p0.y + 4).toFixed(2)); }
  if (t4) { t4.setAttribute('x', (p4.x - 6).toFixed(2)); t4.setAttribute('y', (p4.y + 4).toFixed(2)); }

  // update numeric text inside the bubble with true cumulative (can be >4)
  const valNode = document.querySelector('.semester:last-child #gaugeTemplate .gpa-value .val') ||
    gaugeTemplate.querySelector('.gpa-value .val') ||
    document.querySelector('.semester:last-child .gpa-value .val');

  // fallback that always finds the bubble text
  const bubbleVal = gaugeTemplate.querySelector('.gpa-value .val') || document.querySelector('.gpa-value .val');
  if (bubbleVal) bubbleVal.textContent = cumulative.toFixed(2);
}

/* ---------- Init ---------- */
document.getElementById('addSemester').addEventListener('click', createSemester);
createSemester();
