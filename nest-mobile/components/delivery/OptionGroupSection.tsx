import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';
import { ProductOptionGroup } from '@/types/api';
import { formatPriceDelta } from '@/lib/currency';

interface OptionGroupSectionProps {
  group: ProductOptionGroup;
  selected: string[];
  onToggle: (optionId: string) => void;
  /** True cuando required=true y selected.length === 0 — pinta header en rojo. */
  hasError?: boolean;
}

/**
 * Renderiza un grupo de opciones. Maneja:
 * - mode='single' (radio): la selección reemplaza la actual
 * - mode='multiple' (checkbox): respeta maxSelections
 * - required: muestra label "Requerido" en rojo si hasError
 */
export const OptionGroupSection: React.FC<OptionGroupSectionProps> = ({
  group,
  selected,
  onToggle,
  hasError,
}) => {
  const subtitle = (() => {
    if (group.mode === 'single') return group.required ? 'Elige 1' : 'Opcional';
    const max = group.maxSelections;
    if (max && max > 0) return `Hasta ${max} opciones`;
    return group.required ? 'Mínimo 1' : 'Opcional';
  })();

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{group.name}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        <View
          style={[
            styles.requiredPill,
            group.required ? styles.requiredPillOn : styles.requiredPillOff,
            hasError && styles.requiredPillError,
          ]}
        >
          <Text
            style={[
              styles.requiredText,
              group.required ? styles.requiredTextOn : styles.requiredTextOff,
              hasError && styles.requiredTextError,
            ]}
          >
            {group.required ? 'Requerido' : 'Opcional'}
          </Text>
        </View>
      </View>

      <View style={styles.options}>
        {group.options.map((opt) => {
          const isSelected = selected.includes(opt.id);
          const disabled = !opt.available;
          // En multi: si ya llegamos al max y este no está seleccionado, lo deshabilitamos.
          const blockedByMax =
            group.mode === 'multiple' &&
            !isSelected &&
            typeof group.maxSelections === 'number' &&
            selected.length >= group.maxSelections;

          return (
            <TouchableOpacity
              key={opt.id}
              onPress={() => !disabled && !blockedByMax && onToggle(opt.id)}
              disabled={disabled || blockedByMax}
              activeOpacity={0.7}
              style={[
                styles.option,
                isSelected && styles.optionSelected,
                (disabled || blockedByMax) && styles.optionDisabled,
              ]}
            >
              <View
                style={[
                  group.mode === 'single' ? styles.radio : styles.checkbox,
                  isSelected && styles.markerSelected,
                ]}
              >
                {isSelected ? (
                  group.mode === 'single' ? (
                    <View style={styles.radioDot} />
                  ) : (
                    <Feather name="check" size={12} color={COLORS.ui.white} />
                  )
                ) : null}
              </View>
              <Text
                style={[
                  styles.optionName,
                  (disabled || blockedByMax) && styles.optionNameDisabled,
                ]}
              >
                {opt.name}
                {disabled ? ' · Agotado' : ''}
              </Text>
              <Text
                style={[
                  styles.optionDelta,
                  opt.priceDelta === 0 && styles.optionDeltaIncluded,
                ]}
              >
                {formatPriceDelta(opt.priceDelta)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.ui.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.light.border,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text.primary,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  requiredPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  requiredPillOn: {
    backgroundColor: COLORS.promotions.badgeSuccessBg,
    borderColor: COLORS.promotions.badgeSuccessBorder,
  },
  requiredPillOff: {
    backgroundColor: COLORS.light.backgroundSecondary,
    borderColor: COLORS.light.border,
  },
  requiredPillError: {
    backgroundColor: '#fee2e2',
    borderColor: '#fecaca',
  },
  requiredText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  requiredTextOn: {
    color: COLORS.brand.tealDark,
  },
  requiredTextOff: {
    color: COLORS.text.label,
  },
  requiredTextError: {
    color: '#b91c1c',
  },
  options: { gap: 4 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  optionSelected: {},
  optionDisabled: {
    opacity: 0.5,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.text.label,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.text.label,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerSelected: {
    borderColor: COLORS.brand.tealDark,
    backgroundColor: COLORS.brand.tealDark,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.ui.white,
  },
  optionName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  optionNameDisabled: {
    color: COLORS.text.label,
  },
  optionDelta: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  optionDeltaIncluded: {
    color: COLORS.text.label,
    fontWeight: '500',
  },
});
