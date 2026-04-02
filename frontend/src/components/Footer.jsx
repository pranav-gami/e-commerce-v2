import { useState } from "react";
import { Link } from "react-router-dom";

const SHOPPING_LINKS = [
  { label: "Men", to: "/products?category=Men" },
  { label: "Women", to: "/products?category=Women" },
  { label: "Kids", to: "/products?category=Kids" },
  { label: "Home & Living", to: "/products?category=Home%20%26%20Living" },
  { label: "Beauty", to: "/products?category=Beauty" },
  { label: "Gift Cards", to: "/products?category=Gift%20Cards" },
];

const POLICY_LINKS = [
  { label: "Contact Us", to: "/contact" },
  { label: "FAQ", to: "/contact" },
  { label: "Terms of Use", to: "/terms" },
  { label: "Track Orders", to: "/orders" },
  { label: "Shipping", to: "/contact" },
  { label: "Returns", to: "/contact" },
];

const SOCIAL = [
  {
    label: "Facebook",
    href: "#",
    path: "M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z",
  },
  {
    label: "Instagram",
    href: "#",
    path: "M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z M4 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  },
  {
    label: "Twitter / X",
    href: "#",
    path: "M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z",
  },
];

/* Collapsible section — tap to open on mobile, always open on desktop */
const FooterSection = ({ title, children }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/10 md:border-none">
      <button
        className="md:hidden w-full flex items-center justify-between py-4 bg-transparent border-none cursor-pointer text-left"
        onClick={() => setOpen((p) => !p)}
        aria-expanded={open}
      >
        <span className="text-[11px] font-extrabold text-[#535766] uppercase tracking-widest">
          {title}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#535766"
          strokeWidth="2.5"
          className={`transition-transform duration-200 flex-shrink-0 ${open ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      <h4 className="hidden md:block text-[11px] font-extrabold text-[#535766] uppercase tracking-widest mb-4">
        {title}
      </h4>

      <div
        className={`overflow-hidden transition-all duration-300 md:block ${open ? "max-h-96 pb-4" : "max-h-0 md:max-h-none"}`}
      >
        {children}
      </div>
    </div>
  );
};

const Footer = () => (
  <footer className="bg-[#1c1c26] text-white">
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
      {/* 4-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 md:gap-8 mb-0 md:mb-10">
        {/* Online Shopping — dynamic from backend categories */}
        <FooterSection title="Online Shopping">
          <ul className="space-y-2.5">
            {SHOPPING_LINKS.map((item) => (
              <li key={item.label}>
                <Link
                  to={item.to}
                  className="text-sm text-white/60 hover:text-white transition-colors"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </FooterSection>

        {/* Customer Policies */}
        <FooterSection title="Customer Policies">
          <ul className="space-y-2.5">
            {POLICY_LINKS.map((item) => (
              <li key={item.label}>
                <Link
                  to={item.to}
                  className="text-sm text-white/60 hover:text-white transition-colors"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </FooterSection>

        {/* App download */}
        <FooterSection title="Experience App On">
          <div className="space-y-2.5">
            {[
              {
                store: "Google Play",
                sub: "Get it on",
                icon: (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M3.18 23.76c.3.17.64.24.99.19l12.6-7.27-2.79-2.79-10.8 9.87zM.43 1.53A1.5 1.5 0 0 0 0 2.6v18.8c0 .42.15.8.43 1.07l.06.06 10.53-10.53v-.25L.49 1.47l-.06.06zM21.8 10.27l-2.9-1.67-3.14 3.14 3.14 3.14 2.93-1.69c.84-.48.84-1.27-.03-1.92zM4.17.24L16.77 7.5l-2.79 2.79L3.18.24c.3-.17.64-.21.99-.19L4.17.24z" />
                  </svg>
                ),
              },
              {
                store: "App Store",
                sub: "Download on the",
                icon: (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98l-.09.06c-.22.15-2.18 1.27-2.16 3.8.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.37 2.78zM13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                  </svg>
                ),
              },
            ].map(({ store, sub, icon }) => (
              <a
                key={store}
                href="#"
                className="flex items-center gap-3 bg-white/8 hover:bg-white/15 border border-white/10 transition-all px-3 py-2.5 rounded-lg group"
              >
                <span className="text-white/70 group-hover:text-white transition-colors">
                  {icon}
                </span>
                <div>
                  <p className="text-[10px] text-white/40 leading-none">
                    {sub}
                  </p>
                  <p className="text-sm font-bold text-white leading-snug">
                    {store}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </FooterSection>

        {/* Social */}
        <FooterSection title="Keep In Touch">
          <div className="flex gap-3 flex-wrap mb-4">
            {SOCIAL.map((s) => (
              <a
                key={s.label}
                href={s.href}
                aria-label={s.label}
                className="w-9 h-9 border border-white/20 rounded-full flex items-center justify-center hover:bg-[#ff3f6c] hover:border-[#ff3f6c] transition-all"
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                >
                  <path d={s.path} />
                </svg>
              </a>
            ))}
          </div>
          <p className="text-xs text-white/35 leading-relaxed">
            Follow us for daily style inspiration, new arrivals & exclusive
            offers.
          </p>
        </FooterSection>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10 pt-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/40">
        <div className="flex items-center gap-2">
          <img
            src="/logo.ico"
            alt="Myntra"
            className="h-6 w-auto object-contain"
          />
          <span className="text-white/60 font-semibold">Myntra</span>
        </div>

        <p className="text-center m-0">© 2026 Myntra — All rights reserved.</p>

        <div className="flex gap-4">
          <Link to="/terms" className="hover:text-white transition-colors">
            Privacy Policy
          </Link>
          <Link to="/terms" className="hover:text-white transition-colors">
            Terms
          </Link>
          <a href="#" className="hover:text-white transition-colors">
            Cookies
          </a>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
