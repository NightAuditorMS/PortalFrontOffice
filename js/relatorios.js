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
    
    let typeKey = 'type_daily_report';
    if (report.type === 'Checklist') typeKey = 'type_checklist';
    if (report.type === 'Contagem de Caixa') typeKey = 'type_caixa';
    const localizedType = getTranslation(lang, typeKey);

    tr.innerHTML = `
      <td style="padding-left:20px; font-weight:500;">${formatReportDate(report.date)}</td>
      <td style="font-weight:600;">${report.name}</td>
      <td><span class="badge" style="background: rgba(198,166,103,0.1); border: 1px solid rgba(198,166,103,0.3); color: var(--gold); padding: 4px 8px; border-radius: 4px; font-size:12px;">${localizedType}</span></td>
      <td style="padding-right:20px; text-align:right;">
        <button class="pdf-btn btn-view-pdf" style="padding:6px 14px; font-size:12.5px; margin:0;" data-i18n="btn_view_pdf">${getTranslation(lang, 'btn_view_pdf')}</button>
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
  const lang = localStorage.getItem('portal-lang') || 'pt';
  if (!report.pdfUrl || report.pdfUrl === '#') {
    // Generate a simple report PDF dynamically for mock items
    if (window.jspdf?.jsPDF) {
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
      doc.text(lang === 'en' ? `HISTORICAL ARCHIVE — ${formatReportDate(report.date)}` : `ARQUIVO HISTÓRICO — ${formatReportDate(report.date)}`, 15, 26);
      
      // Gold accent line
      doc.setFillColor(198, 166, 103); // Gold
      doc.rect(10, 32, 190, 1, 'F');
      
      y = 42;

      function addSectionHeader(title) {
        doc.setFillColor(245, 245, 247); // Light gray background
        doc.rect(10, y, 190, 8, 'F');
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(0, 38, 58); // Navy
        doc.text(title.toUpperCase(), 13, y + 5.5);
        doc.setFillColor(198, 166, 103); // Gold line
        doc.rect(10, y, 1.5, 8, 'F');
        y += 14;
      }

      function addKeyValueRow(label1, val1, label2, val2) {
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

      // Metadata section
      addSectionHeader(lang === 'en' ? 'Document Metadata' : 'Metadados do Documento');
      addKeyValueRow(
        lang === 'en' ? 'Document Name' : 'Nome do Documento', report.name,
        lang === 'en' ? 'Document Type' : 'Tipo de Documento', getTranslation(lang, report.type === 'Checklist' ? 'type_checklist' : report.type === 'Contagem de Caixa' ? 'type_caixa' : 'type_daily_report')
      );
      addKeyValueRow(
        lang === 'en' ? 'Operational Date' : 'Data Operacional', formatReportDate(report.date)
      );
      
      y += 5;

      // Report content section
      addSectionHeader(lang === 'en' ? 'Archived Data Summary' : 'Resumo dos Dados Arquivados');
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(50, 50, 50);
      
      const desc1 = lang === 'en' 
        ? "This document represents a simulated historical record restored from the SharePoint closing folders."
        : "Este documento representa um registo histórico simulado restaurado das pastas de fecho no SharePoint.";
      const desc2 = lang === 'en'
        ? "For recently generated reports, the viewer loads and downloads the identical PDF generated in real-time by the user."
        : "Para relatórios reais gerados recentemente, o visualizador irá carregar e transferir o PDF idêntico ao gerado em tempo de execução.";
      
      doc.text(desc1, 15, y); y += 6;
      doc.text(desc2, 15, y); y += 12;

      // Additional mock stats depending on report type
      if (report.type === 'Daily Report' && report.data) {
        addKeyValueRow(
          lang === 'en' ? 'Occupancy Rate' : 'Taxa de Ocupação', `${report.data.occupancy}%`,
          lang === 'en' ? 'Total Revenue' : 'Receita Total', `${report.data.totalRevenue.toFixed(2)} €`
        );
      } else if (report.type === 'Checklist' && report.data) {
        addKeyValueRow(
          lang === 'en' ? 'Auditor' : 'Auditor', report.data.auditor,
          lang === 'en' ? 'Shift' : 'Turno', getTranslation(lang, 'shift_' + report.data.shift)
        );
      } else if (report.type === 'Contagem de Caixa' && report.data) {
        addKeyValueRow(
          lang === 'en' ? 'Cash Count Total' : 'Total de Caixa', `${report.data.totalCaixa.toFixed(2)} €`,
          lang === 'en' ? 'Calculated Deposit' : 'Depósito Efetuado', `${report.data.deposito.toFixed(2)} €`
        );
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
