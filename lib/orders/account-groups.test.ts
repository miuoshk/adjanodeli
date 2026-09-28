import { describe, expect, it } from "vitest";

import { groupAccountOrders } from "./account-groups";

describe("groupAccountOrders", () => {
  it("puts pickup and production on cards and keeps three other orders", () => {
    const orders = [
      { id: "1", status: "delivered" },
      { id: "2", status: "paid" },
      { id: "3", status: "in_production" },
      { id: "4", status: "picked_up" },
      { id: "5", status: "expired" },
      { id: "6", status: "cancelled" },
      { id: "7", status: "pending_payment" },
    ];

    expect(groupAccountOrders(orders)).toEqual({
      waiting: [{ id: "1", status: "delivered" }],
      preparing: [
        { id: "2", status: "paid" },
        { id: "3", status: "in_production" },
      ],
      recent: [
        { id: "4", status: "picked_up" },
        { id: "5", status: "expired" },
        { id: "6", status: "cancelled" },
      ],
    });
  });
});
