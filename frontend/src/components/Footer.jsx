import { Link } from "react-router-dom";

const Footer = () => {
  const columns = [
    {
      title: "ONLINE SHOPPING",
      links: ["Men", "Women", "Kids", "Home & Living", "Beauty", "Gift Cards"],
    },
    {
      title: "CUSTOMER POLICIES",
      links: ["Contact Us", "FAQ", "T&C", "Terms Of Use", "Track Orders", "Shipping"],
    },
    {
      title: "EXPERIENCE SHOP.IN APP ON",
      links: [],
      isApp: true,
    },
    {
      title: "KEEP IN TOUCH",
      links: [],
      isSocial: true,
    },
  ];

  return (
    <footer className="bg-brand-dark text-white">
      <div className="max-w-screen-xl mx-auto px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {/* Nav columns */}
          <div>
            <h4 className="text-[11px] font-extrabold text-brand-gray uppercase tracking-widest mb-4">Online Shopping</h4>
            <ul className="space-y-2.5">
              {["Men", "Women", "Kids", "Home & Living", "Beauty", "Gift Cards"].map((item) => (
                <li key={item}>
                  <Link to="/products" className="text-sm text-white/70 hover:text-white transition-colors">{item}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[11px] font-extrabold text-brand-gray uppercase tracking-widest mb-4">Customer Policies</h4>
            <ul className="space-y-2.5">
              {["Contact Us", "FAQ", "Terms of Use", "Track Orders", "Shipping", "Returns"].map((item) => (
                <li key={item}>
                  <Link to="/contact" className="text-sm text-white/70 hover:text-white transition-colors">{item}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[11px] font-extrabold text-brand-gray uppercase tracking-widest mb-4">Experience App On</h4>
            <div className="space-y-2.5">
              {["Google Play", "App Store"].map((store) => (
                <a key={store} href="#" className="flex items-center gap-2 bg-white/10 hover:bg-white/20 transition-colors px-3 py-2 rounded text-sm font-semibold text-white">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" /><line x1="12" y1="18" x2="12.01" y2="18" />
                  </svg>
                  {store}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-[11px] font-extrabold text-brand-gray uppercase tracking-widest mb-4">Keep In Touch</h4>
            <div className="flex gap-3 flex-wrap">
              {[
                { label: "Facebook", path: "M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" },
                { label: "Instagram", path: "M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z M4 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" },
                { label: "Twitter", path: "M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" },
              ].map((s) => (
                <a key={s.label} href="#"
                  className="w-9 h-9 border border-white/20 rounded-full flex items-center justify-center hover:bg-primary hover:border-primary transition-all"
                  aria-label={s.label}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d={s.path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/40">
          <div className="flex items-center gap-2">
            <span className="text-xl font-extrabold text-primary">Shop</span>
            <span className="text-xl font-extrabold text-white">.in</span>
          </div>
          <p>© 2026 Shop.in India — All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
