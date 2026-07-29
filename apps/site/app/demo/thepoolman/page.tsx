'use client';

import React, { useState } from 'react';

// ---------------------------------------------------------------------------
// Inline lucide-style icons (no external dependency).
// ---------------------------------------------------------------------------
type IconProps = { size?: number; className?: string };

function SvgIcon({
  size = 24,
  className = '',
  children,
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const Phone = (p: IconProps) => (
  <SvgIcon {...p}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </SvgIcon>
);
const MapPin = (p: IconProps) => (
  <SvgIcon {...p}>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </SvgIcon>
);
const ShieldCheck = (p: IconProps) => (
  <SvgIcon {...p}>
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    <path d="m9 12 2 2 4-4" />
  </SvgIcon>
);
const Droplet = (p: IconProps) => (
  <SvgIcon {...p}>
    <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" />
  </SvgIcon>
);
const Layers = (p: IconProps) => (
  <SvgIcon {...p}>
    <path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" />
    <path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65" />
    <path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65" />
  </SvgIcon>
);
const Sparkles = (p: IconProps) => (
  <SvgIcon {...p}>
    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .962 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.962 0z" />
    <path d="M20 3v4" />
    <path d="M22 5h-4" />
    <path d="M4 17v2" />
    <path d="M5 18H3" />
  </SvgIcon>
);
const Mail = (p: IconProps) => (
  <SvgIcon {...p}>
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </SvgIcon>
);
const Clock = (p: IconProps) => (
  <SvgIcon {...p}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </SvgIcon>
);
const ArrowRight = (p: IconProps) => (
  <SvgIcon {...p}>
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </SvgIcon>
);
const Menu = (p: IconProps) => (
  <SvgIcon {...p}>
    <line x1="4" x2="20" y1="12" y2="12" />
    <line x1="4" x2="20" y1="6" y2="6" />
    <line x1="4" x2="20" y1="18" y2="18" />
  </SvgIcon>
);
const X = (p: IconProps) => (
  <SvgIcon {...p}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </SvgIcon>
);
const Award = (p: IconProps) => (
  <SvgIcon {...p}>
    <path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526" />
    <circle cx="12" cy="8" r="6" />
  </SvgIcon>
);
const Compass = (p: IconProps) => (
  <SvgIcon {...p}>
    <path d="m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z" />
    <circle cx="12" cy="12" r="10" />
  </SvgIcon>
);
const CheckCircle = (p: IconProps) => (
  <SvgIcon {...p}>
    <circle cx="12" cy="12" r="10" />
    <path d="m9 12 2 2 4-4" />
  </SvgIcon>
);
const Maximize2 = (p: IconProps) => (
  <SvgIcon {...p}>
    <polyline points="15 3 21 3 21 9" />
    <polyline points="9 21 3 21 3 15" />
    <line x1="21" x2="14" y1="3" y2="10" />
    <line x1="3" x2="10" y1="21" y2="14" />
  </SvgIcon>
);
const Sliders = (p: IconProps) => (
  <SvgIcon {...p}>
    <line x1="21" x2="14" y1="4" y2="4" />
    <line x1="10" x2="3" y1="4" y2="4" />
    <line x1="21" x2="12" y1="12" y2="12" />
    <line x1="8" x2="3" y1="12" y2="12" />
    <line x1="21" x2="16" y1="20" y2="20" />
    <line x1="12" x2="3" y1="20" y2="20" />
    <line x1="14" x2="14" y1="2" y2="6" />
    <line x1="8" x2="8" y1="10" y2="14" />
    <line x1="16" x2="16" y1="18" y2="22" />
  </SvgIcon>
);
const Check = (p: IconProps) => (
  <SvgIcon {...p}>
    <path d="M20 6 9 17l-5-5" />
  </SvgIcon>
);

export default function ThePoolManDemo() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeLinerTab, setActiveLinerTab] = useState('20mil');
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    serviceType: 'Liner Replacement',
    scope: '',
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
    setTimeout(() => setFormSubmitted(false), 5000);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans antialiased selection:bg-cyan-500 selection:text-slate-950">
      {/* Pitch Header Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-slate-950 text-xs md:text-sm font-semibold px-4 py-2 text-center flex flex-col sm:flex-row items-center justify-center gap-2 relative z-50">
        <span className="bg-slate-950 text-amber-400 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider">
          Sales Demo Pitch
        </span>
        <span>Custom Interactive Presentation Prepared for <strong>Kevin &quot;The Pool Man&quot; Cherwinski</strong></span>
      </div>

      {/* Navigation */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex-shrink-0 flex flex-col">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-gradient-to-tr from-cyan-500 to-sky-500 rounded-lg text-slate-950">
                  <Droplet size={24} className="h-6 w-6" />
                </div>
                <span className="text-xl md:text-2xl font-black tracking-tight text-white uppercase">
                  The Pool <span className="text-sky-400">Man</span>
                </span>
              </div>
              <span className="text-[10px] tracking-widest text-slate-400 uppercase font-bold mt-0.5">
                Kevin Cherwinski
              </span>
            </div>

            <nav className="hidden md:flex items-center space-x-8">
              <a href="#services" className="text-sm font-semibold text-slate-300 hover:text-white transition-colors">Services</a>
              <a href="#liners" className="text-sm font-semibold text-slate-300 hover:text-white transition-colors">Vinyl Liners</a>
              <a href="#process" className="text-sm font-semibold text-slate-300 hover:text-white transition-colors">Our Process</a>
              <a href="#areas" className="text-sm font-semibold text-slate-300 hover:text-white transition-colors">Areas Served</a>
              <a href="#contact" className="text-sm font-semibold text-slate-300 hover:text-white transition-colors">Get Estimate</a>
            </nav>

            <div className="hidden md:block">
              <a
                href="#contact"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-slate-950 shadow-lg shadow-sky-500/10 hover:shadow-sky-400/20 active:scale-95"
              >
                [[PLACEHOLDER: Phone or Quote CTA]]
              </a>
            </div>

            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
                aria-label="Toggle Menu"
              >
                {mobileMenuOpen ? <X size={24} className="h-6 w-6" /> : <Menu size={24} className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-950 border-b border-slate-800 transition-all duration-300">
            <div className="px-2 pt-2 pb-4 space-y-1 sm:px-3">
              <a href="#services" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2.5 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-900">Services</a>
              <a href="#liners" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2.5 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-900">Vinyl Liners</a>
              <a href="#process" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2.5 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-900">Our Process</a>
              <a href="#areas" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2.5 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-900">Areas Served</a>
              <div className="pt-4 pb-2 px-3 border-t border-slate-800">
                <a href="#contact" onClick={() => setMobileMenuOpen(false)} className="w-full flex items-center justify-center px-4 py-3 rounded-lg text-base font-bold bg-gradient-to-r from-sky-500 to-cyan-500 text-slate-950 text-center">
                  [[PLACEHOLDER: Phone or Quote CTA]]
                </a>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-24 md:py-32 bg-slate-950">
        <div className="absolute inset-0 pointer-events-none opacity-40 mix-blend-screen">
          <svg className="w-full h-full" viewBox="0 0 1440 800" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 200C240 100 480 300 720 200C960 100 1200 300 1440 200V800H0V200Z" fill="url(#poolGradient)" opacity="0.3" />
            <path d="M0 350C300 250 600 450 900 350C1200 250 1350 400 1440 380V800H0V350Z" fill="url(#poolGradient2)" opacity="0.25" />
            <defs>
              <linearGradient id="poolGradient" x1="720" y1="200" x2="720" y2="800" gradientUnits="userSpaceOnUse">
                <stop stopColor="#0ea5e9" stopOpacity="0.8" />
                <stop offset="1" stopColor="#0f172a" />
              </linearGradient>
              <linearGradient id="poolGradient2" x1="720" y1="350" x2="1000" y2="800" gradientUnits="userSpaceOnUse">
                <stop stopColor="#06b6d4" stopOpacity="0.6" />
                <stop offset="1" stopColor="#020617" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-sky-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-full px-4 py-1.5 mb-8">
              <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-xs font-bold tracking-wide uppercase text-slate-300">
                Center Moriches &amp; Eastern Suffolk County&apos;s Elite Pool Specialist
              </span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6 leading-[1.1]">
              Clear Water.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-cyan-400 to-teal-300">
                Perfect Fits.
              </span><br />
              Complete Pool Mastery.
            </h1>

            <p className="text-lg sm:text-xl text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed">
              Serving the unique demands of Eastern Long Island pools. High-end, custom-fit vinyl liners, expert seasonal maintenance, and modern technical upgrades.
            </p>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <a href="#contact" className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-xl text-base font-bold bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-slate-950 transition-all duration-300 shadow-xl shadow-sky-500/10 hover:shadow-sky-500/20 hover:-translate-y-0.5 active:translate-y-0">
                [[PLACEHOLDER: Get an Estimate CTA]]
                <ArrowRight size={20} className="ml-2 h-5 w-5" />
              </a>
              <a href="tel:Placeholder" className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-xl text-base font-bold bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0">
                <Phone size={20} className="mr-2 h-5 w-5 text-sky-400" />
                [[PLACEHOLDER: Contact Phone Number]]
              </a>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mt-16 pt-8 border-t border-slate-900">
              <div className="text-center p-4">
                <div className="text-2xl md:text-3xl font-black text-white">100%</div>
                <div className="text-xs text-slate-400 font-semibold mt-1">Laser Accuracy</div>
              </div>
              <div className="text-center p-4">
                <div className="text-2xl md:text-3xl font-black text-white">East End</div>
                <div className="text-xs text-slate-400 font-semibold mt-1">Local Focus</div>
              </div>
              <div className="text-center p-4">
                <div className="text-2xl md:text-3xl font-black text-white">Premium</div>
                <div className="text-xs text-slate-400 font-semibold mt-1">Vinyl Specialists</div>
              </div>
              <div className="text-center p-4">
                <div className="text-2xl md:text-3xl font-black text-white">Direct</div>
                <div className="text-xs text-slate-400 font-semibold mt-1">Owner Operated</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Services Section */}
      <section id="services" className="py-20 md:py-28 bg-slate-900 border-t border-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs uppercase tracking-widest font-black text-sky-400">SERVICES</h2>
            <p className="text-3xl sm:text-5xl font-extrabold text-white mt-2 mb-4">Complete Pool Care &amp; Renovation</p>
            <p className="text-slate-300">
              Whether reviving a legacy pool or keeping your current water in immaculate balance, we offer unmatched local craftsmanship with modern accountability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-b from-slate-950 to-slate-900 rounded-2xl border border-slate-800 p-8 flex flex-col justify-between hover:border-sky-500/50 transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 bg-sky-500/10 rounded-bl-2xl text-sky-400">
                <Layers size={24} className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-sky-400">High Margin / Core Specialization</span>
                <h3 className="text-2xl font-bold text-white mt-2 mb-4">Custom Vinyl Liners</h3>
                <p className="text-slate-300 mb-6 leading-relaxed">
                  Precision computerized laser-measured drop-in replacements. We scrape structural walls, clean and re-level bottoms, and guarantee zero-wrinkle, long-lasting fits.
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center text-sm text-slate-300"><CheckCircle size={18} className="text-cyan-400 mr-2 shrink-0" />Perfect corner fitment &amp; slope alignment</li>
                  <li className="flex items-center text-sm text-slate-300"><CheckCircle size={18} className="text-cyan-400 mr-2 shrink-0" />Groundwater extraction &amp; structural prep</li>
                  <li className="flex items-center text-sm text-slate-300"><CheckCircle size={18} className="text-cyan-400 mr-2 shrink-0" />Premium chemical-resistant vinyl brands</li>
                </ul>
              </div>
              <a href="#liners" className="inline-flex items-center text-sm font-bold text-sky-400 hover:text-sky-300">
                Explore Vinyl Liners
                <ArrowRight size={16} className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>

            <div className="bg-gradient-to-b from-slate-950 to-slate-900 rounded-2xl border border-slate-800 p-8 flex flex-col justify-between hover:border-cyan-500/50 transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 bg-cyan-500/10 rounded-bl-2xl text-cyan-400">
                <Droplet size={24} className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Flawless Operation</span>
                <h3 className="text-2xl font-bold text-white mt-2 mb-4">Maintenance &amp; Openings</h3>
                <p className="text-slate-300 mb-6 leading-relaxed">
                  Turnkey spring openings, fall closings, safety cover installations, vacuums, and custom chemical supply scheduling. We ensure crystal-clear pool chemistry.
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center text-sm text-slate-300"><CheckCircle size={18} className="text-cyan-400 mr-2 shrink-0" />Premium chemical balance &amp; stabilization</li>
                  <li className="flex items-center text-sm text-slate-300"><CheckCircle size={18} className="text-cyan-400 mr-2 shrink-0" />Thorough system vacuuming &amp; brushwork</li>
                  <li className="flex items-center text-sm text-slate-300"><CheckCircle size={18} className="text-cyan-400 mr-2 shrink-0" />Expert winterization &amp; safety covers</li>
                </ul>
              </div>
              <a href="#contact" className="inline-flex items-center text-sm font-bold text-cyan-400 hover:text-cyan-300">
                Schedule Season Service
                <ArrowRight size={16} className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>

            <div className="bg-gradient-to-b from-slate-950 to-slate-900 rounded-2xl border border-slate-800 p-8 flex flex-col justify-between hover:border-teal-500/50 transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 bg-teal-500/10 rounded-bl-2xl text-teal-400">
                <Sparkles size={24} className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-teal-400">Modern Performance</span>
                <h3 className="text-2xl font-bold text-white mt-2 mb-4">Construction &amp; Upgrades</h3>
                <p className="text-slate-300 mb-6 leading-relaxed">
                  Breathe new life into older setups. We construct high-quality vinyl-liner pools and upgrade existing equipment to high-efficiency heaters, salt water conversions, and smart-controlled lighting.
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center text-sm text-slate-300"><CheckCircle size={18} className="text-teal-400 mr-2 shrink-0" />Eco-friendly variable speed pumps &amp; heaters</li>
                  <li className="flex items-center text-sm text-slate-300"><CheckCircle size={18} className="text-teal-400 mr-2 shrink-0" />Advanced salt systems &amp; automatic feeders</li>
                  <li className="flex items-center text-sm text-slate-300"><CheckCircle size={18} className="text-teal-400 mr-2 shrink-0" />Custom lighting &amp; automated tech panels</li>
                </ul>
              </div>
              <a href="#contact" className="inline-flex items-center text-sm font-bold text-teal-400 hover:text-teal-300">
                Request Upgrade Consultation
                <ArrowRight size={16} className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Deep-Dive Pool Liners */}
      <section id="liners" className="py-20 md:py-28 bg-slate-950 relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7">
              <span className="text-xs font-black tracking-widest text-cyan-400 uppercase">OUR PROFITABLE CORE</span>
              <h2 className="text-3xl sm:text-5xl font-black text-white mt-2 mb-6">
                The Anatomy of a Perfect Fit: Custom Vinyl Liners
              </h2>
              <p className="text-slate-300 text-base sm:text-lg mb-6 leading-relaxed">
                Many pool contractors cut corners on liners—taking fast, approximate measurements that result in unsightly wrinkles, premature dry-rot, and early failure.
              </p>
              <p className="text-slate-300 text-base sm:text-lg mb-8 leading-relaxed">
                At <strong>The Pool Man</strong>, we employ a meticulous multi-point preparation and laser measurement process. We control groundwater extraction directly, completely scrape and re-smooth structural pool walls, adjust the floor bed to exact standards, and hook up powerful vacuum arrays to seat the vinyl perfectly before a single drop of water is added.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex gap-4">
                  <div className="h-10 w-10 shrink-0 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-center text-cyan-400"><Maximize2 size={20} className="h-5 w-5" /></div>
                  <div><h4 className="font-bold text-white">Laser Measurement</h4><p className="text-sm text-slate-400 mt-1">Millimeter-accurate mapping ensures exact slope and bead fitment.</p></div>
                </div>
                <div className="flex gap-4">
                  <div className="h-10 w-10 shrink-0 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-center text-cyan-400"><Sliders size={20} className="h-5 w-5" /></div>
                  <div><h4 className="font-bold text-white">Zero Wrinkle Guarantee</h4><p className="text-sm text-slate-400 mt-1">High-pressure vacuum seating forces a seamless fit against walls.</p></div>
                </div>
                <div className="flex gap-4">
                  <div className="h-10 w-10 shrink-0 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-center text-cyan-400"><ShieldCheck size={20} className="h-5 w-5" /></div>
                  <div><h4 className="font-bold text-white">Wall Refinishing</h4><p className="text-sm text-slate-400 mt-1">Rust abatement, wall scraping, and cushion pads installed for comfort.</p></div>
                </div>
                <div className="flex gap-4">
                  <div className="h-10 w-10 shrink-0 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-center text-cyan-400"><Droplet size={20} className="h-5 w-5" /></div>
                  <div><h4 className="font-bold text-white">Water Table Control</h4><p className="text-sm text-slate-400 mt-1">Hydrostatic pressure relief and deep-well pumps used during seat.</p></div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 bg-gradient-to-tr from-slate-900 to-slate-950 p-6 sm:p-8 rounded-2xl border border-slate-800">
              <div className="mb-6">
                <span className="text-[10px] tracking-widest text-sky-400 uppercase font-extrabold block mb-1">INTERACTIVE PREVIEW</span>
                <h3 className="text-xl font-bold text-white">Verification &amp; Material Specifier</h3>
                <p className="text-xs text-slate-400 mt-1">Toggle the tiers below to simulate client selection options.</p>
              </div>

              <div className="flex bg-slate-950 p-1.5 rounded-xl border border-slate-800 mb-6">
                <button onClick={() => setActiveLinerTab('20mil')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeLinerTab === '20mil' ? 'bg-gradient-to-r from-sky-500 to-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'}`}>Standard (20 mil)</button>
                <button onClick={() => setActiveLinerTab('28mil')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeLinerTab === '28mil' ? 'bg-gradient-to-r from-sky-500 to-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'}`}>Premium Max (28 mil)</button>
              </div>

              <div className="space-y-6">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Liner Specifications</span>
                  <div className="text-slate-100 font-mono text-sm leading-relaxed">
                    {activeLinerTab === '20mil' ? (
                      <div>
                        <strong>[[PLACEHOLDER: 20mil Liner Warranty &amp; Details]]</strong>
                        <div className="text-xs text-slate-400 mt-2">Flexible conforming vinyl designed for standard residential applications. Provides exceptional cost-to-performance ratio with optimal UV protection.</div>
                      </div>
                    ) : (
                      <div>
                        <strong>[[PLACEHOLDER: 28mil Liner Warranty &amp; Details]]</strong>
                        <div className="text-xs text-slate-400 mt-2">High-caliber, ultra-tough chemical-resistant vinyl. Built for extreme conditions, heavy active usage, and superior protection against puncture risk.</div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-sky-500/5 border border-sky-500/20 p-4 rounded-xl">
                  <Award size={40} className="text-cyan-400 shrink-0" />
                  <div>
                    <h5 className="font-bold text-white text-sm">Owner-Inspected Guarantee</h5>
                    <p className="text-xs text-slate-400 mt-0.5"><strong>[[PLACEHOLDER: Warranty Details]]</strong></p>
                  </div>
                </div>

                <div className="relative h-44 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex flex-col justify-end p-4 group">
                  <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:14px_24px]" />
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" />
                  <div className="absolute top-1/2 left-4 right-4 h-12 border-b-2 border-dashed border-sky-400/40" />
                  <div className="absolute top-4 right-4 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded text-[10px] text-slate-300 font-mono">{activeLinerTab === '20mil' ? 'Thickness: 20 mil' : 'Thickness: 28 mil'}</div>
                  <div className="relative z-10 text-center text-xs text-slate-400 font-medium">[[IMAGE: Graphical blueprint illustration of a {activeLinerTab} custom vinyl swimming pool liner fitment]]</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Structured Process */}
      <section id="process" className="py-20 md:py-28 bg-slate-900 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-xs uppercase tracking-widest font-black text-sky-400">HOW WE WORK</h2>
            <p className="text-3xl sm:text-5xl font-extrabold text-white mt-2 mb-4">Precision From Start To Finish</p>
            <p className="text-slate-300">We make custom pool management simple. Each phase of our process is fully structured, transparent, and built around your property&apos;s schedule.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            <div className="relative p-6 bg-slate-950 rounded-2xl border border-slate-800"><span className="absolute -top-6 left-6 text-5xl font-black text-sky-500/20">01</span><h3 className="text-xl font-bold text-white mt-4 mb-2">1. Consultation</h3><p className="text-sm text-slate-300">We review your current layout, diagnose liner concerns, outline equipment needs, and provide clear options without dynamic upselling.</p></div>
            <div className="relative p-6 bg-slate-950 rounded-2xl border border-slate-800"><span className="absolute -top-6 left-6 text-5xl font-black text-sky-500/20">02</span><h3 className="text-xl font-bold text-white mt-4 mb-2">2. Laser Scan</h3><p className="text-sm text-slate-300">Using ultra-precise computerized laser scanning, we map the entire perimeter of your basin to eliminate structural sag or pocket wrinkles.</p></div>
            <div className="relative p-6 bg-slate-950 rounded-2xl border border-slate-800"><span className="absolute -top-6 left-6 text-5xl font-black text-sky-500/20">03</span><h3 className="text-xl font-bold text-white mt-4 mb-2">3. Surface Prep</h3><p className="text-sm text-slate-300">We pull the old vinyl, scrape walls of structural anomalies, repair floor concrete imperfections, and secure groundwater relief drainage.</p></div>
            <div className="relative p-6 bg-slate-950 rounded-2xl border border-slate-800"><span className="absolute -top-6 left-6 text-5xl font-black text-sky-500/20">04</span><h3 className="text-xl font-bold text-white mt-4 mb-2">4. Vacuum Seal</h3><p className="text-sm text-slate-300">Using heavy duty vacuum rigs, we lock the custom liner flush with the structural base and begin filling, ensuring clean gaskets at all points.</p></div>
          </div>
        </div>
      </section>

      {/* Areas Served */}
      <section id="areas" className="py-20 bg-slate-950 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-8 md:p-12 relative overflow-hidden">
            <div className="absolute right-0 bottom-0 w-1/3 h-full opacity-10 pointer-events-none">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none"><circle cx="100" cy="100" r="80" fill="cyan" /></svg>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-400 bg-slate-900 border border-slate-800 rounded-full px-3 py-1 mb-4"><MapPin size={12} className="h-3 w-3" /><span>Eastern Suffolk County</span></div>
                <h3 className="text-2xl sm:text-4xl font-extrabold text-white mb-4">Serving Moriches, Manorville, &amp; Surrounding Towns</h3>
                <p className="text-slate-300 mb-6 leading-relaxed">To ensure maximum quality controls and same-day responsive service, we concentrate our operation to local zip codes. Check below to verify your location.</p>
                <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl">
                  <span className="text-xs font-bold text-slate-400 block mb-2 uppercase">Official Service Territories</span>
                  <div className="text-sky-400 font-mono font-bold text-base md:text-lg">[[PLACEHOLDER: Exact Service Areas / Towns Served]]</div>
                </div>
              </div>
              <div className="lg:col-span-5 h-64 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col items-center justify-center p-6 text-center">
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-full text-sky-400 mb-3"><Compass size={24} className="h-6 w-6" /></div>
                <div className="text-xs text-slate-400 max-w-xs">[[IMAGE: Local SVG geographic map overlay representing Center Moriches and surrounding service boundaries]]</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact / Estimate Form */}
      <section id="contact" className="py-20 md:py-28 bg-slate-900 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-950 rounded-3xl border border-slate-800 p-8 md:p-12 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-sky-500 via-cyan-500 to-teal-400" />
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="text-xs font-black tracking-widest text-sky-400 uppercase">GET AN ESTIMATE</span>
              <h3 className="text-3xl font-extrabold text-white mt-1 mb-2">Let&apos;s Get Started</h3>
              <p className="text-sm text-slate-400">Submit details about your vinyl liner replacement, seasonal maintenance, or upgrade project.</p>
            </div>

            {formSubmitted ? (
              <div className="bg-sky-500/10 border border-sky-500/30 rounded-2xl p-8 text-center text-slate-100">
                <div className="inline-flex items-center justify-center p-3 bg-sky-500 rounded-full text-slate-950 mb-4"><Check size={24} className="h-6 w-6 stroke-[3]" /></div>
                <h4 className="text-xl font-bold mb-2">Demo Request Logged Successfully!</h4>
                <p className="text-sm text-slate-300 max-w-md mx-auto">In the live production build, this form triggers real-time text notifications straight to Kevin Cherwinski&apos;s phone so he can bid jobs instantly.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Your Name</label>
                    <input type="text" name="name" required value={formData.name} onChange={handleInputChange} placeholder="Jane Doe" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Your Phone</label>
                    <input type="tel" name="phone" required value={formData.phone} onChange={handleInputChange} placeholder="[[PLACEHOLDER: Phone Input Format]]" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Email Address</label>
                    <input type="email" name="email" required value={formData.email} onChange={handleInputChange} placeholder="jane@example.com" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Requested Service</label>
                    <select name="serviceType" value={formData.serviceType} onChange={handleInputChange} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors appearance-none">
                      <option value="Liner Replacement">Vinyl Liner Replacement</option>
                      <option value="Seasonal Opening/Closing">Seasonal Opening / Closing</option>
                      <option value="Weekly Maintenance">Weekly Maintenance Plan</option>
                      <option value="Equipment Upgrade">Equipment &amp; Tech Upgrades</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Scope of Work &amp; Pool Dimensions (Optional)</label>
                  <textarea rows={4} name="scope" value={formData.scope} onChange={handleInputChange} placeholder="E.g., 18x36 vinyl liner replacement, currently has localized wrinkles near deep end stairs..." className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors resize-none" />
                </div>
                <div className="pt-2">
                  <button type="submit" className="w-full bg-gradient-to-r from-sky-500 via-cyan-500 to-teal-400 hover:from-sky-400 hover:to-teal-300 text-slate-950 font-bold py-4 rounded-xl transition-all duration-300 shadow-lg shadow-sky-500/10 hover:shadow-sky-500/20 active:scale-[0.99] flex items-center justify-center gap-2">
                    <span>[[PLACEHOLDER: Send Demo Request]]</span>
                    <span className="text-[10px] font-black tracking-widest bg-slate-950/20 text-slate-900 px-2 py-0.5 rounded uppercase">Demo Entry Only</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 text-slate-400 pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-12">
            <div className="md:col-span-5 flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-gradient-to-tr from-cyan-500 to-sky-500 rounded-lg text-slate-950"><Droplet size={20} className="h-5 w-5" /></div>
                <span className="text-xl font-black tracking-tight text-white uppercase">The Pool <span className="text-sky-400">Man</span></span>
              </div>
              <span className="text-[10px] tracking-widest text-slate-400 uppercase font-bold">Kevin Cherwinski</span>
              <p className="text-sm text-slate-400 mt-4 max-w-sm leading-relaxed">Premium vinyl liner solutions, professional openings, closings, and modern chemical supply directly serving the East End.</p>
            </div>
            <div className="md:col-span-4 space-y-4">
              <h4 className="text-xs font-black uppercase text-white tracking-widest">Base of Operations</h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2.5"><MapPin size={16} className="text-sky-400 shrink-0 mt-0.5" /><span>Center Moriches, NY</span></li>
                <li className="flex items-start gap-2.5"><Clock size={16} className="text-sky-400 shrink-0 mt-0.5" /><span><strong>Hours:</strong> [[PLACEHOLDER: Hours of Operation]]</span></li>
              </ul>
            </div>
            <div className="md:col-span-3 space-y-4">
              <h4 className="text-xs font-black uppercase text-white tracking-widest">Direct Lines</h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2.5"><Phone size={16} className="text-sky-400 shrink-0" /><span>[[PLACEHOLDER: Phone Number]]</span></li>
                <li className="flex items-center gap-2.5"><Mail size={16} className="text-sky-400 shrink-0" /><span>[[PLACEHOLDER: Email Address]]</span></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-900 text-center flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <p>© {new Date().getFullYear()} The Pool Man. All rights reserved. Pitch build for evaluation.</p>
            <div className="flex gap-4">
              <span className="text-slate-600">Moriches Area Zip Codes Only</span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-600">Owner Operated</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
