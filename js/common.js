import { checkAuthStatus, logoutUser, checkRole, auth } from './auth.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js';
import { translatePage } from './lang.js';
import './automation.js';

// Weather Service
export const WeatherService = {
  defaultLocation: { latitude: 38.7167, longitude: -9.1333 },

  weatherCodeMap(code, lang = 'pt') {
    const isEn = lang === 'en';
    const map = {
      0: isEn ? 'Sunny' : 'Ensolarado',
      1: isEn ? 'Mainly clear' : 'Pouco nublado',
      2: isEn ? 'Partly cloudy' : 'Parcialmente nublado',
      3: isEn ? 'Cloudy' : 'Nublado',
      45: isEn ? 'Fog' : 'Neblina',
      48: isEn ? 'Depositing rime fog' : 'Neblina seca',
      51: isEn ? 'Light drizzle' : 'Chuvisco leve',
      53: isEn ? 'Moderate drizzle' : 'Chuvisco moderado',
      55: isEn ? 'Dense drizzle' : 'Chuvisco denso',
      61: isEn ? 'Slight rain' : 'Chuva fraca',
      63: isEn ? 'Moderate rain' : 'Chuva moderada',
      65: isEn ? 'Heavy rain' : 'Chuva forte',
      66: isEn ? 'Light freezing rain' : 'Chuva congelante leve',
      67: isEn ? 'Heavy freezing rain' : 'Chuva congelante forte',
      71: isEn ? 'Slight snow' : 'Neve fraca',
      73: isEn ? 'Moderate snow' : 'Neve moderada',
      75: isEn ? 'Heavy snow' : 'Neve forte',
      77: isEn ? 'Snow grains' : 'Granizo',
      80: isEn ? 'Slight rain showers' : 'Chuva de pancada',
      81: isEn ? 'Moderate rain showers' : 'Chuva de pancada moderada',
      82: isEn ? 'Violent rain showers' : 'Chuva de pancada forte',
      85: isEn ? 'Slight snow showers' : 'Neve de pancada',
      86: isEn ? 'Heavy snow showers' : 'Neve de pancada forte',
      95: isEn ? 'Thunderstorm' : 'Tempestade',
      96: isEn ? 'Thunderstorm with slight hail' : 'Tempestade com granizo',
      99: isEn ? 'Thunderstorm with heavy hail' : 'Tempestade severa'
    };
    return map[code] || (isEn ? 'Weather undefined' : 'Tempo indefinido');
  },

  async fetchForecast(lang = 'pt') {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${this.defaultLocation.latitude}&longitude=${this.defaultLocation.longitude}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto`;
      const response = await fetch(url);
      if (!response.ok) return null;
      const data = await response.json();
      const daily = data.daily;
      if (!daily || !daily.weathercode || daily.weathercode.length === 0) return null;
      const index = 0;
      const description = this.weatherCodeMap(daily.weathercode[index], lang);
      const min = Math.round(daily.temperature_2m_min[index]);
      const max = Math.round(daily.temperature_2m_max[index]);
      return { description, min, max };
    } catch (e) {
      console.error(e);
      return null;
    }
  },

  formatForecast(forecast, lang = 'pt') {
    if (!forecast) return lang === 'en' ? 'Could not retrieve forecast' : 'Não foi possível obter a previsão';
    return `${forecast.description} · min ${forecast.min}° · max ${forecast.max}°`;
  }
};

// Theme Controller
export const ThemeController = {
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

// Language Controller
export const LanguageController = {
  currentLang: 'pt',

  init() {
    this.currentLang = localStorage.getItem('portal-lang') || 'pt';
    this.applyLanguage(this.currentLang);

    const langButton = document.getElementById('lang-toggle');
    if (langButton) {
      langButton.addEventListener('click', () => this.toggleLanguage());
    }
  },

  applyLanguage(lang) {
    localStorage.setItem('portal-lang', lang);
    this.currentLang = lang;
    translatePage(lang);
    
    // Update weather display with the new language
    this.updateWeatherDisplay(lang);
    
    // Trigger localized custom event so specific page renderers can redraw
    const event = new CustomEvent('languageChanged', { detail: { lang } });
    document.dispatchEvent(event);
  },

  toggleLanguage() {
    const nextLang = this.currentLang === 'pt' ? 'en' : 'pt';
    this.applyLanguage(nextLang);
  },

  async updateWeatherDisplay(lang) {
    const weatherSummary = document.getElementById('weather-summary');
    if (weatherSummary) {
      try {
        const forecast = await WeatherService.fetchForecast(lang);
        weatherSummary.textContent = WeatherService.formatForecast(forecast, lang);
      } catch (e) {
        weatherSummary.textContent = lang === 'en' ? 'Could not retrieve forecast' : 'Não foi possível obter a previsão';
      }
    }
  }
};

// Clock Controller
export const ClockController = {
  init() {
    const clockEl = document.getElementById('current-date-time');
    if (clockEl) {
      const updateClock = () => {
        const now = new Date();
        const dateStr = now.toLocaleDateString(LanguageController.currentLang === 'en' ? 'en-US' : 'pt-PT', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
        const timeStr = now.toLocaleTimeString(LanguageController.currentLang === 'en' ? 'en-US' : 'pt-PT', {
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

// Sidebar Dropdown Controller
export const SidebarDropdownController = {
  init() {
    // 1. SELECT ALL DROPDOWN BUTTONS IN SIDEBAR
    const dropdownBtns = document.querySelectorAll('.sidebar-dropdown-btn');

    dropdownBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const container = btn.closest('.sidebar-dropdown-container');
            const menu = container.querySelector('.sidebar-dropdown-menu');
            const arrow = btn.querySelector('.dropdown-arrow');
            
            // Check if this menu is already open
            const isOpen = container.classList.contains('active-dropdown');

            // Close all other open dropdowns first (Accordion behavior)
            document.querySelectorAll('.sidebar-dropdown-container').forEach(otherContainer => {
                if (otherContainer !== container) {
                    otherContainer.classList.remove('active-dropdown');
                    const otherMenu = otherContainer.querySelector('.sidebar-dropdown-menu');
                    const otherBtn = otherContainer.querySelector('.sidebar-dropdown-btn');
                    const otherArrow = otherBtn.querySelector('.dropdown-arrow');
                    if (otherMenu) otherMenu.style.maxHeight = null;
                    if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
                    if (otherArrow) otherArrow.style.transform = 'rotate(0deg)';
                }
            });

            // Toggle current dropdown
            if (isOpen) {
                container.classList.remove('active-dropdown');
                menu.style.maxHeight = null;
                btn.setAttribute('aria-expanded', 'false');
                if (arrow) arrow.style.transform = 'rotate(0deg)';
            } else {
                container.classList.add('active-dropdown');
                // Smooth transition using scrollHeight
                menu.style.maxHeight = menu.scrollHeight + "px";
                btn.setAttribute('aria-expanded', 'true');
                if (arrow) arrow.style.transform = 'rotate(180deg)';
            }
        });
    });

    // 2. HIGHLIGHT ACTIVE CURRENT PAGE IN SIDEBAR
    const currentPath = window.location.pathname.split("/").pop() || "index.html";
    const navLinks = document.querySelectorAll('.dashboard-sidebar a');
    
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
            // If the active link is inside a dropdown, open that dropdown automatically
            const parentMenu = link.closest('.sidebar-dropdown-menu');
            if (parentMenu) {
                const container = parentMenu.closest('.sidebar-dropdown-container');
                const btn = container.querySelector('.sidebar-dropdown-btn');
                const arrow = btn.querySelector('.dropdown-arrow');
                container.classList.add('active-dropdown');
                parentMenu.style.maxHeight = parentMenu.scrollHeight + "px";
                btn.setAttribute('aria-expanded', 'true');
                if (arrow) arrow.style.transform = 'rotate(180deg)';
            }
        } else {
            link.classList.remove('active');
        }
    });

    // 3. LISTEN FOR LANGUAGE CHANGES TO RECALCULATE HEIGHTS DYNAMICALLY
    document.addEventListener('languageChanged', () => {
      const activeContainer = document.querySelector('.sidebar-dropdown-container.active-dropdown');
      if (activeContainer) {
        const menu = activeContainer.querySelector('.sidebar-dropdown-menu');
        if (menu) {
          menu.style.maxHeight = menu.scrollHeight + "px";
        }
      }
    });
  }
};

// Function to update user profile header UI
function updateHeaderUI(email) {
  // TEMPORARY DEV BYPASS - REMOVE IN PRODUCTION
  const devBypassEmail = window.localStorage.getItem('dev_bypass');
  const activeEmail = devBypassEmail || email;

  const profileEmailEl = document.getElementById('user-profile-email');
  if (profileEmailEl) {
    profileEmailEl.textContent = activeEmail || 'Utilizador';
  }
  
  // Check role and display Gerar Daily Report if user is Admin
  const isAdmin = checkRole(activeEmail);
  const gerarReportEl = document.getElementById('sidebar-gerar-report-item');
  if (gerarReportEl) {
    gerarReportEl.style.display = isAdmin ? 'block' : 'none';
  }
  const adminGestaoEl = document.getElementById('sidebar-gestao-container');
  if (adminGestaoEl) {
    adminGestaoEl.style.display = isAdmin ? 'block' : 'none';
  }
}

function initCommon() {
  // TEMPORARY DEV BYPASS - REMOVE IN PRODUCTION
  const devBypassEmail = window.localStorage.getItem('dev_bypass');
  if (devBypassEmail) {
    updateHeaderUI(devBypassEmail);
  } else {
    // 1. Auth check using onAuthStateChanged to prevent state leakage
    onAuthStateChanged(auth, (user) => {
      if (user) {
        updateHeaderUI(user.email);
      } else {
        const path = window.location.pathname;
        if (!path.endsWith('/login.html') && !path.endsWith('login.html')) {
          window.location.href = 'login.html';
        }
      }
    });
  }

  // 2. Setup logout handler
  const logoutButton = document.getElementById('logout-button');
  if (logoutButton) {
    logoutButton.addEventListener('click', async () => {
      try {
        await logoutUser();
        window.location.href = 'login.html';
      } catch (error) {
        alert(error.message || 'Erro ao efetuar logout.');
      }
    });
  }

  // 3. Initialize components
  ThemeController.init();
  LanguageController.init();
  ClockController.init();
  SidebarDropdownController.init();
}

// Check document readystate to handle race conditions with cached modules
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCommon);
} else {
  initCommon();
}
