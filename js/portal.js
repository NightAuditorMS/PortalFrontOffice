// js/portal.js
import './common.js';
import { UIRenderer } from './UIRenderer.js';

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

// Main application logic
const App = {
  async init() {
    console.log('Portal Front Office iniciado.');
    
    // Fetch and render data
    const report = await DataService.fetchDailyReport();
    UIRenderer.renderDailyReport(report);

    const noticias = await DataService.fetchNoticias();
    UIRenderer.renderNoticias(noticias, 'noticias-container');

    const eventos = await DataService.fetchEventos();
    UIRenderer.renderEventos(eventos, 'eventos-container');

    const links = await DataService.fetchLinks();
    UIRenderer.renderLinks(links, 'links-container');
  }
};

// Start the app when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  App.init();

  // Listen for language changes and re-render localized dashboard elements
  document.addEventListener('languageChanged', async () => {
    const report = await DataService.fetchDailyReport();
    UIRenderer.renderDailyReport(report);
    
    const noticias = await DataService.fetchNoticias();
    UIRenderer.renderNoticias(noticias, 'noticias-container');
    
    const eventos = await DataService.fetchEventos();
    UIRenderer.renderEventos(eventos, 'eventos-container');
    
    const links = await DataService.fetchLinks();
    UIRenderer.renderLinks(links, 'links-container');
  });
});
