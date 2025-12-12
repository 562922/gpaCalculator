/* Helpers for arc drawing (SVG A command). We'll draw clockwise (sweep-flag=1). */
function polar(cx, cy, r, deg) {
    const rad = (deg - 90) * Math.PI / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}
function arcPath(cx, cy, r, startDeg, endDeg) {
    // normalize to 0-360
    startDeg = ((startDeg % 360) + 360) % 360;
    endDeg = ((endDeg % 360) + 360) % 360;
    const start = polar(cx, cy, r, startDeg);
    const end = polar(cx, cy, r, endDeg);
    // compute delta in positive direction
    const delta = (endDeg - startDeg + 360) % 360;
    const largeArc = (delta > 180) ? 1 : 0;
    const sweep = 1; // 1 = clockwise (positive-angle direction)
    return `M ${start.x.toFixed(3)} ${start.y.toFixed(3)} A ${r} ${r} 0 ${largeArc} ${sweep} ${end.x.toFixed(3)} ${end.y.toFixed(3)}`;
}

const ARC_START = 125, ARC_END = 315; // mapping 0.0 => 125deg, 4.0 => 315deg
const ARC_CX = 70, ARC_CY = 70, ARC_R = 48;

let semCounter = 0;
const container = document.getElementById('semesters');
const gaugeTemplate = document.getElementById('gaugeTemplate');

/* Create a semester block with independent weighted toggle and controls */
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
          <div class="toggle" role="switch" aria-checked="false" tabindex="0" data-toggle>
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
    </div>
  `;

    container.appendChild(section);

    // add 4 placeholder courses
    for (let i = 0; i < 4; i++) addCourse(id);

    // wire controls
    section.querySelector('[data-action="add-course"]').addEventListener('click', () => addCourse(id));
    section.querySelector('[data-action="delete-sem"]').addEventListener('click', () => deleteSemester(id));

    const toggle = section.querySelector('[data-toggle]');
    toggle.addEventListener('click', () => {
        toggle.classList.toggle('on');
        toggle.setAttribute('aria-checked', toggle.classList.contains('on') ? 'true' : 'false');
        setWeightsEnabledForSemester(id, toggle.classList.contains('on'));
        updateAll();
    });
    // allow keyboard toggle (space/enter)
    toggle.addEventListener('keydown', (e) => {
        if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle.click(); }
    });

    // attach/move gauge to newest semester
    attachGaugeToNewest();
    updateAll();
}

/* Delete semester by id */
function deleteSemester(id) {
    const node = container.querySelector(`.semester[data-id='${id}']`);
    if (node) node.remove();
    attachGaugeToNewest();
    updateAll();
}

/* Add a course row to a given semester */
function addCourse(semId) {
    const rows = document.getElementById(`rows-${semId}`);
    if (!rows) return;
    const r = document.createElement('div');
    r.className = 'row';
    r.innerHTML = `
    <input type="text" placeholder="Course name" />
    <select class="grade"><option value="" selected disabled>Grade</option><option value="4">A</option><option value="3">B</option><option value="2">C</option><option value="1">D</option><option value="0">F</option></select>
    <input type="number" class="credits" placeholder="Credits" min="0" />
    <select class="weight" disabled><option value="0">Regular</option><option value="0.5">Honors</option><option value="1">AP/IB</option><option value="0.25">College</option></select>
    <button class="circle" title="Delete course" data-action="delete-course">×</button>
  `;
    rows.appendChild(r);

    // events
    r.querySelector('.grade').addEventListener('input', updateAll);
    r.querySelector('.credits').addEventListener('input', updateAll);
    r.querySelector('.weight').addEventListener('change', updateAll);
    r.querySelector('[data-action="delete-course"]').addEventListener('click', () => { r.remove(); updateAll(); });

    // enable/disable weight depending on semester toggle
    const sem = container.querySelector(`.semester[data-id='${semId}']`);
    const isOn = sem && sem.querySelector('[data-toggle]').classList.contains('on');
    setWeightsEnabledForSemester(semId, isOn);
}

/* Enable/disable weight selects in a semester */
function setWeightsEnabledForSemester(semId, enabled) {
    const sem = container.querySelector(`.semester[data-id='${semId}']`);
    if (!sem) return;
    sem.querySelectorAll('.weight').forEach(s => {
        s.disabled = !enabled;
        if (!enabled) s.setAttribute('aria-disabled', 'true'); else s.removeAttribute('aria-disabled');
    });
}

/* Attach the single gauge template to the newest semester (or hide if none) */
function attachGaugeToNewest() {
    const sems = Array.from(container.querySelectorAll('.semester'));
    // hide template first
    if (!gaugeTemplate) return;
    gaugeTemplate.style.display = 'none';
    gaugeTemplate.setAttribute('aria-hidden', 'true');
    // remove any existing numeric nodes appended to older semesters
    container.querySelectorAll('.gpa-value').forEach(n => n.remove());
    if (sems.length === 0) return;
    const last = sems[sems.length - 1];
    last.appendChild(gaugeTemplate); // moves it
    gaugeTemplate.style.display = 'block';
    gaugeTemplate.setAttribute('aria-hidden', 'false');

    // numeric node inside newest semester
    const val = document.createElement('div');
    val.className = 'gpa-value';
    val.innerHTML = `<div class="val">0.00</div><div class="muted">Cumulative GPA</div>`;
    last.appendChild(val);
}

/* Compute per-semester and cumulative GPAs and render gauge */
function updateAll() {
    let totalQuality = 0, totalCredits = 0;
    const sems = Array.from(container.querySelectorAll('.semester'));
    sems.forEach(sem => {
        const id = sem.dataset.id;
        let semQuality = 0, semCredits = 0;
        const weightedOn = sem.querySelector('[data-toggle]').classList.contains('on');
        sem.querySelectorAll('.row').forEach(row => {
            const gv = row.querySelector('.grade').value;
            const cv = row.querySelector('.credits').value;
            const wv = parseFloat(row.querySelector('.weight').value) || 0;
            const g = gv === '' ? NaN : parseFloat(gv);
            const c = cv === '' ? NaN : parseFloat(cv);
            if (!isNaN(g) && !isNaN(c) && c > 0) {
                const eff = Math.min(4, weightedOn ? g + wv : g);
                semQuality += eff * c; semCredits += c;
            }
        });
        const sg = semCredits ? (semQuality / semCredits).toFixed(2) : '0.00';
        const semGEl = sem.querySelector(`#sem-gpa-${id}`);
        if (semGEl) semGEl.textContent = sg;
        totalQuality += semQuality; totalCredits += semCredits;
    });

    const cumulative = totalCredits ? (totalQuality / totalCredits) : 0;
    renderGauge(cumulative);
}

/* Render the gauge in the template (attached to newest semester if present) */
function renderGauge(cumulative) {
    // ensure template present
    const svg = gaugeTemplate.querySelector('.gauge-svg');
    if (!svg || gaugeTemplate.style.display === 'none') return;
    const bg = svg.querySelector('.arc-bg');
    const fg = svg.querySelector('.arc-fg');
    const t0 = svg.querySelector('.tick0');
    const t4 = svg.querySelector('.tick4');

    // background arc: always full from ARC_START to ARC_END (clockwise)
    const bgPath = arcPath(ARC_CX, ARC_CY, ARC_R, ARC_START, ARC_END);
    bg.setAttribute('d', bgPath);

    // foreground from start to mapped angle
    const pct = Math.max(0, Math.min(1, cumulative / 4));
    const angle = ARC_START + (ARC_END - ARC_START) * pct; // linear mapping
    const fgPath = arcPath(ARC_CX, ARC_CY, ARC_R, ARC_START, angle);
    fg.setAttribute('d', fgPath);

    // position small tick labels
    const p0 = polar(ARC_CX, ARC_CY, ARC_R, ARC_START);
    const p4 = polar(ARC_CX, ARC_CY, ARC_R, ARC_END);
    t0.setAttribute('x', (p0.x - 6).toFixed(2)); t0.setAttribute('y', (p0.y + 4).toFixed(2));
    t4.setAttribute('x', (p4.x - 6).toFixed(2)); t4.setAttribute('y', (p4.y + 4).toFixed(2));

    // numeric update inside newest semester's .gpa-value
    const valNode = container.querySelector('.semester:last-child .gpa-value .val');
    if (valNode) valNode.textContent = cumulative.toFixed(2);
}

/* Wiring and initialization */
document.getElementById('addSemester').addEventListener('click', createSemester);

// start with a single semester
createSemester();

// some inputs don't emit 'input' for number step changes, but we already attached listeners on row creation.
// use interval to recalc as a safety net
setInterval(updateAll, 600);