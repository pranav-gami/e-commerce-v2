const Card = ({ children, className = "", hover = false, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded ${
        hover
          ? "hover:shadow-lg transition-shadow duration-300 cursor-pointer"
          : "shadow-sm"
      } ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;
