/**
 * ============================================================
 *  PRODUCT DATA
 *  Array of product objects – each with id, name, price, emoji
 * ============================================================
 */
const PRODUCTS = [
    { id: 1, name: 'Wireless Headphones', price: 79.99, emoji: '🎧' },
    { id: 2, name: 'Smartphone Case', price: 24.99, emoji: '📱' },
    { id: 3, name: 'Mechanical Keyboard', price: 129.99, emoji: '⌨️' },
    { id: 4, name: 'Gaming Mouse', price: 49.99, emoji: '🖱️' },
    { id: 5, name: 'USB-C Charger', price: 19.99, emoji: '🔌' },
    { id: 6, name: 'Game Controller', price: 59.99, emoji: '🎮' },
];

/**
 * ============================================================
 *  COUPON CONFIG
 *  NEWCUSTOMER generates a random discount between 5% and 45%
 * ============================================================
 */
const COUPONS = {
    SAVE10: { code: 'SAVE10', discount: 0.10, label: '10% off' },
    SAVE20: { code: 'SAVE20', discount: 0.20, label: '20% off' },
    NEWCUSTOMER: { code: 'NEWCUSTOMER', discount: 'random', label: 'Random 5-45% off' },
};

/**
 * ============================================================
 *  STATE
 *  cart              : array of { productId, quantity }
 *  appliedCoupon     : string (applied coupon code) or null
 *  appliedCouponRate : number (actual discount rate, e.g., 0.27)
 * ============================================================
 */
let cart = [];
let appliedCoupon = null; // e.g. 'SAVE10' or 'NEWCUSTOMER'
let appliedCouponRate = 0; // stores the numeric rate for the applied coupon

/**
 * ============================================================
 *  DOM REFS
 * ============================================================
 */
const productGrid = document.getElementById('productGrid');
const cartItemsEl = document.getElementById('cartItems');
const itemCountEl = document.getElementById('itemCount');
const cartItemCountEl = document.getElementById('cartItemCount');
const totalSummaryEl = document.getElementById('totalSummary');
const discountInfoEl = document.getElementById('discountInfo');
const couponInput = document.getElementById('couponInput');
const applyCouponBtn = document.getElementById('applyCouponBtn');
const checkoutBtn = document.getElementById('checkoutBtn');

/**
 * ============================================================
 *  HELPER FUNCTIONS
 * ============================================================
 */

/** Find a product by id (using Array.find) */
const findProduct = (id) => PRODUCTS.find(p => p.id === id);

/** Get total quantity of all items in cart (using Array.reduce) */
const getTotalQuantity = () => cart.reduce((sum, item) => sum + item.quantity, 0);

/** Check if an item qualifies for bulk discount (qty >= 3) */
const hasBulkDiscount = (qty) => qty >= 3;

/**
 * ============================================================
 *  CART CALCULATIONS (the core logic)
 *  Uses: map, filter, reduce, find, forEach
 * ============================================================
 */

/**
 *  computeCartTotals()
 *  Returns an object with:
 *    - subtotal         : sum of all item prices × qty
 *    - bulkDiscount     : total $ saved from bulk discounts
 *    - couponDiscount   : total $ saved from coupon
 *    - shipping         : $5.99 if subtotal < 50, else 0
 *    - total            : final total after all discounts + shipping
 *    - items            : enriched cart items with product data & discounts
 *    - bulkItems        : array of items that got bulk discount
 *    - couponPercent    : the coupon % or 0
 *    - couponLabel      : display label for the coupon
 * ============================================================
 */
function computeCartTotals() {
    // 1. Enrich cart items with product data using .map()
    const enriched = cart.map(item => {
        const product = findProduct(item.productId);
        return {
            ...item, // { productId, quantity }
            product, // full product object
            itemTotal: product ? product.price * item.quantity : 0,
        };
    });

    // 2. Filter out any items where product was not found (safety)
    const validItems = enriched.filter(item => item.product !== undefined);

    // 3. Calculate subtotal using .reduce()
    const subtotal = validItems.reduce((sum, item) => sum + item.itemTotal, 0);

    // 4. Calculate bulk discounts using .map() + .filter()
    //    Bulk discount: 10% off on items with qty >= 3
    const BULK_DISCOUNT_RATE = 0.10;
    const bulkItems = validItems
        .filter(item => hasBulkDiscount(item.quantity))
        .map(item => ({
            ...item,
            discountAmount: item.product.price * item.quantity * BULK_DISCOUNT_RATE,
        }));

    const bulkDiscountTotal = bulkItems.reduce((sum, item) => sum + item.discountAmount, 0);

    // 5. Apply coupon discount (using the stored appliedCouponRate)
    let couponPercent = 0;
    let couponDiscountTotal = 0;
    let couponLabel = '';

    if (appliedCoupon && appliedCouponRate > 0) {
        couponPercent = appliedCouponRate;
        // coupon applies to subtotal AFTER bulk discount
        const afterBulk = subtotal - bulkDiscountTotal;
        couponDiscountTotal = afterBulk * couponPercent;

        // Build a nice label
        if (appliedCoupon === 'NEWCUSTOMER') {
            const percentDisplay = (appliedCouponRate * 100).toFixed(0);
            couponLabel = `${percentDisplay}% off (New Customer)`;
        } else {
            couponLabel = COUPONS[appliedCoupon]?.label || `${(couponPercent * 100).toFixed(0)}% off`;
        }
    }

    // 6. Shipping: free if subtotal (before any discounts) >= 50
    const SHIPPING_THRESHOLD = 50;
    const SHIPPING_COST = 5.99;
    const shipping = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;

    // 7. Final total
    const total = subtotal - bulkDiscountTotal - couponDiscountTotal + shipping;

    // 8. Build result object
    return {
        subtotal,
        bulkDiscountTotal,
        couponDiscountTotal,
        shipping,
        total: Math.round(total * 100) / 100,
        items: validItems,
        bulkItems,
        couponPercent,
        couponLabel,
        itemCount: validItems.reduce((sum, i) => sum + i.quantity, 0),
        totalQuantity: getTotalQuantity(),
        hasBulk: bulkItems.length > 0,
        hasCoupon: appliedCoupon !== null && appliedCouponRate > 0,
        couponCode: appliedCoupon,
    };
}

/**
 * ============================================================
 *  RENDER FUNCTIONS
 * ============================================================
 */

/** Render the product grid */
function renderProducts() {
    productGrid.innerHTML = PRODUCTS.map(product => `
            <div class="product-card" data-id="${product.id}">
                <span class="emoji">${product.emoji}</span>
                <div class="name">${product.name}</div>
                <div class="price">${product.price.toFixed(2)}</div>
                <button class="btn-add" data-id="${product.id}">Add to Cart</button>
                <div class="in-stock">✓ In stock</div>
            </div>
        `).join('');

    // Attach event listeners to "Add to Cart" buttons
    document.querySelectorAll('.btn-add').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.id);
            addToCart(id);
        });
    });
}

/** Render the cart items list */
function renderCartItems() {
    const totals = computeCartTotals();

    if (totals.items.length === 0) {
        cartItemsEl.innerHTML = `
                <div class="empty-cart">
                    <span class="big-emoji">🛒</span>
                    Your cart is empty.<br />
                    Add some awesome products!
                </div>
            `;
        return;
    }

    // Build each cart item row
    cartItemsEl.innerHTML = totals.items.map(item => {
        const p = item.product;
        const isBulk = hasBulkDiscount(item.quantity);
        const bulkTag = isBulk
            ? `<span class="bulk-tag">🔥 Bulk 10% off</span>`
            : '';

        return `
                <div class="cart-item" data-id="${item.productId}">
                    <span class="item-emoji">${p.emoji}</span>
                    <div class="item-info">
                        <div class="item-name">${p.name}</div>
                        <div class="item-price">
                            $${p.price.toFixed(2)} × ${item.quantity}
                            ${bulkTag}
                        </div>
                    </div>
                    <div class="qty-control">
                        <button class="qty-dec" data-id="${item.productId}">−</button>
                        <span class="qty-num">${item.quantity}</span>
                        <button class="qty-inc" data-id="${item.productId}">+</button>
                        <button class="btn-remove" data-id="${item.productId}">✕</button>
                    </div>
                </div>
            `;
    }).join('');

    // Attach event listeners for qty controls
    document.querySelectorAll('.qty-dec').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.id);
            updateQuantity(id, -1);
        });
    });
    document.querySelectorAll('.qty-inc').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.id);
            updateQuantity(id, 1);
        });
    });
    document.querySelectorAll('.btn-remove').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.id);
            removeFromCart(id);
        });
    });
}

/** Render the total summary */
function renderTotals() {
    const totals = computeCartTotals();

    // Update badges
    itemCountEl.textContent = totals.totalQuantity;
    cartItemCountEl.textContent = `${totals.totalQuantity} items`;

    // Format helpers
    const fmt = (val) => `$${val.toFixed(2)}`;
    const discountRows = [];

    // Bulk discount row
    if (totals.bulkDiscountTotal > 0) {
        discountRows.push(`
                <div class="total-row discount-row">
                    <span>🔥 Bulk discount (10%)</span>
                    <span>−${fmt(totals.bulkDiscountTotal)}</span>
                </div>
            `);
    }

    // Coupon discount row
    if (totals.hasCoupon && totals.couponDiscountTotal > 0) {
        const label = totals.couponLabel || 'Coupon';
        discountRows.push(`
                <div class="total-row discount-row">
                    <span>🎫 ${label}</span>
                    <span>−${fmt(totals.couponDiscountTotal)}</span>
                </div>
            `);
    }

    // Shipping row
    const shipText = totals.shipping === 0
        ? '<span class="free-ship-badge">🚚 Free shipping</span>'
        : fmt(totals.shipping);

    totalSummaryEl.innerHTML = `
            <div class="total-row sub">
                <span>Subtotal</span>
                <span>${fmt(totals.subtotal)}</span>
            </div>
            ${discountRows.join('')}
            <div class="total-row shipping-row">
                <span>Shipping</span>
                <span>${shipText}</span>
            </div>
            <div class="total-row grand">
                <span>Total</span>
                <span class="amount">${fmt(totals.total)}</span>
            </div>
        `;

    // Enable/disable checkout button
    checkoutBtn.disabled = totals.totalQuantity === 0;
}

/** Render discount info badges (bulk & coupon status) */
function renderDiscountInfo() {
    const totals = computeCartTotals();
    let html = '';

    // Bulk discount status
    if (totals.hasBulk) {
        const count = totals.bulkItems.length;
        html += `<span class="tag bulk">🔥 Bulk discount active on ${count} item(s)</span>`;
    } else if (totals.totalQuantity > 0) {
        html +=
            `<span class="tag">📦 Add 3+ of same item for 10% bulk discount</span>`;
    }

    // Coupon status
    if (totals.hasCoupon) {
        const label = totals.couponLabel || 'Coupon';
        html += `
                <span class="tag coupon">
                    🎫 ${label} applied
                    <button class="remove-coupon" id="removeCouponBtn">✕</button>
                </span>
            `;
    } else if (totals.totalQuantity > 0) {
        html += `<span class="tag">💡 Try SAVE10, SAVE20, or NEWCUSTOMER (5-45% random)</span>`;
    }

    if (!html) {
        html = `<span class="tag">✨ Add items to see discounts</span>`;
    }

    discountInfoEl.innerHTML = html;

    // Attach remove coupon listener
    const removeBtn = document.getElementById('removeCouponBtn');
    if (removeBtn) {
        removeBtn.addEventListener('click', () => {
            appliedCoupon = null;
            appliedCouponRate = 0;
            couponInput.value = '';
            renderAll();
        });
    }
}

/** Render everything */
function renderAll() {
    renderCartItems();
    renderTotals();
    renderDiscountInfo();
}

/**
 * ============================================================
 *  CART MUTATIONS (using array methods)
 * ============================================================
 */

/** Add a product to cart (or increment quantity) */
function addToCart(productId) {
    // Use .find() to see if item already exists
    const existing = cart.find(item => item.productId === productId);
    if (existing) {
        // Use .map() to create a new array with updated quantity
        cart = cart.map(item =>
            item.productId === productId ?
            { ...item, quantity: item.quantity + 1 } :
            item
        );
    } else {
        // Use spread to add new item
        cart = [...cart, { productId, quantity: 1 }];
    }
    renderAll();
}

/** Update quantity by delta (+1 or -1) */
function updateQuantity(productId, delta) {
    // Use .map() to update, then .filter() to remove items with qty <= 0
    cart = cart
        .map(item =>
            item.productId === productId ?
            { ...item, quantity: Math.max(0, item.quantity + delta) } :
            item
        )
        .filter(item => item.quantity > 0);

    renderAll();
}

/** Remove item entirely from cart */
function removeFromCart(productId) {
    // Use .filter() to exclude the item
    cart = cart.filter(item => item.productId !== productId);
    renderAll();
}

/**
 * ============================================================
 *  APPLY COUPON (with NEWCUSTOMER random logic)
 * ============================================================
 */

/** Apply a coupon code */
function applyCoupon(code) {
    const upper = code.toUpperCase().trim();

    // Handle NEWCUSTOMER – generates a random rate between 5% and 45%
    if (upper === 'NEWCUSTOMER') {
        // Generate random integer between 5 and 45 (inclusive)
        const percent = Math.floor(Math.random() * 41) + 5;
        appliedCoupon = upper;
        appliedCouponRate = percent / 100;
        couponInput.value = upper;
        renderAll();
        return true;
    }

    // Handle static coupons (SAVE10, SAVE20)
    if (COUPONS[upper]) {
        appliedCoupon = upper;
        appliedCouponRate = COUPONS[upper].discount;
        couponInput.value = upper;
        renderAll();
        return true;
    }

    return false;
}

/** Clear the applied coupon */
function clearCoupon() {
    appliedCoupon = null;
    appliedCouponRate = 0;
    couponInput.value = '';
    renderAll();
}

/**
 * ============================================================
 *  EVENT BINDING
 * ============================================================
 */

// Apply coupon button
applyCouponBtn.addEventListener('click', () => {
    const code = couponInput.value.trim();
    if (!code) {
        alert('Please enter a coupon code.');
        return;
    }
    const success = applyCoupon(code);
    if (!success) {
        alert(`❌ "${code}" is not a valid coupon. Try SAVE10, SAVE20, or NEWCUSTOMER.`);
        couponInput.value = '';
        couponInput.focus();
    }
});

// Enter key on coupon input
couponInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        applyCouponBtn.click();
    }
});

// Checkout button (demo)
checkoutBtn.addEventListener('click', () => {
    const totals = computeCartTotals();
    if (totals.totalQuantity === 0) return;
    alert(`✅ Order placed!\nTotal: $${totals.total.toFixed(2)}\nThank you for shopping! 🎉`);
    // Reset cart and coupons
    cart = [];
    appliedCoupon = null;
    appliedCouponRate = 0;
    couponInput.value = '';
    renderAll();
});

/**
 * ============================================================
 *  INITIALISE
 * ============================================================
 */

renderProducts();
renderAll();

// Log the available coupons (helpful for users)
console.log('🎫 Available coupons:', Object.keys(COUPONS).join(', '));
console.log('🎲 NEWCUSTOMER gives a random 5-45% discount each time!');

// Expose state for debugging (optional)
window.__debug = { cart, PRODUCTS, COUPONS, computeCartTotals };