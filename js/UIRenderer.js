export const UIRenderer = {
  renderNoticias(noticias, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!noticias || noticias.length === 0) {
      container.innerHTML = '<p class="muted">Não há notícias disponíveis no momento.</p>';
      return;
    }

    const html = noticias.map(noticia => `
      <article class="noticia-item">
        <h3>${noticia.title}</h3>
        <span class="noticia-date">${noticia.date}</span>
        <p>${noticia.content}</p>
      </article>
    `).join('');

    container.innerHTML = html;
  },

  renderEventos(eventos, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!eventos || eventos.length === 0) {
      container.innerHTML = '<p class="muted">Não há eventos agendados.</p>';
      return;
    }

    const html = eventos.map(evento => `
      <article class="noticia-item">
        <h3>${evento.title}</h3>
        <span class="noticia-date">${evento.date}</span>
        <p>${evento.description}</p>
      </article>
    `).join('');

    container.innerHTML = html;
  },

  renderLinks(links, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!links || links.length === 0) {
      container.innerHTML = '<p class="muted">Não há links disponíveis.</p>';
      return;
    }

    const html = `
      <ul class="link-list">
        ${links.map(link => `<li><a href="${link.url}" target="_blank" rel="noopener noreferrer">${link.name}</a></li>`).join('')}
      </ul>
    `;

    container.innerHTML = html;
  },

  renderDailyReport(report) {
    if (!report) {
      return;
    }
    this.renderHotelSection(report, 'hotel-section-container');
    this.renderStatsBudgetSection(report, 'stats-budget-container');
  },

  renderHotelSection(report, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const occ = report.occupancy != null ? `${report.occupancy}%` : '-';
    const res = report.inHouse != null ? String(report.inHouse) : '-';
    const arr = report.arrivals != null ? String(report.arrivals) : '-';
    const dep = report.departures != null ? String(report.departures) : '-';

    const col1CalendarHTML = this.generateCalendarHTML('Mês atual', report.currentMonthCalendar);
    const col2CalendarHTML = this.generateCalendarHTML('Mês próximo mês', report.nextMonthCalendar);
    const col3FinancialsHTML = this.generateFinancialsCardHTML(report.financials);
    const col4ShowRoomsHTML = this.generateShowRoomsHTML(report.showRooms);

    container.innerHTML = `
      <div class="section-container">
        <div class="section-header-block">
          <h2>Título da secção</h2>
          <div class="section-title-desc">O hotel hoje</div>
        </div>

        <div class="kpi-row">
          <div class="kpi-card">
            <span class="kpi-label">Ocupação do dia %</span>
            <div class="kpi-value">${occ}</div>
          </div>
          <div class="kpi-card">
            <span class="kpi-label">Residentes</span>
            <div class="kpi-value">${res}</div>
          </div>
          <div class="kpi-card">
            <span class="kpi-label">Chegadas</span>
            <div class="kpi-value">${arr}</div>
          </div>
          <div class="kpi-card">
            <span class="kpi-label">Saídas</span>
            <div class="kpi-value">${dep}</div>
          </div>
        </div>

        <div class="four-column-grid">
          <div>${col1CalendarHTML}</div>
          <div>${col2CalendarHTML}</div>
          <div>${col3FinancialsHTML}</div>
          <div>${col4ShowRoomsHTML}</div>
        </div>
      </div>
    `;
  },

  generateCalendarHTML(title, data = []) {
    let html = `
      <div class="calendar-card">
        <table class="calendar-table">
          <thead>
            <tr>
              <th colspan="7" style="text-align: left; padding: 8px 4px; color: var(--gold-2); font-size: 12px; font-weight: 700; border-bottom: 1px solid var(--border);">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span>${title}</span>
                  <span style="font-weight: 500; font-size: 10px; color: var(--muted); text-transform: uppercase;">Total quartos</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
    `;

    const daysPerRow = 7;
    for (let i = 0; i < data.length; i += daysPerRow) {
      html += '<tr>';
      for (let j = 0; j < daysPerRow; j++) {
        const dayIndex = i + j;
        if (dayIndex < data.length) {
          html += `<td class="calendar-day-header">${dayIndex + 1}</td>`;
        } else {
          html += '<td></td>';
        }
      }
      html += '</tr>';

      html += '<tr>';
      for (let j = 0; j < daysPerRow; j++) {
        const dayIndex = i + j;
        if (dayIndex < data.length) {
          const val = data[dayIndex];
          html += `<td class="calendar-day-count">${val != null ? val : '-'}</td>`;
        } else {
          html += '<td></td>';
        }
      }
      html += '</tr>';
    }

    html += `
          </tbody>
        </table>
      </div>
    `;
    return html;
  },

  generateFinancialsCardHTML(financials) {
    const adr = financials?.adr ?? '-';
    const revpar = financials?.revpar ?? '-';
    const trevpar = financials?.trevpar ?? '-';
    const occupancy = financials?.monthlyOccupancy ?? '-';

    return `
      <div class="financials-card">
        <table class="financials-table">
          <tbody>
            <tr>
              <td class="fin-label">ADR</td>
              <td class="fin-value">${adr}</td>
            </tr>
            <tr>
              <td class="fin-label">REVPAR</td>
              <td class="fin-value">${revpar}</td>
            </tr>
            <tr>
              <td class="fin-label">TREVPAR</td>
              <td class="fin-value">${trevpar}</td>
            </tr>
            <tr>
              <td class="fin-label">Ocupação mês até agora</td>
              <td class="fin-value">${occupancy}</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  },

  generateShowRoomsHTML(showRooms = []) {
    const rows = showRooms.map(item => `
      <tr>
        <td class="showroom-type">${item.type}</td>
        <td class="showroom-value">${item.room}</td>
      </tr>
    `).join('');

    return `
      <div class="col4-container">
        <div class="showroom-card">
          <h4>Show Rooms</h4>
          <table class="showroom-table">
            <tbody>
              ${rows || '<tr><td colspan="2" class="muted">Sem informação</td></tr>'}
            </tbody>
          </table>
        </div>
        <div class="status-placeholder-card">
          <div>
            <div style="font-size: 24px; margin-bottom: 4px;">✓</div>
            <span>Tudo Operacional</span>
          </div>
        </div>
      </div>
    `;
  },

  renderStatsBudgetSection(report, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!report || !report.statsBudget) {
      container.innerHTML = '<p class="muted">Dados estatísticos indisponíveis.</p>';
      return;
    }

    const sb = report.statsBudget;

    const buildCategoryHTML = (title, items, headerClass, totalRowClass) => {
      let rowsHTML = '';
      items.forEach((item, index) => {
        const isTotal = index === items.length - 1;
        const rowStyle = isTotal ? `class="${totalRowClass}"` : '';
        rowsHTML += `
          <tr ${rowStyle}>
            <td>${this.escapeHTML(item.item)}</td>
            <td>${this.escapeHTML(item.lastDay)}</td>
            <td>${this.escapeHTML(item.totalDaily)}</td>
            <td>${this.escapeHTML(item.budgetDaily)}</td>
            <td>${this.escapeHTML(item.totalMonthly)}</td>
            <td>${this.escapeHTML(item.budgetMonthly)}</td>
          </tr>
        `;
      });

      return `
        <tr class="category-header-row">
          <td colspan="6" class="category-header-cell ${headerClass}">${title}</td>
        </tr>
        ${rowsHTML}
      `;
    };

    const alojamentoHTML = buildCategoryHTML('ALOJAMENTO', sb.alojamento || [], 'alojamento-header', 'alojamento-total-row');
    const fbHTML = buildCategoryHTML('F&B', sb.fb || [], 'fb-header', 'fb-total-row');
    const diversosHTML = buildCategoryHTML('DIVERSOS', sb.diversos || [], 'diversos-header', 'diversos-total-row');

    const tg = sb.totalGeral || { item: 'TOTAL GERAL', lastDay: '-', totalDaily: '-', budgetDaily: '-', totalMonthly: '-', budgetMonthly: '' };
    const totalGeralHTML = `
      <tr class="total-geral-row">
        <td><strong>${this.escapeHTML(tg.item)}</strong></td>
        <td><strong>${this.escapeHTML(tg.lastDay)}</strong></td>
        <td><strong>${this.escapeHTML(tg.totalDaily)}</strong></td>
        <td><strong>${this.escapeHTML(tg.budgetDaily)}</strong></td>
        <td><strong>${this.escapeHTML(tg.totalMonthly)}</strong></td>
        <td><strong>${this.escapeHTML(tg.budgetMonthly)}</strong></td>
      </tr>
    `;

    container.innerHTML = `
      <div class="section-container">
        <div class="section-header-block">
          <div class="section-title-desc">Secção estatísticas e budget - Mês atual</div>
        </div>
        <div class="stats-table-container">
          <table class="stats-budget-table">
            <thead>
              <tr>
                <th>Estatísticas e Receitas Dia anterior</th>
                <th>Alojamento</th>
                <th>Total (diário)</th>
                <th>Budget (diário)</th>
                <th>Total (mensal)</th>
                <th>Budget (mensal)</th>
              </tr>
            </thead>
            <tbody>
              ${alojamentoHTML}
              ${fbHTML}
              ${diversosHTML}
              ${totalGeralHTML}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  renderVIPs(vips, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!vips || vips.length === 0) {
      container.innerHTML = '<p class="muted">Sem VIPs previstos.</p>';
      return;
    }

    const html = `
      <div class="table-responsive">
        <table class="report-table">
          <thead>
            <tr>
              <th>Quarto</th>
              <th>Nome</th>
              <th>Pax</th>
              <th>Chegada</th>
              <th>Partida</th>
            </tr>
          </thead>
          <tbody>
            ${vips.map(vip => `
              <tr>
                <td class="cell-room">${this.escapeHTML(vip.room)}</td>
                <td class="cell-name"><strong>${this.escapeHTML(vip.name)}</strong></td>
                <td class="cell-pax">${this.formatNumber(vip.pax)}</td>
                <td class="cell-date">${this.escapeHTML(vip.arrival)}</td>
                <td class="cell-date">${this.escapeHTML(vip.departure)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    container.innerHTML = html;
  },

  renderDailyEvents(events, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!events || events.length === 0) {
      container.innerHTML = '<p class="muted">Sem eventos agendados.</p>';
      return;
    }

    const html = `
      <div class="table-responsive">
        <table class="report-table">
          <thead>
            <tr>
              <th>Hora</th>
              <th>Descrição</th>
              <th>Local</th>
            </tr>
          </thead>
          <tbody>
            ${events.map(event => `
              <tr>
                <td class="cell-time">${this.escapeHTML(event.time)}</td>
                <td class="cell-desc">${this.escapeHTML(event.description)}</td>
                <td class="cell-location">${this.escapeHTML(event.location)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    container.innerHTML = html;
  },

  renderOOSRooms(oosRooms, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!oosRooms || oosRooms.length === 0) {
      container.innerHTML = '<p class="muted">Sem quartos fora de serviço.</p>';
      return;
    }

    const html = `
      <div class="table-responsive">
        <table class="report-table">
          <thead>
            <tr>
              <th>Quarto</th>
              <th>Motivo</th>
            </tr>
          </thead>
          <tbody>
            ${oosRooms.map(room => `
              <tr>
                <td class="cell-room">${this.escapeHTML(room.roomNumber)}</td>
                <td class="cell-reason">${this.escapeHTML(room.reason)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    container.innerHTML = html;
  },

  escapeHTML(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  renderDashboardCards(report) {
    // Deprecated: Rendered directly in renderHotelSection
  },

  formatNumber(value) {
    return value == null || Number.isNaN(Number(value)) ? '-' : String(value);
  },

  formatCurrency(value) {
    if (value == null || Number.isNaN(Number(value))) {
      return '-';
    }

    return `€ ${Number(value).toLocaleString('pt-PT', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  },

  formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
};
