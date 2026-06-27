// js/portal.js
import { UIRenderer } from './UIRenderer.js';
import { checkAuthStatus, logoutUser } from './auth.js';

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
  async fetchDailyReport() {
    try {
      const response = await fetch('data/daily-report.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Erro ao carregar relatório diário:', error);
      return null;
    }
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
    if (!navigator.geolocation) {
      return this.defaultLocation;
    }

    return new Promise(resolve => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        () => {
          resolve(this.defaultLocation);
        },
        { timeout: 5000 }
      );
    });
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
    const greetingText = document.getElementById('greeting-text');
    const weatherSummary = document.getElementById('weather-summary');

    if (greetingText) {
      greetingText.textContent = GreetingService.getGreeting();
    }

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

// Main application logic
const App = {
  async init() {
    console.log('Portal Front Office iniciado.');
    
    await HeaderController.init();
    ThemeController.init();

    // Fetch and render data
    const noticias = await DataService.fetchNoticias();
    UIRenderer.renderNoticias(noticias, 'noticias-container');

    const eventos = await DataService.fetchEventos();
    UIRenderer.renderEventos(eventos, 'eventos-container');

    const report = await DataService.fetchDailyReport();
    UIRenderer.renderDailyReport(report);
    UIRenderer.renderDashboardCards(report);

    const links = await DataService.fetchLinks();
    UIRenderer.renderLinks(links, 'links-container');
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

// Start the app when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', async () => {
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
