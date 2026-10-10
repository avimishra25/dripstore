const { fail } = require('../utils/validation');
const transitions = {
  'Pending Payment': ['Cancelled'], Placed: ['Processing', 'Cancelled'],
  Processing: ['Shipped', 'Cancelled'], Shipped: ['Delivered'],
  Delivered: [], Cancelled: [], 'Payment Review': ['Cancelled'],
};
async function transitionOrder(order, status, actor, release) {
  if (order.orderStatus === status) return;
  if (!transitions[order.orderStatus]?.includes(status)) fail(409, 'Invalid order status transition');
  if (status !== 'Cancelled' && !order.isPaid) fail(409, 'Unpaid orders cannot be fulfilled');
  if (status === 'Cancelled') {
    // Legacy paid orders lack stockDeducted; the former confirmation flow deducted inventory.
    if (order.stockDeducted === true || (order.stockDeducted === undefined && order.isPaid)) {
      await release(order.orderItems); order.stockDeducted = false;
    }
    if (order.isPaid && order.refundStatus !== 'processed') order.refundStatus = 'required';
  }
  order.orderStatus = status;
  if (status === 'Delivered') order.deliveredAt = new Date();
  order.statusHistory.push({ status, actor, note: status === 'Cancelled' && order.isPaid ? 'Refund required through payment provider' : '' });
}
module.exports = { transitions, transitionOrder };
