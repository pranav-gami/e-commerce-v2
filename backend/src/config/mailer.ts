import nodemailer from "nodemailer";

import puppeteer from "puppeteer";
import { generateInvoiceHTML } from "./invoiceHTML";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendOtpEmail = async (
  email: string,
  otp: string,
  name: string,
) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Your OTP for Password Reset — Myntra",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin:0;padding:0;background:#f5f5f7;font-family:'Outfit',Arial,sans-serif;">
          <div style="max-width:520px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
            
            <!-- Header -->
            <div style="background:linear-gradient(135deg,#1a1a2e 0%,#0f1a3e 100%);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;font-size:28px;font-weight:800;color:#000080;letter-spacing:-0.5px;">
                <span style="color:#e94560;">Myntra</span>
              </h1>
            </div>

            <!-- Body -->
            <div style="padding:40px;">
              <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1a1a2e;">
                Password Reset OTP
              </h2>
              <p style="margin:0 0 24px;color:#6c757d;font-size:15px;line-height:1.6;">
                Hi <strong>${name}</strong>, use the OTP below to reset your password. It expires in <strong>10 minutes</strong>.
              </p>

              <!-- OTP Box -->
              <div style="background:#fef2f4;border:2px dashed #e94560;border-radius:12px;padding:28px;text-align:center;margin:0 0 24px;">
                <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#e94560;text-transform:uppercase;letter-spacing:2px;">
                  Your OTP
                </p>
                <p style="margin:0;font-size:42px;font-weight:800;color:#1a1a2e;letter-spacing:12px;">
                  ${otp}
                </p>
              </div>

              <!-- Warning -->
              <div style="background:#fff3cd;border-radius:8px;padding:14px 16px;margin:0 0 24px;">
                <p style="margin:0;font-size:13px;color:#856404;">
                  ⚠️ Never share this OTP with anyone. Myntra will never ask for your OTP.
                </p>
              </div>

              <p style="margin:0;color:#6c757d;font-size:13px;line-height:1.6;">
                If you didn't request this, you can safely ignore this email. Your password won't change.
              </p>
            </div>

            <!-- Footer -->
            <div style="background:#f8f9fa;padding:20px 40px;border-top:1px solid #e9ecef;text-align:center;">
              <p style="margin:0;font-size:12px;color:#adb5bd;">
                © 2026 Myntra — All rights reserved
              </p>
            </div>

          </div>
        </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
};

// ORDER CONFIRMED EMAIL WITH INVOICE

interface OrderItem {
  name: string;
  quantity: number;
  discount: number;
  price: number;
}

interface SendOrderConfirmationProps {
  to: string;
  customerName: string;
  orderId: number;
  items: OrderItem[];
  total: number;
  paymentId: string;
  createdAt: Date;
  fullOrder: any;
}

//invoice(PDF)

const generateInvoicePDF = async (order: any): Promise<Buffer> => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  const html = generateInvoiceHTML(order);

  await page.setContent(html, { waitUntil: "domcontentloaded" });

  const pdfUint8 = await page.pdf({
    format: "A4",
    printBackground: true,
  });

  await browser.close();

  return Buffer.from(pdfUint8);
};

export const sendOrderConfirmationEmail = async ({
  to,
  customerName,
  orderId,
  items,
  total,
  paymentId,
  createdAt,
  fullOrder,
}: SendOrderConfirmationProps) => {
  // ✅ Generate PDF buffer
  const pdfBuffer = await generateInvoicePDF(fullOrder);
  const itemsHTML = items
    .map(
      (item) => `
      <tr>
        <td>${item.name}</td>
        <td align="center">${item.quantity}</td>
        <td align="right">₹${item.price.toFixed(2)}</td>
        <td align="right">${item.discount}%</td>
        <td align="right">₹${((item.price - (item.price * (item.discount || 0)) / 100) * item.quantity).toFixed(2)}</td>
      </tr>`,
    )
    .join("");

  const html = `
<html>
<head>
<meta charset="UTF-8" />
<style>
  body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 0;
    background-color: #f5f5f5;
  }

  .email-container {
    max-width: 600px;
    margin: auto;
    background-color: #ffffff;
    border-radius: 8px;
    overflow: hidden;
  }

  .header {
    background-color: #f9f9f9;
    color: #c73652; /* primary brand color */
    padding: 20px;
    text-align: center;
  }

  .header h1 {
    margin: 0;
    font-size: 24px;
  }

  .content {
    padding: 20px;
  }

  .content h2 {
    color: #c73652; /* section headings */
    font-size: 20px;
    margin-bottom: 10px;
  }

  .order-summary {
    width: 100%;
    border-collapse: collapse;
    margin-top: 15px;
  }

  .order-summary th {
    background-color: #fcd6dd; /* softer pink background for contrast */
    color: #c73652; /* make header text match brand */
    text-align: left;
    padding: 8px;
    font-weight: bold;
  }

  .order-summary td {
    padding: 8px;
    border-bottom: 1px solid #e0e0e0;
  }

  .total {
    text-align: right;
    font-weight: bold;
    font-size: 18px;
    margin-top: 10px;
    color: #c73652;
  }

  .footer {
    background-color: #f9f9f9;
    color: #555555;
    padding: 15px;
    text-align: center;
    font-size: 14px;
  }

  a {
    color: #c73652;
    text-decoration: underline;
  }

  /* Optional: highlight Thank You text */
  .thank-you {
    color: #c73652;
    font-size: 22px;
    font-weight: bold;
    text-align: center;
    margin: 20px 0;
  }
</style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>Thank You For Your Order!</h1>
    </div>
    <div class="content">
      <p>Hi ${customerName},</p>
      <p>Your order has been successfully placed.</p>

      <p><b>Order ID:</b> ${orderId}</p>
      <p><b>Payment ID:</b> ${paymentId}</p>
      <p><b>Date:</b> ${new Date(createdAt).toLocaleDateString("en-IN")}</p>

      <h2>Order Summary</h2>
      <table class="order-summary">
        <tr>
          <th>Product</th>
          <th>Qty</th>
          <th>Price</th>
          <th>Discount</th>
          <th>Discounted Price</th>
        </tr>
        ${itemsHTML}
      </table>

      <p class="total">Total: ₹${total.toFixed(2)}</p>

      <p>📎 Invoice PDF is attached.</p>
    </div>
    <div class="footer">
      Any address information, legal, terms etc. <br/>
      <a href="#" style="color:black;text-decoration:underline;">Email Preferences</a> | 
      <a href="#" style="color:black;text-decoration:underline;">Unsubscribe</a> | 
      <a href="#" style="color:black;text-decoration:underline;">View Online</a>
    </div>
  </div>
</body>
</html>
`;
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: `Order Confirmed #${orderId}`,
    html,
    attachments: [
      {
        filename: `invoice-${orderId}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });

  console.log("✅ Email sent with PDF attachment");
};

// PAYMENT FAILED EMAIL

export const sendPaymentFailedEmail = async ({
  to,
  customerName,
  orderId,
}: {
  to: string;
  customerName: string;
  orderId: number;
}) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject: `❌ Payment Failed - Order #${orderId} — Myntra`,
    html: `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin:0;padding:0;background:#f5f5f7;font-family:'Outfit',Arial,sans-serif;">
        <div style="max-width:520px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <div style="background:linear-gradient(135deg,#1a1a2e 0%,#0f1a3e 100%);padding:32px 40px;text-align:center;">
            <h1 style="margin:0;font-size:28px;font-weight:800;color:#000080;letter-spacing:-0.5px;">
              <span style="color:#e94560;">Myntra</span>
            </h1>
          </div>

          <!-- Failed Banner -->
          <div style="background:#fef2f2;border-bottom:2px solid #ef4444;padding:20px 40px;text-align:center;">
            <p style="margin:0;font-size:20px;font-weight:700;color:#dc2626;">❌ Payment Failed</p>
            <p style="margin:6px 0 0;color:#f87171;font-size:14px;">Don't worry, no amount was deducted.</p>
          </div>

          <!-- Body -->
          <div style="padding:36px 40px;">
            <p style="margin:0 0 8px;font-size:16px;color:#1a1a2e;">
              Hi <strong>${customerName}</strong>,
            </p>
            <p style="margin:0 0 24px;color:#6c757d;font-size:14px;line-height:1.7;">
              Unfortunately, your payment for Order <strong>#${orderId}</strong> could not be processed.
              Your cart is still saved — you can try again anytime.
            </p>

            <!-- Order Info -->
            <div style="background:#f8f9fa;border-radius:12px;padding:16px 24px;margin:0 0 24px;">
              <table width="100%">
                <tr>
                  <td style="color:#6c757d;font-size:14px;">📦 Order ID</td>
                  <td style="text-align:right;font-weight:700;color:#1a1a2e;">#${orderId}</td>
                </tr>
                <tr>
                  <td style="color:#6c757d;font-size:14px;padding-top:6px;">📊 Status</td>
                  <td style="text-align:right;padding-top:6px;">
                    <span style="background:#ef4444;color:#fff;padding:3px 12px;border-radius:20px;font-size:12px;font-weight:600;">
                      FAILED
                    </span>
                  </td>
                </tr>
              </table>
            </div>

            <!-- Retry Button -->
            <div style="text-align:center;margin:0 0 24px;">
              <a href="${process.env.FRONTEND_URL}/cart"
                 style="display:inline-block;background:linear-gradient(135deg,#e94560,#c0392b);color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">
                🔄 Try Again
              </a>
            </div>

            <p style="margin:0;color:#6c757d;font-size:13px;line-height:1.6;">
              If the issue persists, please contact our support team. We're happy to help!
            </p>
          </div>

          <!-- Footer -->
          <div style="background:#f8f9fa;padding:20px 40px;border-top:1px solid #e9ecef;text-align:center;">
            <p style="margin:0;font-size:12px;color:#adb5bd;">
              © 2026 Myntra — All rights reserved
            </p>
          </div>

        </div>
      </body>
    </html>
    `,
  };

  await transporter.sendMail(mailOptions);
  console.log(`📧 Payment failed email sent to ${to}`);
};

// ORDER CANCELLED EMAIL (No refund)

export const sendOrderCancelledEmail = async ({
  to,
  customerName,
  orderId,
}: {
  to: string;
  customerName: string;
  orderId: number;
}) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject: `❌ Order Cancelled #${orderId} — Myntra`,
    html: `
    <!DOCTYPE html>
    <html>
      <body style="margin:0;padding:0;background:#f5f5f7;font-family:'Outfit',Arial,sans-serif;">
        <div style="max-width:520px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <div style="background:linear-gradient(135deg,#1a1a2e 0%,#0f1a3e 100%);padding:32px 40px;text-align:center;">
            <h1 style="margin:0;font-size:28px;font-weight:800;color:#fff;">
              <span style="color:#e94560;">Myntra</span>
            </h1>
          </div>

          <!-- Banner -->
          <div style="background:#fef2f2;border-bottom:2px solid #ef4444;padding:20px 40px;text-align:center;">
            <p style="margin:0;font-size:20px;font-weight:700;color:#dc2626;">❌ Order Cancelled</p>
          </div>

          <!-- Body -->
          <div style="padding:36px 40px;">
            <p style="font-size:16px;color:#1a1a2e;">Hi <strong>${customerName}</strong>,</p>
            <p style="color:#6c757d;font-size:14px;line-height:1.7;">
              Your order <strong>#${orderId}</strong> has been successfully cancelled.
            </p>

            <div style="background:#f8f9fa;border-radius:12px;padding:20px 24px;margin:20px 0;">
              <table width="100%">
                <tr>
                  <td style="color:#6c757d;font-size:14px;">📦 Order ID</td>
                  <td style="text-align:right;font-weight:700;color:#1a1a2e;">#${orderId}</td>
                </tr>
                <tr>
                  <td style="color:#6c757d;font-size:14px;padding-top:8px;">📊 Status</td>
                  <td style="text-align:right;padding-top:8px;">
                    <span style="background:#ef4444;color:#fff;padding:3px 12px;border-radius:20px;font-size:12px;font-weight:600;">
                      CANCELLED
                    </span>
                  </td>
                </tr>
              </table>
            </div>

            <p style="color:#6c757d;font-size:13px;">
              If you have any questions, reply to this email.
            </p>
          </div>

          <!-- Footer -->
          <div style="background:#f8f9fa;padding:20px 40px;border-top:1px solid #e9ecef;text-align:center;">
            <p style="margin:0;font-size:12px;color:#adb5bd;">© 2026 Myntra — All rights reserved</p>
          </div>

        </div>
      </body>
    </html>
    `,
  };

  await transporter.sendMail(mailOptions);
  console.log(`📧 Order cancelled email sent to ${to}`);
};
// ORDER CANCELLED + REFUND EMAIL

export const sendOrderCancelledRefundEmail = async ({
  to,
  customerName,
  orderId,
  amount,
}: {
  to: string;
  customerName: string;
  orderId: number;
  amount: number;
}) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject: ` Order Cancelled & Refund Initiated #${orderId} — Myntra`,
    html: `
    <!DOCTYPE html>
    <html>
      <body style="margin:0;padding:0;background:#f5f5f7;font-family:'Outfit',Arial,sans-serif;">
        <div style="max-width:520px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <div style="background:linear-gradient(135deg,#1a1a2e 0%,#0f1a3e 100%);padding:32px 40px;text-align:center;">
            <h1 style="margin:0;font-size:28px;font-weight:800;color:#fff;">
              <span style="color:#e94560;">Myntra</span>
            </h1>
          </div>

          <!-- Banner -->
          <div style="background:#eff6ff;border-bottom:2px solid #3b82f6;padding:20px 40px;text-align:center;">
            <p style="margin:0;font-size:20px;font-weight:700;color:#1d4ed8;">Refund Initiated</p>
            <p style="margin:6px 0 0;color:#60a5fa;font-size:14px;">Your order is cancelled and money is on its way back!</p>
          </div>

          <!-- Body -->
          <div style="padding:36px 40px;">
            <p style="font-size:16px;color:#1a1a2e;">Hi <strong>${customerName}</strong>,</p>
            <p style="color:#6c757d;font-size:14px;line-height:1.7;">
              Your order <strong>#${orderId}</strong> has been cancelled and a full refund has been initiated.
            </p>

            <!-- Refund Info -->
            <div style="background:#f8f9fa;border-radius:12px;padding:20px 24px;margin:20px 0;">
              <table width="100%">
                <tr>
                  <td style="color:#6c757d;font-size:14px;">📦 Order ID</td>
                  <td style="text-align:right;font-weight:700;color:#1a1a2e;">#${orderId}</td>
                </tr>
                <tr>
                  <td style="color:#6c757d;font-size:14px;padding-top:8px;">💰 Refund Amount</td>
                  <td style="text-align:right;font-weight:700;color:#3b82f6;padding-top:8px;">₹${amount.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="color:#6c757d;font-size:14px;padding-top:8px;">⏱️ Expected Time</td>
                  <td style="text-align:right;color:#1a1a2e;padding-top:8px;">5-7 Business Days</td>
                </tr>
                <tr>
                  <td style="color:#6c757d;font-size:14px;padding-top:8px;">📊 Status</td>
                  <td style="text-align:right;padding-top:8px;">
                    <span style="background:#3b82f6;color:#fff;padding:3px 12px;border-radius:20px;font-size:12px;font-weight:600;">
                      REFUND INITIATED
                    </span>
                  </td>
                </tr>
              </table>
            </div>

            <p style="color:#6c757d;font-size:13px;">
              The refund will be credited to your original payment method within 5-7 business days.
              If you have any questions, reply to this email.
            </p>
          </div>

          <!-- Footer -->
          <div style="background:#f8f9fa;padding:20px 40px;border-top:1px solid #e9ecef;text-align:center;">
            <p style="margin:0;font-size:12px;color:#adb5bd;">© 2026 Myntra — All rights reserved</p>
          </div>

        </div>
      </body>
    </html>
    `,
  };

  await transporter.sendMail(mailOptions);
  console.log(`📧 Refund email sent to ${to}`);
};

export default transporter;
