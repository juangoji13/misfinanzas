export type RegionCode = 'CO' | 'MX' | 'US' | 'AR' | 'ES';

export type RegionConfig = {
  code: RegionCode;
  name: string;
  locale: string;
  currency: string;
  currencySymbol: string;
  /** COP and ARS typically shown without cents in daily use. */
  fractionDigits: number;
  timezone: string;
};

export const REGIONS: Record<RegionCode, RegionConfig> = {
  CO: {
    code: 'CO',
    name: 'Colombia',
    locale: 'es-CO',
    currency: 'COP',
    currencySymbol: '$',
    fractionDigits: 0,
    timezone: 'America/Bogota',
  },
  MX: {
    code: 'MX',
    name: 'México',
    locale: 'es-MX',
    currency: 'MXN',
    currencySymbol: '$',
    fractionDigits: 2,
    timezone: 'America/Mexico_City',
  },
  US: {
    code: 'US',
    name: 'Estados Unidos',
    locale: 'en-US',
    currency: 'USD',
    currencySymbol: '$',
    fractionDigits: 2,
    timezone: 'America/New_York',
  },
  AR: {
    code: 'AR',
    name: 'Argentina',
    locale: 'es-AR',
    currency: 'ARS',
    currencySymbol: '$',
    fractionDigits: 0,
    timezone: 'America/Argentina/Buenos_Aires',
  },
  ES: {
    code: 'ES',
    name: 'España',
    locale: 'es-ES',
    currency: 'EUR',
    currencySymbol: '€',
    fractionDigits: 2,
    timezone: 'Europe/Madrid',
  },
};

export const DEFAULT_REGION: RegionCode = 'CO';
export const REGION_STORAGE_KEY = 'finanzas.region';

export function detectRegion(): RegionCode {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale ?? '';
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? '';
    if (tz.includes('Bogota') || locale.toLowerCase().includes('co')) return 'CO';
    if (tz.includes('Mexico') || locale.toLowerCase().includes('mx')) return 'MX';
    if (tz.includes('Argentina') || locale.toLowerCase().includes('ar')) return 'AR';
    if (tz.includes('Madrid') || locale.toLowerCase().startsWith('es-es')) return 'ES';
    if (locale.toLowerCase().startsWith('en-us')) return 'US';
  } catch {
    /* keep default */
  }
  return DEFAULT_REGION;
}
