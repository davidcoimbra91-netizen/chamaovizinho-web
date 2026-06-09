import Link from 'next/link'

export default function HomeLoggedOut() {
  return (
    <>
      <style>{`
        .cv-hero { width:100%; background:transparent; overflow:hidden; position:relative; font-family:Inter,Arial,sans-serif; }
        .cv-hero-inner { max-width:1220px; margin:0 auto; padding:72px 24px; display:grid; grid-template-columns:0.92fr 1.08fr; align-items:center; gap:30px; position:relative; z-index:1; }
        .cv-hero-left { max-width:560px; }
        .cv-mini-badge { display:inline-flex; align-items:center; background:rgba(223,106,54,0.14); color:#d86435; padding:10px 18px; border-radius:999px; font-size:14px; font-weight:700; margin-bottom:24px; }
        .cv-title { font-size:clamp(46px,6vw,76px); line-height:0.93; letter-spacing:-2.5px; color:#242424; margin:0; font-weight:900; }
        .cv-title span { color:#df6a36; font-style:italic; font-weight:500; }
        .cv-subtitle { margin-top:24px; font-size:clamp(19px,2vw,25px); line-height:1.45; color:#5d544d; margin-bottom:34px; max-width:540px; }
        .cv-button { display:inline-flex; align-items:center; justify-content:center; gap:14px; background:linear-gradient(135deg,#df6a36,#cb5226); color:#fff!important; text-decoration:none; padding:19px 32px; border-radius:20px; font-size:19px; font-weight:800; box-shadow:0 18px 34px rgba(203,82,38,0.30); transition:all .2s ease; cursor:pointer; border:none; }
        .cv-button:hover { transform:translateY(-2px); box-shadow:0 22px 40px rgba(203,82,38,0.38); }
        .cv-points-proof { margin-top:18px; display:inline-flex; align-items:center; gap:10px; background:rgba(223,106,54,0.08); border:1px solid rgba(223,106,54,0.10); color:#cb5226!important; padding:12px 16px; border-radius:16px; font-size:15px; font-weight:700; text-decoration:none; transition:all .2s ease; }
        .cv-proofs { display:flex; flex-direction:column; gap:15px; margin-top:34px; }
        .cv-proof { display:flex; align-items:center; gap:14px; }
        .cv-proof-icon { width:46px; height:46px; background:rgba(255,255,255,0.9); border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:20px; box-shadow:0 10px 22px rgba(70,40,20,0.08); flex-shrink:0; }
        .cv-proof strong { display:block; color:#242424; font-size:16px; font-weight:800; }
        .cv-proof span { display:block; margin-top:2px; color:#7a7067; font-size:14px; }
        .cv-hero-right { position:relative; display:flex; justify-content:center; align-items:center; }
        .cv-hero-image { width:100%; max-width:760px; height:auto; display:block; position:relative; z-index:2; filter:drop-shadow(0 35px 45px rgba(60,30,10,0.16)); }

        .cv-services { width:100%; background:transparent; padding:76px 20px; font-family:Inter,Arial,sans-serif; }
        .cv-services-inner { max-width:1180px; margin:0 auto; }
        .cv-services-head { text-align:center; margin-bottom:46px; }
        .cv-services-badge { display:inline-flex; align-items:center; justify-content:center; background:rgba(223,106,54,0.14); color:#d86435; padding:10px 18px; border-radius:999px; font-size:14px; font-weight:800; margin-bottom:18px; }
        .cv-services-title { margin:0; color:#242424; font-size:clamp(36px,4vw,56px); line-height:1; letter-spacing:-1.8px; font-weight:900; }
        .cv-services-subtitle { margin:18px auto 0; color:#6d645d; font-size:18px; line-height:1.5; max-width:650px; }
        .cv-services-grid { display:grid; grid-template-columns:repeat(5,1fr); gap:18px; }
        .cv-service-card { background:rgba(255,255,255,0.82); border:1px solid rgba(120,80,45,0.10); border-radius:26px; padding:26px 16px 22px; text-decoration:none; color:#242424; text-align:center; transition:all .22s ease; box-shadow:0 14px 28px rgba(60,35,20,0.07); min-height:188px; display:flex; flex-direction:column; align-items:center; justify-content:center; cursor:pointer; }
        .cv-service-card:hover { transform:translateY(-6px); box-shadow:0 22px 42px rgba(203,82,38,0.17); border-color:rgba(223,106,54,0.30); }
        .cv-service-icon-wrap { width:86px; height:86px; border-radius:24px; background:linear-gradient(180deg,#fffaf5,#f8eee3); display:flex; align-items:center; justify-content:center; margin-bottom:18px; box-shadow:inset 0 1px 0 rgba(255,255,255,0.75); }
        .cv-service-icon { width:52px; height:52px; object-fit:contain; }
        .cv-service-name { font-size:18px; font-weight:850; color:#242424; margin-bottom:8px; line-height:1.2; }
        .cv-service-desc { font-size:14px; line-height:1.45; color:#7a7068; max-width:180px; }

        .cv-activity { width:100%; background:transparent; padding:82px 20px; font-family:Inter,Arial,sans-serif; }
        .cv-activity-inner { max-width:1180px; margin:0 auto; }
        .cv-activity-head { text-align:center; margin-bottom:46px; }
        .cv-activity-badge { display:inline-flex; align-items:center; gap:9px; background:rgba(223,106,54,0.12); color:#d86435; padding:10px 18px; border-radius:999px; font-size:14px; font-weight:850; margin-bottom:18px; }
        .cv-live-dot { width:9px; height:9px; background:#df6a36; border-radius:50%; box-shadow:0 0 0 6px rgba(223,106,54,0.14); }
        .cv-activity-title { margin:0; color:#242424; font-size:clamp(36px,4vw,56px); line-height:1; letter-spacing:-1.8px; font-weight:900; }
        .cv-activity-subtitle { margin:18px auto 0; color:#6d645d; font-size:18px; line-height:1.5; max-width:680px; }
        .cv-activity-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:18px; }
        .cv-activity-card { background:rgba(255,255,255,0.90); border:1px solid rgba(120,80,45,0.10); border-radius:30px; padding:24px; box-shadow:0 16px 34px rgba(60,35,20,0.07); transition:all .24s ease; position:relative; overflow:hidden; }
        .cv-activity-card::before { content:""; position:absolute; top:-80px; right:-80px; width:170px; height:170px; background:radial-gradient(circle,rgba(223,106,54,0.13),rgba(223,106,54,0)); z-index:0; }
        .cv-activity-card>* { position:relative; z-index:1; }
        .cv-activity-card:hover { transform:translateY(-6px); box-shadow:0 24px 46px rgba(203,82,38,0.16); }
        .cv-card-top { display:flex; align-items:center; justify-content:space-between; gap:14px; margin-bottom:20px; }
        .cv-card-icon-box { width:62px; height:62px; border-radius:22px; background:linear-gradient(180deg,#fffaf5,#f2e1cf); display:flex; align-items:center; justify-content:center; box-shadow:inset 0 1px 0 rgba(255,255,255,0.70); }
        .cv-card-icon-box img { width:38px; height:38px; object-fit:contain; }
        .cv-card-tag { color:#d86435; background:rgba(223,106,54,0.11); padding:8px 12px; border-radius:999px; font-size:13px; font-weight:850; }
        .cv-card-title { color:#242424; font-size:20px; font-weight:900; line-height:1.28; margin-bottom:16px; }
        .cv-card-info { display:flex; flex-wrap:wrap; gap:9px; margin-bottom:18px; }
        .cv-card-pill { background:#fff8f0; color:#746b62; border-radius:999px; padding:8px 11px; font-size:13px; font-weight:750; }
        .cv-card-footer { border-top:1px solid rgba(120,80,45,0.10); padding-top:16px; display:flex; align-items:center; justify-content:space-between; gap:12px; }
        .cv-client-mini { display:flex; align-items:center; gap:10px; }
        .cv-client-avatar { width:36px; height:36px; border-radius:50%; background:linear-gradient(135deg,#df6a36,#f2b078); color:#fff; display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:900; }
        .cv-client-text strong { display:block; color:#242424; font-size:14px; font-weight:850; }
        .cv-client-text span { display:block; color:#83796f; font-size:12px; margin-top:1px; }
        .cv-proposals { color:#d86435; font-size:14px; font-weight:900; }
        .cv-activity-cta { text-align:center; margin-top:42px; }
        .cv-activity-button { display:inline-flex; align-items:center; justify-content:center; background:#242424; color:#fff!important; text-decoration:none; padding:17px 28px; border-radius:18px; font-size:16px; font-weight:850; box-shadow:0 16px 32px rgba(30,20,15,0.16); transition:all .22s ease; cursor:pointer; border:none; }
        .cv-activity-button:hover { transform:translateY(-2px); }

        .cv-step1,.cv-step2,.cv-step3 { width:100%; background:transparent; overflow:hidden; position:relative; font-family:Inter,Arial,sans-serif; }
        .cv-step1-inner { max-width:1280px; margin:0 auto; padding:72px 24px; display:grid; grid-template-columns:0.88fr 1.12fr; align-items:center; gap:20px; }
        .cv-step2-inner { max-width:1280px; margin:0 auto; padding:72px 24px; display:grid; grid-template-columns:1.05fr 0.95fr; align-items:center; gap:40px; }
        .cv-step3-inner { max-width:1280px; margin:0 auto; padding:72px 24px; display:grid; grid-template-columns:0.95fr 1.05fr; align-items:center; gap:40px; }
        .cv-step-badge { display:inline-flex; align-items:center; background:rgba(223,106,54,0.14); color:#d86435; padding:10px 18px; border-radius:999px; font-size:14px; font-weight:700; margin-bottom:24px; }
        .cv-step-title { font-size:clamp(52px,6vw,84px); line-height:0.92; letter-spacing:-2.8px; color:#242424; margin:0; font-weight:900; }
        .cv-step-title span { display:block; color:#df6a36; font-style:italic; font-weight:500; }
        .cv-step-subtitle { margin-top:28px; font-size:clamp(19px,2vw,25px); line-height:1.5; color:#5d544d; max-width:470px; }
        .cv-step-image { width:100%; max-width:860px; height:auto; display:block; }
        .cv-step2-image { width:118%; max-width:920px; margin-left:4%; }
        .cv-step3-image { width:118%; max-width:980px; margin-right:-6%; }
        .cv-step1-points-link { margin-top:18px; display:inline-flex; align-items:center; gap:10px; background:rgba(223,106,54,0.09); color:#cb5226!important; border:1px solid rgba(223,106,54,0.12); padding:12px 16px; border-radius:16px; text-decoration:none; font-size:15px; font-weight:800; transition:all .2s ease; }
        .cv-step1-middle-popup { position:absolute; left:35%; top:42%; transform:translateY(-50%); background:rgba(255,255,255,0.97); border-radius:26px; padding:22px 30px; display:flex; align-items:center; gap:18px; box-shadow:0 20px 45px rgba(70,40,20,0.10); z-index:4; min-width:360px; }
        .cv-step1-middle-icon { width:66px; height:66px; border-radius:50%; background:rgba(223,106,54,0.12); display:flex; align-items:center; justify-content:center; color:#df6a36; font-size:34px; font-weight:900; flex-shrink:0; }
        .cv-step1-middle-popup strong { display:block; color:#242424; font-size:20px; font-weight:900; }
        .cv-step1-middle-popup span { display:block; margin-top:5px; color:#5d544d; font-size:17px; }
        .cv-step1-middle-points { display:inline-flex; align-items:center; margin-top:8px; color:#12a870; background:rgba(18,168,112,0.10); padding:6px 10px; border-radius:999px; font-size:13px; font-weight:900; }

        .cv-step4 { width:100%; background:transparent; overflow:hidden; font-family:Inter,Arial,sans-serif; }
        .cv-step4-inner { max-width:1280px; margin:0 auto; padding:72px 24px; display:grid; grid-template-columns:1.05fr 0.95fr; align-items:center; gap:40px; }
        .cv-step4-image { width:118%; max-width:920px; margin-left:4%; height:auto; display:block; }
        .cv-step4-proofs { display:flex; flex-direction:column; gap:14px; margin-top:28px; }
        .cv-step4-proof { display:flex; align-items:center; gap:14px; }
        .cv-step4-proof-icon { width:42px; height:42px; background:rgba(255,255,255,0.9); border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:18px; box-shadow:0 8px 18px rgba(70,40,20,0.08); flex-shrink:0; }
        .cv-step4-proof strong { display:block; color:#242424; font-size:15px; font-weight:800; }
        .cv-step4-proof span { display:block; margin-top:2px; color:#7a7067; font-size:13px; }
        .cv-step4-points-link { margin-top:18px; display:inline-flex; align-items:center; gap:10px; background:rgba(223,106,54,0.09); color:#cb5226!important; border:1px solid rgba(223,106,54,0.12); padding:12px 16px; border-radius:16px; text-decoration:none; font-size:15px; font-weight:800; }

        .cv-trust { width:100%; background:transparent; font-family:Inter,Arial,sans-serif; padding:64px 20px; }
        .cv-trust-inner { max-width:1180px; margin:0 auto; text-align:center; }
        .cv-trust-badge { display:inline-flex; align-items:center; justify-content:center; background:rgba(223,106,54,0.14); color:#d86435; padding:10px 18px; border-radius:999px; font-size:14px; font-weight:800; margin-bottom:22px; }
        .cv-trust-title { margin:0; color:#242424; font-size:clamp(40px,5vw,68px); line-height:0.96; letter-spacing:-2.2px; font-weight:900; }
        .cv-trust-title span { color:#df6a36; font-style:italic; font-weight:500; }
        .cv-trust-subtitle { max-width:680px; margin:22px auto 0; color:#5d544d; font-size:clamp(17px,2vw,22px); line-height:1.45; }
        .cv-trust-grid { margin-top:42px; display:grid; grid-template-columns:repeat(4,1fr); gap:18px; }
        .cv-trust-card { background:rgba(255,255,255,0.82); border-radius:26px; padding:24px 18px; box-shadow:0 16px 36px rgba(70,40,20,0.06); border:1px solid rgba(223,106,54,0.08); }
        .cv-trust-icon { width:52px; height:52px; border-radius:50%; background:rgba(223,106,54,0.10); display:flex; align-items:center; justify-content:center; margin:0 auto 14px; font-size:22px; }
        .cv-trust-number { color:#242424; font-size:30px; line-height:1; font-weight:900; letter-spacing:-1px; }
        .cv-trust-label { margin-top:8px; color:#6d625a; font-size:14px; line-height:1.3; font-weight:600; }

        .cv-cta { width:100%; background:transparent; font-family:Inter,Arial,sans-serif; padding:54px 24px 72px; }
        .cv-cta-inner { max-width:1080px; margin:0 auto; background:linear-gradient(135deg,#df6a36,#cb5226); border-radius:34px; padding:56px 48px; display:grid; grid-template-columns:1fr auto; align-items:center; gap:40px; box-shadow:0 30px 60px rgba(203,82,38,0.28); position:relative; overflow:hidden; }
        .cv-cta-inner::before { content:""; position:absolute; top:-80px; right:-80px; width:320px; height:320px; background:rgba(255,255,255,0.07); border-radius:50%; }
        .cv-cta-title { margin:0; color:#fff; font-size:clamp(36px,4vw,56px); line-height:0.96; letter-spacing:-1.8px; font-weight:900; }
        .cv-cta-title span { display:block; font-style:italic; font-weight:500; opacity:0.9; }
        .cv-cta-text { margin:16px 0 0; color:rgba(255,255,255,0.8); font-size:18px; line-height:1.5; max-width:560px; }
        .cv-cta-tags { display:flex; gap:12px; margin-top:20px; flex-wrap:wrap; }
        .cv-cta-tag { background:rgba(255,255,255,0.15); color:#fff; padding:8px 14px; border-radius:999px; font-size:13px; font-weight:700; }
        .cv-cta-btn { display:inline-flex; align-items:center; justify-content:center; background:#fff; color:#cb5226!important; text-decoration:none; padding:20px 32px; border-radius:20px; font-size:18px; font-weight:900; white-space:nowrap; box-shadow:0 16px 32px rgba(0,0,0,0.12); transition:all .2s ease; border:none; cursor:pointer; flex-shrink:0; }
        .cv-cta-btn:hover { transform:translateY(-2px); box-shadow:0 20px 38px rgba(0,0,0,0.16); }

        .cv-instagram { width:100%; background:transparent; font-family:Inter,Arial,sans-serif; padding:0 24px 72px; }
        .cv-instagram-inner { max-width:1080px; margin:0 auto; background:rgba(255,255,255,0.78); border:1px solid rgba(223,106,54,0.10); border-radius:34px; padding:38px 42px; display:flex; align-items:center; justify-content:space-between; gap:34px; box-shadow:0 22px 48px rgba(70,40,20,0.07); position:relative; overflow:hidden; }
        .cv-instagram-content { display:flex; align-items:center; gap:22px; }
        .cv-instagram-phone { width:88px; height:88px; flex-shrink:0; }
        .cv-instagram-phone img { width:100%; height:auto; display:block; filter:drop-shadow(0 12px 24px rgba(203,82,38,0.18)); }
        .cv-instagram-title { margin:0; color:#242424; font-size:clamp(28px,3vw,38px); line-height:1; letter-spacing:-1.2px; font-weight:900; }
        .cv-instagram-title span { color:#df6a36; font-style:italic; font-weight:500; }
        .cv-instagram-text { margin:10px 0 0; color:#5d544d; font-size:17px; line-height:1.5; max-width:520px; }
        .cv-instagram-btn { display:inline-flex; align-items:center; justify-content:center; background:linear-gradient(135deg,#df6a36,#cb5226); color:#fff!important; text-decoration:none; padding:18px 28px; border-radius:20px; font-size:17px; font-weight:900; white-space:nowrap; box-shadow:0 16px 32px rgba(203,82,38,0.25); transition:all .2s ease; }
        .cv-instagram-btn:hover { transform:translateY(-2px); }
        .cv-instagram-bg { position:absolute; right:-60px; bottom:-60px; width:240px; opacity:0.05; pointer-events:none; }

        .cv-scrolltop { position:fixed; right:22px; bottom:22px; z-index:9999; }
        .cv-scrolltop-btn { width:62px; height:62px; border-radius:50%; border:none; cursor:pointer; background:linear-gradient(135deg,#df6a36,#cb5226); color:#fff; font-size:26px; font-weight:900; display:flex; align-items:center; justify-content:center; box-shadow:0 18px 38px rgba(203,82,38,0.28); transition:all .2s ease; text-decoration:none; }
        .cv-scrolltop-btn:hover { transform:translateY(-3px) scale(1.04); }
      `}</style>

      {/* ── HERO ── */}
      <section className="cv-hero" id="topo">
        <div className="cv-hero-inner">
          <div className="cv-hero-left">
            <div className="cv-mini-badge">Serviços locais em Portugal</div>
            <h1 className="cv-title">Precisa de ajuda<br /><span>em casa?</span></h1>
            <p className="cv-subtitle">Encontre rapidamente profissionais de confiança perto de si e ganhe pontos ao utilizar a plataforma.</p>
            <Link href="/auth?tab=register" className="cv-button">Publicar pedido grátis →</Link>
            <a href="#recompensas" className="cv-points-proof">🎁 Ganhe pontos ao publicar pedidos</a>
            <div className="cv-proofs">
              <div className="cv-proof"><div className="cv-proof-icon">⭐</div><div><strong>4.9/5 avaliação média</strong><span>Experiência simples e confiável</span></div></div>
              <div className="cv-proof"><div className="cv-proof-icon">📍</div><div><strong>Profissionais locais</strong><span>Perto de si, na sua cidade</span></div></div>
              <div className="cv-proof"><div className="cv-proof-icon">🎁</div><div><strong>Ganhe vantagens</strong><span>Acumule pontos ao utilizar a plataforma</span></div></div>
            </div>
          </div>
          <div className="cv-hero-right">
            <img src="https://4a3225a957f59ca32696c7b995c0c9cb.cdn.bubble.io/f1778675117457x345812555999448700/bloc12.png" alt="Aplicação Chama o Vizinho" className="cv-hero-image" />
          </div>
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section className="cv-services">
        <div className="cv-services-inner">
          <div className="cv-services-head">
            <div className="cv-services-badge">Serviços populares</div>
            <h2 className="cv-services-title">O que precisas hoje?</h2>
            <p className="cv-services-subtitle">Encontre rapidamente ajuda local para os serviços mais procurados perto de si.</p>
          </div>
          <div className="cv-services-grid">
            {[
              { href: '/auth?tab=register', icon: 'https://dvtdjyxhiqucvzadluhv.supabase.co/storage/v1/object/public/icons/water.png', name: 'Canalização', desc: 'Fugas, torneiras, reparações e manutenção.' },
              { href: '/auth?tab=register', icon: 'https://dvtdjyxhiqucvzadluhv.supabase.co/storage/v1/object/public/icons/plug.png', name: 'Eletricidade', desc: 'Instalações, avarias e pequenos trabalhos.' },
              { href: '/auth?tab=register', icon: 'https://dvtdjyxhiqucvzadluhv.supabase.co/storage/v1/object/public/icons/paint.png', name: 'Pintura', desc: 'Casas, apartamentos e renovações rápidas.' },
              { href: '/auth?tab=register', icon: 'https://dvtdjyxhiqucvzadluhv.supabase.co/storage/v1/object/public/icons/gardening.png', name: 'Jardinagem', desc: 'Limpeza exterior e manutenção de jardins.' },
              { href: '/auth?tab=register', icon: 'https://dvtdjyxhiqucvzadluhv.supabase.co/storage/v1/object/public/icons/cleaner.png', name: 'Limpeza', desc: 'Casas, escritórios e limpezas profundas.' },
              { href: '/auth?tab=register', icon: 'https://dvtdjyxhiqucvzadluhv.supabase.co/storage/v1/object/public/icons/delivery-truck.png', name: 'Mudanças', desc: 'Transporte, caixas e ajuda para mudanças.' },
              { href: '/auth?tab=register', icon: 'https://dvtdjyxhiqucvzadluhv.supabase.co/storage/v1/object/public/icons/furniture%20assembly.png', name: 'Montagem', desc: 'Montagem de móveis e pequenos ajustes.' },
              { href: '/auth?tab=register', icon: 'https://dvtdjyxhiqucvzadluhv.supabase.co/storage/v1/object/public/icons/repair%20elecronics.png', name: 'Informática', desc: 'Reparações e ajuda tecnológica em casa.' },
              { href: '/auth?tab=register', icon: 'https://dvtdjyxhiqucvzadluhv.supabase.co/storage/v1/object/public/icons/baby.png', name: 'Babysitting', desc: 'Ajuda familiar e acompanhamento infantil.' },
              { href: '/auth?tab=register', icon: 'https://dvtdjyxhiqucvzadluhv.supabase.co/storage/v1/object/public/icons/mechanic.png', name: 'Mecânica', desc: 'Pequenas reparações e manutenção automóvel.' },
            ].map(s => (
              <Link key={s.name} href={s.href} className="cv-service-card">
                <div className="cv-service-icon-wrap"><img className="cv-service-icon" src={s.icon} alt={s.name} /></div>
                <div className="cv-service-name">{s.name}</div>
                <div className="cv-service-desc">{s.desc}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── ACTIVITY ── */}
      <section className="cv-activity">
        <div className="cv-activity-inner">
          <div className="cv-activity-head">
            <div className="cv-activity-badge"><span className="cv-live-dot"></span>Atividade recente</div>
            <h2 className="cv-activity-title">Pedidos recentes perto de si</h2>
            <p className="cv-activity-subtitle">Veja exemplos de pedidos publicados por pessoas que procuram ajuda local para resolver problemas do dia a dia.</p>
          </div>
          <div className="cv-activity-grid">
            {[
              { icon: 'https://dvtdjyxhiqucvzadluhv.supabase.co/storage/v1/object/public/icons/water.png', tag: 'Canalização', title: 'Preciso reparar uma fuga na cozinha', city: 'Lisboa', time: 'há 12 min', extra: 'Urgente', avatar: 'M', name: 'Maria', proposals: '3 propostas' },
              { icon: 'https://dvtdjyxhiqucvzadluhv.supabase.co/storage/v1/object/public/icons/delivery-truck.png', tag: 'Mudanças', title: 'Ajuda para transportar móveis no Porto', city: 'Porto', time: 'há 28 min', extra: 'Esta semana', avatar: 'J', name: 'João', proposals: '5 propostas' },
              { icon: 'https://dvtdjyxhiqucvzadluhv.supabase.co/storage/v1/object/public/icons/cleaner.png', tag: 'Limpeza', title: 'Limpeza após mudança de apartamento', city: 'Braga', time: 'há 41 min', extra: 'Flexível', avatar: 'A', name: 'Ana', proposals: '2 propostas' },
              { icon: 'https://dvtdjyxhiqucvzadluhv.supabase.co/storage/v1/object/public/icons/furniture%20assembly.png', tag: 'Montagem', title: 'Montar móveis IKEA no quarto', city: 'Coimbra', time: 'há 1 h', extra: 'Hoje', avatar: 'R', name: 'Rita', proposals: '4 propostas' },
              { icon: 'https://dvtdjyxhiqucvzadluhv.supabase.co/storage/v1/object/public/icons/gardening.png', tag: 'Jardinagem', title: 'Cortar relva e limpar jardim pequeno', city: 'Setúbal', time: 'há 2 h', extra: 'Fim de semana', avatar: 'P', name: 'Pedro', proposals: '6 propostas' },
              { icon: 'https://dvtdjyxhiqucvzadluhv.supabase.co/storage/v1/object/public/icons/plug.png', tag: 'Eletricidade', title: 'Trocar tomadas e verificar quadro elétrico', city: 'Aveiro', time: 'há 3 h', extra: 'Orçamento', avatar: 'C', name: 'Clara', proposals: '3 propostas' },
            ].map(c => (
              <div key={c.title} className="cv-activity-card">
                <div className="cv-card-top">
                  <div className="cv-card-icon-box"><img src={c.icon} alt="" /></div>
                  <div className="cv-card-tag">{c.tag}</div>
                </div>
                <div className="cv-card-title">{c.title}</div>
                <div className="cv-card-info">
                  <span className="cv-card-pill">📍 {c.city}</span>
                  <span className="cv-card-pill">⏱️ {c.time}</span>
                  <span className="cv-card-pill">{c.extra}</span>
                </div>
                <div className="cv-card-footer">
                  <div className="cv-client-mini">
                    <div className="cv-client-avatar">{c.avatar}</div>
                    <div className="cv-client-text"><strong>{c.name}</strong><span>Cliente</span></div>
                  </div>
                  <div className="cv-proposals">{c.proposals}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="cv-activity-cta">
            <Link href="/auth?tab=register" className="cv-activity-button">Publicar também o meu pedido →</Link>
          </div>
        </div>
      </section>

      {/* ── STEP 1 ── */}
      <section className="cv-step1">
        <div className="cv-step1-inner">
          <div className="cv-hero-left">
            <div className="cv-step-badge">PASSO 01</div>
            <h1 className="cv-step-title">Publica<span>o pedido</span></h1>
            <p className="cv-step-subtitle">Diz-nos o que precisas,<br/>onde e quando.<br/>É rápido, gratuito e ainda ganhas pontos.</p>
            <a href="#recompensas" className="cv-step1-points-link">🎁 +1 ponto ao criar um pedido válido</a>
          </div>
          <div className="cv-step1-middle-popup">
            <div className="cv-step1-middle-icon">✓</div>
            <div><strong>Pedido publicado</strong><span>Em menos de 1 minuto</span><div className="cv-step1-middle-points">+1 ponto ganho</div></div>
          </div>
          <div className="cv-hero-right">
            <img src="https://dvtdjyxhiqucvzadluhv.supabase.co/storage/v1/object/public/icons/ChatGPT%20Image%2014%20mai%202026,%2016_47_37.png" alt="Publicar pedido" className="cv-step-image" />
          </div>
        </div>
      </section>

      {/* ── STEP 2 ── */}
      <section className="cv-step2">
        <div className="cv-step2-inner">
          <div style={{display:'flex',justifyContent:'center',alignItems:'center',overflow:'visible'}}>
            <img src="https://dvtdjyxhiqucvzadluhv.supabase.co/storage/v1/object/public/icons/etape2_transparent.png" alt="Receber propostas" className="cv-step2-image" />
          </div>
          <div className="cv-hero-left">
            <div className="cv-step-badge">PASSO 02</div>
            <h1 className="cv-step-title">Recebe<span>propostas</span></h1>
            <p className="cv-step-subtitle">Profissionais da tua área<br/>enviam propostas rapidamente.<br/>Compara e escolhe facilmente.</p>
          </div>
        </div>
      </section>

      {/* ── STEP 3 ── */}
      <section className="cv-step3">
        <div className="cv-step3-inner">
          <div className="cv-hero-left">
            <div className="cv-step-badge">PASSO 03</div>
            <h1 className="cv-step-title">Escolhe o<span>profissional</span></h1>
            <p className="cv-step-subtitle">Compare avaliações, preços<br/>e disponibilidade.<br/>Confirme o serviço facilmente.</p>
          </div>
          <div style={{display:'flex',justifyContent:'center',alignItems:'center'}}>
            <img src="https://dvtdjyxhiqucvzadluhv.supabase.co/storage/v1/object/public/icons/Gemini_Generated_Image_x72cs2x72cs2x72c-Photoroom.png" alt="Escolher profissional" className="cv-step3-image" />
          </div>
        </div>
      </section>

      {/* ── STEP 4 ── */}
      <section className="cv-step4">
        <div className="cv-step4-inner">
          <div style={{display:'flex',justifyContent:'center',alignItems:'center'}}>
            <img src="https://dvtdjyxhiqucvzadluhv.supabase.co/storage/v1/object/public/icons/etape4.png" alt="Confirmar e avaliar" className="cv-step4-image" />
          </div>
          <div className="cv-hero-left">
            <div className="cv-step-badge">PASSO 04</div>
            <h1 className="cv-step-title">Confirma<span>e avalia</span></h1>
            <p className="cv-step-subtitle">Depois do serviço concluído, confirma o trabalho, deixa uma avaliação e ajuda a comunidade a encontrar profissionais mais confiáveis.</p>
            <a href="#recompensas" className="cv-step4-points-link">🎁 Ganhe pontos ao avaliar serviços concluídos</a>
            <div className="cv-step4-proofs">
              <div className="cv-step4-proof"><div className="cv-step4-proof-icon">⭐</div><div><strong>Avaliações reais</strong><span>Mais confiança entre clientes e prestadores</span></div></div>
              <div className="cv-step4-proof"><div className="cv-step4-proof-icon">✅</div><div><strong>Profissionais verificados</strong><span>Uma plataforma mais segura para todos</span></div></div>
              <div className="cv-step4-proof"><div className="cv-step4-proof-icon">🎁</div><div><strong>Ganhe vantagens</strong><span>Receba pontos ao participar ativamente</span></div></div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST ── */}
      <section className="cv-trust">
        <div className="cv-trust-inner">
          <div className="cv-trust-badge">CONFIANÇA</div>
          <h2 className="cv-trust-title">Simples, rápido<br/>e <span>confiável</span></h2>
          <p className="cv-trust-subtitle">Uma forma moderna de encontrar profissionais perto de si, comparar propostas e resolver problemas em casa sem complicações.</p>
          <div className="cv-trust-grid">
            {[
              { icon: '⭐', n: '4.9/5', l: 'Avaliação média\ndos serviços' },
              { icon: '📍', n: 'Local', l: 'Profissionais perto\nda sua zona' },
              { icon: '⚡', n: 'Minutos', l: 'Para receber\npropostas' },
              { icon: '✅', n: 'Grátis', l: 'Publicar pedido\nsem compromisso' },
            ].map(t => (
              <div key={t.n} className="cv-trust-card">
                <div className="cv-trust-icon">{t.icon}</div>
                <div className="cv-trust-number">{t.n}</div>
                <div className="cv-trust-label">{t.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="cv-cta" id="recompensas">
        <div className="cv-cta-inner">
          <div>
            <h2 className="cv-cta-title">Crie a sua conta<span>e publique o pedido</span></h2>
            <p className="cv-cta-text">Registe-se gratuitamente, publique o seu pedido em poucos minutos e comece também a acumular pontos na plataforma.</p>
            <div className="cv-cta-tags">
              <span className="cv-cta-tag">✓ Respostas rápidas</span>
              <span className="cv-cta-tag">✓ Profissionais locais</span>
              <span className="cv-cta-tag">✓ Pontos e vantagens</span>
            </div>
          </div>
          <Link href="/auth?tab=register" className="cv-cta-btn">Criar conta e publicar pedido →</Link>
        </div>
      </section>

      {/* ── INSTAGRAM ── */}
      <section className="cv-instagram">
        <div className="cv-instagram-inner">
          <div className="cv-instagram-content">
            <div className="cv-instagram-phone">
              <img src="https://dvtdjyxhiqucvzadluhv.supabase.co/storage/v1/object/public/icons/insta.png" alt="Instagram" />
            </div>
            <div>
              <h2 className="cv-instagram-title">Ainda não precisa de <span>ajuda?</span></h2>
              <p className="cv-instagram-text">Siga-nos no Instagram para acompanhar novidades, dicas úteis para casa e futuras campanhas de pontos e vantagens.</p>
            </div>
          </div>
          <a href="https://www.instagram.com/chama_o_vizinho/" target="_blank" rel="noopener noreferrer" className="cv-instagram-btn">Seguir no Instagram →</a>
          <img src="https://dvtdjyxhiqucvzadluhv.supabase.co/storage/v1/object/public/icons/insta.png" className="cv-instagram-bg" alt="" />
        </div>
      </section>

      {/* ── SCROLL TOP ── */}
      <div className="cv-scrolltop">
        <a href="#topo" className="cv-scrolltop-btn">↑</a>
      </div>
    </>
  )
}
