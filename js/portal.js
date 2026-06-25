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
  },
  clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }
};

const GreetingService = {
  getGreeting() {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) {
      return 'Bom dia';
    }
    if (hour >= 12 && hour < 18) {
      return 'Boa tarde';
    }
    return 'Boa noite';
  }
};

const WeatherService = {
  getForecast() {
    const now = new Date();
    const hour = now.getHours();
    const seed = now.getDate() + now.getMonth() + hour;
    const forecasts = [
      { description: 'Ensolarado', min: 19, max: 28 },
      { description: 'Parcialmente nublado', min: 17, max: 25 },
      { description: 'Nublado', min: 15, max: 23 },
      { description: 'Chuva leve', min: 14, max: 21 },
      { description: 'Chuviscos', min: 13, max: 20 },
      { description: 'Ventoso', min: 16, max: 24 },
      { description: 'Aberturas de sol', min: 18, max: 26 }
    ];

    const item = forecasts[seed % forecasts.length];
    const min = item.min + (hour >= 18 || hour < 6 ? -1 : 0);
    const max = item.max + (hour >= 18 || hour < 6 ? -1 : 0);

    return {
      description: item.description,
      min: Utils.clamp(min, 8, 30),
      max: Utils.clamp(max, 12, 34)
    };
  },

  getForecastText() {
    const forecast = this.getForecast();
    return `${forecast.description} · min ${forecast.min}° · max ${forecast.max}°`;
  }
};

const ThemeController = {
  currentTheme: 'dark',

  init() {
    const storedTheme = localStorage.getItem('portal-theme');
    const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    this.currentTheme = storedTheme || (prefersLight ? 'light' : 'dark');
    this.applyTheme(this.currentTheme);

    const themeButton = document.getElementById('theme-toggle');
    if (themeButton) {
      themeButton.addEventListener('click', () => this.toggleTheme());
    }
  },

  applyTheme(theme) {
    document.body.classList.toggle('light-theme', theme === 'light');
    localStorage.setItem('portal-theme', theme);
    const themeButton = document.getElementById('theme-toggle');
    if (themeButton) {
      themeButton.textContent = theme === 'light' ? '🌙' : '☀️';
      themeButton.setAttribute('aria-label', theme === 'light' ? 'Modo escuro' : 'Modo claro');
    }
  },

  toggleTheme() {
    this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.applyTheme(this.currentTheme);
  }
};

const HeaderController = {
  init() {
    const greetingText = document.getElementById('greeting-text');
    const weatherSummary = document.getElementById('weather-summary');

    if (greetingText) {
      greetingText.textContent = GreetingService.getGreeting();
    }

    if (weatherSummary) {
      weatherSummary.textContent = WeatherService.getForecastText();
    }
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
    
    HeaderController.init();
    ThemeController.init();

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
