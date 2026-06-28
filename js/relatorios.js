import './common.js';
import { DataService } from './data-service.js';
import { getTranslation } from './lang.js';

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

let allReports = [];

document.addEventListener('DOMContentLoaded', async () => {
  await initReportsPage();
});

async function initReportsPage() {
  const tbody = $('#bodyReports');
  try {
    allReports = await DataService.fetchHistoricalReports();
    renderReports(allReports);
  } catch (e) {
    console.error(e);
    if (tbody) {
      const lang = localStorage.getItem('portal-lang') || 'pt';
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--red); padding:30px;">${getTranslation(lang, 'weather_error')}</td></tr>`;
    }
  }

  // Register filter event listeners
  $('#reportsSearch').addEventListener('input', applyFilters);
  $('#reportsType').addEventListener('change', applyFilters);
  $('#reportsFrom').addEventListener('change', applyFilters);
  $('#reportsTo').addEventListener('change', applyFilters);
}

function applyFilters() {
  const query = $('#reportsSearch').value.toLowerCase().trim();
  const type = $('#reportsType').value;
  const fromDate = $('#reportsFrom').value;
  const toDate = $('#reportsTo').value;

  const filtered = allReports.filter(report => {
    // Keyword filter
    if (query && !report.name.toLowerCase().includes(query)) {
      return false;
    }

    // Type filter
    if (type !== 'all' && report.type !== type) {
      return false;
    }

    // Date range from filter
    if (fromDate && report.date < fromDate) {
      return false;
    }

    // Date range to filter
    if (toDate && report.date > toDate) {
      return false;
    }

    return true;
  });

  renderReports(filtered);
}

function renderReports(reports) {
  const tbody = $('#bodyReports');
  if (!tbody) return;
  tbody.innerHTML = '';

  const lang = localStorage.getItem('portal-lang') || 'pt';

  if (reports.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:30px; color:var(--muted);">${lang === 'en' ? 'No reports found matching filters.' : 'Não foram encontrados relatórios para os filtros aplicados.'}</td></tr>`;
    return;
  }

  reports.forEach(report => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="padding-left:20px; font-weight:500;">${formatReportDate(report.date)}</td>
      <td style="font-weight:600;">${report.name}</td>
      <td><span class="badge" style="background: rgba(198,166,103,0.1); border: 1px solid rgba(198,166,103,0.3); color: var(--gold); padding: 4px 8px; border-radius: 4px; font-size:12px;">${report.type}</span></td>
      <td style="padding-right:20px; text-align:right;">
        <button class="pdf-btn btn-view-pdf" style="padding:6px 14px; font-size:12.5px; margin:0;" data-i18n="btn_view_pdf">Ver / Download PDF</button>
      </td>
    `;
    tbody.appendChild(tr);

    tr.querySelector('.btn-view-pdf').addEventListener('click', () => {
      handlePdfDownload(report);
    });
  });
}

function formatReportDate(dateStr) {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  } catch (e) {}
  return dateStr;
}

function handlePdfDownload(report) {
  if (!report.pdfUrl || report.pdfUrl === '#') {
    // Generate a simple report PDF dynamically for mock items
    if (window.jspdf?.jsPDF) {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      
      // Header border line
      doc.setDrawColor(198, 166, 103); doc.setLineWidth(1); doc.line(10, 25, 200, 25);
      
      doc.setFontSize(20); doc.setTextColor(0, 38, 58);
      doc.text(`Sana Mythic Hotel — Arquivo Histórico`, 10, 20);
      
      doc.setFontSize(12); doc.setTextColor(0, 0, 0);
      doc.text(`Relatório: ${report.name}`, 10, 35);
      doc.text(`Data Operacional: ${formatReportDate(report.date)}`, 10, 43);
      doc.text(`Tipo de Documento: ${report.type}`, 10, 51);
      
      doc.text(`Descrição do Arquivo:`, 10, 65);
      doc.setFontSize(10); doc.setTextColor(60, 60, 60);
      doc.text(`Este documento representa um registo histórico simulado restaurado das pastas de fecho`, 10, 72);
      doc.text(`do dia no SharePoint. Para relatórios reais gerados recentemente, o visualizador irá`, 10, 77);
      doc.text(`carregar e transferir o PDF idêntico ao gerado em tempo de execução pelo utilizador.`, 10, 82);
      
      // Additional mock stats depending on report type
      if (report.type === 'Daily Report' && report.data) {
        doc.setFontSize(12); doc.setTextColor(0, 38, 58);
        doc.text(`Métricas Financeiras do Fecho:`, 10, 95);
        doc.setFontSize(10); doc.setTextColor(0, 0, 0);
        doc.text(` - Percentagem Ocupação: ${report.data.occupancy}%`, 10, 103);
        doc.text(` - Receita Total de Caixa: ${report.data.totalRevenue.toFixed(2)} €`, 10, 110);
      }
      
      doc.save(`${report.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
    } else {
      alert(`Visualização rápida do arquivo: ${report.name}`);
    }
  } else {
    // Real reports generated inside current user session
    const link = document.createElement('a');
    link.href = report.pdfUrl;
    link.download = `${report.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
