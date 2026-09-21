import { z } from "zod";
import type {
  ResourceDefinition,
  ResourceName,
} from "./types";

const productSchema = z
  .object({
    id: z.number().int().positive(),
    title: z.string().min(1),
    description: z.string(),
    category: z.string().min(1),
    price: z.number().nonnegative(),
    stock: z.number().int().nonnegative(),
    brand: z.string().optional(),
    thumbnail: z.string().url(),
    images: z.array(z.string().url()).optional(),
  })
  .passthrough();

const userSchema = z
  .object({
    id: z.number().int().positive(),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(1),
    username: z.string().min(1),
    image: z.string().url(),
    role: z.string().optional(),
  })
  .passthrough();

function parseWith(
  schema: typeof productSchema | typeof userSchema,
  value: unknown,
): ReturnType<ResourceDefinition["parseRecord"]> {
  const result = schema.safeParse(value);
  if (result.success) {
    return { success: true, data: result.data };
  }

  const issue = result.error.issues.at(0);
  const path = issue?.path.join(".") || "record";
  return {
    success: false,
    reason: `${path}: ${issue?.message ?? "Invalid source record"}`,
  };
}

function textValue(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

const products: ResourceDefinition = {
  name: "products",
  label: "Products",
  collectionKey: "products",
  editableFields: [
    { key: "title", label: "Title", type: "text" },
    { key: "description", label: "Description", type: "textarea" },
    { key: "category", label: "Category", type: "text" },
    { key: "brand", label: "Brand", type: "text" },
    { key: "price", label: "Price", type: "number" },
    { key: "stock", label: "Stock", type: "number" },
  ],
  columns: [
    { key: "title", label: "Product" },
    { key: "category", label: "Category" },
    { key: "price", label: "Price" },
    { key: "stock", label: "Stock" },
  ],
  parseRecord: (value) => parseWith(productSchema, value),
  getTitle: (record) => textValue(record.title, `Product ${record.id}`),
  getSubtitle: (record) => textValue(record.category, "Uncategorized"),
  getImage: (record) =>
    typeof record.thumbnail === "string" ? record.thumbnail : null,
  simulateSourceChange: (record) => ({
    ...record,
    stock:
      typeof record.stock === "number" ? Math.max(0, record.stock + 7) : 7,
    description: textValue(record.description, "").trim().concat(
      " Source inventory was revised in this simulation.",
    ),
  }),
};

const users: ResourceDefinition = {
  name: "users",
  label: "Users",
  collectionKey: "users",
  editableFields: [
    { key: "firstName", label: "First name", type: "text" },
    { key: "lastName", label: "Last name", type: "text" },
    { key: "email", label: "Email", type: "email" },
    { key: "phone", label: "Phone", type: "text" },
    { key: "username", label: "Username", type: "text" },
    { key: "role", label: "Role", type: "text" },
  ],
  columns: [
    { key: "firstName", label: "User" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "role", label: "Role" },
  ],
  parseRecord: (value) => parseWith(userSchema, value),
  getTitle: (record) =>
    `${textValue(record.firstName, "")} ${textValue(record.lastName, "")}`.trim() ||
    `User ${record.id}`,
  getSubtitle: (record) => textValue(record.email, "No email"),
  getImage: (record) => (typeof record.image === "string" ? record.image : null),
  simulateSourceChange: (record) => ({
    ...record,
    phone: textValue(record.phone, "").trim().concat(" ext. 7"),
    role: "Source profile updated",
  }),
};

export const RESOURCE_DEFINITIONS: Record<ResourceName, ResourceDefinition> = {
  products,
  users,
};

export function formatFieldValue(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "Not set";
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  ) {
    return String(value);
  }
  return "Unsupported value";
}
