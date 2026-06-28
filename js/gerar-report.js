import './common.js';
import { checkAuthStatus, checkRole } from './auth.js';
import { saveReportToHistory } from './storage.js';
import { getTranslation } from './lang.js';

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

document.addEventListener('DOMContentLoaded', async () => {
  const user = await checkAuthStatus();
  if (!user || !checkRole(user.email)) {
    const lang = localStorage.getItem('portal-lang') || 'pt';
    alert(getTranslation(lang, 'msg_unauthorized_admin'));
    window.location.href = 'index.html';
    return;
  }
  initGerarReport();
});

function initGerarReport() {
  // Set default operational date to today
  $('#reportDate').value = new Date().toISOString().split('T')[0];

  // VIP handlers
  $('#btnAddVip').addEventListener('click', () => addVipRow());
  // Add an initial empty row for guidance
  addVipRow();

  // Event handlers
  $('#btnAddEvent').addEventListener('click', () => addEventRow());
  addEventRow();

  // OOS handlers
  $('#btnAddOos').addEventListener('click', () => addOosRow());
  addOosRow();

  // Form submit handler
  $('#formDailyReport').addEventListener('submit', async (e) => {
    e.preventDefault();
    await submitDailyReport();
  });
}

function addVipRow(room = '', name = '', pax = 1, arrival = '', departure = '') {
  const tbody = $('#bodyVips');
  if (!tbody) return;
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td><input type="text" class="form-input vip-room" value="${room}" placeholder="ex: 104" style="margin:0;" required></td>
    <td><input type="text" class="form-input vip-name" value="${name}" placeholder="ex: Sr. Silva" style="margin:0;" required></td>
    <td><input type="number" class="form-input vip-pax" value="${pax}" min="1" style="margin:0;" required></td>
    <td><input type="text" class="form-input vip-arrival" value="${arrival}" placeholder="ex: 14:00" style="margin:0;" required></td>
    <td><input type="text" class="form-input vip-departure" value="${departure}" placeholder="ex: 28/06" style="margin:0;" required></td>
    <td><button type="button" class="btn-delete-row" style="padding:4px 8px; font-weight:bold; background:rgba(220,53,69,0.1); border-color:rgba(220,53,69,0.3); color:var(--red); border-radius:4px;">&times;</button></td>
  `;
  tbody.appendChild(tr);
  tr.querySelector('.btn-delete-row').addEventListener('click', () => tr.remove());
}

function addEventRow(time = '', description = '', location = '') {
  const tbody = $('#bodyEvents');
  if (!tbody) return;
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td><input type="text" class="form-input event-time" value="${time}" placeholder="ex: 18:00" style="margin:0;" required></td>
    <td><input type="text" class="form-input event-desc" value="${description}" placeholder="ex: Reunião Executiva" style="margin:0;" required></td>
    <td><input type="text" class="form-input event-loc" value="${location}" placeholder="ex: Sala Estrela" style="margin:0;" required></td>
    <td><button type="button" class="btn-delete-row" style="padding:4px 8px; font-weight:bold; background:rgba(220,53,69,0.1); border-color:rgba(220,53,69,0.3); color:var(--red); border-radius:4px;">&times;</button></td>
  `;
  tbody.appendChild(tr);
  tr.querySelector('.btn-delete-row').addEventListener('click', () => tr.remove());
}

function addOosRow(roomNumber = '', reason = '') {
  const tbody = $('#bodyOos');
  if (!tbody) return;
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td><input type="text" class="form-input oos-room" value="${roomNumber}" placeholder="ex: 204" style="margin:0;" required></td>
    <td><input type="text" class="form-input oos-reason" value="${reason}" placeholder="ex: Infiltração" style="margin:0;" required></td>
    <td><button type="button" class="btn-delete-row" style="padding:4px 8px; font-weight:bold; background:rgba(220,53,69,0.1); border-color:rgba(220,53,69,0.3); color:var(--red); border-radius:4px;">&times;</button></td>
  `;
  tbody.appendChild(tr);
  tr.querySelector('.btn-delete-row').addEventListener('click', () => tr.remove());
}

async function submitDailyReport() {
  const lang = localStorage.getItem('portal-lang') || 'pt';

  // Assemble dynamic rows data
  const vips = $$('#bodyVips tr').map(tr => ({
    room: tr.querySelector('.vip-room').value.trim(),
    name: tr.querySelector('.vip-name').value.trim(),
    pax: parseInt(tr.querySelector('.vip-pax').value) || 1,
    arrival: tr.querySelector('.vip-arrival').value.trim(),
    departure: tr.querySelector('.vip-departure').value.trim()
  }));

  const events = $$('#bodyEvents tr').map(tr => ({
    time: tr.querySelector('.event-time').value.trim(),
    description: tr.querySelector('.event-desc').value.trim(),
    location: tr.querySelector('.event-loc').value.trim()
  }));

  const oosRooms = $$('#bodyOos tr').map(tr => ({
    roomNumber: tr.querySelector('.oos-room').value.trim(),
    reason: tr.querySelector('.oos-reason').value.trim()
  }));

  // Structure complete daily report object matching schema
  const reportData = {
    reportDate: $('#reportDate').value,
    occupancy: parseFloat($('#occupancy').value) || 0,
    totalRevenue: parseFloat($('#totalRevenue').value) || 0,
    revenue: parseFloat($('#totalRevenue').value) || 0, // Backward compatibility
    inHouse: parseInt($('#inHouse').value) || 0,
    arrivals: parseInt($('#arrivals').value) || 0,
    departures: parseInt($('#departures').value) || 0,
    roomServiceRevenue: parseFloat($('#roomServiceRevenue').value) || 0,
    restaurantRevenue: parseFloat($('#restaurantRevenue').value) || 0,
    spaRevenue: parseFloat($('#spaRevenue').value) || 0,
    averageRate: parseFloat($('#averageRate').value) || 0,
    vips: vips,
    events: events,
    oosRooms: oosRooms
  };

  // Generate official hotel layout PDF via jsPDF
  if (!window.jspdf?.jsPDF) {
    alert(getTranslation(lang, 'warn_pdf_lib_missing'));
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = 15;
  const pw = 190, margin = 10;

  function addLine(txt, size = 11, color = [0, 0, 0], gap = 6) {
    doc.setFontSize(size); doc.setTextColor(...color);
    const lines = doc.splitTextToSize(String(txt), pw);
    if (y + (lines.length * 5) > 285) { doc.addPage(); y = 15; }
    doc.text(lines, margin, y);
    y += Math.max(gap, lines.length * 5);
  }

  // Header Title Design
  doc.setFontSize(20); doc.setTextColor(0, 38, 58);
  doc.text(`Relatório Diário - ${reportData.reportDate}`, 10, y); y += 8;
  doc.setDrawColor(198, 166, 103); doc.setLineWidth(1); doc.line(10, y, 200, y); y += 8;

  addLine(`Métricas Operacionais:`, 13, [198, 166, 103], 7);
  addLine(`Data: ${reportData.reportDate} | Ocupação: ${reportData.occupancy}% | In-House: ${reportData.inHouse} Pax`);
  addLine(`Chegadas: ${reportData.arrivals} | Saídas: ${reportData.departures}`, 11, [0,0,0], 8);

  addLine(`Métricas Financeiras:`, 13, [198, 166, 103], 7);
  addLine(`Receita Total (Revenue): ${reportData.totalRevenue.toFixed(2)} €`);
  addLine(`ADR (Tarifa Média): ${reportData.averageRate.toFixed(2)} €`);
  addLine(`Room Service: ${reportData.roomServiceRevenue.toFixed(2)} € | Restaurante: ${reportData.restaurantRevenue.toFixed(2)} € | SPA: ${reportData.spaRevenue.toFixed(2)} €`, 11, [0,0,0], 8);

  if (vips.length > 0) {
    addLine(`Chegadas VIP:`, 13, [198, 166, 103], 7);
    vips.forEach(v => {
      addLine(` - Quarto ${v.room} | ${v.name} (${v.pax} Pax) | Chegada: ${v.arrival} | Partida: ${v.departure}`, 10, [0,0,0], 5);
    });
    y += 3;
  }

  if (events.length > 0) {
    addLine(`Eventos do Dia:`, 13, [198, 166, 103], 7);
    events.forEach(ev => {
      addLine(` - Hora: ${ev.time} | ${ev.description} | Local: ${ev.location}`, 10, [0,0,0], 5);
    });
    y += 3;
  }

  if (oosRooms.length > 0) {
    addLine(`Quartos OOS (Out of Service):`, 13, [198, 166, 103], 7);
    oosRooms.forEach(o => {
      addLine(` - Quarto ${o.roomNumber} | Motivo: ${o.reason}`, 10, [0,0,0], 5);
    });
  }

  const pdfName = `Relatorio_Diario_${reportData.reportDate}.pdf`;
  doc.save(pdfName);

  // Extract base64 representation
  const pdfBase64 = doc.output('datauristring').split(',')[1];

  // Save to local reports cache
  saveReportToHistory(`Relatório Diário - ${reportData.reportDate}`, 'Daily Report', pdfBase64, reportData.reportDate);

  // Webhook POST Fetch block
  const webhookUrl = "https://defaulte3dc9b5c8d2143428af283327ca360.e3.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/a90ca4cb88204727a3bf23354a19cf91/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=HE9JTgBLGHRX3RZT7qVsSzpnLojaOKhxMHVNssyz8xw";

  const payload = {
    reportDate: reportData.reportDate,
    jsonData: reportData,
    pdfNome: pdfName,
    pdfConteudoBase64: pdfBase64
  };

  try {
    const resp = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    if (resp.ok) {
      alert("✅ SUCESSO! Relatório diário submetido ao SharePoint via Power Automate!");
      location.reload();
    } else {
      alert("⚠️ O SharePoint recusou os dados. Código de erro: " + resp.status);
    }
  } catch (error) {
    alert("❌ ERRO DE CONEXÃO: " + error.message);
  }
}
