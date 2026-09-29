import { redirect } from "next/navigation";

// Legacy unauthenticated dashboard removed for security.
// Real delivery staff use the authenticated /driver and /delivery-company flows.
export default function DeliveryPage() {
  redirect("/driver");
}