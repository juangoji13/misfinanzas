import type { RegionConfig } from '@/config/regions';

export function parseAmount(raw: string, fractionDigits: number): number {
  if (!raw) return 0;
  if (fractionDigits === 0) {
    const digits = raw.replace(/[^\d]/g, '');
    return Number(digits) || 0;
  }
  const normalized = raw.replace(/[^\d.,-]/g, '').replace(/\.(?=.*[.,])/g, '').replace(',', '.');
  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
}

export function formatAmountInput(value: string, region: RegionConfig): string {
  const n = parseAmount(value, region.fractionDigits);
  if (!value.replace(/[^\d]/g, '')) return '';
  return n.toLocaleString(region.locale, {
    maximumFractionDigits: region.fractionDigits,
    minimumFractionDigits: 0,
  });
}

export function formatMoney(amount: number, region: RegionConfig, withCode = false): string {
  const abs = Math.abs(amount || 0);
  const body = abs.toLocaleString(region.locale, {
    minimumFractionDigits: region.fractionDigits,
    maximumFractionDigits: region.fractionDigits,
  });
  const sign = amount < 0 ? '-' : '';
  const prefix = region.currency === 'EUR' ? '' : region.currencySymbol;
  const suffix = region.currency === 'EUR' ? ` ${region.currencySymbol}` : withCode ? ` ${region.currency}` : '';
  return `${sign}${prefix}${body}${suffix}`;
}

export function formatDate(iso: string | null | undefined, region: RegionConfig): string {
  const d = iso ? new Date(iso) : new Date();
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(region.locale, { day: '2-digit', month: 'short', year: 'numeric' });
}
