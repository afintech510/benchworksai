'use client';

import React, { useState } from 'react';

// ---------------------------------------------------------------------------
// Inline lucide-style icons (no external dependency — keeps this demo
// self-contained and off the production marketing bundle / lockfile).
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
const Clock = (p: IconProps) => (
  <SvgIcon {...p}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
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
const Truck = (p: IconProps) => (
  <SvgIcon {...p}>
    <path d="M5 18H3c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v11" />
    <path d="M14 9h4l4 4v4c0 .6-.4 1-1 1h-2" />
    <circle cx="7" cy="18" r="2" />
    <path d="M15 18H9" />
    <circle cx="17" cy="18" r="2" />
  </SvgIcon>
);
const Settings = (p: IconProps) => (
  <SvgIcon {...p}>
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </SvgIcon>
);
const Hammer = (p: IconProps) => (
  <SvgIcon {...p}>
    <path d="m15 12-8.5 8.5a2.12 2.12 0 1 1-3-3L12 9" />
    <path d="M17.64 15 22 10.64" />
    <path d="m20.91 11.7-1.25-1.25c-.6-.6-.93-1.4-.93-2.25v-.86L16.01 4.6a5.56 5.56 0 0 0-3.94-1.64H9l.92.82A6.18 6.18 0 0 1 12 8.4v1.56l2 2h2.47l2.26 1.91" />
  </SvgIcon>
);
const ChevronRight = (p: IconProps) => (
  <SvgIcon {...p}>
    <path d="m9 18 6-6-6-6" />
  </SvgIcon>
);
const ShieldCheck = (p: IconProps) => (
  <SvgIcon {...p}>
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    <path d="m9 12 2 2 4-4" />
  </SvgIcon>
);

export default function EasternTruckDemo() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const businessInfo = {
    name: 'Eastern Truck & Equipment Repair',
    suffix: '& Welding Inc.',
    phone: '631-939-1397',
    address: '91 N Phillips Ave.',
    city: 'Speonk',
    state: 'NY',
    domain: 'www.easternTruckRepair.com',
  };

  return (
    <div className="min-h-screen font-sans bg-slate-50 text-slate-900">
      {/* Top Bar - Contact Info */}
      <div className="bg-slate-900 text-white text-sm py-2 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center">
          <div className="flex items-center space-x-6">
            <span className="flex items-center space-x-2">
              <MapPin size={16} className="text-yellow-500" />
              <span>{businessInfo.address}, {businessInfo.city} {businessInfo.state}</span>
            </span>
            <span className="hidden md:flex items-center space-x-2">
              <Clock size={16} className="text-yellow-500" />
              <span>Mon-Fri: 7am - 5pm</span>
            </span>
          </div>
          <div className="mt-2 sm:mt-0 flex items-center space-x-2 font-bold text-yellow-500">
            <Phone size={16} />
            <a href={`tel:${businessInfo.phone}`} className="hover:text-yellow-400 transition">
              {businessInfo.phone}
            </a>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center">
              <div className="flex flex-col justify-center">
                <span className="text-2xl font-black tracking-tight text-slate-900 leading-none">
                  EASTERN TRUCK
                </span>
                <span className="text-sm font-bold text-slate-600 leading-tight">
                  & EQUIPMENT REPAIR
                </span>
                <span className="text-xs font-semibold text-yellow-600 leading-tight">
                  {businessInfo.suffix}
                </span>
              </div>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#services" className="text-slate-700 hover:text-yellow-600 font-semibold transition">Services</a>
              <a href="#about" className="text-slate-700 hover:text-yellow-600 font-semibold transition">About Us</a>
              <a href="#contact" className="text-slate-700 hover:text-yellow-600 font-semibold transition">Contact</a>
              <a
                href={`tel:${businessInfo.phone}`}
                className="bg-red-700 hover:bg-red-800 text-white px-6 py-2.5 rounded-md font-bold flex items-center shadow-lg transition-transform hover:-translate-y-0.5"
              >
                <Phone size={18} className="mr-2" />
                Call Now
              </a>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-slate-700 hover:text-slate-900"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Panel */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 px-4 pt-2 pb-4 space-y-1 shadow-lg">
            <a href="#services" className="block px-3 py-2 text-base font-semibold text-slate-700 hover:bg-slate-50 rounded-md">Services</a>
            <a href="#about" className="block px-3 py-2 text-base font-semibold text-slate-700 hover:bg-slate-50 rounded-md">About Us</a>
            <a href="#contact" className="block px-3 py-2 text-base font-semibold text-slate-700 hover:bg-slate-50 rounded-md">Contact</a>
            <a
              href={`tel:${businessInfo.phone}`}
              className="mt-4 w-full bg-red-700 text-white px-3 py-3 rounded-md font-bold flex justify-center items-center"
            >
              <Phone size={18} className="mr-2" />
              {businessInfo.phone}
            </a>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <div className="relative bg-slate-900 py-24 sm:py-32 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center z-10">
          <div className="md:w-1/2 text-left pr-0 md:pr-10">
            <div className="inline-block bg-yellow-500 text-slate-900 font-bold px-3 py-1 rounded-sm text-sm mb-6 shadow-sm">
              Serving {businessInfo.city}, NY & Surrounding Areas
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight mb-6 tracking-tight">
              HEAVY-DUTY REPAIR <br />
              <span className="text-yellow-500">FOR HEAVY-DUTY WORK.</span>
            </h1>
            <p className="text-lg text-slate-300 mb-8 max-w-xl leading-relaxed">
              From commercial truck diagnostics to complete excavator undercarriage rebuilds and custom welding, we keep your fleet running strong.
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <a
                href="#services"
                className="bg-yellow-500 hover:bg-yellow-400 text-slate-900 px-8 py-4 rounded-md font-bold text-center shadow-lg transition-transform hover:-translate-y-1 flex justify-center items-center"
              >
                Our Services <ChevronRight size={20} className="ml-1" />
              </a>
              <a
                href="#contact"
                className="bg-transparent border-2 border-white hover:bg-white hover:text-slate-900 text-white px-8 py-4 rounded-md font-bold text-center transition-colors flex justify-center items-center"
              >
                Get a Quote
              </a>
            </div>
          </div>

          {/* Hero Visual Block */}
          <div className="md:w-1/2 mt-12 md:mt-0 w-full relative">
            <div className="bg-slate-800 rounded-xl p-8 shadow-2xl border border-slate-700 relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-yellow-500 rounded-full opacity-20 blur-2xl"></div>
              <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-32 h-32 bg-red-600 rounded-full opacity-20 blur-2xl"></div>

              <div className="flex flex-col space-y-6 relative z-10">
                <div className="flex items-center space-x-4 p-4 bg-slate-900 rounded-lg border border-slate-700">
                  <div className="bg-yellow-500 p-3 rounded-md text-slate-900">
                    <Truck size={32} />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-xl">Commercial Trucks</h3>
                    <p className="text-slate-400 text-sm">Diagnostics, Engines, Brakes</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4 p-4 bg-slate-900 rounded-lg border border-slate-700">
                  <div className="bg-yellow-500 p-3 rounded-md text-slate-900">
                    <Settings size={32} />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-xl">Heavy Equipment</h3>
                    <p className="text-slate-400 text-sm">Excavators, Loaders, Hydraulics</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4 p-4 bg-slate-900 rounded-lg border border-slate-700">
                  <div className="bg-red-700 p-3 rounded-md text-white">
                    <Hammer size={32} />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-xl">Custom Welding</h3>
                    <p className="text-slate-400 text-sm">Structural Repair & Fabrication</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Services Section */}
      <section id="services" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-base text-red-700 font-bold tracking-wide uppercase">What We Do</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Comprehensive Repair Services
            </p>
            <p className="mt-4 max-w-2xl text-lg text-slate-500 mx-auto">
              Equipped to handle everything from routine maintenance to major overhauls on your heaviest machinery.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Service 1 */}
            <div className="bg-slate-50 rounded-xl p-8 border border-slate-200 shadow-sm hover:shadow-xl transition-shadow duration-300">
              <div className="w-14 h-14 bg-slate-900 rounded-lg flex items-center justify-center mb-6 shadow-md">
                <Truck size={28} className="text-yellow-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Truck Repair</h3>
              <p className="text-slate-600 mb-4 leading-relaxed">
                Expert diagnostics and repair for all makes of commercial trucks. From engine rebuilds to brake systems and suspension.
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center text-sm text-slate-700"><ShieldCheck size={16} className="text-yellow-600 mr-2" /> Computer Diagnostics</li>
                <li className="flex items-center text-sm text-slate-700"><ShieldCheck size={16} className="text-yellow-600 mr-2" /> Engine & Transmission</li>
                <li className="flex items-center text-sm text-slate-700"><ShieldCheck size={16} className="text-yellow-600 mr-2" /> Preventative Maintenance</li>
              </ul>
            </div>

            {/* Service 2 */}
            <div className="bg-slate-50 rounded-xl p-8 border border-slate-200 shadow-sm hover:shadow-xl transition-shadow duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-2 h-full bg-yellow-500"></div>
              <div className="w-14 h-14 bg-slate-900 rounded-lg flex items-center justify-center mb-6 shadow-md">
                <Settings size={28} className="text-yellow-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Equipment Repair</h3>
              <p className="text-slate-600 mb-4 leading-relaxed">
                Specializing in heavy earth-moving equipment. Excavators, dozers, wheel loaders, and more.
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center text-sm text-slate-700"><ShieldCheck size={16} className="text-yellow-600 mr-2" /> Hydraulic Systems</li>
                <li className="flex items-center text-sm text-slate-700"><ShieldCheck size={16} className="text-yellow-600 mr-2" /> Undercarriage Rebuilds</li>
                <li className="flex items-center text-sm text-slate-700"><ShieldCheck size={16} className="text-yellow-600 mr-2" /> Electrical Systems</li>
              </ul>
            </div>

            {/* Service 3 */}
            <div className="bg-slate-50 rounded-xl p-8 border border-slate-200 shadow-sm hover:shadow-xl transition-shadow duration-300">
              <div className="w-14 h-14 bg-slate-900 rounded-lg flex items-center justify-center mb-6 shadow-md">
                <Hammer size={28} className="text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Welding & Fabrication</h3>
              <p className="text-slate-600 mb-4 leading-relaxed">
                Full-service welding capabilities for structural repairs, custom modifications, and heavy metal fabrication.
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center text-sm text-slate-700"><ShieldCheck size={16} className="text-red-600 mr-2" /> Bucket & Boom Repairs</li>
                <li className="flex items-center text-sm text-slate-700"><ShieldCheck size={16} className="text-red-600 mr-2" /> Frame Straightening</li>
                <li className="flex items-center text-sm text-slate-700"><ShieldCheck size={16} className="text-red-600 mr-2" /> Custom Metal Work</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA / Contact Section */}
      <section id="contact" className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-800 rounded-2xl p-8 md:p-12 shadow-2xl border border-slate-700 flex flex-col lg:flex-row items-center justify-between">
            <div className="lg:w-2/3 mb-8 lg:mb-0">
              <h2 className="text-3xl font-black mb-4">Need Immediate Repair or a Quote?</h2>
              <p className="text-slate-300 text-lg mb-6 max-w-2xl">
                Our shop in {businessInfo.city} is fully equipped to handle your toughest jobs. Call us today to schedule service or get an estimate on your repair.
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6">
                <div className="flex items-center space-x-3 text-lg font-bold">
                  <div className="bg-red-700 p-3 rounded-full">
                    <Phone size={24} className="text-white" />
                  </div>
                  <span>{businessInfo.phone}</span>
                </div>
                <div className="flex items-center space-x-3 text-lg font-bold">
                  <div className="bg-yellow-500 p-3 rounded-full text-slate-900">
                    <MapPin size={24} />
                  </div>
                  <span>{businessInfo.address}, {businessInfo.city}</span>
                </div>
              </div>
            </div>

            <div className="lg:w-1/3 w-full flex justify-end">
              <a
                href={`tel:${businessInfo.phone}`}
                className="w-full lg:w-auto text-center bg-yellow-500 hover:bg-yellow-400 text-slate-900 px-10 py-5 rounded-xl font-black text-xl shadow-[0_0_20px_rgba(234,179,8,0.3)] transition-all transform hover:scale-105"
              >
                CALL NOW
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <span className="text-xl font-black text-white block mb-2">{businessInfo.name}</span>
            <span className="text-sm font-bold text-yellow-600 block mb-4">{businessInfo.suffix}</span>
            <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
              Your trusted local partner for commercial truck and heavy equipment repair in New York.
            </p>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4 uppercase tracking-wider text-sm">Quick Links</h4>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-yellow-500 transition">Home</a></li>
              <li><a href="#services" className="hover:text-yellow-500 transition">Services</a></li>
              <li><a href="#about" className="hover:text-yellow-500 transition">About Us</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4 uppercase tracking-wider text-sm">Location</h4>
            <address className="not-italic space-y-2 text-sm">
              <p>{businessInfo.address}</p>
              <p>{businessInfo.city}, {businessInfo.state}</p>
              <p className="pt-2 text-white font-semibold">{businessInfo.phone}</p>
            </address>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-slate-800 text-sm flex flex-col md:flex-row justify-between items-center">
          <p>&copy; {new Date().getFullYear()} {businessInfo.name}. All rights reserved.</p>
          <p className="mt-2 md:mt-0">Designed for {businessInfo.domain}</p>
        </div>
      </footer>
    </div>
  );
}
