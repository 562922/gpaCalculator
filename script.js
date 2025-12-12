/* ---- Constants ---- */
const ARC_START = 225;
const ARC_END = 315;
const R = 90;

/* ---- Arc math ---- */
function polarToCartesian(cx, cy, r, angle) {
  const rad = (angle - 90) * Math.PI / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArc = (endAngle - startAngle) <= 180 ? 0 : 1;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

/* ---- Dark Mode ---- */
document.getElementById("darkToggle").onclick = () => {
  document.body.classList.toggle("dark");
  document.getElementById("darkToggle").classList.toggle("active");
};

/* ---- Semester Creation ---- */
let semesterCount = 0;

function createSemester() {
  semesterCount++;
  const sem = document.createElement("div");
  sem.className = "semester-card";
  sem.dataset.id = semesterCount;

  sem.innerHTML = `
      <div class="sem-header">
        <h2>Semester ${semesterCount}</h2>
        <div class="sem-weight-toggle">
          <span style="font-size:16px;">Weighted</span>
          <div class="weight-switch"></div>
        </div>
        <div class="close-btn sem-delete">
          <svg viewBox="0 0 16 16" stroke-width="2" fill="none" stroke-linecap="round">
            <line x1="4" y1="4" x2="12" y2="12" />
            <line x1="12" y1="4" x2="4" y2="12" />
          </svg>
        </div>
      </div>

      <div class="table">
        ${[1, 2, 3, 4].map(() => `
          <div class="table-row">
            <div class="col name">Course name</div>
            <div class="col grade">Grade 
              <svg width="12" height="12">
                <path d="M2 4 L6 8 L10 4" stroke="var(--subtle)" fill="none" stroke-width="2"/>
              </svg>
            </div>
            <div class="col credits">Credits</div>
            <div class="col weight">Weight
              <svg width="12" height="12">
                <path d="M2 4 L6 8 L10 4" stroke="var(--subtle)" fill="none" stroke-width="2"/>
              </svg>
            </div>
            <div class="close-btn row-delete">
              <svg viewBox="0 0 16 16" stroke-width="2" fill="none" stroke-linecap="round">
                <line x1="4" y1="4" x2="12" y2="12"/>
                <line x1="12" y1="4" x2="4" y2="12"/>
              </svg>
            </div>
          </div>
        `).join('')}
      </div>

      <div class="sem-footer">
        <span>Semester ${semesterCount} GPA: <strong class="sem-gpa">0.00</strong></span>
        <div class="add-course-btn">
          <svg width="14" height="14" stroke="var(--blue)" fill="none" stroke-width="2">
            <line x1="7" y1="2" x2="7" y2="12" />
            <line x1="2" y1="7" x2="12" y2="7" />
          </svg>
          Add Course
        </div>
      </div>

      <div class="gpa-bubble">
        <svg viewBox="0 0 210 210">
          <path id="arc-bg" stroke="var(--gpa-bg-arc)" stroke-width="14" fill="none" stroke-linecap="round"></path>
          <path id="arc-fg" stroke="var(--gpa-arc)" stroke-width="14" fill="none" stroke-linecap="round"></path>
        </svg>
        <div class="gpa-value">0.00</div>
        <div class="gpa-label">Cumulative GPA</div>
        <div class="tick left">0.0</div>
        <div class="tick right">4.0</div>
      </div>
    `;

  document.getElementById("semContainer").appendChild(sem);
  updateArc(0);
}

/* ---- GPA Arc Update ---- */
function updateArc(gpa) {
  const capped = Math.max(0, Math.min(4, gpa));
  const ratio = capped / 4;
  const angle = ARC_START + ratio * (ARC_END - ARC_START);

  const bg = document.querySelector(".gpa-bubble #arc-bg");
  const fg = document.querySelector(".gpa-bubble #arc-fg");

  bg.setAttribute("d", describeArc(105, 105, R, ARC_START, ARC_END));
  fg.setAttribute("d", describeArc(105, 105, R, ARC_START, angle));

  document.querySelector(".gpa-value").textContent = capped.toFixed(2);
}

/* ---- Init ---- */
document.getElementById("addSemester").onclick = createSemester;

createSemester();
updateArc(0);
