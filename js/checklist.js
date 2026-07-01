import './common.js';
import { getTranslation } from './lang.js';
import { getSavedProgress, saveProgress, storageKey, saveReportToHistory } from './storage.js';

// Selectors helper
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

let isLoaded = false;

// Load data when starting or restoring progress
let loadedTarefasData = null;

// Initial state load
async function initChecklist() {
  try {
    const res = await fetch('data/tarefas.json');
    if (!res.ok) throw new Error('Falha ao carregar tarefas.json');
    loadedTarefasData = await res.json();
  } catch (err) {
    console.error('Erro ao ler tarefas.json:', err);
  }

  // Restore form details if saved progress exists
  const progress = getSavedProgress();
  if (progress.turno) $('#turno').value = progress.turno;
  if (progress.auditorNome) $('#auditorNome').value = progress.auditorNome;
  if (progress.auditorData) $('#auditorData').value = progress.auditorData;
  if (progress.obsIniciais) $('#obsIniciais').value = progress.obsIniciais;
  if (progress.proto) $('#proto').value = progress.proto;
  if (progress.obsFinais) $('#obsFinais').value = progress.obsFinais;

  // Restore screen layout if started
  if (progress.tela2Visible) {
    await renderChecklist(progress.turno, true);
    // Apply checkboxes
    const cbs = getAllCheckboxes();
    if (progress.checks) {
      progress.checks.forEach((v, i) => {
        if (cbs[i]) cbs[i].checked = v;
      });
    }
    // Restore opened accordions
    if (progress.openPhases) {
      progress.openPhases.forEach(id => {
        const el = document.getElementById(id);
        const btn = document.querySelector(`.phase-btn[data-target="${id}"]`);
        if (el) el.style.display = 'block';
        if (btn) btn.setAttribute('aria-expanded', 'true');
      });
    }
    updateAllSectionToggles();
    updateProgressBar();
  } else {
    // Default the date picker to today if empty
    if (!$('#auditorData').value) {
      const today = new Date().toISOString().split('T')[0];
      $('#auditorData').value = today;
    }
  }

  // Update layout translation once fully loaded
  const lang = localStorage.getItem('portal-lang') || 'pt';
  applyScreenTranslations(lang);
}

// Helpers
function getChecklistItems() { return $$('#checklist-container .check-item'); }
function getAllCheckboxes(root = document) { return $$('input[type="checkbox"]:not(.section-toggle-all)', root); }
function isOptional(cb) { return cb.dataset.optional === 'true' || cb.dataset.sunday === 'true'; }
function clearWarnings() { getChecklistItems().forEach(li => li.classList.remove('unchecked-warning')); }

function updateProgressBar() {
  const cbs = getAllCheckboxes();
  if (cbs.length === 0) return;
  const checkedCount = cbs.filter(cb => cb.checked).length;
  const percentage = Math.round((checkedCount / cbs.length) * 100);
  const fill = document.getElementById('progress-bar-fill');
  const text = document.getElementById('progress-text');
  if (fill) fill.style.width = `${percentage}%`;
  if (text) {
    const lang = localStorage.getItem('portal-lang') || 'pt';
    text.textContent = lang === 'en' ? `${percentage}% Complete` : `${percentage}% Completo`;
  }
}

function getActiveDate() {
  let activeDate = new Date();
  const dateInput = $('#auditorData');
  if (dateInput && dateInput.value) {
    const parts = dateInput.value.split('-');
    if (parts.length === 3) {
      activeDate = new Date(parts[0], parts[1] - 1, parts[2]);
    }
  }
  return activeDate;
}

// Main Checklist Renderer
async function renderChecklist(turno, isRestore = false) {
  if (!loadedTarefasData) {
    const res = await fetch('data/tarefas.json');
    if (!res.ok) throw new Error('Falha ao carregar tarefas.json');
    loadedTarefasData = await res.json();
  }

  const container = document.getElementById('checklist-container');
  if (!container) return;

  const phases = loadedTarefasData[turno];
  if (!phases) return;

  const lang = localStorage.getItem('portal-lang') || 'pt';
  const activeDate = getActiveDate();
  const dayIndex = activeDate.getDay(); // 0 Sunday, 6 Saturday

  const dayNamesPt = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];
  const dayNamesEn = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

  const normalizeDay = (str) => {
    if (typeof str !== 'string') return '';
    return str.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace("-feira", "")
      .trim();
  };

  const matchesDay = (item, dayIdx) => {
    if (item.dias && Array.isArray(item.dias) && item.dias.length > 0) {
      const targetPt = normalizeDay(dayNamesPt[dayIdx]);
      const targetEn = normalizeDay(dayNamesEn[dayIdx]);
      return item.dias.some(d => {
        if (typeof d === 'number') return d === dayIdx;
        if (typeof d === 'string') {
          const normalized = normalizeDay(d);
          return normalized === targetPt || normalized === targetEn;
        }
        return false;
      });
    }
    return true;
  };

  let html = '';

  phases.forEach(phase => {
    // Translate Phase title if translation helper has it, else use default
    const phaseTitle = getTranslation(lang, phase.id) || phase.title;
    
    if (phase.title) {
      html += `<button class="phase-btn" type="button" data-target="${phase.id}" aria-expanded="false">${phaseTitle}</button>`;
      html += `<div id="${phase.id}" class="phase-content" style="display:none;">`;
      html += `<div class="section-tools"><label class="bulk-toggle"><input type="checkbox" class="section-toggle-all"> ${getTranslation(lang, 'check_all_section')}</label></div>`;
      if (phase.note) {
        html += `<p class="section-note">${phase.note}</p>`;
      }
    } else {
      html += `<div id="${phase.id}" class="checklist-continua">`;
      html += `<div class="section-tools"><label class="bulk-toggle"><input type="checkbox" class="section-toggle-all"> ${getTranslation(lang, 'check_all_section')}</label></div>`;
    }

    phase.sections.forEach(sec => {
      const hasRenderedItems = sec.items.some(item => matchesDay(item, dayIndex));
      if (!hasRenderedItems) return;

      const secTitle = getTranslation(lang, sec.title) || sec.title;
      if (sec.title) {
        if (phase.title) html += `<h3>${secTitle}</h3>`;
        else html += `<p class="section-header">${secTitle}</p>`;
      }
      
      html += `<ul>`;
      sec.items.forEach(item => {
        if (!matchesDay(item, dayIndex)) return;

        // Dynamic translation of item texts & helps
        let itemText = getTranslation(lang, item.text) || item.text;
        let itemHelp = item.help ? (getTranslation(lang, item.help) || item.help) : '';

        // Handle download link tasks
        if (item.type === 'download') {
          html += `<li class="download-links">`;
          html += `<a href="${item.url}" download target="_blank" rel="noopener noreferrer">${itemText}</a>`;
          html += `</li>`;
          return;
        }

        const isDayRestricted = item.dias && Array.isArray(item.dias) && item.dias.length > 0;
        const isOpt = item.optional || (item.sunday && !isDayRestricted);
        const optClass = isOpt ? ' optional-item' : '';
        html += `<li class="check-item${optClass}">`;

        html += `<button class="help-btn" type="button" aria-expanded="false" aria-label="Explanation">?</button>`;
        html += `<div class="check-wrap"><label class="check-label">`;

        const attrs = [];
        if (item.optional) attrs.push('data-optional="true"');
        if (item.sunday && !isDayRestricted) attrs.push('data-sunday="true"');

        html += `<input type="checkbox" ${attrs.join(' ')}>`;
        html += `<span class="item-text">${itemText}`;

        if (item.optional) {
          html += `<div class="optional-badge">${getTranslation(lang, 'badge_optional')}</div>`;
        } else if (isDayRestricted) {
          const dayStr = item.dias.map(d => {
            if (typeof d === 'number') return dayNamesPt[d];
            return d;
          }).map(name => getTranslation(lang, name) || name).join(', ');
          html += `<div class="optional-badge">${getTranslation(lang, 'badge_only_days')} ${dayStr}</div>`;
        } else if (item.sunday) {
          html += `<div class="optional-badge">${getTranslation(lang, 'badge_only_sunday')}</div>`;
        }
        if (itemHelp) html += `<div class="help-text">${itemHelp}</div>`;

        html += `</span></label></div></li>`;
      });
      html += `</ul>`;
    });

    if (phase.id === 'fase4') {
      html += `
        <div style="margin-top: 20px; padding: 15px; border: 1px solid var(--gold); border-radius: 8px; background: rgba(198,166,103,0.05);">
          <label for="proto" style="display: block; margin-bottom: 8px;"><strong>${getTranslation(lang, 'label_proto')}</strong></label>
          <input id="proto" type="text" placeholder="Ex.: MYS-2026-001" style="width: 100%; padding: 10px; border: 1px solid var(--border); border-radius: 4px; background: rgba(255,255,255,0.05); color: white;">
        </div>
      `;
    }

    html += `</div>`;
  });

  container.innerHTML = html;

  // Toggle visible elements
  $('#tela1').style.display = 'none';
  $('#tela2').style.display = 'block';

  // Apply titles & headers
  const shiftText = getTranslation(lang, 'shift_' + turno) || turno;
  $('#tituloTurnoAtivo').textContent = `${getTranslation(lang, 'nav_checklist')} — ${shiftText}`;
  
  const auditorName = $('#auditorNome').value;
  const dateVal = $('#auditorData').value;
  $('#labelInfoMeta').textContent = `${shiftText} | ${auditorName} | ${dateVal}`;



  updateProgressBar();
  if (!isRestore) {
    saveCurrentProgress();
  }
}

// Save & Load state bindings
function saveCurrentProgress() {
  const isTela2 = $('#tela2').style.display === 'block';
  saveProgress({
    turno: $('#turno').value,
    auditorNome: $('#auditorNome').value,
    auditorData: $('#auditorData').value,
    obsIniciais: $('#obsIniciais').value,
    proto: document.getElementById('proto')?.value || '',
    obsFinais: $('#obsFinais').value,
    tela2Visible: isTela2,
    checks: isTela2 ? getAllCheckboxes().map(cb => cb.checked) : [],
    openPhases: isTela2 ? Array.from(document.querySelectorAll('.phase-content'))
                           .filter(el => el.style.display === 'block')
                           .map(el => el.id) : []
  });
}

function updateSectionToggle(sec) {
  const master = $('.section-toggle-all', sec);
  if (!master) return;
  const items = $$('li.check-item input[type="checkbox"]', sec).filter(cb => cb.offsetParent !== null);
  const total = items.length;
  const checked = items.filter(cb => cb.checked).length;
  master.checked = total > 0 && checked === total;
  master.indeterminate = checked > 0 && checked < total;
}

function updateAllSectionToggles() {
  $$('.phase-content, .checklist-continua').forEach(updateSectionToggle);
}

// Event Bindings
$('#btnIniciarTurno').addEventListener('click', async () => {
  const turno = $('#turno').value;
  const nome = $('#auditorNome').value.trim();
  const data = $('#auditorData').value;

  const lang = localStorage.getItem('portal-lang') || 'pt';

  if (!turno || !nome || !data) {
    alert(getTranslation(lang, 'warn_fill_start'));
    return;
  }

  await renderChecklist(turno);
});

$('#btnReiniciar').addEventListener('click', () => {
  const lang = localStorage.getItem('portal-lang') || 'pt';
  if (!confirm(getTranslation(lang, 'confirm_reset_checklist'))) return;

  // Preserve cash counting details while resetting checklist details
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const d = JSON.parse(saved);
      localStorage.setItem(storageKey, JSON.stringify({ cash: d.cash }));
    }
  } catch (e) {}

  // Clear inputs
  $('#turno').value = '';
  $('#auditorNome').value = '';
  const today = new Date().toISOString().split('T')[0];
  $('#auditorData').value = today;
  $('#obsIniciais').value = '';
  $('#obsFinais').value = '';

  $('#tela2').style.display = 'none';
  $('#tela1').style.display = 'block';

  saveCurrentProgress();
});

$('#btnSubmeter').addEventListener('click', async () => {
  const lang = localStorage.getItem('portal-lang') || 'pt';
  const turno = $('#turno').value;
  const proto = document.getElementById('proto')?.value?.trim();

  if (turno === 'noite' && !proto) {
    alert(getTranslation(lang, 'warn_proto_required'));
    return;
  }

  // Clear warnings first
  clearWarnings();

  const cbs = getAllCheckboxes();
  let hasMissingMandatory = false;
  for (const cb of cbs) {
    if (!cb.checked && !isOptional(cb) && cb.offsetParent !== null) {
      const li = cb.closest('.check-item');
      li.classList.add('unchecked-warning');
      if (!hasMissingMandatory) {
        li.scrollIntoView({ behavior: 'smooth', block: 'center' });
        hasMissingMandatory = true;
      }
    }
  }

  if (hasMissingMandatory) {
    alert(getTranslation(lang, 'warn_mandatory_unchecked'));
    return;
  }

  if (confirm(getTranslation(lang, 'confirm_finish_shift'))) {
    await submitShiftProgress();
  }
});


// PDF and SharePoint Automate submit logic
async function submitShiftProgress() {
  const lang = localStorage.getItem('portal-lang') || 'pt';
  
  // Show loader visual indicator if necessary (here alert/reloads will guide)
  await gerarPDF();

  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const d = JSON.parse(saved);
      // Clean shift logs but carry over next cashier shift values
      if (d.cash && d.cash.meta) {
        d.cash.meta.tAtual = d.cash.meta.tProx || '';
        d.cash.meta.rAtual = d.cash.meta.rProx || '';
        d.cash.meta.tProx = '';
        d.cash.meta.rProx = '';
        d.cash.meta.recebido = '0';
      }
      d.turno = d.cash?.meta?.tAtual || '';
      d.auditorNome = d.cash?.meta?.rAtual || '';
      d.auditorData = '';
      d.obsIniciais = ''; d.proto = ''; d.obsFinais = '';
      d.checks = []; d.tela2Visible = false; d.openPhases = [];
      localStorage.setItem(storageKey, JSON.stringify(d));
    }
  } catch (e) {}

  location.reload();
}

async function gerarPDF() {
  const lang = localStorage.getItem('portal-lang') || 'pt';

  if (!window.jspdf?.jsPDF) {
    alert(getTranslation(lang, 'warn_pdf_lib_missing'));
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = 15;
  const margin = 10, pw = 190;

  function addLine(txt, size = 11, color = [0, 0, 0], gap = 6) {
    doc.setFontSize(size); doc.setTextColor(...color);
    const lines = doc.splitTextToSize(String(txt), pw);
    if (y + (lines.length * 5) > 285) { doc.addPage(); y = 15; }
    doc.text(lines, margin, y);
    y += Math.max(gap, lines.length * 5);
  }

  const turno = $('#turno').value || '';
  const shiftText = getTranslation(lang, 'shift_' + turno) || turno;
  const auditor = $('#auditorNome').value || 'Rececionista';
  const data = $('#auditorData').value || 'N/A';
  const proto = document.getElementById('proto')?.value || 'N/A';
  const obsIni = $('#obsIniciais').value || 'N/A';
  const obsFim = $('#obsFinais').value || 'N/A';

  // Retrieve cached cash counts to embed in PDF
  const progress = getSavedProgress();
  const cash = progress.cash || {};
  const totalGeral = cash.calculatedTotalGeral || '0.00';
  const deposito = cash.calculatedDeposito || '0.00';
  const diferenca = cash.calculatedDiferenca || '0.00';
  const recebido = cash.meta?.recebido || '0.00';

  // Title
  doc.setFontSize(20); doc.setTextColor(0, 38, 58);
  doc.text(`Checklist ${shiftText} - Comprovativo`, 10, y); y += 8;
  doc.setDrawColor(198, 166, 103); doc.setLineWidth(1); doc.line(10, y, 200, y); y += 8;

  addLine(`Auditor: ${auditor}`);
  addLine(`Data: ${data}`);
  addLine(`Protocolo MySana: ${proto}`);
  addLine(`Gerado em: ${new Date().toLocaleString('pt-PT')}`, 10, [60, 60, 60]);
  addLine(`Obs. iniciais: ${obsIni}`, 10, [60, 60, 60], 8);
  addLine(`Obs. finais: ${obsFim}`, 10, [60, 60, 60], 8);

  // Cash info
  if (turno !== 'doorman') {
    y += 5;
    addLine(`Fundo de Caixa Fixo: 750.00 €`, 11, [0, 0, 0], 6);
    addLine(`Montante Recebido (Sistema): ${recebido} €`, 11, [0, 0, 0], 6);
    addLine(`Total Geral (Espécie + Docs): ${totalGeral} €`, 11, [0, 0, 0], 6);
    addLine(deposito === '-' ? 'DEPÓSITO DO DIA: -' : `DEPÓSITO DO DIA: ${deposito} €`, 13, [0, 38, 58], 7);
    addLine(`Diferença de Caixa: ${diferenca}`, 11, [parseFloat(diferenca) < 0 ? 200 : 0, 0, 0], 8);

    if (cash.vales && cash.vales.length > 0) {
      addLine('Detalhamento de Vales / Vouchers:', 11, [198, 166, 103], 6);
      cash.vales.forEach(v => {
        addLine(` - ${v.val}€ | Just: ${v.just} | Dept: ${v.dept}`, 9, [0, 0, 0], 5);
      });
    }

    if (cash.paidouts && cash.paidouts.length > 0) {
      addLine('Detalhamento de Paid-outs:', 11, [198, 166, 103], 6);
      cash.paidouts.forEach(p => {
        addLine(` - ${p.val}€ | Just: ${p.just} | Quarto: ${p.room}`, 9, [0, 0, 0], 5);
      });
    }
  }

  y += 2;
  addLine('Itens concluídos:', 15, [0, 38, 58], 8);

  let count = 0;
  getChecklistItems().forEach(li => {
    const cb = $('input[type="checkbox"]', li);
    const it = $('.item-text', li);
    let txt = '';
    if (it) {
      const clone = it.cloneNode(true);
      const toRemove = clone.querySelectorAll('.help-text, .optional-badge');
      toRemove.forEach(el => el.remove());
      txt = (clone.textContent || '').trim().replace(/\s+/g, ' ');
    }
    if (cb && cb.checked && txt) {
      count++;
      addLine(`• ${txt}`, 10, [0, 0, 0], 6);
    }
  });

  if (!count) addLine('Nenhum item concluído foi marcado.', 10, [120, 0, 0], 6);
  addLine(`Total: ${count} itens concluídos`, 11, [0, 38, 58], 8);
  addLine(`Rececionista: ${auditor}`, 12, [0, 38, 58], 6);
  doc.setDrawColor(198, 166, 103); doc.setLineWidth(1); doc.line(10, y, 100, y); y += 6;
  addLine('Assinatura manual:', 11, [20, 20, 20], 8);

  // File naming
  const sanitizeFileName = (v) => {
    return String(v || 'Checklist')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9\-_]+/g, '_').replace(/^_+|_+$/g, '');
  };
  const safe = sanitizeFileName(`Checklist_${shiftText}_${data}_${auditor}`) || 'ChecklistComprovativo';
  
  doc.save(`${safe}.pdf`);

  const pdfBase64 = doc.output('datauristring').split(',')[1];
  saveReportToHistory(`Checklist ${shiftText} - ${auditor}`, 'Checklist', pdfBase64, data);

  // SharePoint POST Integration (webhookUrl Power Automate block)
  try {
    // Reuse pdfBase64 variable
    const payload = {
      dataHora: new Date().toLocaleString('pt-PT'),
      turno: turno,
      rececionista: auditor,
      totalGeralCaixa: parseFloat(totalGeral) || 0,
      diferencaCaixa: parseFloat(diferenca) || 0,
      obsIniciais: obsIni || "Sem observações iniciais.",
      obsFinais: obsFim || "Fecho concluído via app.",
      pdfNome: `${safe}.pdf`,
      pdfConteudoBase64: pdfBase64
    };

    const webhookUrl = "https://defaulte3dc9b5c8d2143428af283327ca360.e3.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/a90ca4cb88204727a3bf23354a19cf91/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=HE9JTgBLGHRX3RZT7qVsSzpnLojaOKhxMHVNssyz8xw";

    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
    .then(response => {
      if (response.ok) {
        alert("✅ SUCESSO! Turno finalizado e salvo no SharePoint!");
      } else {
        alert("⚠️ O SharePoint recusou os dados. Código de erro: " + response.status);
      }
    })
    .catch(error => {
      alert("❌ ERRO DE CONEXÃO: " + error.message);
    });

  } catch (err) {
    alert("❌ ERRO NO CÓDIGO DA PÁGINA: " + err.message);
  }
}

function applyScreenTranslations(lang) {
  const shiftTextVal = $('#turno').value;
  if (shiftTextVal && $('#tela2').style.display === 'block') {
    const shiftText = getTranslation(lang, 'shift_' + shiftTextVal) || shiftTextVal;
    $('#tituloTurnoAtivo').textContent = `${getTranslation(lang, 'nav_checklist')} — ${shiftText}`;
    
    const auditorName = $('#auditorNome').value;
    const dateVal = $('#auditorData').value;
    $('#labelInfoMeta').textContent = `${shiftText} | ${auditorName} | ${dateVal}`;
  }
}

// Accordion toggle clicks and checkbox listener registration
document.addEventListener('click', e => {
  const phaseBtn = e.target.closest('.phase-btn[data-target]');
  if (phaseBtn) {
    const id = phaseBtn.dataset.target;
    const el = document.getElementById(id);
    if (el) {
      const open = el.style.display === 'block';
      el.style.display = open ? 'none' : 'block';
      phaseBtn.setAttribute('aria-expanded', String(!open));
      saveCurrentProgress();
    }
    return;
  }

  const helpBtn = e.target.closest('.help-btn');
  if (helpBtn) {
    const item = helpBtn.closest('.check-item');
    const help = $('.help-text', item);
    if (help) {
      const willOpen = !help.classList.contains('open');
      help.classList.toggle('open', willOpen);
      helpBtn.setAttribute('aria-expanded', String(willOpen));
      helpBtn.setAttribute('aria-label', willOpen ? 'Hide' : 'Explanation');
      helpBtn.textContent = willOpen ? '−' : '?';
    }
    return;
  }
});

document.addEventListener('change', e => {
  if (!isLoaded) return;
  if (e.target.matches('.section-toggle-all')) {
    const sec = e.target.closest('.phase-content, .checklist-continua');
    if (sec) {
      $$('li.check-item input[type="checkbox"]', sec).forEach(cb => cb.checked = e.target.checked);
      clearWarnings();
      updateSectionToggle(sec);
      saveCurrentProgress();
      updateProgressBar();
    }
    return;
  }

  if (e.target.matches('#checklist-container input[type="checkbox"]')) {
    const sec = e.target.closest('.phase-content, .checklist-continua');
    if (sec) updateSectionToggle(sec);
    clearWarnings();
    saveCurrentProgress();
    
    // Trigger Gold Blink effect on checked
    if (e.target.checked) {
      const checkItem = e.target.closest('.check-item');
      if (checkItem) {
        checkItem.classList.remove('gold-blink');
        void checkItem.offsetWidth; // Trigger reflow to restart animation
        checkItem.classList.add('gold-blink');
      }
    }
    
    updateProgressBar();
  }
});

document.addEventListener('input', e => {
  if (!isLoaded) return;
  if (e.target.matches('input,textarea')) {
    saveCurrentProgress();
  }
});

// Refresh translations if language changes
document.addEventListener('languageChanged', (e) => {
  if (!isLoaded) return;
  const lang = e.detail.lang;
  applyScreenTranslations(lang);
  
  // Re-render checklist with new language if visible
  const turno = $('#turno').value;
  if (turno && $('#tela2').style.display === 'block') {
    // Save checks first
    const checks = getAllCheckboxes().map(cb => cb.checked);
    renderChecklist(turno, true).then(() => {
      const cbs = getAllCheckboxes();
      checks.forEach((v, i) => {
        if (cbs[i]) cbs[i].checked = v;
      });
      updateAllSectionToggles();
      updateProgressBar();
    });
  }
});

// Startup Initialization
document.addEventListener('DOMContentLoaded', () => {
  initChecklist().then(() => {
    isLoaded = true;
  });
});
