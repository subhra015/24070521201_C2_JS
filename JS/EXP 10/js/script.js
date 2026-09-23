/* ============================================================
   Student Data Loader
   Demonstrates loading JSON via fetch() and $.getJSON(),
   then rendering the results dynamically into a table.
   ============================================================ */

// ---------- DOM references ----------
const tableBody = document.getElementById('tableBody');
const statusEl = document.getElementById('status');
const btnFetch = document.getElementById('btnFetch');
const btnJQuery = document.getElementById('btnJQuery');
const btnClear = document.getElementById('btnClear');

// ---------- Helper: update status message ----------
function setStatus(message, type = 'info') {
  statusEl.textContent = message;
  statusEl.className = 'status'; // reset
  if (type === 'success') statusEl.classList.add('success');
  else if (type === 'error') statusEl.classList.add('error');
  else if (type === 'loading') statusEl.classList.add('loading');
}

// ---------- Helper: clear table to placeholder ----------
function clearTable() {
  tableBody.innerHTML = `
    <tr>
      <td colspan="7" class="empty">No data loaded yet.</td>
    </tr>
  `;
  setStatus('Table cleared. Click a button to load data.');
}

// ---------- Core render function ----------
function renderStudents(students) {
  if (!Array.isArray(students) || students.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="empty">No student records found.</td>
      </tr>
    `;
    setStatus('JSON loaded but no records found.', 'error');
    return;
  }

  // Build table rows
  const rows = students
    .map((student, index) => {
      const isPass = student.marks >= 40;
      const resultBadge = isPass
        ? '<span class="badge badge-pass">Pass</span>'
        : '<span class="badge badge-fail">Fail</span>';

      return `
        <tr>
          <td>${index + 1}</td>
          <td><strong>${student.name}</strong></td>
          <td>${student.course}</td>
          <td>${student.semester}</td>
          <td>${student.marks}</td>
          <td>${student.city}</td>
          <td>${resultBadge}</td>
        </tr>
      `;
    })
    .join('');

  tableBody.innerHTML = rows;
  setStatus(`✅ Successfully loaded ${students.length} student record(s).`, 'success');
}

// ============================================================
// 1️⃣  Load using native fetch() API
// ============================================================
async function loadWithFetch() {
  setStatus('⏳ Loading data with fetch()…', 'loading');
  tableBody.innerHTML = `<tr><td colspan="7" class="empty">Loading…</td></tr>`;

  try {
    const response = await fetch('data/students.json');

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    renderStudents(data);
  } catch (error) {
    console.error('fetch() error:', error);
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="empty">Failed to load data.</td>
      </tr>
    `;
    setStatus(`❌ fetch() failed: ${error.message}`, 'error');
  }
}

// ============================================================
// 2️⃣  Load using jQuery $.getJSON()
// ============================================================
function loadWithJQuery() {
  setStatus('⏳ Loading data with $.getJSON()…', 'loading');
  tableBody.innerHTML = `<tr><td colspan="7" class="empty">Loading…</td></tr>`;

  $.getJSON('data/students.json')
    .done(function (data) {
      renderStudents(data);
    })
    .fail(function (jqXHR, textStatus, errorThrown) {
      console.error('$.getJSON() error:', textStatus, errorThrown);
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" class="empty">Failed to load data.</td>
        </tr>
      `;
      setStatus(`❌ $.getJSON() failed: ${textStatus} – ${errorThrown}`, 'error');
    });
}

// ============================================================
// Event listeners
// ============================================================
btnFetch.addEventListener('click', loadWithFetch);
btnJQuery.addEventListener('click', loadWithJQuery);
btnClear.addEventListener('click', clearTable);

// Set initial status
setStatus('Click a button to load the data…');