// js/concierge.js
import { checkAuthStatus, logoutUser } from './auth.js';

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

    if (!guias || guias.length === 0) {
      container.innerHTML = '<p class="muted">Nenhum local encontrado.</p>';
      return;
    }

    container.innerHTML = guias.map(guia => `
      <article class="noticia-item">
        <h3>${guia.name}</h3>
        <span class="noticia-date">${guia.category}</span>
        <p>${guia.description}</p>
      </article>
    `).join('');
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
  }
};

function attachLogoutHandler() {
  const logoutButton = document.getElementById('logout-button');
  if (!logoutButton) return;
  logoutButton.addEventListener('click', async () => {
    try {
      await logoutUser();
      window.location.href = 'login.html';
    } catch (error) {
      alert(error.message || 'Não foi possível sair. Tente novamente.');
    }
  });
}

window.addEventListener('DOMContentLoaded', async () => {
  await checkAuthStatus();
  App.init();
  attachLogoutHandler();
});
