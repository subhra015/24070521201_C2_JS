// ─── Data Store ───
let history = [];

// ─── Grading Logic (Control Structures) ───
function getGrade(avg) {
    // if-else control structure for grade determination
    if (avg >= 90) {
        return { grade: 'A', colorClass: 'grade-A', desc: 'Outstanding' };
    } else if (avg >= 80) {
        return { grade: 'B', colorClass: 'grade-B', desc: 'Good' };
    } else if (avg >= 70) {
        return { grade: 'C', colorClass: 'grade-C', desc: 'Average' };
    } else if (avg >= 60) {
        return { grade: 'D', colorClass: 'grade-D', desc: 'Below Average' };
    } else {
        return { grade: 'F', colorClass: 'grade-F', desc: 'Fail' };
    }
}

function getBarColor(avg) {
    // Conditional expression for bar color
    if (avg >= 90) return '#1a7f37';
    if (avg >= 80) return '#0969da';
    if (avg >= 70) return '#9a6700';
    if (avg >= 60) return '#cf222e';
    return '#6e7781';
}

// ─── Form Validation ───
function validate() {
    let valid = true;

    const name = document.getElementById('studentName').value.trim();
    const id = document.getElementById('studentId').value.trim();
    const math = document.getElementById('math').value;
    const science = document.getElementById('science').value;
    const english = document.getElementById('english').value;
    const historyM = document.getElementById('history').value;

    // ─── Name Validation ───
    const nameEl = document.getElementById('studentName');
    const errName = document.getElementById('errName');
    if (name.length < 2) {
        nameEl.classList.add('error');
        errName.classList.add('show');
        valid = false;
    } else {
        nameEl.classList.remove('error');
        errName.classList.remove('show');
    }

    // ─── ID Validation ───
    const idEl = document.getElementById('studentId');
    const errId = document.getElementById('errId');
    if (id.length < 4) {
        idEl.classList.add('error');
        errId.classList.add('show');
        valid = false;
    } else {
        idEl.classList.remove('error');
        errId.classList.remove('show');
    }

    // ─── Mark Validation Helper ───
    function validateMark(val, elId, errId) {
        const el = document.getElementById(elId);
        const err = document.getElementById(errId);
        const num = parseFloat(val);

        // Check empty, NaN, or out of range (0-100)
        if (val === '' || isNaN(num) || num < 0 || num > 100) {
            el.classList.add('error');
            err.classList.add('show');
            return false;
        }
        el.classList.remove('error');
        err.classList.remove('show');
        return true;
    }

    // Validate all subject marks
    valid = validateMark(math, 'math', 'errMath') && valid;
    valid = validateMark(science, 'science', 'errScience') && valid;
    valid = validateMark(english, 'english', 'errEnglish') && valid;
    valid = validateMark(historyM, 'history', 'errHistory') && valid;

    return valid;
}

// ─── Live Error Clearing ───
const inputIds = ['studentName', 'studentId', 'math', 'science', 'english', 'history'];

inputIds.forEach(id => {
    document.getElementById(id).addEventListener('input', function() {
        this.classList.remove('error');
        const errId = 'err' + id.charAt(0).toUpperCase() + id.slice(1);
        const errEl = document.getElementById(errId);
        if (errEl) errEl.classList.remove('show');
    });
});

// ─── Calculate & Display Grade ───
function calculateGrade() {
    // Validate first - return if invalid
    if (!validate()) {
        return;
    }

    // Get all input values
    const name = document.getElementById('studentName').value.trim();
    const id = document.getElementById('studentId').value.trim();
    const math = parseFloat(document.getElementById('math').value);
    const science = parseFloat(document.getElementById('science').value);
    const english = parseFloat(document.getElementById('english').value);
    const historyM = parseFloat(document.getElementById('history').value);

    // Calculate statistics
    const marks = [math, science, english, historyM];
    const total = marks.reduce((a, b) => a + b, 0);  // Array reduce
    const avg = total / marks.length;
    const best = Math.max(...marks);  // Spread operator with Math.max
    const gradeInfo = getGrade(avg);

    // ─── Update Result Card ───
    document.getElementById('resName').textContent = name;
    document.getElementById('resId').textContent = 'ID: ' + id;

    const badge = document.getElementById('gradeBadge');
    badge.textContent = gradeInfo.grade;
    badge.className = 'grade-badge ' + gradeInfo.colorClass;

    document.getElementById('avgScoreText').textContent = avg.toFixed(1) + '%';
    document.getElementById('statTotal').textContent = total;
    document.getElementById('statAvg').textContent = avg.toFixed(1);
    document.getElementById('statBest').textContent = best;

    // Animate score bar
    const barFill = document.getElementById('scoreBarFill');
    barFill.style.width = '0%';
    barFill.style.background = getBarColor(avg);
    setTimeout(() => {
        barFill.style.width = avg + '%';
    }, 50);

    // Highlight active grade on scale
    const grades = ['A', 'B', 'C', 'D', 'F'];
    grades.forEach(g => {
        document.getElementById('scale' + g).classList.remove('active');
    });
    document.getElementById('scale' + gradeInfo.grade).classList.add('active');

    // Show result card
    document.getElementById('resultCard').classList.add('show');

    // ─── Add to History ───
    history.unshift({
        name: name,
        id: id,
        avg: avg.toFixed(1),
        grade: gradeInfo.grade,
        desc: gradeInfo.desc,
        colorClass: gradeInfo.colorClass,
        passed: avg >= 60
    });

    renderHistory();
}

// ─── History Management ───
function renderHistory() {
    const tbody = document.getElementById('historyBody');
    const section = document.getElementById('historySection');

    if (history.length === 0) {
        section.classList.remove('show');
        return;
    }

    section.classList.add('show');
    tbody.innerHTML = '';

    // Loop through history array
    history.forEach((entry) => {
        const tr = document.createElement('tr');
        const statusColor = entry.passed ? '#1a7f37' : '#cf222e';
        const statusText = entry.passed ? 'Pass' : 'Fail';
        
        tr.innerHTML = `
            <td>
                <strong style="color:#1a1a1a">${entry.name}</strong><br>
                <small style="color:#888">${entry.id}</small>
            </td>
            <td>${entry.avg}%</td>
            <td>
                <span class="history-grade" style="background:${getTint(entry.colorClass)};color:${getTextColor(entry.colorClass)}">
                    ${entry.grade}
                </span>
            </td>
            <td>
                <span style="color:${statusColor};font-weight:600;font-size:12px;">
                    ${statusText}
                </span>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// ─── Helper Functions ───
function getTint(cls) {
    const map = {
        'grade-A': 'rgba(26, 127, 55, 0.12)',
        'grade-B': 'rgba(9, 105, 218, 0.12)',
        'grade-C': 'rgba(154, 103, 0, 0.12)',
        'grade-D': 'rgba(207, 34, 46, 0.12)',
        'grade-F': 'rgba(110, 119, 129, 0.12)'
    };
    return map[cls] || 'transparent';
}

function getTextColor(cls) {
    const map = {
        'grade-A': '#1a7f37',
        'grade-B': '#0969da',
        'grade-C': '#9a6700',
        'grade-D': '#cf222e',
        'grade-F': '#6e7781'
    };
    return map[cls] || 'inherit';
}

function clearHistory() {
    history = [];
    renderHistory();
}