const logger = require('../config/logger');
// const nodemailer = require('nodemailer');

/**
 * Send order confirmation email
 * @param {Object} orderData Order details from event payload
 */
const sendOrderConfirmationEmail = async (orderData) => {
  const { orderId, customerEmail, totalAmount, items } = orderData;

  logger.info(`=======================================================`);
  logger.info(`[EMAIL SIMULATOR] Sent order confirmation email!`);
  logger.info(`To: ${customerEmail}`);
  logger.info(`Subject: Cake Delight - Order Confirmation #${orderId}`);
  logger.info(`Total Amount Paid: $${totalAmount}`);
  logger.info(`Items Ordered (${items.length}):`);
  items.forEach((item) => {
    logger.info(` - ${item.cakeName} x${item.quantity} ($${item.unitPrice} each = $${item.lineTotal})`);
  });
  logger.info(`=======================================================`);

  /* 
  // PRODUCTION NODEMAILER SETUP (Uncomment when SMTP credentials are provided):
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: process.env.SMTP_PORT || 587,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: '"Cake Delight" <no-reply@cakedelight.com>',
    to: customerEmail,
    subject: `Order Confirmation #${orderId}`,
    html: `
      <h2>Thank you for your order!</h2>
      <p>Order ID: <strong>${orderId}</strong></p>
      <p>Total Paid: <strong>$${totalAmount}</strong></p>
    `,
  };

  await transporter.sendMail(mailOptions);
  */

  return true;
};

module.exports = {
  sendOrderConfirmationEmail,
};
