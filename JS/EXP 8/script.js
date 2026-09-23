/* ============================= script.js ============================= */

/* =========================================================
   1. ELEMENTS
   ========================================================= */
const form   = document.getElementById('gymForm');
const result = document.getElementById('result');
const toast  = document.getElementById('toast');

const elHeight = document.getElementById('height');
const elWeight = document.getElementById('weight');
const elAge    = document.getElementById('age');
const elGender = document.getElementById('gender');

const bmiEmpty = document.getElementById('bmiEmpty');
const bmiBody  = document.getElementById('bmiBody');

const touched   = new Set();   // fields the user has blurred at least once
let   submitted = false;       // has the form been submitted at least once?

/* =========================================================
   2. VALIDATION RULES  (one function per field → error string)
   ========================================================= */
const NAME_RE  = /^[A-Za-z][A-Za-z .'-]*$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;

function numRule(label, min, max, unit){
  return v => {
    if (v.trim() === '')            return `${label} is required.`;
    const n = Number(v);
    if (!Number.isFinite(n))        return `${label} must be a number.`;
    if (n < min || n > max)         return `${label} must be between ${min} and ${max} ${unit}.`;
    return '';
  };
}

const RULES = {
  fullName: v => {
    v = v.trim();
    if (!v)               return 'Full name is required.';
    if (v.length < 3)     return 'Enter at least 3 characters.';
    if (!NAME_RE.test(v)) return "Only letters, spaces, . ' and - are allowed.";
    return '';
  },

  email: v => {
    v = v.trim();
    if (!v)                return 'Email is required.';
    if (!EMAIL_RE.test(v)) return 'Enter a valid email, e.g. you@mail.com';
    return '';
  },

  phone: v => {
    const d = v.replace(/[\s()-]/g, '');
    if (!d)                  return 'Mobile number is required.';
    if (!/^\d{10}$/.test(d)) return 'Enter exactly 10 digits (no country code).';
    return '';
  },

  age: v => {
    if (v.trim() === '')      return 'Age is required.';
    const n = Number(v);
    if (!Number.isInteger(n)) return 'Age must be a whole number.';
    if (n < 12 || n > 90)     return 'Age must be between 12 and 90.';
    return '';
  },

  gender: v => v ? '' : 'Please select an option.',

  height: numRule('Height', 90, 250, 'cm'),
  weight: numRule('Weight', 25, 300, 'kg'),

  plan: v => v ? '' : 'Please choose a membership plan.',

  emergencyName: v => {
    v = v.trim();
    if (!v)               return 'Emergency contact name is required.';
    if (v.length < 3)     return 'Enter at least 3 characters.';
    if (!NAME_RE.test(v)) return "Only letters, spaces, . ' and - are allowed.";
    return '';
  },

  emergencyPhone: v => {
    const d   = v.replace(/[\s()-]/g, '');
    const own = document.getElementById('phone').value.replace(/\D/g, '');
    if (!d)                  return 'Emergency contact number is required.';
    if (!/^\d{10}$/.test(d)) return 'Enter exactly 10 digits.';
    if (d === own)           return 'Must be different from your own number.';
    return '';
  },

  terms: (v, el) => el.checked ? '' : 'You must accept the terms to continue.'
};

/* =========================================================
   3. PAINT THE UI FOR ONE FIELD
   ========================================================= */
function paint(el, msg){
  const field = el.closest('.field');
  if (!field) return;

  const msgEl    = field.querySelector('.msg');
  const hasValue = el.type === 'checkbox' ? el.checked : el.value.trim() !== '';
  const reveal   = touched.has(el.name) || submitted || hasValue; // live errors once content exists

  const showErr = !!msg && reveal;
  const showOk  = !msg && hasValue;

  field.classList.toggle('invalid', showErr);
  field.classList.toggle('valid',   showOk);

  if (msgEl) msgEl.textContent = showErr ? msg : '';
  el.setAttribute('aria-invalid', showErr ? 'true' : 'false');
}

function validateEl(el){
  const rule = RULES[el.name];
  if (!rule) return true;
  const msg = rule(el.value, el);
  paint(el, msg);
  return msg === '';
}

/* =========================================================
   4. EVENTS  →  live input, blur, change, submit, reset
   ========================================================= */

/* -- live as the user types --------------------------------- */
form.addEventListener('input', e => {
  const el = e.target;
  if (!el.name || !RULES[el.name]) return;

  // soft input filtering for phone fields
  if (el.name === 'phone' || el.name === 'emergencyPhone'){
    const cleaned = el.value.replace(/[^\d\s()-]/g, '');
    if (cleaned !== el.value) el.value = cleaned;

    // re-check own-number rule when either phone changes
    const other = el.name === 'phone'
      ? document.getElementById('emergencyPhone')
      : document.getElementById('phone');
    if (other.value.trim() !== '') validateEl(other);
  }

  validateEl(el);

  // any metric change recalculates BMI in real time
  if (['height','weight','age','gender'].includes(el.name)) updateBMI();
});

/* -- select / checkbox changes ------------------------------ */
form.addEventListener('change', e => {
  const el = e.target;
  if (!el.name || !RULES[el.name]) return;
  validateEl(el);
  if (['height','weight','age','gender'].includes(el.name)) updateBMI();
});

/* -- on blur: mark as touched so errors become visible ------ */
form.addEventListener('focusout', e => {
  const el = e.target;
  if (!el.name || !RULES[el.name]) return;
  touched.add(el.name);
  validateEl(el);
});

/* -- submit -------------------------------------------------- */
form.addEventListener('submit', e => {
  e.preventDefault();
  submitted = true;

  let firstBad = null;
  form.querySelectorAll('[name]').forEach(el => {
    if (!RULES[el.name]) return;
    touched.add(el.name);
    if (!validateEl(el) && !firstBad) firstBad = el;
  });

  updateBMI();

  if (firstBad){
    firstBad.focus();
    firstBad.scrollIntoView({ behavior:'smooth', block:'center' });
    showToast('⚠ Please fix the highlighted fields.', false);
    return;
  }

  const data = collectData();

  // ---- this is the "uploaded" payload (replace with fetch POST) ----
  console.log('%c📤 Payload uploaded to server:', 'color:#ff6b2c;font-weight:bold', data);

  result.hidden = false;
  result.innerHTML = `
    <h3>✅ Welcome aboard, ${esc(data.fullName.split(' ')[0])}!</h3>
    <ul>
      <li>Plan: <b>${esc(data.plan)}</b></li>
      <li>Age / Gender: <b>${data.age} yrs · ${esc(data.gender)}</b></li>
      <li>Height / Weight: <b>${data.height} cm · ${data.weight} kg</b></li>
      <li>BMI: <b>${data.bmi}</b> — ${esc(data.bmiCategory)}</li>
      <li>Body Type: <b>${esc(data.bodyType)}</b></li>
      <li>Ideal Weight Range: <b>${data.idealWeight}</b></li>
      <li>BMR / Maintenance: <b>${data.bmr || '—'} / ${data.tdee || '—'} kcal</b></li>
    </ul>`;
  result.scrollIntoView({ behavior:'smooth', block:'nearest' });

  showToast('🎉 Admission form submitted successfully!', true);
  form.reset();
  resetState();
});

/* -- reset --------------------------------------------------- */
form.addEventListener('reset', () => {
  setTimeout(() => {
    resetState();
    result.hidden = true;
    result.innerHTML = '';
  }, 0);
});

function resetState(){
  touched.clear();
  submitted = false;
  form.querySelectorAll('.field').forEach(f => f.classList.remove('valid','invalid'));
  form.querySelectorAll('.msg').forEach(m => m.textContent = '');
  updateBMI();
}

/* =========================================================
   5. BMI / BODY TYPE ENGINE
   ========================================================= */
const BMI_MIN = 15, BMI_MAX = 35;   // scale bounds for the meter

function classify(bmi){
  if (bmi < 18.5) return {
    label:'Underweight', color:'#3b82f6',
    type:'Ectomorph', trend:'Lean / linear frame',
    note:'Naturally slim with a fast metabolism. Prioritise a calorie surplus, compound lifts and 6–8 g/kg carbs to build mass.'
  };
  if (bmi < 25) return {
    label:'Normal Weight', color:'#2ea043',
    type:'Mesomorph', trend:'Balanced / athletic frame',
    note:'Athletic, responsive build. Great base — you can cut or bulk efficiently. Maintain 3–5 sessions per week.'
  };
  if (bmi < 30) return {
    label:'Overweight', color:'#d29922',
    type:'Endomorph', trend:'Solid / stocky frame',
    note:'Stores fat more readily. Combine resistance training with 3× weekly cardio and a mild 300–500 kcal deficit.'
  };
  return {
    label:'Obese', color:'#f85149',
    type:'Endomorph (high)', trend:'Round / heavy frame',
    note:'Begin with low-impact cardio (cycling, swimming), mobility work and a supervised nutrition plan before intense training.'
  };
}

function updateBMI(){
  const h = parseFloat(elHeight.value);
  const w = parseFloat(elWeight.value);
  const a = parseInt(elAge.value, 10);
  const g = elGender.value;

  const okH = Number.isFinite(h) && h >= 90 && h <= 250;
  const okW = Number.isFinite(w) && w >= 25 && w <= 300;

  if (!okH || !okW){
    bmiEmpty.hidden = false;
    bmiBody.hidden  = true;
    return;
  }

  bmiEmpty.hidden = true;
  bmiBody.hidden  = false;

  const m   = h / 100;
  const bmi = w / (m * m);
  const c   = classify(bmi);

  /* --- number + badge --- */
  const bmiEl = document.getElementById('bmiNumber');
  bmiEl.textContent = bmi.toFixed(1);
  bmiEl.style.color = c.color;

  const badge = document.getElementById('bmiBadge');
  badge.textContent = c.label;
  badge.style.background = c.color + '22';
  badge.style.color = c.color;

  /* --- meter pin --- */
  const pct = Math.min(100, Math.max(0, ((bmi - BMI_MIN) / (BMI_MAX - BMI_MIN)) * 100));
  document.getElementById('meterPin').style.left = pct + '%';

  /* --- body type --- */
  document.getElementById('bodyType').textContent   = c.type;
  document.getElementById('frameTrend').textContent = c.trend;
  document.getElementById('bodyNote').textContent   = c.note;

  /* --- ideal weight range (BMI 18.5 – 24.9) --- */
  const low  = (18.5 * m * m).toFixed(1);
  const high = (24.9 * m * m).toFixed(1);
  document.getElementById('idealWeight').textContent = `${low} – ${high} kg`;

  /* --- BMI prime (BMI / 25) --- */
  document.getElementById('bmiPrime').textContent = (bmi / 25).toFixed(2);

  /* --- BMR (Mifflin-St Jeor) + maintenance --- */
  const bmrEl  = document.getElementById('bmr');
  const tdeeEl = document.getElementById('tdee');

  if (Number.isFinite(a) && a >= 12 && a <= 90 && g){
    let bmr = 10 * w + 6.25 * h - 5 * a;
    if (g === 'male')        bmr += 5;
    else if (g === 'female') bmr -= 161;
    else                     bmr -= 78;   // neutral average

    bmrEl.textContent  = Math.round(bmr).toLocaleString() + ' kcal';
    tdeeEl.textContent = Math.round(bmr * 1.375).toLocaleString() + ' kcal';
  } else {
    bmrEl.textContent  = '— need age & gender';
    tdeeEl.textContent = '—';
  }
}

/* =========================================================
   6. HELPERS
   ========================================================= */
function collectData(){
  const h = parseFloat(elHeight.value);
  const w = parseFloat(elWeight.value);
  const a = parseInt(elAge.value, 10);
  const g = elGender.value;
  const m = h / 100;
  const bmi = w / (m * m);
  const c = classify(bmi);

  let bmr = null;
  if (Number.isFinite(a) && g){
    bmr = 10 * w + 6.25 * h - 5 * a + (g === 'male' ? 5 : g === 'female' ? -161 : -78);
    bmr = Math.round(bmr);
  }

  return {
    fullName : document.getElementById('fullName').value.trim(),
    email    : document.getElementById('email').value.trim(),
    phone    : document.getElementById('phone').value.trim(),
    age      : a,
    gender   : g,
    height   : h,
    weight   : w,
    plan     : document.getElementById('plan').value,
    emergencyName  : document.getElementById('emergencyName').value.trim(),
    emergencyPhone : document.getElementById('emergencyPhone').value.trim(),
    bmi      : bmi.toFixed(1),
    bmiCategory : c.label,
    bodyType : c.type,
    idealWeight : `${(18.5*m*m).toFixed(1)} – ${(24.9*m*m).toFixed(1)} kg`,
    bmr      : bmr,
    tdee     : bmr ? Math.round(bmr * 1.375) : null,
    submittedAt : new Date().toISOString()
  };
}

function esc(s){
  return String(s).replace(/[&<>"']/g, ch => (
    { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]
  ));
}

let toastTimer;
function showToast(text, ok){
  toast.textContent = text;
  toast.classList.toggle('ok', !!ok);
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
}

/* initial paint */
updateBMI();