import { createSlice } from '@reduxjs/toolkit';
import { trackLowStock } from '../../utils/analytics';

const initialState = {
    inventory: {},
    lowStockTracked: [],
};

const inventorySlice = createSlice({
    name: 'inventory',
    initialState,
    reducers: {
        initInventory: (state, action) => {
            action.payload.forEach(product => {
                state.inventory[product.id] = product.stock;
            });
        },
        decreaseStock: (state, action) => {
            const { productId, productData } = action.payload;
            const current = state.inventory[productId] || 0;
            if (current > 0) {
                const newStock = current - 1;
                state.inventory[productId] = newStock;

                if (newStock <= 3 && newStock > 0 && !state.lowStockTracked.includes(productId)) {
                    if (productData) trackLowStock(productData, newStock);
                    state.lowStockTracked.push(productId);
                }
            }
        },
    },
});

export const { initInventory, decreaseStock } = inventorySlice.actions;

//Selectors
export const selectInventory = state => state.inventory.inventory;
export const selectStock = productId => state => state.inventory.inventory[productId] ?? 0;
export const selectIsInStock = productId => state =>
    (state.inventory.inventory[productId] ?? 0) > 0;
export const selectIsLowStock = productId => state => {
    const stock = state.inventory.inventory[productId] ?? 0;
    return stock > 0 && stock <= 3;
};

export default inventorySlice.reducer;
