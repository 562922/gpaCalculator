const GRADES = [
  { label: 'A+', value: 4 }, { label: 'A', value: 4 }, { label: 'A-', value: 3.7 },
  { label: 'B+', value: 3.3 }, { label: 'B', value: 3 }, { label: 'B-', value: 2.7 },
  { label: 'C+', value: 2.3 }, { label: 'C', value: 2 }, { label: 'C-', value: 1.7 },
  { label: 'D+', value: 1.3 }, { label: 'D', value: 1 }, { label: 'D-', value: 0.7 },
  { label: 'F', value: 0 }
];

function addCourse(semId) {
  const rows = document.getElementById(`rows-${semId}`);
  const r = document.createElement('div');
  r.className = 'row';
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

// The rest of the functions (renderGauge, updateAll, etc.) remain the same as before, 
// now the gauge is wrapped in `.gauge-wrap` with border, correct position, and numeric GPA inside the module.
