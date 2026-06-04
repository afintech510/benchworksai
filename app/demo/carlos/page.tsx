'use client';

// ---------------------------------------------------------------------------
// Carlos — Digital Footprint Proposal (bilingual sales scope).
// Standalone static demo route, mirrors app/demo/easternTruck + thepoolman:
// self-contained, no marketing chrome, no external icon/font deps on the
// production bundle. Bespoke design ported verbatim from the source mockup;
// the only structural change is scoping language toggling to a wrapper div
// (`.carlos.es`) instead of <body>, which a Next route can't cleanly own.
// ---------------------------------------------------------------------------

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

const CSS = `
  .carlos{
    --ink:#0a0e14;
    --ink2:#141b26;
    --panel:#1c2533;
    --line:#2c3848;
    --paper:#f4f1ea;
    --paper2:#e8e3d7;
    --amber:#f5a623;
    --amber-d:#d4860a;
    --rust:#c0392b;
    --steel:#7d8a9c;
    --green:#3fa66a;
    --txt:#e7eaf0;
    --txt-dim:#9aa6b6;
    font-family:'Spline Sans',sans-serif;
    background:var(--ink);
    color:var(--txt);
    line-height:1.6;
    overflow-x:hidden;
    min-height:100vh;
  }
  .carlos *{margin:0;padding:0;box-sizing:border-box}
  .carlos .wrap{max-width:1180px;margin:0 auto;padding:0 24px}

  /* ===== language toggle ===== */
  .carlos .lang-bar{
    position:fixed;top:0;left:0;right:0;z-index:100;
    background:rgba(10,14,20,.82);backdrop-filter:blur(14px);
    border-bottom:1px solid var(--line);
  }
  .carlos .lang-inner{max-width:1180px;margin:0 auto;padding:12px 24px;display:flex;justify-content:space-between;align-items:center}
  .carlos .brand-mini{display:flex;align-items:center;gap:10px;font-family:'Archivo';font-weight:800;letter-spacing:-.02em;font-size:15px}
  .carlos .brand-mini .sq{width:22px;height:22px;background:var(--amber);border-radius:5px;display:grid;place-items:center;color:var(--ink);font-size:13px;font-weight:900}
  .carlos .toggle{display:flex;border:1px solid var(--line);border-radius:999px;overflow:hidden;background:var(--ink2)}
  .carlos .toggle button{
    font-family:'Archivo';font-weight:700;font-size:12px;letter-spacing:.04em;
    padding:7px 16px;background:transparent;color:var(--txt-dim);border:none;cursor:pointer;transition:.2s;
  }
  .carlos .toggle button.on{background:var(--amber);color:var(--ink)}

  /* ===== hero ===== */
  .carlos .hero{
    padding:140px 0 80px;position:relative;
    background:
      radial-gradient(1200px 500px at 80% -10%, rgba(245,166,35,.10), transparent 60%),
      linear-gradient(180deg,var(--ink),var(--ink2));
    border-bottom:1px solid var(--line);
  }
  .carlos .hero::before{
    content:"";position:absolute;inset:0;
    background-image:linear-gradient(var(--line) 1px,transparent 1px),linear-gradient(90deg,var(--line) 1px,transparent 1px);
    background-size:46px 46px;opacity:.18;mask-image:radial-gradient(800px 400px at 70% 0%,#000,transparent);
  }
  .carlos .hero .wrap{position:relative;z-index:2}
  .carlos .tag{
    display:inline-flex;align-items:center;gap:8px;
    font-family:'Archivo';font-weight:700;font-size:12px;letter-spacing:.12em;text-transform:uppercase;
    color:var(--amber);border:1px solid var(--amber-d);border-radius:999px;padding:6px 14px;margin-bottom:26px;
    background:rgba(245,166,35,.06);
  }
  .carlos h1{
    font-family:'Archivo';font-weight:900;letter-spacing:-.03em;line-height:.98;
    font-size:clamp(38px,6.5vw,76px);margin-bottom:24px;
  }
  .carlos h1 .hl{color:var(--amber);display:block}
  .carlos .lede{font-size:clamp(17px,2vw,21px);color:var(--txt-dim);max-width:680px;margin-bottom:36px}
  .carlos .hero-cta{display:flex;gap:14px;flex-wrap:wrap}
  .carlos .btn{
    font-family:'Archivo';font-weight:700;font-size:15px;letter-spacing:.01em;
    padding:14px 26px;border-radius:10px;text-decoration:none;cursor:pointer;border:none;transition:.2s;display:inline-flex;align-items:center;gap:8px;
  }
  .carlos .btn-amber{background:var(--amber);color:var(--ink)}
  .carlos .btn-amber:hover{background:var(--amber-d);transform:translateY(-2px)}
  .carlos .btn-ghost{background:transparent;color:var(--txt);border:1px solid var(--line)}
  .carlos .btn-ghost:hover{border-color:var(--amber);color:var(--amber)}

  .carlos .hero-stats{display:flex;gap:40px;margin-top:54px;flex-wrap:wrap}
  .carlos .hs b{font-family:'Archivo';font-weight:900;font-size:34px;color:#fff;display:block;letter-spacing:-.02em}
  .carlos .hs span{font-size:13px;color:var(--txt-dim);text-transform:uppercase;letter-spacing:.08em}

  /* ===== section frame ===== */
  .carlos section{padding:84px 0;position:relative}
  .carlos .eyebrow{font-family:'Archivo';font-weight:700;font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:var(--amber);margin-bottom:14px}
  .carlos h2{font-family:'Archivo';font-weight:800;letter-spacing:-.02em;font-size:clamp(28px,4vw,44px);line-height:1.04;margin-bottom:18px}
  .carlos .sec-lede{color:var(--txt-dim);font-size:17px;max-width:640px;margin-bottom:46px}

  /* ===== the system map ===== */
  .carlos .map{padding:84px 0;background:var(--ink2);border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
  .carlos .map-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1px;background:var(--line);border:1px solid var(--line);border-radius:14px;overflow:hidden}
  .carlos .cell{background:var(--ink2);padding:26px 22px;transition:.25s}
  .carlos .cell:hover{background:var(--panel)}
  .carlos .cell .ic{width:40px;height:40px;border-radius:9px;background:rgba(245,166,35,.12);display:grid;place-items:center;margin-bottom:14px;font-size:20px}
  .carlos .cell h4{font-family:'Archivo';font-weight:700;font-size:16px;margin-bottom:7px}
  .carlos .cell p{font-size:13.5px;color:var(--txt-dim);line-height:1.55}

  /* ===== business blocks ===== */
  .carlos .biz{border-top:1px solid var(--line)}
  .carlos .biz-head{display:flex;align-items:flex-start;gap:20px;margin-bottom:10px;flex-wrap:wrap}
  .carlos .biz-num{font-family:'Archivo';font-weight:900;font-size:15px;color:var(--ink);background:var(--amber);width:38px;height:38px;border-radius:9px;display:grid;place-items:center;flex-shrink:0}
  .carlos .biz-badge{font-family:'Archivo';font-weight:700;font-size:11px;letter-spacing:.1em;text-transform:uppercase;padding:5px 11px;border-radius:999px;border:1px solid var(--line);color:var(--txt-dim);margin-left:auto}
  .carlos .biz-badge.new{color:var(--green);border-color:var(--green)}
  .carlos .biz-badge.jv{color:var(--amber);border-color:var(--amber-d)}
  .carlos .biz-loc{color:var(--steel);font-size:14px;font-family:'Archivo';font-weight:600;letter-spacing:.02em}

  .carlos .feat-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:18px;margin-top:32px}
  .carlos .feat{
    background:var(--ink2);border:1px solid var(--line);border-radius:13px;padding:24px;position:relative;overflow:hidden;transition:.25s;
  }
  .carlos .feat::after{content:"";position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--amber);transform:scaleY(0);transform-origin:top;transition:.25s}
  .carlos .feat:hover{border-color:#3a4759;transform:translateY(-3px)}
  .carlos .feat:hover::after{transform:scaleY(1)}
  .carlos .feat .ftop{display:flex;align-items:center;gap:11px;margin-bottom:12px}
  .carlos .feat .fic{width:34px;height:34px;border-radius:8px;background:var(--panel);display:grid;place-items:center;font-size:17px;flex-shrink:0}
  .carlos .feat h4{font-family:'Archivo';font-weight:700;font-size:16.5px;letter-spacing:-.01em}
  .carlos .feat .what{font-size:14px;color:var(--txt);margin-bottom:12px}
  .carlos .feat .why{font-size:13px;color:var(--txt-dim);border-top:1px dashed var(--line);padding-top:11px}
  .carlos .feat .why b{color:var(--amber);font-family:'Archivo';font-weight:600;font-size:11px;letter-spacing:.08em;text-transform:uppercase;display:block;margin-bottom:3px}

  .carlos .phase-pill{display:inline-block;font-family:'Archivo';font-weight:700;font-size:10.5px;letter-spacing:.07em;text-transform:uppercase;color:var(--steel);border:1px solid var(--line);border-radius:6px;padding:3px 8px;margin-top:12px}

  /* existing site callout */
  .carlos .callout{background:linear-gradient(135deg,rgba(192,57,43,.08),rgba(245,166,35,.05));border:1px solid var(--line);border-left:3px solid var(--rust);border-radius:12px;padding:22px 24px;margin-top:30px}
  .carlos .callout h5{font-family:'Archivo';font-weight:700;font-size:14px;letter-spacing:.04em;text-transform:uppercase;color:var(--rust);margin-bottom:8px}
  .carlos .callout p{font-size:14.5px;color:var(--txt-dim)}

  /* platform spotlight */
  .carlos .spot{background:var(--ink2);border-top:1px solid var(--line)}
  .carlos .spot-card{background:linear-gradient(160deg,var(--panel),var(--ink2));border:1px solid var(--line);border-radius:18px;padding:42px;position:relative;overflow:hidden}
  .carlos .spot-card::before{content:"";position:absolute;top:-60px;right:-60px;width:240px;height:240px;background:radial-gradient(circle,rgba(245,166,35,.14),transparent 70%)}
  .carlos .flow{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin:26px 0 8px}
  .carlos .flow .step{background:var(--ink);border:1px solid var(--line);border-radius:9px;padding:11px 15px;font-family:'Archivo';font-weight:600;font-size:13px;display:flex;align-items:center;gap:8px}
  .carlos .flow .step .n{color:var(--amber);font-weight:900}
  .carlos .flow .arr{color:var(--steel);font-size:18px}

  /* town engine */
  .carlos .towns{display:flex;flex-wrap:wrap;gap:8px;margin-top:24px}
  .carlos .town{font-family:'Archivo';font-weight:600;font-size:12.5px;color:var(--txt-dim);background:var(--ink2);border:1px solid var(--line);border-radius:7px;padding:7px 12px;transition:.2s}
  .carlos .town:hover{color:var(--amber);border-color:var(--amber-d)}
  .carlos .matrix-note{font-size:13px;color:var(--steel);margin-top:18px;font-style:italic}

  /* close */
  .carlos .close{background:linear-gradient(180deg,var(--ink2),var(--ink));border-top:1px solid var(--line);text-align:center}
  .carlos .close h2{margin-bottom:16px}
  .carlos .close p{color:var(--txt-dim);max-width:560px;margin:0 auto 32px;font-size:17px}

  .carlos footer{border-top:1px solid var(--line);padding:30px 0;color:var(--steel);font-size:13px;text-align:center}
  .carlos footer .dot{width:7px;height:7px;background:var(--green);border-radius:50%;display:inline-block;margin-right:7px;vertical-align:middle}

  /* lang visibility — only the INACTIVE language is forced hidden, so the
     active one keeps its natural/element display (e.g. .feat .why b is block).
     :not(.es) + !important beats higher-specificity element rules. */
  .carlos:not(.es) [data-es]{display:none !important}
  .carlos.es [data-en]{display:none !important}

  .carlos .reveal{opacity:0;transform:translateY(22px);transition:.6s cubic-bezier(.2,.7,.3,1)}
  .carlos .reveal.in{opacity:1;transform:none}

  @media(max-width:640px){
    .carlos .hero{padding:118px 0 60px}
    .carlos .hero-stats{gap:26px}
    .carlos section{padding:60px 0}
  }
`;

export default function CarlosProposalPage() {
  const [es, setEs] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Scroll reveal — same IntersectionObserver as the source mockup, scoped to
  // this page's subtree so it never touches the rest of the app.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    root
      .querySelectorAll<HTMLElement>('section .feat, .map-grid, .spot-card, .callout')
      .forEach((el, i) => {
        el.classList.add('reveal');
        el.style.transitionDelay = `${(i % 4) * 60}ms`;
        obs.observe(el);
      });
    return () => obs.disconnect();
  }, []);

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800;900&family=Spline+Sans:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <style>{CSS}</style>

      <div ref={rootRef} className={es ? 'carlos es' : 'carlos'} lang={es ? 'es' : 'en'}>
        {/* LANG BAR */}
        <div className="lang-bar">
          <div className="lang-inner">
            <div className="brand-mini">
              <span className="sq">B</span>BenchworksAI
            </div>
            <div className="toggle">
              <button type="button" className={es ? '' : 'on'} onClick={() => setEs(false)}>
                EN
              </button>
              <button type="button" className={es ? 'on' : ''} onClick={() => setEs(true)}>
                ES
              </button>
            </div>
          </div>
        </div>

        {/* HERO */}
        <div className="hero">
          <div className="wrap">
            <span className="tag" data-en="">● Prepared for Carlos — Scope &amp; Vision</span>
            <span className="tag" data-es="">● Preparado para Carlos — Alcance y Visión</span>
            <h1 data-en="">Build a superior business.<span className="hl">Invest in your digital footprint.</span></h1>
            <h1 data-es="">Construye un negocio superior.<span className="hl">Invierte en tu presencia digital.</span></h1>
            <p className="lede" data-en="">Four businesses. One connected system that finds customers, books the work, collects the money, and builds real value you can sell later.</p>
            <p className="lede" data-es="">Cuatro negocios. Un sistema conectado que encuentra clientes, agenda el trabajo, cobra el dinero y construye valor real que puedes vender después.</p>
            <div className="hero-cta">
              <a className="btn btn-amber" href="#businesses" data-en="">See the plan ↓</a>
              <a className="btn btn-amber" href="#businesses" data-es="">Ver el plan ↓</a>
              <a className="btn btn-ghost" href="#rentals" data-en="">The rental platform</a>
              <a className="btn btn-ghost" href="#rentals" data-es="">La plataforma de renta</a>
            </div>
            <div className="hero-stats">
              <div className="hs"><b>4</b><span data-en="">Businesses</span><span data-es="">Negocios</span></div>
              <div className="hs"><b>2</b><span data-en="">Languages</span><span data-es="">Idiomas</span></div>
              <div className="hs"><b>40+</b><span data-en="">Local town pages</span><span data-es="">Páginas locales</span></div>
              <div className="hs"><b>1</b><span data-en="">Partner who builds it for you</span><span data-es="">Socio que lo construye para ti</span></div>
            </div>
          </div>
        </div>

        {/* WHY / SYSTEM MAP */}
        <div className="map">
          <div className="wrap">
            <div className="eyebrow" data-en="">The Core System — every business gets this</div>
            <div className="eyebrow" data-es="">El Sistema Base — cada negocio lo recibe</div>
            <h2 data-en="">The foundation that runs under all four</h2>
            <h2 data-es="">La base que corre bajo los cuatro</h2>
            <p className="sec-lede" data-en="">Every business starts with the same proven core. Then we add the systems that fit that specific business on top.</p>
            <p className="sec-lede" data-es="">Cada negocio empieza con el mismo núcleo probado. Luego agregamos los sistemas que le quedan a ese negocio específico.</p>
            <div className="map-grid">
              <div className="cell"><div className="ic">🌐</div><h4 data-en="">Website</h4><h4 data-es="">Sitio Web</h4><p data-en="">Fast, modern, mobile-first site with your real photos and local content — not a stock template.</p><p data-es="">Sitio rápido, moderno y móvil con tus fotos reales y contenido local — no una plantilla genérica.</p></div>
              <div className="cell"><div className="ic">📍</div><h4 data-en="">Directory Listings</h4><h4 data-es="">Directorios</h4><p data-en="">Google, Bing, Apple Maps, Yelp, Facebook — claimed, verified, and consistent everywhere.</p><p data-es="">Google, Bing, Apple Maps, Yelp, Facebook — reclamados, verificados y consistentes.</p></div>
              <div className="cell"><div className="ic">⭐</div><h4 data-en="">Reviews Engine</h4><h4 data-es="">Motor de Reseñas</h4><p data-en="">Automatic review requests after every job. More 5-star reviews = higher ranking + more trust.</p><p data-es="">Solicitudes automáticas de reseña tras cada trabajo. Más reseñas de 5 estrellas = mejor ranking.</p></div>
              <div className="cell"><div className="ic">🗂️</div><h4 data-en="">CRM</h4><h4 data-es="">CRM</h4><p data-en="">One database of every customer and job history — the asset a future buyer pays a premium for.</p><p data-es="">Una base de datos de cada cliente e historial — el activo por el que un comprador paga más.</p></div>
              <div className="cell"><div className="ic">📞</div><h4 data-en="">VOIP + AI Phone Agent</h4><h4 data-es="">VOIP + Agente Telefónico IA</h4><p data-en="">Business phone + texting with a programmable, custom AI agent that answers calls, quotes, and books jobs 24/7 — plus missed-call auto-text so no lead is ever lost.</p><p data-es="">Teléfono y mensajes con un agente de IA personalizado y programable que contesta llamadas, cotiza y agenda trabajos 24/7 — más texto automático en llamadas perdidas para no perder clientes.</p></div>
              <div className="cell"><div className="ic">📣</div><h4 data-en="">Weekly Posts</h4><h4 data-es="">Publicaciones Semanales</h4><p data-en="">Regular posts to Google &amp; Facebook. Google rewards active profiles with better visibility.</p><p data-es="">Publicaciones regulares en Google y Facebook. Google premia los perfiles activos.</p></div>
              <div className="cell"><div className="ic">📊</div><h4 data-en="">Lead Dashboard</h4><h4 data-es="">Panel de Clientes</h4><p data-en="">One screen showing calls, leads, and reviews per business. You see exactly what's working.</p><p data-es="">Una pantalla con llamadas, clientes y reseñas por negocio. Ves exactamente qué funciona.</p></div>
              <div className="cell"><div className="ic">📧</div><h4 data-en="">Email &amp; SMS Marketing</h4><h4 data-es="">Marketing por Email y SMS</h4><p data-en="">Automated campaigns, promos, and seasonal reminders by email and text — bring past customers back and fill the slow weeks.</p><p data-es="">Campañas automáticas, promociones y recordatorios de temporada por email y texto — recupera clientes y llena las semanas lentas.</p></div>
              <div className="cell"><div className="ic">🎯</div><h4 data-en="">Google Ads Management</h4><h4 data-es="">Gestión de Google Ads</h4><p data-en="">Managed Google Search &amp; Local Services Ads that put you at the top for ready-to-buy searches — spend and ROI tracked.</p><p data-es="">Anuncios de Google Search y Local Services administrados que te ponen arriba en búsquedas listas para comprar — gasto y ROI medidos.</p></div>
              <div className="cell"><div className="ic">🌎</div><h4 data-en="">Bilingual</h4><h4 data-es="">Bilingüe</h4><p data-en="">Every site and system with an English / Spanish switch built in from day one.</p><p data-es="">Cada sitio y sistema con un botón inglés / español desde el primer día.</p></div>
            </div>
          </div>
        </div>

        {/* BUSINESSES */}
        <section id="businesses">
          <div className="wrap">
            <div className="eyebrow" data-en="">Business by Business</div>
            <div className="eyebrow" data-es="">Negocio por Negocio</div>
            <h2 data-en="">What we build for each</h2>
            <h2 data-es="">Lo que construimos para cada uno</h2>
            <p className="sec-lede" data-en="">The core system above, plus the specific tools each business needs to grow and run itself.</p>
            <p className="sec-lede" data-es="">El sistema base de arriba, más las herramientas específicas que cada negocio necesita.</p>
          </div>

          {/* BIZ 1 */}
          <div className="biz">
            <div className="wrap" style={{ paddingTop: 46 }}>
              <div className="biz-head">
                <span className="biz-num">1</span>
                <div>
                  <h2 style={{ fontSize: 'clamp(24px,3vw,32px)', marginBottom: 4 }}>Eastern Truck &amp; Equipment Repair</h2>
                  <span className="biz-loc">Speonk, NY — <span data-en="">Flagship</span><span data-es="">Principal</span></span>
                </div>
                <span className="biz-badge" data-en="">Full Build</span><span className="biz-badge" data-es="">Construcción Completa</span>
              </div>
              <div className="feat-grid">
                <div className="feat"><div className="ftop"><div className="fic">🌐</div><h4 data-en="">Flagship Website</h4><h4 data-es="">Sitio Principal</h4></div><p className="what" data-en="">Full site: services, fleet/diesel repair, welding, inspections, town pages.</p><p className="what" data-es="">Sitio completo: servicios, reparación diésel, soldadura, inspecciones, páginas por pueblo.</p><div className="why"><b data-en="">Why</b><b data-es="">Por qué</b><span data-en="">This is the anchor brand — everything else references it. Built to rank and convert.</span><span data-es="">Es la marca ancla — todo lo demás la referencia. Hecho para posicionar y convertir.</span></div></div>
                <div className="feat"><div className="ftop"><div className="fic">🔧</div><h4 data-en="">NY State Inspections</h4><h4 data-es="">Inspecciones NY</h4></div><p className="what" data-en="">Dedicated inspection page + booking — one of the highest-intent local searches there is.</p><p className="what" data-es="">Página y reserva de inspección — una de las búsquedas locales de mayor intención.</p><div className="why"><b data-en="">Why</b><b data-es="">Por qué</b><span data-en="">"Inspection near me" is ready-to-buy traffic. Own it and the phone rings.</span><span data-es="">"Inspección cerca de mí" es tráfico listo para comprar. Domínalo y suena el teléfono.</span></div></div>
                <div className="feat"><div className="ftop"><div className="fic">📞</div><h4 data-en="">AI Phone Agent + VOIP</h4><h4 data-es="">Agente Telefónico IA + VOIP</h4></div><p className="what" data-en="">A programmable, custom AI phone agent answers, quotes, and books jobs 24/7, with instant text-back on missed calls and full call logging into the CRM.</p><p className="what" data-es="">Un agente telefónico de IA personalizado y programable contesta, cotiza y agenda trabajos 24/7, con texto instantáneo en llamadas perdidas y registro completo en el CRM.</p><div className="why"><b data-en="">Why</b><b data-es="">Por qué</b><span data-en="">A busy shop can't catch every call. The AI agent answers the ones you'd miss — each one is a job saved.</span><span data-es="">Un taller ocupado no contesta cada llamada. El agente de IA atiende las que perderías — cada una es un trabajo salvado.</span></div></div>
                <div className="feat"><div className="ftop"><div className="fic">📊</div><h4 data-en="">Local SEO + Town Pages</h4><h4 data-es="">SEO Local + Pueblos</h4></div><p className="what" data-en="">A page for every service in every nearby town, built on a controlled schedule.</p><p className="what" data-es="">Una página por cada servicio en cada pueblo cercano, en un calendario controlado.</p><div className="why"><b data-en="">Why</b><b data-es="">Por qué</b><span data-en="">This is the moat. Competitors can't match the coverage — see the engine below.</span><span data-es="">Esta es la ventaja. La competencia no iguala la cobertura — ve el motor abajo.</span></div></div>
              </div>
              <div className="hero-cta" style={{ marginTop: 24 }}>
                <Link className="btn btn-amber" href="/demo/easternTruck" data-en="">See the live Eastern Truck demo site →</Link>
                <Link className="btn btn-amber" href="/demo/easternTruck" data-es="">Ver el sitio demo de Eastern Truck →</Link>
              </div>
              <div>
                <span className="phase-pill" data-en="">Build: months 1–6 · Maintenance: months 7–12</span>
                <span className="phase-pill" data-es="">Construcción: meses 1–6 · Mantenimiento: meses 7–12</span>
              </div>
            </div>
          </div>

          {/* BIZ 2 */}
          <div className="biz">
            <div className="wrap" style={{ paddingTop: 46 }}>
              <div className="biz-head">
                <span className="biz-num">2</span>
                <div>
                  <h2 style={{ fontSize: 'clamp(24px,3vw,32px)', marginBottom: 4 }}>Jet Truck Repair</h2>
                  <span className="biz-loc">965 E Main St, Riverhead, NY</span>
                </div>
                <span className="biz-badge" data-en="">Own Brand</span><span className="biz-badge" data-es="">Marca Propia</span>
              </div>
              <div className="feat-grid">
                <div className="feat"><div className="ftop"><div className="fic">🌐</div><h4 data-en="">Its Own Identity</h4><h4 data-es="">Su Propia Identidad</h4></div><p className="what" data-en="">Jet keeps its own name and presence — own site, own Google profile, own reviews.</p><p className="what" data-es="">Jet mantiene su nombre y presencia — sitio propio, perfil de Google propio, reseñas propias.</p><div className="why"><b data-en="">Why</b><b data-es="">Por qué</b><span data-en="">Two brands in two towns capture twice the local search — they don't compete.</span><span data-es="">Dos marcas en dos pueblos capturan el doble de búsquedas — no compiten entre sí.</span></div></div>
                <div className="feat"><div className="ftop"><div className="fic">⚡</div><h4 data-en="">Faster Build (Proven Systems)</h4><h4 data-es="">Construcción Más Rápida</h4></div><p className="what" data-en="">Same engine as Eastern, re-skinned for Jet — so it's quicker and costs less to stand up.</p><p className="what" data-es="">El mismo motor que Eastern, adaptado para Jet — más rápido y de menor costo.</p><div className="why"><b data-en="">Why</b><b data-es="">Por qué</b><span data-en="">You pay for a second business, not a second invention. Discounted accordingly.</span><span data-es="">Pagas por un segundo negocio, no por reinventar. Con descuento.</span></div></div>
                <div className="feat"><div className="ftop"><div className="fic">📍</div><h4 data-en="">Riverhead Local SEO</h4><h4 data-es="">SEO Local Riverhead</h4></div><p className="what" data-en="">Town pages targeting Riverhead and the North/South Fork corridor.</p><p className="what" data-es="">Páginas de pueblo enfocadas en Riverhead y el corredor North/South Fork.</p><div className="why"><b data-en="">Why</b><b data-es="">Por qué</b><span data-en="">A separate service area means no overlap with Speonk — pure added reach.</span><span data-es="">Un área de servicio separada significa cero traslape con Speonk — alcance puro.</span></div></div>
                <div className="feat"><div className="ftop"><div className="fic">📞</div><h4 data-en="">Shared Comms Backbone</h4><h4 data-es="">Comunicación Compartida</h4></div><p className="what" data-en="">Same VOIP/SMS platform, separate tracked number — leads attributed to Jet cleanly.</p><p className="what" data-es="">Misma plataforma VOIP/SMS, número rastreado aparte — clientes atribuidos a Jet.</p><div className="why"><b data-en="">Why</b><b data-es="">Por qué</b><span data-en="">One system to manage, clean per-business reporting. Efficient for you, clear for him.</span><span data-es="">Un solo sistema, reportes claros por negocio. Eficiente y claro.</span></div></div>
              </div>
              <div>
                <span className="phase-pill" data-en="">Build: months 1–6 · Maintenance: months 7–12</span>
                <span className="phase-pill" data-es="">Construcción: meses 1–6 · Mantenimiento: meses 7–12</span>
              </div>
            </div>
          </div>

          {/* BIZ 3 */}
          <div className="biz">
            <div className="wrap" style={{ paddingTop: 46 }}>
              <div className="biz-head">
                <span className="biz-num">3</span>
                <div>
                  <h2 style={{ fontSize: 'clamp(24px,3vw,32px)', marginBottom: 4 }}>Redwood Tree Experts</h2>
                  <span className="biz-loc"><span data-en="">Tree Service — Replacing the current site</span><span data-es="">Servicio de Árboles — Reemplazo del sitio actual</span></span>
                </div>
                <span className="biz-badge" data-en="">Rebuild + Booking</span><span className="biz-badge" data-es="">Reconstrucción</span>
              </div>

              <div className="callout">
                <h5 data-en="">⚠ The current site is holding you back</h5>
                <h5 data-es="">⚠ El sitio actual te está frenando</h5>
                <p data-en="">The existing site was spun up by a tax-software company on a generic builder. The hero photo is a tree job in <b>Atlanta</b> — stock imagery, not your crews. No meta description, no real local SEO, no booking, no Spanish, and the brand is diluted with metal edging and electric gates. It looks fine at a glance but it will never rank or book a job on its own.</p>
                <p data-es="">El sitio actual lo armó una empresa de software de impuestos en un constructor genérico. La foto principal es un trabajo de árbol en <b>Atlanta</b> — imágenes de banco, no tus equipos. Sin descripción meta, sin SEO local real, sin reservas, sin español, y la marca se diluye con bordes de metal y portones eléctricos. Se ve bien a primera vista pero nunca posicionará ni reservará un trabajo solo.</p>
              </div>

              <div className="feat-grid">
                <div className="feat"><div className="ftop"><div className="fic">🌲</div><h4 data-en="">Real Rebuild, Real Photos</h4><h4 data-es="">Reconstrucción Real</h4></div><p className="what" data-en="">New bilingual site with Redwood's actual job photos and tight focus on tree work.</p><p className="what" data-es="">Nuevo sitio bilingüe con fotos reales de Redwood y enfoque claro en árboles.</p><div className="why"><b data-en="">Why</b><b data-es="">Por qué</b><span data-en="">Real local photos + focus is what Google and customers both reward.</span><span data-es="">Fotos locales reales + enfoque es lo que premian Google y los clientes.</span></div></div>
                <div className="feat"><div className="ftop"><div className="fic">📦</div><h4 data-en="">Bookable Service Packages</h4><h4 data-es="">Paquetes Reservables</h4></div><p className="what" data-en="">Standard jobs — stump grinding, trimming, brush cleanup, roof-line clearing — as fixed packages customers book online in a few taps.</p><p className="what" data-es="">Trabajos estándar — molienda de tocones, poda, limpieza de maleza — como paquetes fijos que el cliente reserva en línea.</p><div className="why"><b data-en="">Why</b><b data-es="">Por qué</b><span data-en="">Turns "call for an estimate" into instant online bookings. Less phone tag, more booked work.</span><span data-es="">Convierte "llama para cotizar" en reservas instantáneas. Menos llamadas, más trabajo agendado.</span></div></div>
                <div className="feat"><div className="ftop"><div className="fic">🚨</div><h4 data-en="">Emergency / Storm Funnel</h4><h4 data-es="">Embudo de Emergencia</h4></div><p className="what" data-en="">A fast "tree down / emergency" path that captures urgent high-value calls instantly.</p><p className="what" data-es="">Una vía rápida de "árbol caído / emergencia" que captura llamadas urgentes de alto valor.</p><div className="why"><b data-en="">Why</b><b data-es="">Por qué</b><span data-en="">Storm work is premium-priced and time-sensitive — being first to answer wins the job.</span><span data-es="">El trabajo de tormenta es premium y urgente — el primero en contestar gana.</span></div></div>
                <div className="feat"><div className="ftop"><div className="fic">📸</div><h4 data-en="">Photo-Estimate Intake</h4><h4 data-es="">Cotización por Foto</h4></div><p className="what" data-en="">Customers upload a photo of the tree/job to start an estimate request — faster, fewer site visits.</p><p className="what" data-es="">El cliente sube una foto del árbol para iniciar la cotización — más rápido, menos visitas.</p><div className="why"><b data-en="">Why</b><b data-es="">Por qué</b><span data-en="">Pre-qualifies leads and cuts wasted drive time before quoting.</span><span data-es="">Pre-califica clientes y reduce tiempo de manejo antes de cotizar.</span></div></div>
              </div>
              <div>
                <span className="phase-pill" data-en="">Build: months 1–3 · Maintenance: months 4–12</span>
                <span className="phase-pill" data-es="">Construcción: meses 1–3 · Mantenimiento: meses 4–12</span>
              </div>
            </div>
          </div>
        </section>

        {/* RENTALS PLATFORM SPOTLIGHT */}
        <div className="spot" id="rentals">
          <div className="wrap">
            <div className="eyebrow" data-en="">Custom Platform · Built From Scratch</div>
            <div className="eyebrow" data-es="">Plataforma a Medida · Desde Cero</div>
            <h2 data-en="">Equipment Rentals — the whole machine</h2>
            <h2 data-es="">Renta de Equipo — la máquina completa</h2>
            <p className="sec-lede" data-en="">Not a brochure — a full booking platform that runs the rental business end to end, from the ad that finds the customer to the deposit hold on their card.</p>
            <p className="sec-lede" data-es="">No un folleto — una plataforma completa que maneja la renta de principio a fin, desde el anuncio hasta el depósito en su tarjeta.</p>

            <div className="spot-card">
              <div className="flow">
                <div className="step"><span className="n">1</span><span data-en="">Marketing</span><span data-es="">Marketing</span></div>
                <span className="arr">→</span>
                <div className="step"><span className="n">2</span><span data-en="">Browse &amp; Availability</span><span data-es="">Catálogo</span></div>
                <span className="arr">→</span>
                <div className="step"><span className="n">3</span><span data-en="">Online Booking</span><span data-es="">Reserva</span></div>
                <span className="arr">→</span>
                <div className="step"><span className="n">4</span><span data-en="">Digital Waiver</span><span data-es="">Exención Digital</span></div>
                <span className="arr">→</span>
                <div className="step"><span className="n">5</span><span data-en="">Card Auth Hold</span><span data-es="">Retención de Tarjeta</span></div>
                <span className="arr">→</span>
                <div className="step"><span className="n">6</span><span data-en="">Payment</span><span data-es="">Pago</span></div>
                <span className="arr">→</span>
                <div className="step"><span className="n">7</span><span data-en="">Return &amp; Review</span><span data-es="">Devolución</span></div>
              </div>

              <div className="feat-grid" style={{ marginTop: 30 }}>
                <div className="feat"><div className="ftop"><div className="fic">📅</div><h4 data-en="">Live Availability Calendar</h4><h4 data-es="">Calendario en Vivo</h4></div><p className="what" data-en="">Real-time inventory so a piece can't be double-booked. Customers see what's free and reserve it.</p><p className="what" data-es="">Inventario en tiempo real para no duplicar reservas. El cliente ve qué está libre y lo reserva.</p></div>
                <div className="feat"><div className="ftop"><div className="fic">✍️</div><h4 data-en="">Online Waiver / E-Sign</h4><h4 data-es="">Exención en Línea</h4></div><p className="what" data-en="">Liability waiver signed digitally before pickup — stored, timestamped, legally clean.</p><p className="what" data-es="">Exención de responsabilidad firmada digital antes de recoger — guardada y con fecha.</p></div>
                <div className="feat"><div className="ftop"><div className="fic">💳</div><h4 data-en="">Card Authorization Hold</h4><h4 data-es="">Retención en Tarjeta</h4></div><p className="what" data-en="">A security hold on the customer's card at booking — protects the equipment, automated.</p><p className="what" data-es="">Una retención de seguridad en la tarjeta al reservar — protege el equipo, automatizado.</p></div>
                <div className="feat"><div className="ftop"><div className="fic">💰</div><h4 data-en="">Payments + Deposits</h4><h4 data-es="">Pagos + Depósitos</h4></div><p className="what" data-en="">Take rental payment and deposit online; release or charge the hold on return automatically.</p><p className="what" data-es="">Cobra renta y depósito en línea; libera o cobra la retención al devolver, automático.</p></div>
                <div className="feat"><div className="ftop"><div className="fic">📋</div><h4 data-en="">Rental Agreements</h4><h4 data-es="">Contratos de Renta</h4></div><p className="what" data-en="">Auto-generated rental contracts per booking, tied to the equipment and the customer record.</p><p className="what" data-es="">Contratos generados automáticamente por reserva, ligados al equipo y al cliente.</p></div>
                <div className="feat"><div className="ftop"><div className="fic">🔔</div><h4 data-en="">Reminders &amp; Overdue Alerts</h4><h4 data-es="">Recordatorios</h4></div><p className="what" data-en="">Automatic pickup/return reminders by text, plus overdue alerts so nothing walks off.</p><p className="what" data-es="">Recordatorios automáticos de recogida/devolución por texto, más alertas de retraso.</p></div>
              </div>
            </div>
          </div>
        </div>

        {/* OPTIONAL: SHOP MGMT */}
        <section>
          <div className="wrap">
            <div className="eyebrow" data-en="">Optional Add-On · Truck Repair</div>
            <div className="eyebrow" data-es="">Opcional · Reparación de Camiones</div>
            <h2 data-en="">Fleet Client Portal &amp; Shop Management</h2>
            <h2 data-es="">Portal de Flotas y Gestión del Taller</h2>
            <p className="sec-lede" data-en="">A deeper system for the repair shops — turning one-time jobs into recurring fleet relationships. Build it custom, or integrate a proven shop-management platform.</p>
            <p className="sec-lede" data-es="">Un sistema más profundo para los talleres — convirtiendo trabajos únicos en relaciones de flota recurrentes.</p>
            <div className="feat-grid">
              <div className="feat"><div className="ftop"><div className="fic">🚛</div><h4 data-en="">Fleet Client Accounts</h4><h4 data-es="">Cuentas de Flota</h4></div><p className="what" data-en="">Commercial clients log in, add their trucks/equipment, and manage everything in one place.</p><p className="what" data-es="">Clientes comerciales entran, agregan sus camiones/equipo y manejan todo en un lugar.</p><div className="why"><b data-en="">Why</b><b data-es="">Por qué</b><span data-en="">Fleet accounts are sticky, recurring, high-value — the opposite of one-off walk-ins.</span><span data-es="">Las cuentas de flota son recurrentes y de alto valor — lo opuesto a clientes de paso.</span></div></div>
              <div className="feat"><div className="ftop"><div className="fic">🗓️</div><h4 data-en="">Maintenance Scheduling</h4><h4 data-es="">Programación de Mantenimiento</h4></div><p className="what" data-en="">Per-vehicle service intervals with automatic reminders when a truck is due.</p><p className="what" data-es="">Intervalos de servicio por vehículo con recordatorios automáticos.</p><div className="why"><b data-en="">Why</b><b data-es="">Por qué</b><span data-en="">Proactive reminders book the next job before the client even thinks to call.</span><span data-es="">Los recordatorios agendan el siguiente trabajo antes de que el cliente llame.</span></div></div>
              <div className="feat"><div className="ftop"><div className="fic">🧾</div><h4 data-en="">Estimates &amp; Invoicing</h4><h4 data-es="">Cotizaciones y Facturas</h4></div><p className="what" data-en="">Digital estimates, approvals, and invoices tied to each vehicle's full service history.</p><p className="what" data-es="">Cotizaciones, aprobaciones y facturas ligadas al historial de cada vehículo.</p><div className="why"><b data-en="">Why</b><b data-es="">Por qué</b><span data-en="">Faster billing, fewer disputes, and a documented history that raises business value.</span><span data-es="">Facturación más rápida, menos disputas, e historial que sube el valor del negocio.</span></div></div>
              <div className="feat"><div className="ftop"><div className="fic">💳</div><h4 data-en="">Online Payments</h4><h4 data-es="">Pagos en Línea</h4></div><p className="what" data-en="">Clients pay invoices online — faster cash flow, automatic receipts and records.</p><p className="what" data-es="">Los clientes pagan en línea — flujo más rápido, recibos y registros automáticos.</p><div className="why"><b data-en="">Why</b><b data-es="">Por qué</b><span data-en="">Money in faster, less chasing checks, cleaner books for an eventual sale.</span><span data-es="">Dinero más rápido, menos persecución de cheques, libros limpios para vender.</span></div></div>
            </div>
            <p className="matrix-note" data-en="">Two paths: integrate a proven platform (Tekmetric / Shopmonkey) via its API for the repair-order depth, or build a lean custom portal you own outright. We'll pick based on shop volume and your exit goals.</p>
            <p className="matrix-note" data-es="">Dos caminos: integrar una plataforma probada (Tekmetric / Shopmonkey) por su API, o construir un portal propio. Elegimos según el volumen y tus metas de venta.</p>
          </div>
        </section>

        {/* TOWN ENGINE */}
        <section style={{ background: 'var(--ink2)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
          <div className="wrap">
            <div className="eyebrow" data-en="">The Growth Engine · Always Running</div>
            <div className="eyebrow" data-es="">El Motor de Crecimiento · Siempre Activo</div>
            <h2 data-en="">A page for every service, in every town</h2>
            <h2 data-es="">Una página por cada servicio, en cada pueblo</h2>
            <p className="sec-lede" data-en="">The long-term moat. We continuously build local content pages — every service crossed with every town in the vicinity — published on a steady, natural schedule. Most agencies manage 2–3 pages a month. This engine fills the whole map.</p>
            <p className="sec-lede" data-es="">La ventaja a largo plazo. Construimos continuamente páginas locales — cada servicio por cada pueblo cercano — publicadas en un calendario constante y natural.</p>
            <div className="towns">
              <span className="town">Speonk</span><span className="town">Riverhead</span><span className="town">Westhampton</span><span className="town">Hampton Bays</span><span className="town">Center Moriches</span><span className="town">East Moriches</span><span className="town">Eastport</span><span className="town">Manorville</span><span className="town">Mastic</span><span className="town">Shirley</span><span className="town">Patchogue</span><span className="town">Quogue</span><span className="town">Southampton</span><span className="town">Hampton Bays</span><span className="town">Calverton</span><span className="town">Wading River</span><span className="town">Aquebogue</span><span className="town">Jamesport</span><span className="town">Moriches</span><span className="town">Remsenburg</span><span className="town">+ 20 more…</span>
            </div>
            <p className="matrix-note" data-en="">Example: "Diesel truck repair in Riverhead" · "Stump grinding in Westhampton" · "NY inspection in Speonk" · "Excavator rental in Manorville" — each a real, individually-written page that ranks for ready-to-buy local searches.</p>
            <p className="matrix-note" data-es="">Ejemplo: "Reparación diésel en Riverhead" · "Molienda de tocones en Westhampton" · "Inspección en Speonk" — cada una una página real que posiciona para búsquedas locales listas para comprar.</p>
          </div>
        </section>

        {/* TIMELINE */}
        <section>
          <div className="wrap">
            <div className="eyebrow" data-en="">Build &amp; Rollout · Estimated Timeline</div>
            <div className="eyebrow" data-es="">Construcción y Lanzamiento · Cronograma Estimado</div>
            <h2 data-en="">From kickoff to the full machine in 12 months</h2>
            <h2 data-es="">De inicio a la máquina completa en 12 meses</h2>
            <p className="sec-lede" data-en="">A phased rollout — the systems that bring in revenue go live first, the deeper platforms build in parallel behind them. Every phase delivers something working, not a year-long wait for one big launch.</p>
            <p className="sec-lede" data-es="">Un lanzamiento por fases — los sistemas que generan ingresos salen primero, las plataformas más profundas se construyen en paralelo detrás. Cada fase entrega algo funcionando, sin esperar un año por un solo lanzamiento.</p>
            <div className="feat-grid">
              <div className="feat"><div className="ftop"><div className="fic">1</div><h4 data-en="">Foundation</h4><h4 data-es="">Cimientos</h4></div><span className="phase-pill" data-en="">Weeks 1–4</span><span className="phase-pill" data-es="">Semanas 1–4</span><p className="what" style={{ marginTop: 12 }} data-en="">Brand, domains, CRM, business phone numbers and AI-agent setup, and directory listings claimed and verified across all businesses.</p><p className="what" style={{ marginTop: 12 }} data-es="">Marca, dominios, CRM, números de teléfono y configuración del agente IA, y directorios reclamados y verificados en todos los negocios.</p></div>
              <div className="feat"><div className="ftop"><div className="fic">2</div><h4 data-en="">Flagship Launch</h4><h4 data-es="">Lanzamiento Principal</h4></div><span className="phase-pill" data-en="">Months 1–3</span><span className="phase-pill" data-es="">Meses 1–3</span><p className="what" style={{ marginTop: 12 }} data-en="">Eastern Truck site live and Redwood Tree rebuilt with online booking. Core system running: website, reviews engine, AI phone agent, missed-call text, and the lead dashboard.</p><p className="what" style={{ marginTop: 12 }} data-es="">Sitio de Eastern Truck en vivo y Redwood reconstruido con reservas. Sistema base activo: sitio, reseñas, agente IA, texto en llamadas perdidas y panel de clientes.</p></div>
              <div className="feat"><div className="ftop"><div className="fic">3</div><h4 data-en="">Expansion</h4><h4 data-es="">Expansión</h4></div><span className="phase-pill" data-en="">Months 3–6</span><span className="phase-pill" data-es="">Meses 3–6</span><p className="what" style={{ marginTop: 12 }} data-en="">Jet Truck site live. Email &amp; SMS marketing and Google Ads campaigns launched. The town-page engine begins publishing on a steady schedule.</p><p className="what" style={{ marginTop: 12 }} data-es="">Sitio de Jet Truck en vivo. Campañas de Email/SMS y Google Ads lanzadas. El motor de páginas por pueblo comienza a publicar.</p></div>
              <div className="feat"><div className="ftop"><div className="fic">4</div><h4 data-en="">Rentals Platform</h4><h4 data-es="">Plataforma de Renta</h4></div><span className="phase-pill" data-en="">Months 4–8</span><span className="phase-pill" data-es="">Meses 4–8</span><p className="what" style={{ marginTop: 12 }} data-en="">The custom equipment-rental platform built and launched — live availability, online booking, digital waivers, card holds, payments, and auto-generated agreements.</p><p className="what" style={{ marginTop: 12 }} data-es="">La plataforma de renta a medida construida y lanzada — disponibilidad en vivo, reservas, exenciones digitales, retenciones de tarjeta, pagos y contratos automáticos.</p></div>
              <div className="feat"><div className="ftop"><div className="fic">5</div><h4 data-en="">Scale &amp; Optimize</h4><h4 data-es="">Escala y Optimización</h4></div><span className="phase-pill" data-en="">Months 6–12</span><span className="phase-pill" data-es="">Meses 6–12</span><p className="what" style={{ marginTop: 12 }} data-en="">Optional fleet client portal, the town-page engine at full cadence, ongoing maintenance, ad optimization, and monthly reporting across every business.</p><p className="what" style={{ marginTop: 12 }} data-es="">Portal de flotas opcional, el motor de páginas a máxima cadencia, mantenimiento continuo, optimización de anuncios y reportes mensuales por negocio.</p></div>
            </div>
            <p className="matrix-note" data-en="">Estimate only — exact sequencing flexes to priorities, access, and approvals. Phases overlap; the goal is steady momentum with something live at every step.</p>
            <p className="matrix-note" data-es="">Solo estimación — la secuencia exacta se ajusta a prioridades, accesos y aprobaciones. Las fases se traslapan; la meta es impulso constante con algo en vivo en cada paso.</p>
          </div>
        </section>

        {/* CLOSE */}
        <section className="close">
          <div className="wrap">
            <div className="eyebrow" style={{ textAlign: 'center' }} data-en="">The Bottom Line</div>
            <div className="eyebrow" style={{ textAlign: 'center' }} data-es="">En Resumen</div>
            <h2 data-en="">Build it once. Own it forever. Sell it for more.</h2>
            <h2 data-es="">Constrúyelo una vez. Poséelo siempre. Véndelo por más.</h2>
            <p data-en="">Every website, profile, customer record, and system is set up cleanly under your ownership and transfers to you — or a buyer — whenever you want. A business that runs on documented systems sells for a higher multiple. We're not just marketing your shops; we're building the asset.</p>
            <p data-es="">Cada sitio, perfil, registro de cliente y sistema se configura bajo tu propiedad y se transfiere a ti — o a un comprador — cuando quieras. Un negocio que corre con sistemas documentados se vende por más. No solo hacemos marketing; construimos el activo.</p>
            <div className="hero-cta" style={{ justifyContent: 'center' }}>
              <a className="btn btn-amber" href="tel:+1" data-en="">Let's talk numbers →</a>
              <a className="btn btn-amber" href="tel:+1" data-es="">Hablemos de números →</a>
            </div>
          </div>
        </section>

        <footer>
          <div className="wrap">
            <span className="dot"></span><span data-en="">BenchworksAI · Digital Operations Partnership · Prepared for Carlos · Confidential working scope</span>
            <span data-es="">BenchworksAI · Sociedad de Operaciones Digitales · Preparado para Carlos · Alcance confidencial</span>
          </div>
        </footer>
      </div>
    </>
  );
}
