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

const WeatherService = {
  defaultLocation: {
    latitude: 38.7167,
    longitude: -9.1333
  },

  weatherCodeMap(code) {
    const map = {
      0: 'Ensolarado',
      1: 'Pouco nublado',
      2: 'Parcialmente nublado',
      3: 'Nublado',
      45: 'Neblina',
      48: 'Neblina seca',
      51: 'Chuvisco leve',
      53: 'Chuvisco moderado',
      55: 'Chuvisco denso',
      56: 'Garoa congelante leve',
      57: 'Garoa congelante densa',
      61: 'Chuva fraca',
      63: 'Chuva moderada',
      65: 'Chuva forte',
      66: 'Chuva congelante leve',
      67: 'Chuva congelante forte',
      71: 'Neve fraca',
      73: 'Neve moderada',
      75: 'Neve forte',
      77: 'Granizo',
      80: 'Chuva de pancada',
      81: 'Chuva intensa de pancada',
      82: 'Chuva muito intensa de pancada',
      85: 'Neve de pancada',
      86: 'Neve intensa de pancada',
      95: 'Tempestade',
      96: 'Tempestade com granizo',
      99: 'Tempestade severa'
    };
    return map[code] || 'Tempo indefinido';
  },

  async getLocation() {
    return this.defaultLocation;
  },

  async fetchForecast() {
    const location = await this.getLocation();
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const data = await response.json();
    const daily = data.daily;
    if (!daily || !daily.weathercode || daily.weathercode.length === 0) {
      throw new Error('Weather data unavailable');
    }

    const index = 0;
    const description = this.weatherCodeMap(daily.weathercode[index]);
    const min = Math.round(daily.temperature_2m_min[index]);
    const max = Math.round(daily.temperature_2m_max[index]);

    return { description, min, max };
  },

  formatForecast(forecast) {
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
  async init() {
    const weatherSummary = document.getElementById('weather-summary');

    if (weatherSummary) {
      weatherSummary.textContent = 'A carregar previsão...';
      try {
        const forecast = await WeatherService.fetchForecast();
        weatherSummary.textContent = WeatherService.formatForecast(forecast);
      } catch (error) {
        console.error('Erro ao carregar previsão do tempo:', error);
        weatherSummary.textContent = 'Não foi possível obter a previsão';
      }
    }

    // Dynamic Clock implementation
    const clockEl = document.getElementById('current-date-time');
    if (clockEl) {
      const updateClock = () => {
        const now = new Date();
        const dateStr = now.toLocaleDateString('pt-PT', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
        const timeStr = now.toLocaleTimeString('pt-PT', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
        clockEl.textContent = `${dateStr} | ${timeStr}`;
      };
      updateClock();
      setInterval(updateClock, 1000);
    }
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
    await HeaderController.init();
    ThemeController.init();

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
  const user = await checkAuthStatus();
  if (user) {
    const profileEmailEl = document.getElementById('user-profile-email');
    if (profileEmailEl) {
      profileEmailEl.textContent = user.email || 'Utilizador';
    }
  }
  App.init();
  attachLogoutHandler();
});
