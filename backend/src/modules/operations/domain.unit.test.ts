import { stableUuid } from "./domain";
import { invoiceTotals, paymentBalance, rentSchedule, csvCell } from "./domain";
import { paymentInput, leaseInput, phone, settingsInput } from "./schemas";
describe("Financial and tenancy invariants", () => {
  it("generates stable valid identifiers for reminder retries", () => {
    expect(stableUuid("visit:1")).toBe(stableUuid("visit:1"));
    expect(stableUuid("visit:1")).not.toBe(stableUuid("visit:2"));
    expect(stableUuid("visit:1")).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-8[0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });
  it("generates twelve calendar-month obligations without drifting after February", () => {
    const dates = rentSchedule(
      new Date("2028-01-31"),
      new Date("2029-01-31"),
    ).map((d) => d.toISOString().slice(0, 10));
    expect(dates).toHaveLength(12);
    expect(dates.slice(0, 3)).toEqual([
      "2028-01-31",
      "2028-02-29",
      "2028-03-31",
    ]);
  });
  it("rejects invalid lease terms", () => {
    expect(() =>
      rentSchedule(new Date("2028-02-01"), new Date("2028-01-01")),
    ).toThrow();
  });
  it("uses decimal arithmetic and rounds tax once", () => {
    const t = invoiceTotals(
      [
        { quantity: 3, unitPrice: 0.1 },
        { quantity: 1, unitPrice: 10.99 },
      ],
      7.5,
    );
    expect(t.subtotal.toFixed(2)).toBe("11.29");
    expect(t.taxAmount.toFixed(2)).toBe("0.85");
    expect(t.totalAmount.toFixed(2)).toBe("12.14");
  });
  it("supports partial payment and rejects overpayment", () => {
    expect(paymentBalance(100, 20, 30).status).toBe("PARTIALLY_PAID");
    expect(paymentBalance(100, 20, 80).status).toBe("PAID");
    expect(() => paymentBalance(100, 20, 80.01)).toThrow("exceeds");
  });
  it("requires one payment target and a replay key", () => {
    const base = {
      amount: 10,
      method: "CASH",
      requestKey: "a6f76b1e-dc49-4696-93ab-1769b242bdbd",
    };
    expect(paymentInput.safeParse(base).success).toBe(false);
    expect(
      paymentInput.safeParse({
        ...base,
        invoiceId: base.requestKey,
        obligationId: base.requestKey,
      }).success,
    ).toBe(false);
    expect(
      paymentInput.safeParse({ ...base, invoiceId: base.requestKey }).success,
    ).toBe(true);
    expect(
      paymentInput.safeParse({
        ...base,
        invoiceId: base.requestKey,
        amount: 0.001,
      }).success,
    ).toBe(false);
  });
  it("neutralizes spreadsheet formula injection and quotes CSV values", () => {
    expect(csvCell("=1+2")).toBe('"\'=1+2"');
    expect(csvCell('a"b')).toBe('"a""b"');
  });
  it("normalizes customer phones and validates agency time zones", () => {
    expect(phone.parse("0300 1234567")).toBe("+923001234567");
    expect(settingsInput.safeParse({ timezone: "Invalid/Zone" }).success).toBe(
      false,
    );
  });
});
