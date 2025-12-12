const gradeToGPA = {
    'A+': 4.0, 'A': 4.0, 'A-': 3.7,
    'B+': 3.3, 'B': 3.0, 'B-': 2.7,
    'C+': 2.3, 'C': 2.0, 'C-': 1.7,
    'D+': 1.3, 'D': 1.0, 'D-': 0.7,
    'F': 0.0
};

const rigorMultiplier = {
    'Regular': 1.0,
    'Honors': 1.0,
    'AP': 1.1,
    'IB': 1.1
};

let semesters = [];

function addSemester() {
    semesters.push({ id: Date.now(), courses: [] });
    render();
}

function removeSemester(index) {
    semesters.splice(index, 1);
    render();
}

function addCourse(semesterIndex) {
    semesters[semesterIndex].courses.push({
        id: Date.now(),
        grade: 'A',
        credits: 3,
        rigor: 'Regular'
    });
    render();
}

function removeCourse(semesterIndex, courseIndex) {
    semesters[semesterIndex].courses.splice(courseIndex, 1);
    render();
}

function updateCourse(semesterIndex, courseIndex, field, value) {
    semesters[semesterIndex].courses[courseIndex][field] = value;
    render();
}

function calculateSemesterGPA(courses) {
    if (!courses.length) return 0;
    let totalPoints = 0, totalCredits = 0;
    courses.forEach(c => {
        const gpa = gradeToGPA[c.grade] * rigorMultiplier[c.rigor];
        totalPoints += gpa * parseFloat(c.credits);
        totalCredits += parseFloat(c.credits);
    });
    return (totalPoints / totalCredits).toFixed(2);
}

function calculateCumulativeGPA() {
    let totalPoints = 0, totalCredits = 0;
    semesters.forEach(sem => {
        sem.courses.forEach(c => {
            const gpa = gradeToGPA[c.grade] * rigorMultiplier[c.rigor];
            totalPoints += gpa * parseFloat(c.credits);
            totalCredits += parseFloat(c.credits);
        });
    });
    return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : 0;
}

function render() {
    const container = document.getElementById('semesterContainer');
    container.innerHTML = semesters.map((sem, sIdx) => `
                <div class="semester-section">
                    <div class="semester-header">
                        <h2>Semester ${sIdx + 1}</h2>
                        <button class="btn-remove" onclick="removeSemester(${sIdx})">Remove Semester</button>
                    </div>
                    <button class="add-course-btn" onclick="addCourse(${sIdx})">+ Add Course</button>
                    ${sem.courses.map((c, cIdx) => `
                        <div class="course">
                            <div class="form-group">
                                <label>Grade</label>
                                <select onchange="updateCourse(${sIdx}, ${cIdx}, 'grade', this.value)">
                                    ${Object.keys(gradeToGPA).map(g => `<option ${c.grade === g ? 'selected' : ''}>${g}</option>`).join('')}
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Credits</label>
                                <input type="number" min="0.5" step="0.5" value="${c.credits}" 
                                       onchange="updateCourse(${sIdx}, ${cIdx}, 'credits', this.value)">
                            </div>
                            <div class="form-group">
                                <label>Rigor Level</label>
                                <select onchange="updateCourse(${sIdx}, ${cIdx}, 'rigor', this.value)">
                                    ${Object.keys(rigorMultiplier).map(r => `<option ${c.rigor === r ? 'selected' : ''}>${r}</option>`).join('')}
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Weighted GPA</label>
                                <input type="text" readonly value="${(gradeToGPA[c.grade] * rigorMultiplier[c.rigor]).toFixed(2)}">
                            </div>
                            <button class="btn-remove" onclick="removeCourse(${sIdx}, ${cIdx})">Remove</button>
                        </div>
                    `).join('')}
                    <div class="semester-gpa">Semester GPA: ${calculateSemesterGPA(sem.courses)}</div>
                </div>
            `).join('');
    document.getElementById('cumulativeGPA').textContent = calculateCumulativeGPA();
}

addSemester();