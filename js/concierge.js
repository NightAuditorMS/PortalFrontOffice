// js/concierge.js
import './common.js';
import { getTranslation } from './lang.js';

const DataService = {
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
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }
};

const UIRenderer = {
  renderGuias(guias, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const lang = localStorage.getItem('portal-lang') || 'pt';

    if (!guias || guias.length === 0) {
      container.innerHTML = `<p class="muted">${getTranslation(lang, 'no_guides_found')}</p>`;
      return;
    }

    container.innerHTML = guias.map(guia => {
      // Map categories
      let catKey = 'category_useful';
      if (guia.category.toLowerCase().includes('transport')) catKey = 'category_transports';
      else if (guia.category.toLowerCase().includes('restauran') || guia.category.toLowerCase().includes('food')) catKey = 'category_restaurants';
      else if (guia.category.toLowerCase().includes('interes') || guia.category.toLowerCase().includes('sight')) catKey = 'category_poi';

      return `
        <article class="noticia-item">
          <h3>${guia.name}</h3>
          <span class="noticia-date">${getTranslation(lang, catKey)}</span>
          <p>${guia.description}</p>
        </article>
      `;
    }).join('');
  }
};

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

const App = {
  async init() {
    const guias = await DataService.fetchGuias();
    UIRenderer.renderGuias(guias, 'guias-container');
    SearchController.init(guias);

    // Watch language changes to redraw list and translate search placeholder
    document.addEventListener('languageChanged', () => {
      UIRenderer.renderGuias(guias, 'guias-container');
    });
  }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
