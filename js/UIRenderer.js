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

    const cards = [
      {
        label: 'Data',
        value: normalizedReport.reportDate ? this.formatDate(normalizedReport.reportDate) : '-'
      },
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
