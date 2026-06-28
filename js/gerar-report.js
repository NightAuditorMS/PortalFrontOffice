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

  // Event handlers
  $('#btnAddEvent').addEventListener('click', () => addEventRow());

  // OOS handlers
  $('#btnAddOos').addEventListener('click', () => addOosRow());

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
  let y = 10;
  
  // Premium Header Banner
  doc.setFillColor(0, 38, 58); // Dark Navy
  doc.rect(10, 10, 190, 22, 'F');
  
  doc.setFontSize(16);
  doc.setTextColor(198, 166, 103); // Gold
  doc.setFont("helvetica", "bold");
  doc.text("SANA MYTHIC HOTEL", 15, 19);
  
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255); // White
  doc.setFont("helvetica", "normal");
  doc.text(lang === 'en' ? `DAILY REPORT — ${reportData.reportDate}` : `RELATÓRIO DIÁRIO — ${reportData.reportDate}`, 15, 26);
  
  // Gold accent line under header banner
  doc.setFillColor(198, 166, 103); // Gold
  doc.rect(10, 32, 190, 1, 'F');
  
  y = 42;

  function addSectionHeader(title) {
    if (y + 15 > 280) { doc.addPage(); y = 15; }
    doc.setFillColor(245, 245, 247); // Light gray background for section title
    doc.rect(10, y, 190, 8, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(0, 38, 58); // Navy
    doc.text(title.toUpperCase(), 13, y + 5.5);
    doc.setFillColor(198, 166, 103); // Gold indicator line
    doc.rect(10, y, 1.5, 8, 'F');
    y += 14;
  }

  function addKeyValueRow(label1, val1, label2, val2) {
    if (y + 8 > 280) { doc.addPage(); y = 15; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text(label1 + ":", 15, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    doc.text(String(val1), 60, y);
    
    if (label2) {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(60, 60, 60);
      doc.text(label2 + ":", 105, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      doc.text(String(val2), 150, y);
    }
    y += 7;
  }

  function drawTableHeader(headers, widths) {
    if (y + 12 > 280) { doc.addPage(); y = 15; }
    doc.setFillColor(0, 38, 58); // Navy header
    doc.rect(10, y, 190, 7, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255); // White text
    
    let currentX = 12;
    headers.forEach((header, idx) => {
      doc.text(header, currentX, y + 4.8);
      currentX += widths[idx];
    });
    
    y += 7;
  }

  function drawTableRow(data, widths, isEven) {
    if (y + 10 > 280) { doc.addPage(); y = 15; }
    if (isEven) {
      doc.setFillColor(245, 245, 247);
      doc.rect(10, y, 190, 6, 'F');
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    
    let currentX = 12;
    data.forEach((val, idx) => {
      const txt = doc.splitTextToSize(String(val), widths[idx] - 4);
      doc.text(txt, currentX, y + 4.2);
      currentX += widths[idx];
    });
    y += 6;
  }

  // 1. Operational Section
  const optTitle = getTranslation(lang, 'section_kpis');
  addSectionHeader(optTitle);
  addKeyValueRow(
    lang === 'en' ? 'Operational Date' : 'Data Operacional', reportData.reportDate,
    lang === 'en' ? 'Occupancy' : 'Ocupação', `${reportData.occupancy}%`
  );
  addKeyValueRow(
    lang === 'en' ? 'In-House Guests' : 'Hóspedes In-House', reportData.inHouse,
    lang === 'en' ? 'Arrivals' : 'Chegadas', reportData.arrivals
  );
  addKeyValueRow(
    lang === 'en' ? 'Departures' : 'Saídas', reportData.departures
  );
  
  y += 5;

  // 2. Financial Section
  const finTitle = getTranslation(lang, 'section_financials');
  addSectionHeader(finTitle);
  addKeyValueRow(
    lang === 'en' ? 'Total Revenue' : 'Receita Total', `${reportData.totalRevenue.toFixed(2)} €`,
    lang === 'en' ? 'Average Rate (ADR)' : 'Tarifa Média (ADR)', `${reportData.averageRate.toFixed(2)} €`
  );
  addKeyValueRow(
    lang === 'en' ? 'Room Service' : 'Room Service', `${reportData.roomServiceRevenue.toFixed(2)} €`,
    lang === 'en' ? 'Restaurant' : 'Restaurante', `${reportData.restaurantRevenue.toFixed(2)} €`
  );
  addKeyValueRow(
    lang === 'en' ? 'Spa' : 'Spa', `${reportData.spaRevenue.toFixed(2)} €`
  );

  y += 5;

  // 3. VIP Arrivals Section
  if (vips.length > 0) {
    const vipTitle = getTranslation(lang, 'section_vips');
    addSectionHeader(vipTitle);
    const vipHeaders = lang === 'en' 
      ? ['Room', 'Name', 'Pax', 'Arrival', 'Departure']
      : ['Quarto', 'Nome', 'Pax', 'Chegada', 'Partida'];
    const vipWidths = [25, 75, 15, 35, 40];
    
    drawTableHeader(vipHeaders, vipWidths);
    vips.forEach((v, i) => {
      drawTableRow([v.room, v.name, v.pax, v.arrival, v.departure], vipWidths, i % 2 === 1);
    });
    y += 5;
  }

  // 4. Events Section
  if (events.length > 0) {
    const evTitle = getTranslation(lang, 'section_events');
    addSectionHeader(evTitle);
    const evHeaders = lang === 'en'
      ? ['Time', 'Description', 'Location']
      : ['Hora', 'Descrição', 'Localização'];
    const evWidths = [30, 90, 70];
    
    drawTableHeader(evHeaders, evWidths);
    events.forEach((ev, i) => {
      drawTableRow([ev.time, ev.description, ev.location], evWidths, i % 2 === 1);
    });
    y += 5;
  }

  // 5. OOS Section
  if (oosRooms.length > 0) {
    const oosTitle = getTranslation(lang, 'section_oos');
    addSectionHeader(oosTitle);
    const oosHeaders = lang === 'en'
      ? ['Room', 'Reason']
      : ['Quarto', 'Motivo'];
    const oosWidths = [40, 150];
    
    drawTableHeader(oosHeaders, oosWidths);
    oosRooms.forEach((o, i) => {
      drawTableRow([o.roomNumber, o.reason], oosWidths, i % 2 === 1);
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
      alert(getTranslation(lang, 'msg_submit_success'));
      location.reload();
    } else {
      alert(getTranslation(lang, 'msg_submit_error') + resp.status);
    }
  } catch (error) {
    alert(getTranslation(lang, 'msg_connection_error') + error.message);
  }
}
