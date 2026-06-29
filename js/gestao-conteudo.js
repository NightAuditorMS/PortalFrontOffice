// js/gestao-conteudo.js
import './common.js';
import { checkAuthStatus, checkRole } from './auth.js';
import { getTranslation } from './lang.js';

// Selectors
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

// State
let currentUserEmail = '';

// Check role restrictions on load
document.addEventListener('DOMContentLoaded', async () => {
  const user = await checkAuthStatus();
  if (!user || !checkRole(user.email)) {
    const lang = localStorage.getItem('portal-lang') || 'pt';
    alert(getTranslation(lang, 'msg_unauthorized_admin'));
    window.location.href = 'index.html';
    return;
  }
  currentUserEmail = user.email;
  initCMS();
});

// Mock Database of Recent Publications
const recentPublications = [
  { type: 'noticias', title: 'Manutenção de Elevadores', date: '2026-06-29', author: 'nightauditor@mythic.sanahotels.com', info: 'Elevador B indisponível das 02:00 às 04:00' },
  { type: 'wakeup', title: 'Quarto 314 - Acordar', date: '2026-06-29', author: 'nightauditor@mythic.sanahotels.com', info: 'Chamada de despertar às 07:00' }
];

function initCMS() {
  const selectEl = $('#cms-publish-select');
  const formContainer = $('#cms-form-container');
  const alertBox = $('#cms-alert-box');

  // Load select option change listener
  selectEl.addEventListener('change', (e) => {
    const category = e.target.value;
    alertBox.style.display = 'none'; // Hide alerts on form change
    
    // Add smooth transition effect
    formContainer.style.opacity = '0';
    formContainer.style.transform = 'translateY(10px)';
    
    setTimeout(() => {
      renderForm(category);
      formContainer.style.opacity = '1';
      formContainer.style.transform = 'translateY(0)';
      
      // Update form translations
      const lang = localStorage.getItem('portal-lang') || 'pt';
      const event = new CustomEvent('languageChanged', { detail: { lang } });
      document.dispatchEvent(event);
    }, 200);
  });

  // Render the initial placeholder and publications list
  renderRecentPublications();
}

// Generate Category-specific Forms
function renderForm(category) {
  const container = $('#cms-form-container');
  const lang = localStorage.getItem('portal-lang') || 'pt';
  const defaultDate = new Date().toISOString().split('T')[0];

  let formHTML = '';

  switch (category) {
    case 'noticias':
    case 'eventos':
    case 'grupos':
      formHTML = `
        <form id="cms-dynamic-form" class="cms-form-card show">
          <input type="hidden" name="category" value="${category}">
          <div class="cms-form-grid">
            <div class="cms-input-group">
              <label for="form-title" data-i18n="lbl_title">Título</label>
              <input type="text" id="form-title" name="title" class="cms-input" required placeholder="Ex.: Manutenção da Piscina">
            </div>
            <div class="cms-input-group">
              <label for="form-date" data-i18n="lbl_date">Data</label>
              <input type="date" id="form-date" name="date" class="cms-input" value="${defaultDate}" required>
            </div>
          </div>
          
          <div class="cms-input-group">
            <label for="form-description" data-i18n="lbl_description">Descrição / Notas</label>
            <textarea id="form-description" name="description" class="cms-textarea" rows="4" required placeholder="Escreva os detalhes da publicação..."></textarea>
          </div>

          <div class="cms-form-grid" style="margin-top: 12px;">
            <div class="cms-input-group">
              <label for="form-author" data-i18n="lbl_author">Autor / Auditor</label>
              <input type="text" id="form-author" name="author" class="cms-input" value="${currentUserEmail}" readonly>
            </div>
          </div>

          <button type="submit" class="final-btn" style="margin-top: 16px;" data-i18n="btn_publish">Publicar</button>
        </form>
      `;
      break;

    case 'vip':
      formHTML = `
        <form id="cms-dynamic-form" class="cms-form-card show">
          <input type="hidden" name="category" value="vip">
          <div class="cms-form-grid">
            <div class="cms-input-group">
              <label for="vip-room">Quarto VIP</label>
              <input type="text" id="vip-room" name="room" class="cms-input" placeholder="Ex.: 402" required>
            </div>
            <div class="cms-input-group">
              <label for="vip-guest">Nome do Hóspede</label>
              <input type="text" id="vip-guest" name="guestName" class="cms-input" placeholder="Ex.: John Smith" required>
            </div>
          </div>

          <div class="cms-form-grid">
            <div class="cms-input-group">
              <label for="vip-level">Nível VIP</label>
              <select id="vip-level" name="vipLevel" class="cms-select" style="padding: 10px;">
                <option value="VIP 1 (Press/VIP)">VIP 1 (Press/VIP)</option>
                <option value="VIP 2 (Corporate)">VIP 2 (Corporate)</option>
                <option value="VIP 3 (Regular)">VIP 3 (Regular)</option>
              </select>
            </div>
            <div class="cms-input-group">
              <label for="form-date" data-i18n="lbl_date">Data</label>
              <input type="date" id="form-date" name="date" class="cms-input" value="${defaultDate}" required>
            </div>
          </div>

          <div class="cms-input-group">
            <label for="vip-request">Tratamento VIP / Notas Especiais</label>
            <textarea id="vip-request" name="description" class="cms-textarea" rows="3" placeholder="Ex.: Espumante e fruta laminada à chegada."></textarea>
          </div>

          <div class="cms-input-group" style="margin-top: 12px; display: none;">
            <input type="text" name="author" value="${currentUserEmail}">
          </div>

          <button type="submit" class="final-btn" style="margin-top: 16px;" data-i18n="btn_publish">Publicar</button>
        </form>
      `;
      break;

    case 'transferes':
      formHTML = `
        <form id="cms-dynamic-form" class="cms-form-card show">
          <input type="hidden" name="category" value="transferes">
          <div class="cms-form-grid">
            <div class="cms-input-group">
              <label for="trans-flight">Nº de Voo</label>
              <input type="text" id="trans-flight" name="flightNum" class="cms-input" placeholder="Ex.: TP 1234" required>
            </div>
            <div class="cms-input-group">
              <label for="trans-time">Hora do Voo / Pickup</label>
              <input type="time" id="trans-time" name="pickupTime" class="cms-input" required>
            </div>
          </div>

          <div class="cms-form-grid">
            <div class="cms-input-group">
              <label for="trans-dest">Trajeto / Destino</label>
              <input type="text" id="trans-dest" name="destination" class="cms-input" placeholder="Ex.: Aeroporto -> Hotel" required>
            </div>
            <div class="cms-input-group">
              <label for="trans-pax">Nº de Pessoas (Pax)</label>
              <input type="number" id="trans-pax" name="pax" class="cms-input" min="1" value="2" required>
            </div>
          </div>

          <div class="cms-input-group">
            <label for="trans-notes">Observações do Motorista</label>
            <textarea id="trans-notes" name="description" class="cms-textarea" rows="2" placeholder="Ex.: Necessita de cadeira de bebé."></textarea>
          </div>

          <div class="cms-input-group" style="margin-top: 12px; display: none;">
            <input type="text" name="author" value="${currentUserEmail}">
            <input type="date" name="date" value="${defaultDate}">
          </div>

          <button type="submit" class="final-btn" style="margin-top: 16px;" data-i18n="btn_publish">Publicar</button>
        </form>
      `;
      break;

    case 'wakeup':
      formHTML = `
        <form id="cms-dynamic-form" class="cms-form-card show">
          <input type="hidden" name="category" value="wakeup">
          <div class="cms-form-grid">
            <div class="cms-input-group">
              <label for="wu-room">Quarto</label>
              <input type="text" id="wu-room" name="room" class="cms-input" placeholder="Ex.: 210" required>
            </div>
            <div class="cms-input-group">
              <label for="wu-time">Hora Despertar</label>
              <input type="time" id="wu-time" name="wuTime" class="cms-input" required>
            </div>
          </div>

          <div class="cms-form-grid">
            <div class="cms-input-group">
              <label for="wu-guest">Hóspede</label>
              <input type="text" id="wu-guest" name="guestName" class="cms-input" placeholder="Nome Completo">
            </div>
            <div class="cms-input-group">
              <label for="form-date" data-i18n="lbl_date">Data</label>
              <input type="date" id="form-date" name="date" class="cms-input" value="${defaultDate}" required>
            </div>
          </div>

          <div class="cms-input-group">
            <label for="wu-notes">Observações</label>
            <textarea id="wu-notes" name="description" class="cms-textarea" rows="2" placeholder="Ex.: Despertar em Inglês. Pretende táxi após acordar."></textarea>
          </div>

          <div class="cms-input-group" style="margin-top: 12px; display: none;">
            <input type="text" name="author" value="${currentUserEmail}">
          </div>

          <button type="submit" class="final-btn" style="margin-top: 16px;" data-i18n="btn_publish">Publicar</button>
        </form>
      `;
      break;

    case 'taxis':
      formHTML = `
        <form id="cms-dynamic-form" class="cms-form-card show">
          <input type="hidden" name="category" value="taxis">
          <div class="cms-form-grid">
            <div class="cms-input-group">
              <label for="taxi-room">Quarto</label>
              <input type="text" id="taxi-room" name="room" class="cms-input" placeholder="Ex.: 105" required>
            </div>
            <div class="cms-input-group">
              <label for="taxi-time">Hora de Saída</label>
              <input type="time" id="taxi-time" name="taxiTime" class="cms-input" required>
            </div>
          </div>

          <div class="cms-form-grid">
            <div class="cms-input-group">
              <label for="taxi-dest">Destino</label>
              <input type="text" id="taxi-dest" name="destination" class="cms-input" placeholder="Ex.: Estação de Sta. Apolónia" required>
            </div>
            <div class="cms-input-group">
              <label for="taxi-pax">Nº de Passageiros</label>
              <input type="number" id="taxi-pax" name="pax" class="cms-input" min="1" value="1" required>
            </div>
          </div>

          <div class="cms-input-group" style="margin-top: 12px; display: none;">
            <input type="text" name="author" value="${currentUserEmail}">
            <input type="date" name="date" value="${defaultDate}">
          </div>

          <button type="submit" class="final-btn" style="margin-top: 16px;" data-i18n="btn_publish">Publicar</button>
        </form>
      `;
      break;

    case 'breakfast':
      formHTML = `
        <form id="cms-dynamic-form" class="cms-form-card show">
          <input type="hidden" name="category" value="breakfast">
          <div class="cms-form-grid">
            <div class="cms-input-group">
              <label for="bf-room">Quarto</label>
              <input type="text" id="bf-room" name="room" class="cms-input" placeholder="Ex.: 508" required>
            </div>
            <div class="cms-input-group">
              <label for="bf-qty">Nº de Caixas</label>
              <input type="number" id="bf-qty" name="qty" class="cms-input" min="1" value="1" required>
            </div>
          </div>

          <div class="cms-form-grid">
            <div class="cms-input-group">
              <label for="bf-time">Hora de Recolha</label>
              <input type="time" id="bf-time" name="pickupTime" class="cms-input" required>
            </div>
            <div class="cms-input-group">
              <label for="form-date" data-i18n="lbl_date">Data de Saída</label>
              <input type="date" id="form-date" name="date" class="cms-input" value="${defaultDate}" required>
            </div>
          </div>

          <div class="cms-input-group">
            <label for="bf-diet">Restrições Alimentares / Notas</label>
            <textarea id="bf-diet" name="description" class="cms-textarea" rows="2" placeholder="Ex.: 1 Sem glúten, 1 Vegetariano."></textarea>
          </div>

          <div class="cms-input-group" style="margin-top: 12px; display: none;">
            <input type="text" name="author" value="${currentUserEmail}">
          </div>

          <button type="submit" class="final-btn" style="margin-top: 16px;" data-i18n="btn_publish">Publicar</button>
        </form>
      `;
      break;

    default:
      formHTML = `
        <div class="muted" style="text-align: center; padding: 40px 0; border: 1px dashed var(--border); border-radius: 8px;">
          Selecione uma categoria acima para carregar o respetivo formulário de publicação.
        </div>
      `;
  }

  container.innerHTML = formHTML;

  // Add form submit listener
  const formEl = $('#cms-dynamic-form');
  if (formEl) {
    formEl.addEventListener('submit', (e) => {
      e.preventDefault();
      handleFormSubmission(new FormData(formEl));
    });
  }
}

// Handle Mock Publish
function handleFormSubmission(formData) {
  const alertBox = $('#cms-alert-box');
  const lang = localStorage.getItem('portal-lang') || 'pt';

  const category = formData.get('category');
  let title = '';
  let details = '';

  // Extract info according to category
  if (category === 'noticias' || category === 'eventos' || category === 'grupos') {
    title = formData.get('title');
    details = formData.get('description');
  } else if (category === 'vip') {
    title = `VIP Alert - Quarto ${formData.get('room')}`;
    details = `${formData.get('guestName')} (${formData.get('vipLevel')}) - ${formData.get('description')}`;
  } else if (category === 'transferes') {
    title = `Transfer: ${formData.get('flightNum')}`;
    details = `Hora: ${formData.get('pickupTime')} | Rota: ${formData.get('destination')} | Pax: ${formData.get('pax')} | Obs: ${formData.get('description') || 'Sem observações'}`;
  } else if (category === 'wakeup') {
    title = `Wake-up Call: Quarto ${formData.get('room')}`;
    details = `Hora: ${formData.get('wuTime')} | Hóspede: ${formData.get('guestName') || '-'} | Obs: ${formData.get('description') || 'Sem observações'}`;
  } else if (category === 'taxis') {
    title = `Táxi: Quarto ${formData.get('room')}`;
    details = `Hora: ${formData.get('taxiTime')} | Destino: ${formData.get('destination')} | Pax: ${formData.get('pax')}`;
  } else if (category === 'breakfast') {
    title = `Breakfast Boxes: Quarto ${formData.get('room')}`;
    details = `Qtd: ${formData.get('qty')} | Hora Recolha: ${formData.get('pickupTime')} | Notas: ${formData.get('description') || 'Sem observações'}`;
  }

  const date = formData.get('date') || new Date().toISOString().split('T')[0];
  const author = formData.get('author') || currentUserEmail;

  if (!title || !details) {
    alertBox.className = 'cms-alert cms-alert-error';
    alertBox.textContent = getTranslation(lang, 'msg_fill_fields');
    alertBox.style.display = 'block';
    return;
  }

  // Add to local mock database
  recentPublications.unshift({
    type: category,
    title: title,
    date: date,
    author: author,
    info: details
  });

  // Display success message
  alertBox.className = 'cms-alert cms-alert-success';
  alertBox.textContent = getTranslation(lang, 'msg_publish_success');
  alertBox.style.display = 'block';

  // Clear form and redraw recent publications
  renderForm(category);
  renderRecentPublications();
}

// Render dynamic table at the bottom of the CMS page
function renderRecentPublications() {
  const mainEl = $('.dashboard-main');
  
  // Remove existing block if present
  const existingBlock = $('#cms-recent-publications-block');
  if (existingBlock) {
    existingBlock.remove();
  }

  const publicationsHTML = recentPublications.map(pub => `
    <article class="noticia-item" style="margin-bottom: 12px; background: var(--surface);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <h4 style="margin: 0; color: var(--gold); font-size: 14.5px;">${pub.title}</h4>
        <span class="badge" style="font-size: 11px; padding: 2px 8px; border-radius: 4px; background: rgba(198,166,103,0.12); color: var(--gold-2); text-transform: uppercase; font-weight: bold;">
          ${pub.type}
        </span>
      </div>
      <div class="notification-item-meta" style="margin-bottom: 6px;">
        <span>Autor: ${pub.author}</span>
        <span>${pub.date}</span>
      </div>
      <p style="margin: 0; font-size: 13px; color: var(--muted);">${pub.info}</p>
    </article>
  `).join('');

  const publicationsBlock = document.createElement('section');
  publicationsBlock.id = 'cms-recent-publications-block';
  publicationsBlock.className = 'card';
  publicationsBlock.style.marginTop = '24px';
  publicationsBlock.innerHTML = `
    <h2 style="font-size: 15px; text-transform: uppercase; letter-spacing: 0.08em; border-bottom: 1px solid var(--border); padding-bottom: 10px; margin-bottom: 16px;">
      Publicações Recentes do Turno (Mock DB)
    </h2>
    <div class="notification-list">
      ${publicationsHTML || '<p class="muted" style="text-align: center;">Nenhuma publicação efetuada neste turno.</p>'}
    </div>
  `;

  mainEl.appendChild(publicationsBlock);
}
