import { useState } from "react";
import { Link } from "react-router-dom";

const SHOPPING_LINKS = ["Men", "Women", "Kids", "Home & Living", "Beauty", "Gift Cards"];
const POLICY_LINKS   = ["Contact Us", "FAQ", "Terms of Use", "Track Orders", "Shipping", "Returns"];
const SOCIAL = [
  { label: "Facebook",  path: "M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" },
  { label: "Instagram", path: "M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z M4 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" },
  { label: "Twitter",   path: "M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" },
];

// Collapsible section for mobile
const FooterSection = ({ title, children }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/10 md:border-none">
      {/* Header – tappable on mobile, static heading on desktop */}
      <button
        className="md:hidden w-full flex items-center justify-between py-4 bg-transparent border-none cursor-pointer text-left"
        onClick={() => setOpen((p) => !p)}
        aria-expanded={open}
      >
        <span className="text-[11px] font-extrabold text-[#535766] uppercase tracking-widest">
          {title}
        </span>
        <svg
          width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke="#535766" strokeWidth="2.5"
          className={`transition-transform duration-200 flex-shrink-0 ${open ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Desktop heading (always visible) */}
      <h4 className="hidden md:block text-[11px] font-extrabold text-[#535766] uppercase tracking-widest mb-4">
        {title}
      </h4>

      {/* Content – always visible on md+, toggled on mobile */}
      <div className={`overflow-hidden transition-all duration-300 md:block ${open ? "max-h-96 pb-4" : "max-h-0 md:max-h-none"}`}>
        {children}
      </div>
    </div>
  );
};

const Footer = () => (
  <footer className="bg-[#1c1c26] text-white">
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">

      {/* ── 4-column grid on md+, single column on mobile ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 md:gap-8 mb-0 md:mb-10">

        {/* Online Shopping */}
        <FooterSection title="Online Shopping">
          <ul className="space-y-2.5">
            {SHOPPING_LINKS.map((item) => (
              <li key={item}>
                <Link to="/products" className="text-sm text-white/60 hover:text-white transition-colors">
                  {item}
                </Link>
              </li>
            ))}
          </ul>
        </FooterSection>

        {/* Customer Policies */}
        <FooterSection title="Customer Policies">
          <ul className="space-y-2.5">
            {POLICY_LINKS.map((item) => (
              <li key={item}>
                <Link to="/contact" className="text-sm text-white/60 hover:text-white transition-colors">
                  {item}
                </Link>
              </li>
            ))}
          </ul>
        </FooterSection>

        {/* App stores */}
        <FooterSection title="Experience App On">
          <div className="space-y-2.5">
            {["Google Play", "App Store"].map((store) => (
              <a
                key={store}
                href="#"
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 transition-colors px-3 py-2 rounded text-sm font-semibold text-white"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                  <line x1="12" y1="18" x2="12.01" y2="18" />
                </svg>
                {store}
              </a>
            ))}
          </div>
        </FooterSection>

        {/* Social */}
        <FooterSection title="Keep In Touch">
          <div className="flex gap-3 flex-wrap">
            {SOCIAL.map((s) => (
              <a
                key={s.label}
                href="#"
                aria-label={s.label}
                className="w-9 h-9 border border-white/20 rounded-full flex items-center justify-center hover:bg-[#ff3f6c] hover:border-[#ff3f6c] transition-all"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d={s.path} />
                </svg>
              </a>
            ))}
          </div>
        </FooterSection>
      </div>

      {/* ── Bottom bar ── */}
      <div className="border-t border-white/10 pt-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/40">
        <div className="flex items-center gap-1">
          <span className="text-xl font-extrabold text-[#ff3f6c]">Shop</span>
          <span className="text-xl font-extrabold text-white">.in</span>
        </div>
        <p className="text-center sm:text-left m-0">© 2026 Shop.in — All rights reserved.</p>
        <div className="flex gap-4">
          {["Privacy Policy", "Terms", "Cookies"].map((l) => (
            <a key={l} href="#" className="hover:text-white transition-colors">{l}</a>
          ))}
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;