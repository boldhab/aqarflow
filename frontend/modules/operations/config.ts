import { Field } from "./ResourceWorkspace";
export const contactFields: Field[] = [
  { name: "name", label: "Full name" },
  { name: "phone", label: "Mobile number (+92)", type: "tel" },
  { name: "email", label: "Email", type: "email", required: false },
  {
    name: "type",
    label: "Contact type",
    options: ["BUYER", "SELLER", "TENANT", "LANDLORD", "INVESTOR"],
  },
  { name: "notes", label: "Notes", type: "textarea", required: false },
];
export const leaseFields: Field[] = [
  { name: "propertyId", label: "Property", source: "/properties" },
  { name: "contactId", label: "Tenant", source: "/contacts" },
  {
    name: "landlordContactId",
    label: "Landlord",
    source: "/contacts",
    required: false,
  },
  {
    name: "managerUserId",
    label: "Property manager",
    source: "/users",
    required: false,
  },
  {
    name: "billingFrequency",
    label: "Billing cycle",
    options: ["MONTHLY", "QUARTERLY", "BI_ANNUAL", "ANNUAL"],
  },
  {
    name: "dueDayOfMonth",
    label: "Due day (1–31, optional)",
    type: "number",
    min: 1,
    step: "1",
    required: false,
  },
  {
    name: "gracePeriodDays",
    label: "Grace period (days)",
    type: "number",
    min: 0,
    step: "1",
    required: false,
  },
  { name: "startDate", label: "Start date", type: "date" },
  { name: "endDate", label: "End date (exclusive)", type: "date" },
  {
    name: "monthlyRent",
    label: "Monthly rent",
    type: "number",
    min: 0.01,
    step: "0.01",
  },
  {
    name: "depositAmount",
    label: "Security deposit",
    type: "number",
    min: 0,
    step: "0.01",
  },
];
export const staffFields: Field[] = [
  { name: "name", label: "Full name" },
  { name: "email", label: "Email", type: "email" },
  { name: "phone", label: "Mobile number", type: "tel", required: false },
  {
    name: "password",
    label: "Initial password (at least 10 characters)",
    type: "password",
  },
  { name: "role", label: "Role", options: ["AGENT", "ADMIN"] },
];
export const expenseFields: Field[] = [
  {
    name: "category",
    label: "Category",
    options: ["Marketing", "Office", "Legal", "Maintenance", "Other"],
  },
  { name: "description", label: "Description", type: "textarea" },
  { name: "amount", label: "Amount", type: "number", min: 0.01, step: "0.01" },
  { name: "date", label: "Expense date", type: "date" },
  { name: "receiptUrl", label: "Receipt URL", type: "url", required: false },
];
export const maintenanceFields: Field[] = [
  { name: "propertyId", label: "Property", source: "/properties" },
  { name: "title", label: "Issue title" },
  { name: "description", label: "Description", type: "textarea" },
  {
    name: "category",
    label: "Category",
    options: ["Plumbing", "Electrical", "HVAC", "Structural", "Other"],
  },
  {
    name: "priority",
    label: "Priority",
    options: ["LOW", "MEDIUM", "HIGH", "URGENT"],
  },
  { name: "photoUrl", label: "Issue photo", type: "asset", required: false },
];
export const maintenanceUpdateFields: Field[] = [
  {
    name: "status",
    label: "Status",
    options: [
      "OPEN",
      "ASSIGNED",
      "IN_PROGRESS",
      "WAITING",
      "RESOLVED",
      "CLOSED",
    ],
  },
  { name: "assignedTo", label: "Contractor / technician", required: false },
  {
    name: "cost",
    label: "Cost",
    type: "number",
    min: 0,
    step: "0.01",
    required: false,
  },
];
export const paymentFields: Field[] = [
  {
    name: "amount",
    label: "Payment amount",
    type: "number",
    min: 0.01,
    step: "0.01",
  },
  {
    name: "method",
    label: "Payment method",
    options: ["CASH", "BANK_TRANSFER", "CHEQUE", "ONLINE_PAYMENT"],
  },
  { name: "referenceCode", label: "Transaction reference", required: false },
];
export const branchFields: Field[] = [
  { name: "name", label: "Branch name" },
  { name: "address", label: "Office address" },
  { name: "city", label: "City" },
  { name: "phone", label: "Telephone", required: false },
];
export const settingsFields: Field[] = [
  { name: "name", label: "Agency name" },
  { name: "email", label: "Email", type: "email" },
  { name: "phone", label: "Telephone", required: false },
  { name: "address", label: "Address", required: false },
  { name: "logoUrl", label: "Agency logo", type: "asset", required: false },
  { name: "currency", label: "Currency (ISO code)" },
  { name: "timezone", label: "Time zone (e.g. Asia/Karachi)" },
  { name: "invoicePrefix", label: "Invoice prefix" },
  { name: "taxNumber", label: "Tax registration number", required: false },
  {
    name: "commissionRate",
    label: "Commission rate (%)",
    type: "number",
    min: 0,
    step: "0.01",
  },
];
