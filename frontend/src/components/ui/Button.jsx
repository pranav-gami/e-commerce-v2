const Button = ({
  children,
  variant = "primary",
  size = "md",
  className = "",
  disabled = false,
  onClick,
  type = "button",
  fullWidth = false,
}) => {
  const base =
    "inline-flex items-center justify-center font-semibold tracking-wide transition-all duration-200 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-primary text-white hover:bg-primary-hover active:scale-95",
    outline:
      "border border-primary text-primary hover:bg-primary-light active:scale-95",
    ghost:
      "text-brand-dark hover:bg-brand-light active:scale-95",
    danger:
      "bg-red-500 text-white hover:bg-red-600 active:scale-95",
  };

  const sizes = {
    sm: "text-xs px-4 py-1.5 rounded",
    md: "text-sm px-6 py-2.5 rounded",
    lg: "text-base px-8 py-3 rounded",
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? "w-full" : ""} ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;
