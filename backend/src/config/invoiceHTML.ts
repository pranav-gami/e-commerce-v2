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
  const totalAmount = subtotal;

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8" />
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }

      body {
        font-family: 'Helvetica Neue', Arial, sans-serif;
        color: #111;
        font-size: 13px;
        background: #fff;
      }

      .top-bar {
        background: #e94560;
        height: 12px;
        width: 100%;
      }

      .bottom-bar {
        background: #e94560;
        height: 12px;
        width: 100%;
        margin-top: 40px;
      }

      .page {
        padding: 30px 40px;
      }

      /* ── HEADER ── */
      .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 24px;
      }

      .brand-name {
        font-size: 22px;
        font-weight: 900;
        color: #c73652;
        letter-spacing: 1px;
        line-height: 1.1;
      }

      .brand-sub {
        font-size: 13px;
        font-weight: 700;
        color: #e94560;
      }

      .invoice-title {
        font-size: 26px;
        font-weight: 900;
        color: #e94560;
        text-align: right;
      }

      /* ── BILL TO + META ── */
      .info-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 20px;
      }

      .bill-to-label {
        font-weight: 700;
        color: #e94560;
        font-size: 12px;
        margin-bottom: 4px;
      }

      .bill-to-name {
        font-weight: 600;
        font-size: 13px;
      }

      .bill-to-sub {
        font-size: 12px;
        color: #444;
      }

      .meta-grid {
        display: grid;
        grid-template-columns: auto auto;
        gap: 2px 16px;
        font-size: 12px;
        text-align: right;
      }

      .meta-grid .label {
        color: #444;
        text-align: left;
      }

      .meta-grid .value {
        font-weight: 600;
      }

      /* ── CONTACT + PAYMENT ── */
      .contact-payment-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 20px;
        padding-bottom: 16px;
        border-bottom: 1px solid #ddd;
      }

      .cp-label {
        font-weight: 700;
        color: #e94560;
        font-size: 12px;
        margin-bottom: 5px;
      }

      .cp-line {
        font-size: 12px;
        color: #333;
        margin-bottom: 2px;
      }

      .cp-line span {
        color: #666;
        margin-right: 6px;
      }

      /* ── TABLE ── */
      table {
        width: 100%;
        border-collapse: collapse;
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

      .product { font-weight: 500; }
      .right { text-align: right; }
      .center { text-align: center; }

      /* ── SUMMARY ── */
      .summary-wrapper {
        display: flex;
        justify-content: flex-end;
        margin-top: 20px;
        padding-top: 10px;
      }

      .summary {
        width: 280px;
        font-size: 12px;
      }

      .summary-row {
        display: flex;
        justify-content: space-between;
        padding: 5px 0;
        color: #333;
      }

      .summary-total-row {
        display: flex;
        justify-content: space-between;
        padding: 10px 0 8px;
        font-size: 14px;
        font-weight: 800;
        border-top: 2px solid #e94560;
        margin-top: 6px;
        color: #111;
      }

      /* ── SIGN + TERMS ── */
      .bottom-section {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        margin-top: 30px;
        padding-top: 20px;
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
        max-width: 280px;
        line-height: 1.5;
      }

      .sign-block {
        text-align: right;
        font-size: 12px;
        color: #555;
      }

      .sign-name {
        font-family: Georgia, serif;
        font-size: 22px;
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
        padding: 10px 40px;
        font-size: 12px;
        margin-top: 0;
      }
    </style>
  </head>
  <body>

    <div class="top-bar"></div>

    <div class="page">

      <!-- HEADER -->
      <div class="header">
        <div>
          <div class="brand-name">MYNTRA</div>
          <div class="brand-sub">FASHION STORE</div>
        </div>
        <div>
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
          <div class="cp-line"><span>Email</span> support@myntra.com</div>
          <div class="cp-line"><span>Phone</span> 1800-123-4567</div>
        </div>
        <div>
          <div class="cp-label">Payment Information</div>
          <div class="cp-line"><span>Bank Name:</span> HDFC Bank</div>
          <div class="cp-line"><span>Account Number:</span> XXXX-XXXX-1234</div>
        </div>
      </div>

      <!-- ITEMS TABLE -->
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
