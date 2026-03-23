const Input = ({
  label,
  error,
  className = "",
  type = "text",
  ...props
}) => {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-xs font-semibold text-brand-muted uppercase tracking-wider">
          {label}
        </label>
      )}
      <input
        type={type}
        className={`w-full border ${
          error ? "border-red-400 bg-red-50" : "border-brand-border"
        } rounded px-3 py-2.5 text-sm text-brand-dark placeholder-brand-gray focus:outline-none focus:border-primary transition-colors ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
};

export default Input;
