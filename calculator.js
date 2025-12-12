/* =======================
      CONSTANTS
======================= */
const gradeValues = {
    "A+": 4.0, "A": 4.0, "A-": 3.7,
    "B+": 3.3, "B": 3.0, "B-": 2.7,
    "C+": 2.3, "C": 2.0, "C-": 1.7,
    "D+": 1.3, "D": 1.0, "F": 0.0
};

const weightValues = {
    "None": 0,
    "Honors": 0.5,
    "AP/IB": 1
};

let semesterCount = 0;

/* =======================
  LOCAL STORAGE SAVE/LOAD
======================= */

function saveState() {
    const data = {
        dark: document.body.classList.contains("dark"),
        semesters: []
    };

    document.querySelectorAll(".semester").forEach(sem => {
        const s = {
            weighted: sem.querySelector(".weight-toggle").checked,
            courses: []
        };

        sem.querySelectorAll("tbody tr").forEach(row => {
            s.courses.push({
                name: row.querySelector(".name").value,
                grade: row.querySelector(".grade").value,
                credits: row.querySelector(".credits").value,
                weight: row.querySelector(".weight").value
            });
        });

        data.semesters.push(s);
    });

    localStorage.setItem("gpaSoftDark", JSON.stringify(data));
}

function loadState() {
    const saved = localStorage.getItem("gpaSoftDark");
    if (!saved) {
        addSemester();
        return;
    }

    const data = JSON.parse(saved);

    if (data.dark) {
        document.body.classList.add("dark");
        document.getElementById("dark-toggle").checked = true;
    }

    data.semesters.forEach(s => {
        const sem = addSemester();
        sem.querySelector(".weight-toggle").checked = s.weighted;

        const list = sem.querySelector(".course-list");
        list.innerHTML = "";

        s.courses.forEach(c => {
            const row = addCourse(sem);
            row.querySelector(".name").value = c.name;
            row.querySelector(".grade").value = c.grade;
            row.querySelector(".credits").value = c.credits;
            row.querySelector(".weight").value = c.weight;
        });
    });

    calculateAll();
}

/* =======================
    ADD SEMESTERS/COURSES
======================= */

function addSemester() {
    semesterCount++;

    const sem = document.createElement("div");
    sem.className = "semester";

    sem.innerHTML = `
        <h2>Semester ${semesterCount}</h2>

        <div class="toggle-weight">
            Weighted
            <input type="checkbox" class="weight-toggle">
        </div>

        <table>
            <thead>
                <tr>
                    <th>Course name</th>
                    <th>Grade</th>
                    <th>Credits</th>
                    <th>Weight</th>
                    <th></th>
                </tr>
            </thead>
            <tbody class="course-list"></tbody>
        </table>

        <button class="add-course-btn">➕ Add Course</button>
        <div class="gpa-line">Semester GPA: <span class="semester-gpa">0.00</span></div>
    `;

    document.getElementById("semesters").appendChild(sem);

    sem.querySelector(".add-course-btn").onclick = () => {
        addCourse(sem);
        saveState();
    };

    sem.querySelector(".weight-toggle").onchange = () => {
        calculateAll();
        saveState();
    };

    for (let i = 0; i < 4; i++) addCourse(sem);

    return sem;
}

function addCourse(sem) {
    const row = document.createElement("tr");

    row.innerHTML = `
        <td><input class="name" type="text"></td>
        <td>
            <select class="grade">
                <option></option>
                ${Object.keys(gradeValues).map(g => `<option>${g}</option>`).join("")}
            </select>
        </td>
        <td><input class="credits" type="number" step="0.5"></td>
        <td>
            <select class="weight">
                ${Object.keys(weightValues).map(w => `<option>${w}</option>`).join("")}
            </select>
        </td>
        <td><span class="remove-course">✖</span></td>
    `;

    sem.querySelector(".course-list").appendChild(row);

    row.querySelectorAll("input,select").forEach(el => {
        el.addEventListener("input", () => {
            calculateAll();
            saveState();
        });
    });

    row.querySelector(".remove-course").onclick = () => {
        row.remove();
        calculateAll();
        saveState();
    };

    return row;
}

/* =======================
         ANIMATION
======================= */

function animateRing(gpa) {
    const circle = document.querySelector(".ring");
    const total = 440;
    const percent = Math.min(gpa / 4, 1);
    const offset = total * (1 - percent);

    circle.style.transition = "stroke-dashoffset 1s ease";
    circle.style.strokeDashoffset = offset;
}

/* =======================
         CALCULATIONS
======================= */

function calculateAll() {
    let tPts = 0, tCts = 0;

    document.querySelectorAll(".semester").forEach(sem => {
        let pts = 0, cts = 0;
        const weighted = sem.querySelector(".weight-toggle").checked;

        sem.querySelectorAll("tbody tr").forEach(row => {
            const g = row.querySelector(".grade").value;
            const c = parseFloat(row.querySelector(".credits").value);
            const w = row.querySelector(".weight").value;

            if (g && c) {
                const base = gradeValues[g];
                const bonus = weighted ? weightValues[w] : 0;
                pts += (base + bonus) * c;
                cts += c;
            }
        });

        const semGPA = cts ? pts / cts : 0;
        sem.querySelector(".semester-gpa").textContent = semGPA.toFixed(2);

        tPts += pts;
        tCts += cts;
    });

    const cgpa = tCts ? tPts / tCts : 0;

    document.getElementById("cumulative-gpa").textContent = cgpa.toFixed(2);
    animateRing(cgpa);
}

/* =======================
         DARK MODE
======================= */

document.getElementById("dark-toggle").onchange = e => {
    document.body.classList.toggle("dark", e.target.checked);
    saveState();
};

/* =======================
         INIT APP
======================= */

document.getElementById("add-semester").onclick = () => {
    addSemester();
    saveState();
};

loadState();
