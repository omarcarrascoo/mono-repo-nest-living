import { create } from 'zustand';
import {
  CartItem,
  CartItemModifier,
  CashDenomination,
  CreateOrderRequest,
  Order,
  PaymentMethodKind,
  Product,
  ProductOptionGroup,
} from '@/types/api';
import { deliveryService } from '@/services/delivery.service';
import { useOrdersStore } from './orders-store';

/** Selección del usuario dentro del detalle: groupId -> optionId(s). */
export type SelectionMap = Record<string, string[]>;

interface CartState {
  items: CartItem[];

  paymentMethod: PaymentMethodKind | null;
  cashDenomination: CashDenomination | null;
  notes: string;

  submitting: boolean;
  submitError: string | null;
  lastOrder: Order | null;

  // Mutations
  addProduct: (
    product: Product,
    selection: SelectionMap,
    quantity: number,
    notes?: string,
  ) => CartItem;
  updateQuantity: (lineId: string, quantity: number) => void;
  removeLine: (lineId: string) => void;
  clear: () => void;

  setPaymentMethod: (m: PaymentMethodKind | null) => void;
  setCashDenomination: (d: CashDenomination | null) => void;
  setNotes: (notes: string) => void;

  // Derivados (selectores se exportan abajo, no como state)
  submit: () => Promise<Order>;
  resetLastOrder: () => void;
}

let lineCounter = 0;
function nextLineId(): string {
  lineCounter += 1;
  return `cart-${Date.now().toString(36)}-${lineCounter}`;
}

/** Construye los modifiers a partir de la selección, validando contra los grupos. */
function buildModifiers(
  groups: ProductOptionGroup[],
  selection: SelectionMap,
): CartItemModifier[] {
  const result: CartItemModifier[] = [];
  for (const group of groups) {
    const ids = selection[group.id] ?? [];
    for (const optionId of ids) {
      const option = group.options.find((o) => o.id === optionId);
      if (!option) continue;
      result.push({
        groupId: group.id,
        groupName: group.name,
        optionId: option.id,
        optionName: option.name,
        priceDelta: option.priceDelta,
      });
    }
  }
  return result;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  paymentMethod: null,
  cashDenomination: null,
  notes: '',
  submitting: false,
  submitError: null,
  lastOrder: null,

  addProduct: (product, selection, quantity, notes) => {
    const modifiers = buildModifiers(product.optionGroups, selection);
    const unitPrice =
      product.price + modifiers.reduce((s, m) => s + m.priceDelta, 0);
    const item: CartItem = {
      lineId: nextLineId(),
      productId: product.id,
      name: product.name,
      image: product.image,
      unitPrice,
      quantity: Math.max(quantity, 1),
      modifiers,
      notes,
      lineTotal: unitPrice * Math.max(quantity, 1),
    };
    set((s) => ({ items: [...s.items, item] }));
    return item;
  },

  updateQuantity: (lineId, quantity) => {
    if (quantity <= 0) {
      get().removeLine(lineId);
      return;
    }
    set((s) => ({
      items: s.items.map((it) =>
        it.lineId === lineId
          ? { ...it, quantity, lineTotal: it.unitPrice * quantity }
          : it,
      ),
    }));
  },

  removeLine: (lineId) =>
    set((s) => ({ items: s.items.filter((it) => it.lineId !== lineId) })),

  clear: () =>
    set({
      items: [],
      paymentMethod: null,
      cashDenomination: null,
      notes: '',
      submitError: null,
    }),

  setPaymentMethod: (m) =>
    set((s) => ({
      paymentMethod: m,
      // Si cambian de cash → terminal limpiamos la denominación
      cashDenomination: m === 'cash' ? s.cashDenomination : null,
    })),

  setCashDenomination: (d) => set({ cashDenomination: d }),

  setNotes: (notes) => set({ notes }),

  submit: async () => {
    const state = get();
    if (state.items.length === 0) {
      throw new Error('Tu carrito está vacío');
    }
    if (!state.paymentMethod) {
      throw new Error('Selecciona un método de pago');
    }
    if (state.paymentMethod === 'cash' && !state.cashDenomination) {
      throw new Error('Indica con qué billete vas a pagar');
    }

    set({ submitting: true, submitError: null });
    try {
      const payload: CreateOrderRequest = {
        items: state.items.map((it) => {
          const grouped = new Map<string, string[]>();
          for (const m of it.modifiers) {
            const arr = grouped.get(m.groupId) ?? [];
            arr.push(m.optionId);
            grouped.set(m.groupId, arr);
          }
          return {
            productId: it.productId,
            quantity: it.quantity,
            selections: Array.from(grouped.entries()).map(([groupId, optionIds]) => ({
              groupId,
              optionIds,
            })),
            notes: it.notes,
          };
        }),
        payment: {
          method: state.paymentMethod,
          cashDenomination:
            state.paymentMethod === 'cash'
              ? state.cashDenomination ?? undefined
              : undefined,
        },
        notes: state.notes.trim() || undefined,
      };
      const order = await deliveryService.createOrder(payload);
      useOrdersStore.getState().upsertOrder(order);
      set({
        submitting: false,
        lastOrder: order,
        items: [],
        paymentMethod: null,
        cashDenomination: null,
        notes: '',
      });
      return order;
    } catch (e: any) {
      const msg = e?.message ?? 'No pudimos crear tu orden';
      set({ submitting: false, submitError: msg });
      throw e;
    }
  },

  resetLastOrder: () => set({ lastOrder: null }),
}));

// ============================================================
// Selectores — los pasamos por function en lugar de poner los
// derived values en el state para que zustand no re-renderee a
// todos los consumidores cuando cambia algo del carrito.
// ============================================================

export const cartSelectors = {
  itemCount: (s: CartState): number =>
    s.items.reduce((sum, it) => sum + it.quantity, 0),
  subtotal: (s: CartState): number =>
    s.items.reduce((sum, it) => sum + it.lineTotal, 0),
  total: (s: CartState): number =>
    s.items.reduce((sum, it) => sum + it.lineTotal, 0),
  cashChange: (s: CartState): number | null => {
    if (s.paymentMethod !== 'cash' || !s.cashDenomination) return null;
    const total = s.items.reduce((sum, it) => sum + it.lineTotal, 0);
    return Math.max(s.cashDenomination - total, 0);
  },
};
