import { createContext, useContext, useState } from "react";
import { trackLowStock } from "../utils/analytics";

const InventoryContext = createContext();

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error("useInventory must be used within InventoryProvider");
  }
  return context;
};

export const InventoryProvider = ({ children }) => {
  const [inventory, setInventory] = useState({});
  const [lowStockTracked, setLowStockTracked] = useState(new Set());

  const initInventory = (products) => {
    const initialInventory = {};
    products.forEach((product) => {
      initialInventory[product.id] = product.stock;
    });
    setInventory(initialInventory);
  };

  const getStock = (productId) => {
    return inventory[productId] ?? 0;
  };

  const decreaseStock = (productId, productData) => {
    setInventory((prev) => {
      const currentStock = prev[productId] || 0;
      if (currentStock > 0) {
        const newStock = currentStock - 1;

        if (newStock <= 3 && newStock > 0 && !lowStockTracked.has(productId)) {
          if (productData) {
            trackLowStock(productData, newStock);
            setLowStockTracked((prev) => new Set(prev).add(productId));
          }
        }

        return { ...prev, [productId]: newStock };
      }
      return prev;
    });
  };

  const isInStock = (productId) => {
    return getStock(productId) > 0;
  };

  const isLowStock = (productId) => {
    const stock = getStock(productId);
    return stock > 0 && stock <= 3;
  };

  const value = {
    inventory,
    initInventory,
    getStock,
    decreaseStock,
    isInStock,
    isLowStock,
  };

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
};
