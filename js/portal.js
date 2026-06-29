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

// Dynamic mock data for notifications
const mockNotifications = {
  noticias: [
    { title: 'Manutenção de Elevadores', date: '2026-06-29', author: 'Auditoria de Noite', desc: 'O Elevador B estará fora de serviço para manutenção periódica preventiva das 02:00 às 04:00.' },
    { title: 'Nova Farda Receção', date: '2026-06-28', author: 'Direção Geral', desc: 'As novas fardas serão entregues a partir da próxima quarta-feira na lavandaria.' }
  ],
  eventos: [
    { title: 'Conferência Anual Tech', date: '2026-06-29', author: 'Eventos Desk', desc: 'Check-in de 150 participantes no foyer principal a partir das 08:30.' },
    { title: 'Jantar de Gala SANA', date: '2026-06-29', author: 'F&B Manager', desc: 'Jantar privado para 80 pessoas no Salão Nobre a partir das 20:00.' }
  ],
  vip: [
    { title: 'VIP Alert: Quarto 402', date: '2026-06-29', author: 'Relações Públicas', desc: 'Hóspede John Smith (CEO Mythic Corp). VIP 1. Colocar espumante e fruta às 15:00.' },
    { title: 'VIP Alert: Quarto 102', date: '2026-06-29', author: 'Direção Geral', desc: 'Hóspede Maria Silva. VIP 2. Tratamento standard e acompanhamento especial no check-in.' }
  ],
  transferes: [
    { title: 'Voo TP 1234 - Aeroporto -> Hotel', date: '2026-06-29', author: 'Concierge', desc: 'Pickup para 2 pax às 14:30. Motorista atribuído: José Rodrigues (Carrinha VIP).' },
    { title: 'Hotel -> Aeroporto - Quarto 304', date: '2026-06-29', author: 'Concierge', desc: 'Dropoff para 1 pax às 19:00. Motorista atribuído: Manuel Silva.' }
  ]
};

function initNotificationCenter() {
  const modalOverlay = document.getElementById('notification-modal-overlay');
  const modalTitle = document.getElementById('notification-modal-title');
  const modalBody = document.getElementById('notification-modal-body');
  const modalClose = document.getElementById('notification-modal-close');

  const wrapperButtons = document.querySelectorAll('.notification-icon-wrapper');

  wrapperButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const category = btn.getAttribute('data-category');
      const categoryLabel = btn.getAttribute('title');
      
      // Remove badge when clicked (read status)
      const badge = btn.querySelector('.notification-badge');
      if (badge) {
        badge.style.display = 'none';
      }

      // Populate modal content
      modalTitle.textContent = `Notificações - ${categoryLabel}`;
      
      const items = mockNotifications[category] || [];
      if (items.length === 0) {
        modalBody.innerHTML = '<p class="muted" style="text-align: center; padding: 20px 0;">Não existem novas notificações.</p>';
      } else {
        const lang = localStorage.getItem('portal-lang') || 'pt';
        const readMoreLabel = lang === 'en' ? 'Read more' : 'Ler tudo';
        
        modalBody.innerHTML = `
          <div class="notification-list">
            ${items.map(item => `
              <div class="notification-item-card">
                <h4>${item.title}</h4>
                <div class="notification-item-meta">
                  <span>Autor: ${item.author}</span>
                  <span>${item.date}</span>
                </div>
                <p class="notification-item-desc">${item.desc}</p>
                <a href="#" class="notification-read-more">${readMoreLabel} &rarr;</a>
              </div>
            `).join('')}
          </div>
        `;
      }

      // Open modal
      modalOverlay.classList.add('show');
    });
  });

  // Close modal click listeners
  if (modalClose) {
    modalClose.addEventListener('click', () => {
      modalOverlay.classList.remove('show');
    });
  }

  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      modalOverlay.classList.remove('show');
    }
  });
}

// Start the app when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  App.init();
  initNotificationCenter();

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
