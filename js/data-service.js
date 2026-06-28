export const DataService = {
  async fetchHistoricalReports() {
    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 200));

    const localReports = JSON.parse(localStorage.getItem('portal-historical-reports') || '[]');
    
    const mockReports = [
      { id: 'mock-1', date: '2026-06-27', name: 'Relatório Diário - 27/06/2026', type: 'Daily Report', pdfUrl: '#', data: { occupancy: 82, totalRevenue: 12450.50 } },
      { id: 'mock-2', date: '2026-06-27', name: 'Checklist Turno Noite - 27/06/2026', type: 'Checklist', pdfUrl: '#', data: { auditor: 'João Silva', shift: 'noite' } },
      { id: 'mock-3', date: '2026-06-27', name: 'Contagem de Caixa - Turno Noite', type: 'Contagem de Caixa', pdfUrl: '#', data: { totalCaixa: 800.00, deposito: 50.00 } },
      { id: 'mock-4', date: '2026-06-26', name: 'Relatório Diário - 26/06/2026', type: 'Daily Report', pdfUrl: '#', data: { occupancy: 78, totalRevenue: 11200.00 } },
      { id: 'mock-5', date: '2026-06-26', name: 'Checklist Turno Tarde - 26/06/2026', type: 'Checklist', pdfUrl: '#', data: { auditor: 'Maria Lima', shift: 'tarde' } }
    ];

    return [...localReports, ...mockReports];
  }
};
