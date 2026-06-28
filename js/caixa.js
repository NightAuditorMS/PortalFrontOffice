import './common.js';
import { getTranslation } from './lang.js';
import { getSavedProgress, saveProgress } from './storage.js';

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

let isLoaded = false;

// Dynamic Vouchers and Paidouts row creators
function addValeRow(val = 0, just = '', dept = '', resp = '', date = '') {
  const tbody = $('#bodyVales');
  if (!tbody) return;
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td><input type="number" class="dyn-val cash-input form-input" step="0.01" value="${val}" style="margin:0;"></td>
    <td><input type="text" class="dyn-just form-input" placeholder="..." value="${just}" style="margin:0;"></td>
    <td><input type="text" class="dyn-dept form-input" placeholder="..." value="${dept}" style="margin:0;"></td>
    <td><input type="text" class="dyn-resp form-input" placeholder="..." value="${resp}" style="margin:0;"></td>
    <td><input type="date" class="dyn-date form-input" value="${date}" style="margin:0;"></td>
    <td><button class="help-btn btn-delete-row" type="button" style="border-color:#ff5757; color:#ff5757; margin:0; font-size:12px;">X</button></td>
  `;
  tbody.appendChild(tr);

  tr.querySelector('.btn-delete-row').addEventListener('click', () => {
    tr.remove();
    calculateTotalCaixa();
  });
}

function addPaidoutRow(val = 0, just = '', room = '', resp = '', date = '') {
  const tbody = $('#bodyPaidouts');
  if (!tbody) return;
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td><input type="number" class="dyn-val cash-input form-input" step="0.01" value="${val}" style="margin:0;"></td>
    <td><input type="text" class="dyn-just form-input" placeholder="..." value="${just}" style="margin:0;"></td>
    <td><input type="text" class="dyn-room form-input" placeholder="..." value="${room}" style="margin:0;"></td>
    <td><input type="text" class="dyn-resp form-input" placeholder="..." value="${resp}" style="margin:0;"></td>
    <td><input type="date" class="dyn-date form-input" value="${date}" style="margin:0;"></td>
    <td><button class="help-btn btn-delete-row" type="button" style="border-color:#ff5757; color:#ff5757; margin:0; font-size:12px;">X</button></td>
  `;
  tbody.appendChild(tr);

  tr.querySelector('.btn-delete-row').addEventListener('click', () => {
    tr.remove();
    calculateTotalCaixa();
  });
}

// Math calculator function
function calculateTotalCaixa() {
  let totalNotas = 0, totalMoedas = 0, totalVales = 0, totalPaidouts = 0;

  // Notes subtotal
  $$('#tableNotas tbody tr').forEach(tr => {
    const input = tr.querySelector('.cash-input');
    const rowDisplay = tr.querySelector('.row-total');
    if (input) {
      const val = parseFloat(input.value) || 0;
      const mult = parseFloat(input.dataset.value) || 0;
      const sub = val * mult;
      if (rowDisplay) rowDisplay.innerText = sub.toFixed(2) + '€';
      totalNotas += sub;
    }
  });

  // Coins subtotal
  $$('#tableMoedas tbody tr').forEach(tr => {
    const input = tr.querySelector('.cash-input');
    const rowDisplay = tr.querySelector('.row-total');
    if (input) {
      const val = parseFloat(input.value) || 0;
      const mult = parseFloat(input.dataset.value) || 0;
      const sub = val * mult;
      if (rowDisplay) rowDisplay.innerText = sub.toFixed(2) + '€';
      totalMoedas += sub;
    }
  });

  // Dynamic Vouchers subtotal
  $$('#bodyVales tr').forEach(tr => {
    const input = tr.querySelector('.dyn-val');
    if (input) {
      totalVales += parseFloat(input.value) || 0;
    }
  });

  // Dynamic Paidouts subtotal
  $$('#bodyPaidouts tr').forEach(tr => {
    const input = tr.querySelector('.dyn-val');
    if (input) {
      totalPaidouts += parseFloat(input.value) || 0;
    }
  });

  $('#totalNotasSum').innerText = totalNotas.toFixed(2) + '€';
  $('#totalMoedasSum').innerText = totalMoedas.toFixed(2) + '€';
  $('#totalValesSum').innerText = totalVales.toFixed(2) + '€';
  $('#totalPaidoutsSum').innerText = totalPaidouts.toFixed(2) + '€';

  const totalDocs = totalVales + totalPaidouts;
  $('#totalDocsSum').innerText = totalDocs.toFixed(2) + '€';

  const totalEspecie = totalNotas + totalMoedas;
  const totalGeral = totalEspecie + totalDocs;
  const fundoCaixa = 750.00;
  const montanteRecebido = parseFloat($('#montanteRecebidoDia').value) || 0;

  const depositoCalculado = totalGeral - fundoCaixa;
  const diferenca = depositoCalculado - montanteRecebido;

  $('#totalGeralCaixa').innerText = totalGeral.toFixed(2);

  const elDeposito = $('#depositoDiaCalculado');
  const elDepositoEuro = $('#depositoDiaEuro');
  const lang = localStorage.getItem('portal-lang') || 'pt';

  if (depositoCalculado < 0) {
    elDeposito.innerText = '-';
    elDeposito.style.color = 'var(--gold)';
    if (elDepositoEuro) elDepositoEuro.style.display = 'none';
  } else {
    elDeposito.innerText = depositoCalculado.toFixed(2);
    if (elDepositoEuro) elDepositoEuro.style.display = 'inline';
    
    // Condição verde: Total espécie - paidouts + montante recebido > 750.00
    const condicaoVerde = (totalEspecie - totalPaidouts + montanteRecebido) > 750.00;
    if (condicaoVerde) {
      elDeposito.style.color = '#27ae60'; // Success green
    } else {
      elDeposito.style.color = 'var(--gold)';
    }
  }

  const resDiferenca = $('#diferencaCaixa');
  if (diferenca < -0.005) {
    resDiferenca.innerText = diferenca.toFixed(2) + '€';
    resDiferenca.style.color = '#ff5757';
  } else {
    resDiferenca.innerText = '-';
    resDiferenca.style.color = 'var(--gold)';
  }

  const statusMsg = $('#statusCaixaMsg');
  if (Math.abs(diferenca) < 0.01 && depositoCalculado > 0) {
    statusMsg.innerText = getTranslation(lang, 'cash_status_ok') || "Tudo certo!";
    statusMsg.style.color = "#27ae60";
  } else if (diferenca < -0.01) {
    statusMsg.innerText = getTranslation(lang, 'cash_status_discrepancy') || "Inconsistência na contagem";
    statusMsg.style.color = "#ff5757";
  } else {
    statusMsg.innerText = "";
  }

  saveCurrentProgress(totalGeral.toFixed(2), depositoCalculado < 0 ? '-' : depositoCalculado.toFixed(2), diferenca < -0.005 ? diferenca.toFixed(2) + '€' : '-');
}

function saveCurrentProgress(totalGeral, deposito, diferenca) {
  const cashData = {
    inputs: $$('.cash-input:not(.dyn-val)').map(i => ({ val: i.value })),
    vales: $$('#bodyVales tr').map(tr => ({
      val: tr.querySelector('.dyn-val').value,
      just: tr.querySelector('.dyn-just').value,
      dept: tr.querySelector('.dyn-dept').value,
      resp: tr.querySelector('.dyn-resp').value,
      date: tr.querySelector('.dyn-date').value
    })),
    paidouts: $$('#bodyPaidouts tr').map(tr => ({
      val: tr.querySelector('.dyn-val').value,
      just: tr.querySelector('.dyn-just').value,
      room: tr.querySelector('.dyn-room').value,
      resp: tr.querySelector('.dyn-resp').value,
      date: tr.querySelector('.dyn-date').value
    })),
    meta: {
      tAtual: $('#cashTurnoAtual').value,
      rAtual: $('#cashRececionistaAtual').value,
      tProx: $('#cashTurnoProximo').value,
      rProx: $('#cashRececionistaProximo').value,
      recebido: $('#montanteRecebidoDia').value
    },
    calculatedTotalGeral: totalGeral,
    calculatedDeposito: deposito,
    calculatedDiferenca: diferenca
  };

  saveProgress({
    cash: cashData
  });
}

function initCaixa() {
  const p = getSavedProgress();
  const cash = p.cash || {};

  // Restore fields
  if (cash.meta) {
    if (cash.meta.tAtual) $('#cashTurnoAtual').value = cash.meta.tAtual;
    const rEl = $('#cashRececionistaAtual');
    if (rEl && cash.meta.rAtual) rEl.value = cash.meta.rAtual;
    
    const tPEl = $('#cashTurnoProximo');
    if (tPEl && cash.meta.tProx) tPEl.value = cash.meta.tProx;
    
    const rPEl = $('#cashRececionistaProximo');
    if (rPEl && cash.meta.rProx) rPEl.value = cash.meta.rProx;

    const sysEl = $('#montanteRecebidoDia');
    if (sysEl && cash.meta.recebido != null) sysEl.value = cash.meta.recebido;
  }

  // Restore quantities
  const inputs = $$('.cash-input:not(.dyn-val)');
  if (cash.inputs) {
    cash.inputs.forEach((item, i) => {
      if (inputs[i]) inputs[i].value = item.val;
    });
  }

  // Restore rows
  if (cash.vales) {
    cash.vales.forEach(v => {
      addValeRow(v.val, v.just, v.dept, v.resp, v.date);
    });
  }

  if (cash.paidouts) {
    cash.paidouts.forEach(p => {
      addPaidoutRow(p.val, p.just, p.room, p.resp, p.date);
    });
  }

  calculateTotalCaixa();
}

// Click bindings
$('#btnAddVale').addEventListener('click', () => {
  const today = new Date().toISOString().split('T')[0];
  addValeRow(0, '', '', '', today);
  calculateTotalCaixa();
});

$('#btnAddPaidout').addEventListener('click', () => {
  const today = new Date().toISOString().split('T')[0];
  addPaidoutRow(0, '', '', '', today);
  calculateTotalCaixa();
});

// Auto-save listeners
document.addEventListener('input', e => {
  if (!isLoaded) return;
  if (e.target.closest('.card') && e.target.matches('input, select')) {
    calculateTotalCaixa();
  }
});

document.addEventListener('change', e => {
  if (!isLoaded) return;
  if (e.target.closest('.card') && e.target.matches('input, select')) {
    calculateTotalCaixa();
  }
});

document.addEventListener('languageChanged', () => {
  if (!isLoaded) return;
  calculateTotalCaixa();
});

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  initCaixa();
  isLoaded = true;
});
