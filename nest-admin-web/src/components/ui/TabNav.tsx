"use client";

import { cn } from "@/lib/cn";

export interface TabItem<T extends string> {
  key: T;
  label: string;
  count?: number;
}

export function TabNav<T extends string>({
  items,
  active,
  onChange,
}: {
  items: TabItem<T>[];
  active: T;
  onChange: (key: T) => void;
}) {
  return (
    <div className="flex gap-1 border-b border-hairline">
      {items.map((tab) => {
        const isActive = tab.key === active;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={cn(
              "relative inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold tracking-tight transition-colors",
              isActive
                ? "text-editorial-ink"
                : "text-editorial-soft hover:text-editorial-ink",
            )}
          >
            {tab.label}
            {typeof tab.count === "number" && tab.count > 0 && (
              <span
                className={cn(
                  "font-display tabular-nums text-base italic",
                  isActive ? "text-teal-dark" : "text-editorial-soft",
                )}
              >
                {tab.count}
              </span>
            )}
            {isActive && (
              <span className="absolute inset-x-2 -bottom-px h-px bg-teal-dark" />
            )}
          </button>
        );
      })}
    </div>
  );
}
