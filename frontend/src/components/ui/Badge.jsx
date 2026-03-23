const Badge = ({ children, variant = "primary", className = "" }) => {
  const variants = {
    primary: "bg-primary text-white",
    success: "bg-green-500 text-white",
    warning: "bg-amber-400 text-white",
    info: "bg-blue-500 text-white",
    outline: "border border-primary text-primary",
  };
  return (
    <span
      className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;
