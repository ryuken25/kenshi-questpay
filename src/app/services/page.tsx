import type { Metadata } from "next";
import { SITE } from "@/lib/site";
import ServicesClient from "./ServicesClient";

export const metadata: Metadata = {
  title: "Services — Kenshi QuestPay",
  description: "Fixed-price creator services with structured briefs and Polygon payment receipts.",
};

export default function ServicesPage() {
  return <ServicesClient />;
}
