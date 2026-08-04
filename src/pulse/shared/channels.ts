/**
 * Canales y marcas del portafolio PKGD.
 * "brand" y "channel" son las dos dimensiones nativas del grano diario.
 */

export const CHANNELS = [
  'ga4',
  'google_ads',
  'meta_ads',
  'instagram',
  'facebook',
  'youtube',
  'tiktok',
  'linkedin',
  'klaviyo',
] as const;
export type Channel = (typeof CHANNELS)[number];

export const CHANNEL_LABELS: Record<Channel, string> = {
  ga4: 'GA4 / Web',
  google_ads: 'Google Ads',
  meta_ads: 'Meta Ads',
  instagram: 'Instagram',
  // 'facebook' = páginas ORGÁNICAS (conector facebook_organic). No confundir con
  // 'meta_ads' (conector facebook), que es la inversión publicitaria de Meta.
  facebook: 'Facebook',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  linkedin: 'LinkedIn',
  klaviyo: 'Klaviyo',
};

/**
 * Marcas del portafolio. `portfolio` es el agregado (no una marca real);
 * se usa para métricas que solo existen a nivel cartera (Web sessions, etc.).
 */
export const BRANDS = [
  'portfolio',
  'pkgd',
  'g4',
  'palomo',
  'el_ateo',
  'arriesgado',
  'dos_locos',
  'el_acabo',
  'el_viejito',
  'esperalo',
  'ultramundo',
  'other',
] as const;
export type Brand = (typeof BRANDS)[number];

export const BRAND_LABELS: Record<string, string> = {
  portfolio: 'Portfolio',
  pkgd: 'PKGD Group',
  g4: 'G4 Tequila',
  palomo: 'Palomo Mezcal',
  el_ateo: 'El Ateo',
  arriesgado: 'Arriesgado',
  dos_locos: 'Dos Locos',
  el_acabo: 'El Acabo',
  el_viejito: 'El Viejito',
  esperalo: 'Espéralo',
  ultramundo: 'Ultramundo',
  other: 'Otras',
};

/** Marcas con Instagram conectado (tabs de la §3). Orden por relevancia. */
export const IG_BRANDS: Brand[] = [
  'g4', 'palomo', 'pkgd', 'el_ateo', 'arriesgado',
  'dos_locos', 'el_acabo', 'el_viejito', 'esperalo', 'ultramundo',
];

/**
 * Marcas con página de Facebook conectada. Windsor (facebook_organic) devuelve
 * las mismas 10 páginas que Instagram, así que el set coincide; se declara
 * aparte para que un canal no arrastre al otro si cambia.
 */
export const FB_BRANDS: Brand[] = [
  'g4', 'palomo', 'pkgd', 'el_ateo', 'arriesgado',
  'dos_locos', 'el_acabo', 'el_viejito', 'esperalo', 'ultramundo',
];
