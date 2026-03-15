const STORAGE_KEY = 'licne-finansije-transakcije';

function getTransactions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveTransactions(arr) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
}

function setToday(el) {
  const d = new Date();
  el.value = d.toISOString().slice(0, 10);
}

function setCurrentMonth(el) {
  const d = new Date();
  el.value = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
}

function setCurrentYear(el) {
  el.value = new Date().getFullYear();
}

const amountEl = document.getElementById('amount');
const typeEl = document.getElementById('type');
const dateEl = document.getElementById('date');
const descEl = document.getElementById('description');
const addBtn = document.getElementById('addBtn');
const filterDay = document.getElementById('filter-day');
const filterMonth = document.getElementById('filter-month');
const filterYear = document.getElementById('filter-year');

setToday(dateEl);
setToday(filterDay);
setCurrentMonth(filterMonth);
setCurrentYear(filterYear);

addBtn.addEventListener('click', () => {
  const amount = parseFloat(amountEl.value);
  if (!amount || amount <= 0) return;
  const type = typeEl.value;
  const date = dateEl.value;
  const description = (descEl.value || '').trim() || (type === 'prihod' ? 'Prihod' : 'Trošak');
  const list = getTransactions();
  list.push({
    id: Date.now(),
    amount: type === 'trošak' ? -amount : amount,
    type,
    date,
    description
  });
  saveTransactions(list);
  amountEl.value = '';
  descEl.value = '';
  setToday(dateEl);
  refreshAll();
});

function formatMoney(n) {
  return new Intl.NumberFormat('sr-RS', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

function renderSummary(containerId, prihod, trosak) {
  const el = document.getElementById(containerId);
  const bilans = prihod - Math.abs(trosak);
  el.innerHTML = `
    <div class="box prihod"><div class="value">${formatMoney(prihod)}</div><div class="label">Prihod</div></div>
    <div class="box trošak"><div class="value">${formatMoney(Math.abs(trosak))}</div><div class="label">Trošak</div></div>
    <div class="box bilans"><div class="value">${formatMoney(bilans)}</div><div class="label">Bilans</div></div>
  `;
}

function renderList(listElId, emptyElId, items) {
  const listEl = document.getElementById(listElId);
  const emptyEl = document.getElementById(emptyElId);
  if (!items.length) {
    listEl.innerHTML = '';
    emptyEl.style.display = 'block';
    return;
  }
  emptyEl.style.display = 'none';
  listEl.innerHTML = items
    .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)
    .map(t => `
      <li>
        <span class="date">${t.date}</span>
        <span class="desc" title="${escapeHtml(t.description)}">${escapeHtml(t.description)}</span>
        <span class="amount ${t.amount >= 0 ? 'income' : 'expense'}">${t.amount >= 0 ? '+' : ''}${formatMoney(t.amount)}</span>
      </li>
    `).join('');
}

function escapeHtml(s) {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

function refreshDaily() {
  const day = filterDay.value;
  const list = getTransactions().filter(t => t.date === day);
  const prihod = list.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const trosak = list.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0);
  renderSummary('daily-summary', prihod, trosak);
  renderList('list-daily', 'empty-daily', list);
}

function refreshMonthly() {
  const month = filterMonth.value;
  if (!month) return;
  const [y, m] = month.split('-').map(Number);
  const list = getTransactions().filter(t => {
    const [ty, tm] = t.date.split('-').map(Number);
    return ty === y && tm === m;
  });
  const prihod = list.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const trosak = list.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0);
  renderSummary('monthly-summary', prihod, trosak);
  renderList('list-monthly', 'empty-monthly', list);
}

function refreshYearly() {
  const year = parseInt(filterYear.value, 10);
  if (!year) return;
  const list = getTransactions().filter(t => t.date.startsWith(String(year)));
  const prihod = list.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const trosak = list.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0);
  renderSummary('yearly-summary', prihod, trosak);
  renderList('list-yearly', 'empty-yearly', list);
}

function refreshAll() {
  refreshDaily();
  refreshMonthly();
  refreshYearly();
}

filterDay.addEventListener('change', refreshDaily);
filterMonth.addEventListener('change', refreshMonthly);
filterYear.addEventListener('input', refreshYearly);
filterYear.addEventListener('change', refreshYearly);

document.querySelectorAll('.tabs button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tabs button').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('panel-' + btn.dataset.tab).classList.add('active');
  });
});

refreshAll();
