import { Customer, Sale, Product } from '../types/index.ts';

/**
 * Exports Debt Book (Kitabu cha Madeni) to CSV
 */
export function exportDebtsToCSV(customers: Customer[], shopName: string): void {
  const headers = ['Name', 'Nickname', 'Phone Number', 'Location', 'Current Debt (KES)', 'Total Borrowed (KES)', 'Total Repaid (KES)', 'Repayment Rate (%)', 'Consent Date'];
  const rows = customers.map(c => [
    `"${c.name}"`,
    `"${c.nickname || ''}"`,
    `"${c.phoneNumber}"`,
    `"${c.locationNote || ''}"`,
    c.currentDebt,
    c.totalBorrowed,
    c.totalRepaid,
    c.totalBorrowed > 0 ? Math.round((c.totalRepaid / c.totalBorrowed) * 100) : 0,
    `"${c.consent?.consentedAt || c.createdAt}"`,
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `${shopName.replace(/\s+/g, '_')}_Debts_Report_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Exports Sales History to CSV
 */
export function exportSalesToCSV(sales: Sale[], shopName: string): void {
  const headers = ['Receipt No', 'Date', 'Payment Type', 'Customer', 'Items Count', 'Total Amount (KES)', 'Total Cost (KES)', 'Gross Profit (KES)'];
  const rows = sales.map(s => [
    `"${s.receiptNumber}"`,
    `"${new Date(s.createdAt).toLocaleString()}"`,
    `"${s.paymentType.toUpperCase()}"`,
    `"${s.customerName || 'Walk-in'}"`,
    s.items.length,
    s.totalAmount,
    s.totalCost,
    s.grossProfit,
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `${shopName.replace(/\s+/g, '_')}_Sales_History_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
