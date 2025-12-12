const ARC_START = 225, ARC_END = 315, ARC_CX = 70, ARC_CY = 70, ARC_R = 48;
let semCounter = 0;
const container = document.getElementById('semesters');
const gaugeTemplate = document.getElementById('gaugeTemplate');

// Dark mode toggle
const darkToggle = document.getElementById('darkModeToggle');
darkToggle.addEventListener('click', () => {
  darkToggle.classList.toggle('on');
  document.body.classList.toggle('dark');
});

// Helpers for arc
function polar(cx, cy, r, deg) {
  const rad = (deg - 90) * Math.PI / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}
function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polar(cx, cy, endAngle);
  const end = polar(cx, cy, startAngle);
  const largeArc = (endAngle - startAngle + 360) % 360 > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

// Semester creation
function createSemester() {
  semCounter++;
  const id = semCounter;
  const section = document.createElement('section');
  section.className = 'semester';
  section.dataset.id = id;
  section.innerHTML = `
    <div class="header">
      <div class="title">Semester ${id}</div>
      <div class="controls">
        <div style="display:flex;flex-direction:column;align-items:flex-end;margin-right:6px">
          <div style="font-size:12px;color:#55606b">Weighted</div>
          <div class="toggle-switch" role="switch" aria-checked="false" tabindex="0" data-toggle>
            <div class="knob"></div>
          </div>
        </div>
        <button class="circle" data-action="delete-sem" title="Delete semester">×</button>
      </div>
    </div>
    <div class="rows" id="rows-${id}"></div>
    <div class="footer">
      <div>Semester GPA: <strong id="sem-gpa-${id}">0.00</strong></div>
      <div style="display:flex;gap:10px;align-items:center">
        <button class="add-btn" data-action="add-course">+ Add Course</button>
      </div>
    </div>`;
  container.appendChild(section);

  for (let i = 0; i < 4; i++) addCourse(id);

  // Add event listeners
  section.querySelector('[data-action="add-course"]').addEventListener('click', () => addCourse(id));
  section.querySelector('[data-action="delete-sem"]').addEventListener('click', () => deleteSemester(id));

  const toggle = section.querySelector('[data-toggle]');
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
  const r = document.createElement('div');
  r.className = 'row';
  r.innerHTML = `
    <input type="text" placeholder="Course name" />
    <select class="grade"><option value="" disabled selected>Grade</option>
      <option value="4">A</option><option value="3">B</option>
      <option value="2">C</option><option value="1">D</option>
      <option value="0">F</option>
    </select>
    <input type="number" class="credits" placeholder="Credits" min="0" />
    <select class="weight" disabled>
      <option value="0">Regular</option>
      <option value="0.5">Honors</option>
      <option value="1">AP/IB</option>
      <option value="0.25">College</option>
    </select>
    <button class="circle" data-action="delete-course">×</button>`;
  rows.appendChild(r);

  r.querySelector('.grade').addEventListener('input', updateAll);
  r.querySelector('.credits').addEventListener('input', updateAll);
  r.querySelector('.weight').addEventListener('change', updateAll);
  r.querySelector('[data-action="delete-course"]').addEventListener('click', () => { r.remove(); updateAll(); });

  const sem = container.querySelector(`.semester[data-id='${semId}']`);
  const isOn = sem.querySelector('[data-toggle]').classList.contains('on');
  setWeightsEnabled(semId, isOn);
}

function setWeightsEnabled(semId, enabled) {
  const sem = container.querySelector(`.semester[data-id='${semId}']`);
  sem.querySelectorAll('.weight').forEach(s => s.disabled = !enabled);
}

function attachGaugeToNewest() {
  const sems = container.querySelectorAll('.semester');
  if (sems.length === 0) { gaugeTemplate.style.display = 'none'; return; }
  const last = sems[sems.length - 1];
  last.appendChild(gaugeTemplate);
  gaugeTemplate.style.display = 'block';
  // Add numeric GPA
  document.querySelectorAll('.gpa-value').forEach(n => n.remove());
  const valNode = document.createElement('div');
  valNode.className = 'gpa-value';
  valNode.innerHTML = `<div class="val">0.00</div><div class="muted">Cumulative GPA</div>`;
  last.appendChild(valNode);
}

function updateAll() {
  let totalQ = 0, totalC = 0;
  container.querySelectorAll('.semester').forEach(sem => {
    let semQ = 0, semC = 0;
    const weighted = sem.querySelector('[data-toggle]').classList.contains('on');
    sem.querySelectorAll('.row').forEach(r => {
      const g = parseFloat(r.querySelector('.grade').value);
      const c = parseFloat(r.querySelector('.credits').value);
      const w = parseFloat(r.querySelector('.weight').value) || 0;
      if (!isNaN(g) && !isNaN(c) && c > 0) {
        semQ += weighted ? Math.min(4, g + w) * c : g * c;
        semC += c;
      }
    });
    const sg = semC ? (semQ / semC).toFixed(2) : '0.00';
    sem.querySelector(`#sem-gpa-${sem.dataset.id}`).textContent = sg;
    totalQ += semQ; totalC += semC;
  });
  const cumulative = totalC ? (totalQ / totalC) : 0;
  renderGauge(cumulative);
}

// Render gauge with animation
function renderGauge(gpa) {
  const svg = gaugeTemplate.querySelector('svg');
  const fg = svg.querySelector('.arc-fg');
  const bg = svg.querySelector('.arc-bg');
  const t0 = svg.querySelector('.tick0');
  const t4 = svg.querySelector('.tick4');

  const ratio = Math.max(0, Math.min(1, gpa / 4));
  const angle = ARC_START + (ARC_END - ARC_START) * ratio;

  const oldD = fg.getAttribute('d') || describeArc(ARC_CX, ARC_CY, ARC_R, ARC_START, ARC_START);
  const newD = describeArc(ARC_CX, ARC_CY, ARC_R, ARC_START, angle);

  // Animate via simple tween
  let start = 0, steps = 20;
  const startAngle = parseFloat(oldD.split(' ')[1]) || ARC_START;
  function animate() {
    start++;
    const interp = start / steps;
    const midAngle = ARC_START + (angle - ARC_START) * interp;
    fg.setAttribute('d', describeArc(ARC_CX, ARC_CY, ARC_R, ARC_START, midAngle));
    if (start < steps) requestAnimationFrame(animate);
  }
  animate();

  bg.setAttribute('d', describeArc(ARC_CX, ARC_CY, ARC_R, ARC_START, ARC_END));

  const p0 = polar(ARC_CX, ARC_CY, ARC_R, ARC_START);
  const p4 = polar(ARC_CX, ARC_CY, ARC_R, ARC_END);
  t0.setAttribute('x', p0.x - 6); t0.setAttribute('y', p0.y + 4);
  t4.setAttribute('x', p4.x - 6); t4.setAttribute('y', p4.y + 4);

  const valNode = document.querySelector('.semester:last-child .gpa-value .val');
  if (valNode) valNode.textContent = gpa.toFixed(2);
}

document.getElementById('addSemester').addEventListener('click', createSemester);
createSemester();
