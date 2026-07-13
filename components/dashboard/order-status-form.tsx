"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { OrderDetail } from "@/lib/types";
import { apiFetch } from "@/lib/api-url";

const statuses = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
] as const;

type OrderStatus = OrderDetail["status"];

type OrderStatusFormProps = {
  orderId: string;
  status: OrderStatus;
};

type ApiResponse = {
  success: boolean;
  data: OrderDetail | null;
  error: { message: string } | null;
};

export function OrderStatusForm({ orderId, status }: OrderStatusFormProps) {
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>(status);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function updateStatus() {
    setLoading(true);
    setMessage("");
    setError("");
    try {
      const response = await apiFetch(
        `/api/v1/dashboard/orders/${orderId}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: selectedStatus }),
        },
      );
      const contentType = response.headers.get("content-type") ?? "";
      const body = contentType.includes("application/json")
        ? ((await response.json()) as ApiResponse)
        : null;
      if (!response.ok || !body?.success) {
        setError(body?.error?.message ?? "Could not update order status.");
        return;
      }

      setMessage("Order status updated.");
      router.refresh();
    } catch {
      setError("Could not reach the order service.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded border border-zinc-200 bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <label className="grid flex-1 gap-2 text-sm font-bold text-zinc-900">
          Status
          <select
            value={selectedStatus}
            onChange={(event) =>
              setSelectedStatus(event.target.value as OrderStatus)
            }
            className="h-11 rounded border border-zinc-200 bg-white px-3 text-sm font-bold outline-none focus:border-zinc-900"
          >
            {statuses.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <Button
          loading={loading}
          disabled={selectedStatus === status}
          onClick={updateStatus}
        >
          Update Status
        </Button>
      </div>
      {message ? (
        <p className="mt-3 rounded bg-emerald-50 p-3 text-sm font-bold text-emerald-700">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="mt-3 rounded bg-red-50 p-3 text-sm font-bold text-red-700">
          {error}
        </p>
      ) : null}
    </section>
  );
}
