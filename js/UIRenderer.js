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
      this.renderVIPs([], 'vips-container');
      this.renderDailyEvents([], 'daily-events-container');
      this.renderOOSRooms([], 'oos-container');
      return;
    }
    this.renderVIPs(report.vips, 'vips-container');
    this.renderDailyEvents(report.events, 'daily-events-container');
    this.renderOOSRooms(report.oosRooms, 'oos-container');
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
    const container = document.getElementById('daily-report-cards');
    if (!container) return;

    if (!report) {
      container.innerHTML = '<p class="muted">Relatório diário indisponível.</p>';
      return;
    }

    const normalizedReport = {
      ...report,
      totalRevenue: report.totalRevenue ?? report.revenue ?? 0,
      reportDate: report.reportDate ?? report.date ?? '',
    };

    const headerDateEl = document.getElementById('header-date');
    if (headerDateEl) {
      headerDateEl.textContent = normalizedReport.reportDate 
        ? `${this.formatDate(normalizedReport.reportDate)} · ` 
        : '';
    }

    const cards = [
      {
        label: 'Ocupação',
        value: normalizedReport.occupancy != null ? `${normalizedReport.occupancy}%` : '-'
      },
      {
        label: 'Receita Total',
        value: this.formatCurrency(normalizedReport.totalRevenue)
      },
      {
        label: 'In-House',
        value: this.formatNumber(normalizedReport.inHouse)
      },
      {
        label: 'Chegadas',
        value: this.formatNumber(normalizedReport.arrivals)
      },
      {
        label: 'Saídas',
        value: this.formatNumber(normalizedReport.departures)
      },
      {
        label: 'Room Service',
        value: this.formatCurrency(normalizedReport.roomServiceRevenue)
      },
      {
        label: 'Restaurante',
        value: this.formatCurrency(normalizedReport.restaurantRevenue)
      },
      {
        label: 'Spa',
        value: this.formatCurrency(normalizedReport.spaRevenue)
      },
      {
        label: 'Tarifa Média',
        value: this.formatCurrency(normalizedReport.averageRate)
      }
    ];

    container.innerHTML = cards.map(card => `
      <article class="dashboard-card">
        <span class="metric-label">${card.label}</span>
        <strong>${card.value}</strong>
      </article>
    `).join('');
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
