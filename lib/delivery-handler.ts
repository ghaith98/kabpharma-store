export type DeliveryHandler = {
  delivery_handler_type?: string | null;
  delivery_handler_id?: string | null;
  delivery_handler_name?: string | null;
  delivery_claimed_at?: string | null;
  driver_name?: string | null;
};

export function deliveryHandlerLabel(order: DeliveryHandler) {
  if (order.delivery_handler_type === "driver") return `Driver: ${order.delivery_handler_name || order.driver_name || "Unknown"}`;
  if (order.delivery_handler_type === "delivery_company") return `Delivery company: ${order.delivery_handler_name || "Unknown"}`;
  if (order.delivery_handler_type === "admin") return "Admin";
  if (order.driver_name) return `Driver: ${order.driver_name}`;
  return "Not recorded";
}
