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
