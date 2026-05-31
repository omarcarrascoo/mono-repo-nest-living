import { apiFetch } from "@/lib/api/client";
import { Category } from "@/types/api";
import { adaptCategory } from "./adapters";

export const categoriesService = {
  async list(): Promise<Category[]> {
    const raw = await apiFetch<unknown[]>("/categories", { method: "GET" });
    return Array.isArray(raw)
      ? raw.map((c) => adaptCategory(c as Record<string, unknown>))
      : [];
  },
};
