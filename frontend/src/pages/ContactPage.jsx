import { useEffect, useState } from "react";
import { trackFormSubmit } from "../utils/analytics";

const ContactPage = () => {
  useEffect(() => {
    document.title = "Help Center";
  }, []);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    trackFormSubmit("contact");

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setFormData({ name: "", email: "", message: "" });
      setTimeout(() => setIsSubmitted(false), 5000);
    }, 1000);
  };

  return (
    <div className="bg-gray-50 min-h-screen py-10 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900">Contact Us</h1>
          <p className="text-gray-500 mt-2 text-sm">
            Have questions? We'd love to hear from you!
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* FORM */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            {isSubmitted && (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded mb-4 text-sm">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <polyline
                    points="20 6 9 17 4 12"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  />
                </svg>
                Message sent successfully
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Enter your name"
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-[#ff3f6c]"
                />
              </div>

              {/* Email */}
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="Enter your email"
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-[#ff3f6c]"
                />
              </div>

              {/* Message */}
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase">
                  Message
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows="5"
                  placeholder="Enter your message"
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-[#ff3f6c]"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#ff3f6c] text-white py-2.5 rounded font-bold text-sm hover:bg-[#e0355f] transition disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Sending...
                  </>
                ) : (
                  "SEND MESSAGE"
                )}
              </button>
            </form>
          </div>

          {/* CONTACT INFO */}
          <div className="space-y-5">
            {[
              {
                title: "Address",
                value: "Mumbai, Maharashtra\nIndia",
                icon: (
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                ),
              },
              {
                title: "Email",
                value: "support@shop-india.com",
                icon: (
                  <>
                    <path d="M4 4h16v16H4z" />
                    <polyline points="22,6 12,13 2,6" />
                  </>
                ),
              },
              {
                title: "Phone",
                value: "+91 1800-123-4567",
                icon: <path d="M22 16.92v3a2 2 0 0 1-2.18 2..." />,
              },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition"
              >
                <div className="flex items-center gap-3 mb-2">
                  <svg
                    width="20"
                    height="20"
                    stroke="#ff3f6c"
                    fill="none"
                    strokeWidth="2"
                  >
                    {item.icon}
                  </svg>
                  <h3 className="font-bold text-gray-800 text-sm uppercase">
                    {item.title}
                  </h3>
                </div>
                <p className="text-gray-500 text-sm whitespace-pre-line">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
