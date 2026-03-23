// Analytics utility functions for GA4 event tracking

// Track when user views a product
export const trackProductView = (product) => {
    if (window.gtag) {
        window.gtag('event', 'view_item', {
            currency: 'INR',
            value: product.price,
            items: [{
                item_id: product.id,
                item_name: product.name,
                item_category: product.category,
                price: product.price
            }]
        });
    }
};

// Track add to cart with enhanced details
export const trackAddToCart = (product, quantity = 1) => {
    if (window.gtag) {
        window.gtag('event', 'add_to_cart', {
            currency: 'INR',
            value: product.price * quantity,
            items: [{
                item_id: product.id,
                item_name: product.name,
                item_category: product.category,
                price: product.price,
                quantity: quantity
            }]
        });
    }
};

// Track remove from cart
export const trackRemoveFromCart = (product, quantity = 1) => {
    if (window.gtag) {
        window.gtag('event', 'remove_from_cart', {
            currency: 'INR',
            value: product.price * quantity,
            items: [{
                item_id: product.id,
                item_name: product.name,
                item_category: product.category,
                price: product.price,
                quantity: quantity
            }]
        });
    }
};

// Track when user views their cart
export const trackViewCart = (cartItems, total) => {
    if (window.gtag) {
        window.gtag('event', 'view_cart', {
            currency: 'INR',
            value: total,
            items: cartItems.map(item => ({
                item_id: item.id,
                item_name: item.name,
                item_category: item.category,
                price: item.price,
                quantity: item.quantity
            }))
        });
    }
};

// Track checkout initiation (begin_checkout)
export const trackBeginCheckout = (cartItems, total) => {
    if (window.gtag) {
        window.gtag('event', 'begin_checkout', {
            currency: 'INR',
            value: total,
            items: cartItems.map(item => ({
                item_id: item.id,
                item_name: item.name,
                item_category: item.category,
                price: item.price,
                quantity: item.quantity
            }))
        });
    }
};

// Track purchase intent (when user clicks "Buy Now")
export const trackPurchaseIntent = (cartItems, total) => {
    if (window.gtag) {
        window.gtag('event', 'purchase_intent', {
            currency: 'INR',
            value: total,
            items: cartItems.map(item => ({
                item_id: item.id,
                item_name: item.name,
                item_category: item.category,
                price: item.price,
                quantity: item.quantity
            }))
        });
    }
};

// Track actual purchase (on thank you page)
export const trackPurchase = (cartItems, total, transactionId) => {
    if (window.gtag) {
        window.gtag('event', 'purchase', {
            transaction_id: transactionId,
            currency: 'INR',
            value: total,
            items: cartItems.map(item => ({
                item_id: item.id,
                item_name: item.name,
                item_category: item.category,
                price: item.price,
                quantity: item.quantity
            }))
        });
    }
};

// Track search queries
export const trackSearch = (searchTerm, resultsCount) => {
    if (window.gtag) {
        window.gtag('event', 'search', {
            search_term: searchTerm,
            results_count: resultsCount
        });
    }
};

// Track form submissions
export const trackFormSubmit = (formType) => {
    if (window.gtag) {
        window.gtag('event', 'form_submit', {
            form_type: formType,
            form_location: window.location.pathname
        });
    }
};

// Track low stock alerts
export const trackLowStock = (product, stockRemaining) => {
    if (window.gtag) {
        window.gtag('event', 'low_stock_view', {
            item_id: product.id,
            item_name: product.name,
            stock_remaining: stockRemaining,
            item_category: product.category
        });
    }
};

// Track out of stock views
export const trackOutOfStock = (product) => {
    if (window.gtag) {
        window.gtag('event', 'out_of_stock_view', {
            item_id: product.id,
            item_name: product.name,
            item_category: product.category
        });
    }
};

// Track cart abandonment (call when user leaves with items in cart)
export const trackCartAbandonment = (cartItems, total, abandonmentStage) => {
    if (window.gtag && cartItems.length > 0) {
        window.gtag('event', 'cart_abandonment', {
            currency: 'INR',
            value: total,
            abandonment_stage: abandonmentStage, // 'cart_view', 'checkout_start', etc.
            items_count: cartItems.length,
            items: cartItems.map(item => ({
                item_id: item.id,
                item_name: item.name,
                item_category: item.category,
                price: item.price,
                quantity: item.quantity
            }))
        });
    }
};

// Track category browsing
export const trackCategoryView = (categoryName) => {
    if (window.gtag) {
        window.gtag('event', 'view_item_list', {
            item_list_name: categoryName
        });
    }
};

// Track user engagement time on product pages
export const trackProductEngagement = (product, timeSpent) => {
    if (window.gtag) {
        window.gtag('event', 'product_engagement', {
            item_id: product.id,
            item_name: product.name,
            time_spent_seconds: timeSpent
        });
    }
};
