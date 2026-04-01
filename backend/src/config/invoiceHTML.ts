export const generateInvoiceHTML = (order: any) => {
  const formatDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const itemsHTML = order.items
    .map(
      (item: any) => `
      <tr>
        <td class="product">${item.product.name}</td>
        <td class="center">${item.quantity}</td>
        <td class="right">₹${(item.price - (item.price * (item.product?.discount || 0)) / 100).toFixed(2)}</td>
        <td class="right">₹${((item.price - (item.price * (item.product?.discount || 0)) / 100) * item.quantity).toFixed(2)}</td>
      </tr>
    `,
    )
    .join("");

  const subtotal = order.items.reduce(
    (sum: number, item: any) =>
      sum +
      (item.price - (item.price * (item.product?.discount || 0)) / 100) *
        item.quantity,
    0,
  );

  const couponDiscount = order.couponDiscount ?? 0;
  const couponCode = order.couponCode ?? null;
  const totalAmount = subtotal - couponDiscount;

  const couponRowHTML = couponCode
    ? `
      <div class="summary-row coupon-row">
        <span>Coupon <span class="coupon-badge">${couponCode}</span></span>
        <span class="coupon-value">- ₹${couponDiscount.toFixed(2)}</span>
      </div>`
    : "";

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8" />
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }

      html, body {
        height: 100%;
      }

      body {
        font-family: 'Helvetica Neue', Arial, sans-serif;
        color: #111;
        font-size: 13px;
        background: #fff;
        display: flex;
        flex-direction: column;
        min-height: 100vh;
      }

      /* ── TOP / BOTTOM BARS ── */
      .top-bar {
        background: #e94560;
        height: 14px;
        width: 100%;
        flex-shrink: 0;
      }

      /* ── MAIN WRAPPER (3 flex parts) ── */
      .page {
        flex: 1;
        padding: 30px 44px;
        display: flex;
        flex-direction: column;
      }

      /* Part 1 — header + meta */
      .part-top {
        flex-shrink: 0;
      }

      /* Part 2 — table (grows to fill space) */
      .part-middle {
        flex: 1;
        display: flex;
        flex-direction: column;
      }

      /* Part 3 — summary + bottom section (always at bottom) */
      .part-bottom {
        flex-shrink: 0;
      }

      /* ── HEADER ── */
      .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 20px;
      }

      .brand-name {
        font-size: 22px;
        font-weight: 900;
        color: #c73652;
        letter-spacing: 1px;
        line-height: 1.1;
      }

      .brand-sub {
        font-size: 12px;
        font-weight: 700;
        color: #e94560;
        letter-spacing: 0.5px;
        margin-top: 2px;
      }

      .invoice-block {
        text-align: right;
      }

      .invoice-title {
        font-size: 28px;
        font-weight: 900;
        color: #e94560;
        letter-spacing: 2px;
      }

      /* ── BILL TO + META (2-column) ── */
      .info-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 18px;
      }

      .bill-to-label {
        font-weight: 700;
        color: #e94560;
        font-size: 12px;
        margin-bottom: 5px;
      }

      .bill-to-name {
        font-weight: 600;
        font-size: 13px;
        margin-bottom: 2px;
      }

      .bill-to-sub {
        font-size: 12px;
        color: #444;
        margin-bottom: 1px;
      }

      .meta-grid {
        display: grid;
        grid-template-columns: auto auto;
        gap: 3px 20px;
        font-size: 12px;
        align-self: flex-start;
      }

      .meta-grid .label { color: #555; }
      .meta-grid .value { font-weight: 600; text-align: right; }

      /* ── CONTACT + PAYMENT (2-column) ── */
      .contact-payment-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 20px;
        padding-bottom: 14px;
        border-bottom: 1px solid #ddd;
      }

      .cp-label {
        font-weight: 700;
        color: #e94560;
        font-size: 12px;
        margin-bottom: 6px;
      }

      .cp-line {
        font-size: 12px;
        color: #333;
        margin-bottom: 2px;
      }

      .cp-line span { color: #777; margin-right: 6px; }

      /* ── TABLE ── */
      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 4px;
      }

      thead tr {
        border-bottom: 2px solid #e94560;
      }

      th {
        font-size: 12px;
        font-weight: 700;
        color: #111;
        padding: 8px 10px;
        text-align: left;
      }

      td {
        padding: 10px;
        border-bottom: 1px solid #eee;
        font-size: 12px;
        vertical-align: top;
      }

      /* Grey separator after last row */
      tbody tr:last-child td {
        border-bottom: 1px solid #ccc;
      }

      .product { font-weight: 500; }
      .right    { text-align: right; }
      .center   { text-align: center; }

      /* ── SUMMARY ── */
      .summary-wrapper {
        display: flex;
        justify-content: flex-end;
        margin-top: 16px;
      }

      .summary {
        width: 300px;
        font-size: 12px;
      }

      .summary-row {
        display: flex;
        justify-content: space-between;
        padding: 5px 0;
        color: #333;
      }

      .coupon-row { color: #2a7a2a; }

      .coupon-badge {
        display: inline-block;
        background: #fff4e5;
        color: #c17a00;
        border: 1px dashed #c17a00;
        border-radius: 3px;
        padding: 0px 5px;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.5px;
        margin-left: 5px;
        vertical-align: middle;
      }

      .coupon-value { font-weight: 600; }

      .summary-divider {
        border: none;
        border-top: 1px solid #ccc;
        margin: 6px 0;
      }

      .summary-total-row {
        display: flex;
        justify-content: space-between;
        padding: 8px 0 4px;
        font-size: 13px;
        font-weight: 800;
        border-top: 2px solid #e94560;
        margin-top: 4px;
        color: #111;
      }

      /* ── TERMS + SIGNATURE ── */
      .bottom-section {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        margin-top: 28px;
        padding-top: 16px;
        border-top: 1px solid #ddd;
      }

      .terms-label {
        font-weight: 700;
        font-size: 12px;
        margin-bottom: 5px;
      }

      .terms-text {
        font-size: 11px;
        color: #666;
        max-width: 300px;
        line-height: 1.6;
      }

      .sign-block {
        text-align: right;
        font-size: 12px;
        color: #555;
      }

      .sign-name {
        font-family: Georgia, serif;
        font-size: 24px;
        color: #111;
        margin-top: 4px;
        font-style: italic;
      }

      /* ── FOOTER BAR ── */
      .footer-bar {
        background: #e94560;
        color: #fff;
        display: flex;
        justify-content: space-around;
        align-items: center;
        padding: 11px 40px;
        font-size: 12px;
        flex-shrink: 0;
      }
    </style>
  </head>
  <body>

    <div class="top-bar"></div>

    <div class="page">

      <!-- ══ PART 1 — Header & Meta ══ -->
      <div class="part-top">

        <!-- HEADER -->
        <div class="header">
          <div>
            <div class="brand-name">MYNTRA</div>
            <div class="brand-sub">FASHION STORE</div>
          </div>
          <div class="invoice-block">
            <div class="invoice-title">INVOICE</div>
          </div>
        </div>

        <!-- BILL TO + INVOICE META -->
        <div class="info-row">
          <div>
            <div class="bill-to-label">Bill To:</div>
            <div class="bill-to-name">${order.user.name}</div>
            <div class="bill-to-sub">${order.user.email}</div>
            ${order.shippingAddress ? `<div class="bill-to-sub">${order.shippingAddress}</div>` : ""}
          </div>
          <div class="meta-grid">
            <div class="label">Invoice Number</div>
            <div class="value">MYINV-${order.id.toString().slice(-6).toUpperCase()}</div>
            <div class="label">Invoice Date</div>
            <div class="value">${formatDate}</div>
            <div class="label">Order ID</div>
            <div class="value">${order.id}</div>
            <div class="label">Payment ID</div>
            <div class="value">${order.paymentId}</div>
          </div>
        </div>

        <!-- CONTACT + PAYMENT INFO -->
        <div class="contact-payment-row">
          <div>
            <div class="cp-label">Contact Information</div>
            <div class="cp-line"><span>Email</span>support@myntra.com</div>
            <div class="cp-line"><span>Phone</span>1800-123-4567</div>
          </div>
          <div>
            <div class="cp-label">Payment Information</div>
            <div class="cp-line"><span>Bank Name:</span>HDFC Bank</div>
            <div class="cp-line"><span>Account Number:</span>XXXX-XXXX-1234</div>
          </div>
        </div>

      </div>
      <!-- /part-top -->

      <!-- ══ PART 2 — Items Table ══ -->
      <div class="part-middle">
        <table>
          <thead>
            <tr>
              <th>Item Description</th>
              <th class="center">Quantity</th>
              <th class="right">Rate</th>
              <th class="right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
        </table>
      </div>
      <!-- /part-middle -->

      <!-- ══ PART 3 — Summary + Terms ══ -->
      <div class="part-bottom">

        <!-- SUMMARY -->
        <div class="summary-wrapper">
          <div class="summary">
            <div class="summary-row">
              <span>Subtotal:</span>
              <span>₹${subtotal.toFixed(2)}</span>
            </div>
            <div class="summary-row">
              <span>Shipping:</span>
              <span>FREE</span>
            </div>
            ${couponRowHTML}
            <div class="summary-total-row">
              <span>Total Amount Due:</span>
              <span>₹${totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <!-- TERMS + SIGNATURE -->
        <div class="bottom-section">
          <div>
            <div class="terms-label">Terms and Conditions</div>
            <div class="terms-text">
              All sales are final. Returns accepted within 30 days of delivery for eligible products.
              For disputes, contact our support team at support@myntra.com.
              This is a system-generated invoice.
            </div>
          </div>
          <div class="sign-block">
            <div>Sign</div>
            <div class="sign-name">Myntra</div>
          </div>
        </div>

      </div>
      <!-- /part-bottom -->

    </div>
    <!-- /page -->

    <!-- FOOTER BAR -->
    <div class="footer-bar">
      <span>support@myntra.com</span>
      <span>www.myntra.com</span>
      <span>Phone 1800-123-4567</span>
    </div>

  </body>
  </html>
  `;
};
