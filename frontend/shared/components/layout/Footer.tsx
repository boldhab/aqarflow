import React from 'react';
import Link from 'next/link';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
      {/* Main Footer Directory */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand & Mission Column */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-white">
              <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-brand-600 text-white text-sm font-black shadow-md">
                A
              </span>
              <span>
                Aqar<span className="text-brand-400">Flow</span>
              </span>
            </Link>
            <p className="text-sm text-slate-300 leading-relaxed max-w-sm">
              Pakistan&apos;s modern real estate platform connecting discerning buyers, tenants, and investors
              with property listings and agency professionals.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-emerald-400 border border-slate-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Agency property listings
              </span>
              <span className="text-xs text-slate-300">Prices displayed in PKR</span>
            </div>
          </div>

          {/* Discover Properties */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Discover
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/properties?purpose=SALE" className="hover:text-white transition-colors">
                  Properties for Sale
                </Link>
              </li>
              <li>
                <Link href="/properties?purpose=RENT" className="hover:text-white transition-colors">
                  Properties for Rent
                </Link>
              </li>
              <li>
                <Link href="/properties?type=APARTMENT" className="hover:text-white transition-colors">
                  Luxury Apartments
                </Link>
              </li>
              <li>
                <Link href="/properties?type=HOUSE" className="hover:text-white transition-colors">
                  Houses &amp; Villas
                </Link>
              </li>
              <li>
                <Link href="/properties?type=PLOT" className="hover:text-white transition-colors">
                  Residential &amp; Commercial Plots
                </Link>
              </li>
            </ul>
          </div>

          {/* Prime Metros */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Major Cities
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/properties?city=Lahore" className="hover:text-white transition-colors">
                  Lahore (DHA, Gulberg, Bahria)
                </Link>
              </li>
              <li>
                <Link href="/properties?city=Karachi" className="hover:text-white transition-colors">
                  Karachi (Clifton, DHA, PECHS)
                </Link>
              </li>
              <li>
                <Link href="/properties?city=Islamabad" className="hover:text-white transition-colors">
                  Islamabad (F-6, F-7, F-10, DHA)
                </Link>
              </li>
              <li>
                <Link href="/properties?city=Rawalpindi" className="hover:text-white transition-colors">
                  Rawalpindi &amp; Environs
                </Link>
              </li>
            </ul>
          </div>

          {/* Company & Operations */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Company
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  About AqarFlow
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Contact &amp; Advisory
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-white transition-colors text-brand-400 font-medium">
                  Agency Workspace &rarr;
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Legal & Copyright Bar */}
      <div className="border-t border-slate-800 bg-slate-950/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-300">
          <p>&copy; {currentYear} AqarFlow Real Estate Technologies. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/contact" className="hover:text-white">Contact support</Link>


          </div>
        </div>
      </div>
    </footer>
  );
};
