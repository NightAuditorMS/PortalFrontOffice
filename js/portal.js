// js/portal.js

// Modular architecture - Data fetching module
const DataService = {
  async fetchNoticias() {
    try {
      const response = await fetch('data/noticias.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Erro ao carregar notícias:', error);
      return [];
    }
  },
  async fetchEventos() {
    try {
      const response = await fetch('data/eventos.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Erro ao carregar eventos:', error);
      return [];
    }
  },
  async fetchLinks() {
    try {
      const response = await fetch('data/links.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Erro ao carregar links:', error);
      return [];
    }
  },
  async fetchGuias() {
    try {
      const response = await fetch('data/guias.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Erro ao carregar guias:', error);
      return [];
    }
  }
};

// UI rendering module
const UIRenderer = {
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
  renderGuias(guias, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!guias || guias.length === 0) {
      container.innerHTML = '<p class="muted">Nenhum local encontrado.</p>';
      return;
    }

    const html = guias.map(guia => `
      <article class="noticia-item">
        <h3>${guia.name}</h3>
        <span class="noticia-date">${guia.category}</span>
        <p>${guia.description}</p>
      </article>
    `).join('');

    container.innerHTML = html;
  }
};

// Utility functions
const Utils = {
  debounce(func, delay) {
    let timeoutId;
    return function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(this, args);
      }, delay);
    };
  },
  normalizeText(text) {
    if (!text) return '';
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, "").toLowerCase();
  }
};

// Search Module
const SearchController = {
  init(guiasData) {
    const searchInput = document.getElementById('search-guias');
    if (!searchInput) return;

    searchInput.addEventListener('input', Utils.debounce((e) => {
      const searchTerm = Utils.normalizeText(e.target.value);
      const filteredGuias = guiasData.filter(guia => 
        Utils.normalizeText(guia.name).includes(searchTerm) || 
        Utils.normalizeText(guia.category).includes(searchTerm) || 
        Utils.normalizeText(guia.description).includes(searchTerm)
      );
      UIRenderer.renderGuias(filteredGuias, 'guias-container');
    }, 300));
  }
};

// Main application logic
const App = {
  async init() {
    console.log('Portal Front Office iniciado.');
    
    // Fetch and render data
    const noticias = await DataService.fetchNoticias();
    UIRenderer.renderNoticias(noticias, 'noticias-container');

    const eventos = await DataService.fetchEventos();
    UIRenderer.renderEventos(eventos, 'eventos-container');

    const guias = await DataService.fetchGuias();
    UIRenderer.renderGuias(guias, 'guias-container');
    SearchController.init(guias);

    const links = await DataService.fetchLinks();
    UIRenderer.renderLinks(links, 'links-container');
  }
};

// Start the app when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
