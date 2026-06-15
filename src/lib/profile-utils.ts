// ─── Source des données ───────────────────────────────────────────────────────
// Prestataires  → provider_profiles (city, region, coords, cover_photo)
// Clients seuls → user_profiles
// Photo de profil (cercle) → user_profiles.profile_photo pour TOUT LE MONDE
// Avatar (bannière/cover) → provider_profiles.cover_photo (provider) ou header 1-4 (client)

// ─── Logos de type (Supabase CDN) ────────────────────────────────────────────
export const TYPE_LOGOS: Record<string, string> = {
  'Particular':   'https://dvtdjyxhiqucvzadluhv.supabase.co/storage/v1/object/public/Chama%20o%20Vizinho%20Bubble/logo%20particular.png',
  'Recibo Verde': 'https://dvtdjyxhiqucvzadluhv.supabase.co/storage/v1/object/public/Chama%20o%20Vizinho%20Bubble/logo%20pro%20verde.png',
  'Empresa':      'https://dvtdjyxhiqucvzadluhv.supabase.co/storage/v1/object/public/Chama%20o%20Vizinho%20Bubble/logo%20pro.png',
}

// Logo affiché pour les clients (particuliers)
export const CLIENT_LOGO = TYPE_LOGOS['Particular']

// ─── Bannière stable par ID ───────────────────────────────────────────────────
// Produit un numéro 1-4 stable (hash de l'ID) → même image à chaque rendu
export function getHeaderImage(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  }
  const n = (hash % 4) + 1
  return `/icons/header ${n}.jpg`
}

// ─── Couleurs badge type provider ────────────────────────────────────────────
export const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  'Particular':   { bg: '#FBF0E8', color: '#7A4F28' },
  'Recibo Verde': { bg: '#E8F5E9', color: '#2E7D32' },
  'Empresa':      { bg: '#E3F2FD', color: '#1565C0' },
}
