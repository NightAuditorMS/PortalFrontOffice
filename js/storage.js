export const storageKey = 'nightAuditProgress_v72';

export function getSavedProgress() {
  try {
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : {};
  } catch (e) {
    return {};
  }
}

export function saveProgress(dataToMerge) {
  try {
    const current = getSavedProgress();
    const updated = { ...current, ...dataToMerge };
    localStorage.setItem(storageKey, JSON.stringify(updated));
  } catch (e) {
    console.error('Error saving progress:', e);
  }
}

export function saveReportToHistory(name, type, pdfBase64, date) {
  try {
    const key = 'portal-historical-reports';
    const list = JSON.parse(localStorage.getItem(key) || '[]');
    const newReport = {
      id: 'stored-' + Date.now(),
      date: date || new Date().toISOString().split('T')[0],
      name: name,
      type: type,
      pdfUrl: `data:application/pdf;base64,${pdfBase64}`
    };
    list.unshift(newReport);
    localStorage.setItem(key, JSON.stringify(list));
  } catch (e) {
    console.error('Error saving report to history:', e);
  }
}
