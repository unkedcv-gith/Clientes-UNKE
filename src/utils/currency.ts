/**
 * Utility functions for Argentine formatting (ARS currency, dates, math)
 */

// Formats a number as Argentine Pesos: $ 1.250.000 or $ 1.250.000,50
export function formatARS(amount: number | null | undefined, showDecimals: boolean = false): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '$ 0';
  }

  const parts = Math.abs(amount).toFixed(showDecimals ? 2 : 0).split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const decimalPart = parts[1];

  const formatted = decimalPart !== undefined ? `${integerPart},${decimalPart}` : integerPart;
  const sign = amount < 0 ? '-' : '';

  return `${sign}$ ${formatted}`;
}

// Parses a string with dots and commas into a clean number
export function parseARS(value: string | number): number {
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  if (!value) return 0;

  // Clean currency symbols, spaces, keep only digits, dots and commas
  const cleaned = value.toString().replace(/[^0-9.,-]/g, '').trim();

  if (!cleaned) return 0;

  // If contains comma as decimal separator (Argentine system: 1.500.000,50)
  if (cleaned.includes(',')) {
    const standardized = cleaned.replace(/\./g, '').replace(',', '.');
    const parsed = parseFloat(standardized);
    return isNaN(parsed) ? 0 : parsed;
  }

  // If only dots: e.g. "1.500.000" -> 1500000
  if (cleaned.includes('.')) {
    // Check if dot might be decimal (e.g. 1500.50) or thousands (1.500.000)
    const dotCount = (cleaned.match(/\./g) || []).length;
    if (dotCount > 1 || cleaned.split('.')[1]?.length === 3) {
      const parsed = parseFloat(cleaned.replace(/\./g, ''));
      return isNaN(parsed) ? 0 : parsed;
    }
  }

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

// Formats a string to include thousands separators dynamically (e.g. for input fields)
export function formatAmountInput(value: string | number): string {
  const strValue = value.toString();
  // Strip all non-digit characters
  const cleaned = strValue.replace(/\D/g, '');
  if (!cleaned) return '';
  const num = parseInt(cleaned, 10);
  if (isNaN(num)) return '';
  // Format with dots as thousands separators
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// Formats YYYY-MM-DD to DD/MM/YYYY
export function formatDateAR(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  try {
    const [year, month, day] = dateString.split('T')[0].split('-');
    if (!year || !month || !day) return dateString;
    return `${day}/${month}/${year}`;
  } catch {
    return dateString;
  }
}

// Returns a human-friendly string for deadline difference
export function getDeadlineBadge(deliveryDate: string, status?: string): {
  label: string;
  isUrgent: boolean;
  isLate: boolean;
  colorClass: string;
} {
  if (!deliveryDate || status === 'completado' || status === 'entregado') {
    return {
      label: 'Completado',
      isUrgent: false,
      isLate: false,
      colorClass: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    };
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const [y, m, d] = deliveryDate.split('-').map(Number);
  const target = new Date(y, m - 1, d);
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const days = Math.abs(diffDays);
    return {
      label: `Atrasado por ${days} ${days === 1 ? 'día' : 'días'}`,
      isUrgent: true,
      isLate: true,
      colorClass: 'text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800 font-medium',
    };
  }

  if (diffDays === 0) {
    return {
      label: '¡Entrega HOY!',
      isUrgent: true,
      isLate: false,
      colorClass: 'text-amber-800 bg-amber-100 dark:bg-amber-950/60 dark:text-amber-200 border-amber-300 dark:border-amber-700 font-semibold',
    };
  }

  if (diffDays === 1) {
    return {
      label: 'Entrega mañana',
      isUrgent: true,
      isLate: false,
      colorClass: 'text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    };
  }

  if (diffDays <= 4) {
    return {
      label: `En ${diffDays} días`,
      isUrgent: true,
      isLate: false,
      colorClass: 'text-orange-700 bg-orange-50 dark:bg-orange-950/40 dark:text-orange-300 border-orange-200 dark:border-orange-800',
    };
  }

  return {
    label: `En ${diffDays} días (${formatDateAR(deliveryDate)})`,
    isUrgent: false,
    isLate: false,
    colorClass: 'text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  };
}

// Generate unique ID
export function generateId(prefix: string = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
}
