import Image from 'next/image'

interface Props {
  title?: string
  subtitle?: string
  children?: React.ReactNode
}

/**
 * Banner réutilisable avec placeholder SVG village.
 * Pour remplacer par une vraie image : ajouter /public/hero-banner.jpg (1440x160px)
 * et décommenter la ligne <Image ...> ci-dessous.
 */
export default function HeroBanner({ title, subtitle, children }: Props) {
  return (
    <div className="relative overflow-hidden flex items-center justify-center" style={{ background: '#F5E8D4', height: 160 }}>

      {/* === PLACEHOLDER SVG — remplacer par Image quand disponible === */}
      {/* Pour utiliser une vraie image :
          1. Mettre hero-banner.jpg dans /public/ (taille recommandée : 1440x160px)
          2. Supprimer le bloc SVG ci-dessous
          3. Décommenter le bloc Image
      */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1440 160" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <rect width="1440" height="160" fill="#F5E8D4"/>
        <rect x="0" y="85" width="1440" height="75" fill="#EDD9BE"/>
        {/* Maisons gauche */}
        <rect x="40" y="45" width="110" height="80" rx="4" fill="#D4A882"/>
        <path d="M35 50 L95 10 L155 50z" fill="#C08060"/>
        <rect x="68" y="75" width="20" height="50" rx="3" fill="#B07040"/>
        <rect x="100" y="65" width="28" height="22" rx="2" fill="#F5E8D0"/>
        <rect x="160" y="60" width="90" height="65" rx="3" fill="#C89060"/>
        <path d="M155 65 L205 28 L255 65z" fill="#B07040"/>
        <rect x="186" y="85" width="16" height="40" rx="2" fill="#9A5A30"/>
        {/* Arbres gauche */}
        <ellipse cx="270" cy="68" rx="28" ry="24" fill="#A8C070"/>
        <rect x="267" y="88" width="6" height="22" fill="#7A8040"/>
        <ellipse cx="315" cy="75" rx="20" ry="18" fill="#90B055"/>
        <rect x="312" y="90" width="6" height="18" fill="#7A8040"/>
        {/* Maisons droite */}
        <rect x="1110" y="50" width="100" height="75" rx="4" fill="#D4A882"/>
        <path d="M1105 55 L1160 18 L1215 55z" fill="#C08060"/>
        <rect x="1140" y="78" width="18" height="47" rx="3" fill="#B07040"/>
        <rect x="1220" y="55" width="120" height="70" rx="3" fill="#C89060"/>
        <path d="M1215 60 L1280 22 L1345 60z" fill="#B07040"/>
        <rect x="1258" y="82" width="20" height="43" rx="2" fill="#9A5A30"/>
        {/* Arbres droite */}
        <ellipse cx="1080" cy="70" rx="26" ry="22" fill="#A8C070"/>
        <rect x="1077" y="89" width="6" height="20" fill="#7A8040"/>
        {/* Camionnette */}
        <rect x="1340" y="90" width="80" height="50" rx="4" fill="#E8D0B0"/>
        <rect x="1355" y="78" width="45" height="30" rx="3" fill="#D0B898"/>
        <circle cx="1360" cy="140" r="10" fill="#8B7355"/>
        <circle cx="1400" cy="140" r="10" fill="#8B7355"/>
        {/* Route */}
        <rect x="300" y="128" width="840" height="5" rx="2" fill="#E0CCAA" opacity="0.5"/>
      </svg>

      {/* === VRAIE IMAGE (décommenter quand disponible) ===
      <Image
        src="/hero-banner.jpg"
        alt=""
        fill
        className="object-cover"
        priority
        aria-hidden="true"
      />
      */}

      {/* Contenu */}
      {(title || children) && (
        <div className="relative z-10 text-center">
          {title && (
            <h1 style={{ fontFamily: 'Lora, serif', fontSize: 26, fontWeight: 600, color: '#2C1A0E', marginBottom: 4 }}>
              {title}
            </h1>
          )}
          {subtitle && (
            <p style={{ fontSize: 13, color: '#8B6848' }}>{subtitle}</p>
          )}
          {children}
        </div>
      )}
    </div>
  )
}
