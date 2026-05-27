import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS } from '@/constants/theme';
import { PaymentMethodCard } from '@/components/delivery/PaymentMethodCard';
import { cartSelectors, useCartStore } from '@/stores/cart-store';
import { CashDenomination, PaymentMethodKind } from '@/types/api';
import { formatMXN } from '@/lib/currency';

const CASH_DENOMINATIONS: CashDenomination[] = [50, 100, 200, 500, 1000];

export default function CheckoutScreen() {
  const router = useRouter();

  const items = useCartStore((s) => s.items);
  const total = useCartStore(cartSelectors.total);
  const cashChange = useCartStore(cartSelectors.cashChange);
  const paymentMethod = useCartStore((s) => s.paymentMethod);
  const cashDenomination = useCartStore((s) => s.cashDenomination);
  const notes = useCartStore((s) => s.notes);
  const submitting = useCartStore((s) => s.submitting);
  const setPaymentMethod = useCartStore((s) => s.setPaymentMethod);
  const setCashDenomination = useCartStore((s) => s.setCashDenomination);
  const setNotes = useCartStore((s) => s.setNotes);
  const submit = useCartStore((s) => s.submit);

  const [localError, setLocalError] = useState<string | null>(null);

  const handleSelectMethod = (m: PaymentMethodKind) => {
    setLocalError(null);
    setPaymentMethod(m);
  };

  /** Solo permitimos billetes ≥ total. Si todos son insuficientes, mostramos
   *  todos pero deshabilitados, para que el usuario vea por qué no puede pagar. */
  const validDenominations = CASH_DENOMINATIONS.filter((d) => d >= total);

  const handleSubmit = async () => {
    setLocalError(null);
    if (!paymentMethod) {
      setLocalError('Selecciona un método de pago');
      return;
    }
    if (paymentMethod === 'cash' && !cashDenomination) {
      setLocalError('Indica con qué billete pagarás');
      return;
    }
    try {
      await submit();
      router.replace('/delivery/confirmation' as never);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No pudimos procesar tu orden');
    }
  };

  if (items.length === 0) {
    // Fallback — el usuario no debería poder llegar aquí sin items pero por si acaso
    return (
      <View style={[styles.container, styles.centerEmpty]}>
        <Feather name="shopping-bag" size={32} color={COLORS.text.label} />
        <Text style={styles.emptyTitle}>Tu carrito está vacío</Text>
        <TouchableOpacity
          style={styles.emptyBtn}
          onPress={() => router.replace('/(tabs)/delivery' as never)}
        >
          <Text style={styles.emptyBtnText}>Volver a productos</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} hitSlop={8}>
            <Feather name="chevron-left" size={22} color={COLORS.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Pago</Text>
          <View style={styles.iconBtn} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Total */}
          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>Total a pagar</Text>
            <Text style={styles.totalValue}>{formatMXN(total)}</Text>
            <Text style={styles.totalItems}>
              {items.length} {items.length === 1 ? 'producto' : 'productos'}
            </Text>
          </View>

          {/* Payment methods */}
          <Text style={styles.sectionTitle}>Método de pago</Text>
          <View style={styles.methodList}>
            <PaymentMethodCard
              icon="credit-card"
              title="Terminal en la entrega"
              subtitle="Pagas con tarjeta cuando llegue tu pedido"
              selected={paymentMethod === 'terminal'}
              onPress={() => handleSelectMethod('terminal')}
            />
            <PaymentMethodCard
              icon="dollar-sign"
              title="Efectivo"
              subtitle="Pagas en efectivo a la entrega"
              selected={paymentMethod === 'cash'}
              onPress={() => handleSelectMethod('cash')}
            />
          </View>

          {/* Cash denomination */}
          {paymentMethod === 'cash' ? (
            <View style={styles.cashBlock}>
              <Text style={styles.sectionTitle}>¿Con qué billete vas a pagar?</Text>
              <Text style={styles.sectionHelper}>
                Esto nos ayuda a llevar el cambio exacto.
              </Text>
              <View style={styles.denomGrid}>
                {CASH_DENOMINATIONS.map((d) => {
                  const enabled = d >= total;
                  const selected = cashDenomination === d;
                  return (
                    <TouchableOpacity
                      key={d}
                      onPress={() => enabled && setCashDenomination(d)}
                      disabled={!enabled}
                      activeOpacity={0.85}
                      style={[
                        styles.denomChip,
                        selected && styles.denomChipSelected,
                        !enabled && styles.denomChipDisabled,
                      ]}
                    >
                      <Text
                        style={[
                          styles.denomText,
                          selected && styles.denomTextSelected,
                          !enabled && styles.denomTextDisabled,
                        ]}
                      >
                        {formatMXN(d)}
                      </Text>
                      {!enabled ? (
                        <Text style={styles.denomHint}>Insuficiente</Text>
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {validDenominations.length === 0 ? (
                <View style={styles.warning}>
                  <Feather name="info" size={14} color={COLORS.status.warning} />
                  <Text style={styles.warningText}>
                    Tu pedido excede el billete más grande. Considera pagar con terminal.
                  </Text>
                </View>
              ) : null}

              {cashChange !== null && cashDenomination ? (
                <View style={styles.changeCard}>
                  <Text style={styles.changeLabel}>Cambio</Text>
                  <Text style={styles.changeValue}>{formatMXN(cashChange)}</Text>
                </View>
              ) : null}
            </View>
          ) : null}

          {/* Notes */}
          <Text style={styles.sectionTitle}>Notas para el repartidor</Text>
          <View style={styles.notesCard}>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Departamento, contraseña del lobby, etc."
              placeholderTextColor={COLORS.text.placeholder}
              multiline
              style={styles.notesInput}
              maxLength={200}
            />
          </View>
        </ScrollView>

        {localError ? (
          <View style={styles.errorBar}>
            <Feather name="alert-circle" size={14} color={COLORS.ui.white} />
            <Text style={styles.errorBarText}>{localError}</Text>
          </View>
        ) : null}

        <View style={styles.ctaBar}>
          <TouchableOpacity
            style={[styles.ctaBtn, submitting && styles.ctaBtnDisabled]}
            activeOpacity={0.85}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={COLORS.ui.white} />
            ) : (
              <>
                <Text style={styles.ctaBtnText}>Confirmar pedido · {formatMXN(total)}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.light.backgroundSecondary },
  centerEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text.primary,
  },
  emptyBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.brand.tealDark,
  },
  emptyBtnText: { color: COLORS.ui.white, fontWeight: '800' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 16,
    backgroundColor: COLORS.ui.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light.border,
  },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text.primary,
  },

  scrollContent: { padding: 20, paddingBottom: 160 },

  totalCard: {
    backgroundColor: COLORS.ui.white,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.light.border,
    alignItems: 'center',
    marginBottom: 24,
  },
  totalLabel: {
    fontSize: 12,
    color: COLORS.text.label,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  totalValue: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.text.primary,
    letterSpacing: -1,
  },
  totalItems: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginTop: 4,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  sectionHelper: {
    fontSize: 13,
    color: COLORS.text.secondary,
    marginBottom: 12,
  },
  methodList: { gap: 10, marginTop: 12, marginBottom: 24 },

  cashBlock: {
    marginBottom: 24,
  },
  denomGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  denomChip: {
    flexBasis: '30%',
    flexGrow: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: COLORS.ui.white,
    borderWidth: 2,
    borderColor: COLORS.light.border,
    alignItems: 'center',
  },
  denomChipSelected: {
    borderColor: COLORS.brand.tealDark,
    backgroundColor: '#ecfdf5',
  },
  denomChipDisabled: {
    opacity: 0.45,
  },
  denomText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text.primary,
  },
  denomTextSelected: {
    color: COLORS.brand.tealDark,
  },
  denomTextDisabled: {
    color: COLORS.text.label,
  },
  denomHint: {
    fontSize: 10,
    color: COLORS.text.label,
    marginTop: 2,
    fontWeight: '600',
  },
  warning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#fef3c7',
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: '#92400e',
    fontWeight: '600',
  },
  changeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    padding: 16,
    borderRadius: 14,
    backgroundColor: COLORS.text.primary,
  },
  changeLabel: {
    fontSize: 13,
    color: COLORS.text.light,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  changeValue: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.ui.white,
  },

  notesCard: {
    backgroundColor: COLORS.ui.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.light.border,
    marginTop: 12,
  },
  notesInput: {
    minHeight: 60,
    fontSize: 14,
    color: COLORS.text.primary,
    textAlignVertical: 'top',
  },

  errorBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.status.error,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  errorBarText: {
    color: COLORS.ui.white,
    fontSize: 13,
    fontWeight: '700',
  },

  ctaBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 32 : 20,
    backgroundColor: COLORS.ui.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.light.border,
  },
  ctaBtn: {
    backgroundColor: COLORS.brand.tealDark,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaBtnDisabled: {
    opacity: 0.6,
  },
  ctaBtnText: {
    color: COLORS.ui.white,
    fontSize: 16,
    fontWeight: '800',
  },
});
