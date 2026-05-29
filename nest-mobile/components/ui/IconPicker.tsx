import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '@/constants/theme';

const RECENTS_KEY = 'nest.iconpicker.recents';
const MAX_RECENTS = 12;

/**
 * Lista curada de Feather Icons útiles para una app residencial.
 * Ordenados por relevancia: amenities, comida, comunes, transporte, etc.
 * Cada entry incluye `aliases` en español para que el search funcione bien.
 */
type IconEntry = {
  name: keyof typeof Feather.glyphMap;
  aliases: string[];
};

const ICONS: IconEntry[] = [
  // Amenities
  { name: 'home', aliases: ['casa', 'inicio'] },
  { name: 'wifi', aliases: ['internet', 'red'] },
  { name: 'tv', aliases: ['television'] },
  { name: 'music', aliases: ['musica', 'sonido'] },
  { name: 'film', aliases: ['cine', 'pelicula'] },
  { name: 'sun', aliases: ['sol', 'piscina', 'verano'] },
  { name: 'cloud', aliases: ['nube'] },
  { name: 'umbrella', aliases: ['paraguas', 'lluvia'] },
  { name: 'wind', aliases: ['viento', 'ventilador'] },
  { name: 'thermometer', aliases: ['temperatura', 'clima'] },
  { name: 'droplet', aliases: ['agua', 'gota'] },
  { name: 'zap', aliases: ['rayo', 'energia', 'electricidad'] },
  // Food
  { name: 'coffee', aliases: ['cafe', 'bebida'] },
  // Spaces
  { name: 'grid', aliases: ['cuadricula', 'todos'] },
  { name: 'layout', aliases: ['salon'] },
  { name: 'box', aliases: ['caja'] },
  { name: 'package', aliases: ['paquete', 'producto'] },
  // People
  { name: 'user', aliases: ['usuario', 'persona'] },
  { name: 'users', aliases: ['personas', 'grupo', 'comunidad'] },
  { name: 'user-check', aliases: ['aprobado'] },
  { name: 'user-plus', aliases: ['agregar usuario'] },
  // Activity
  { name: 'activity', aliases: ['ejercicio', 'gym', 'fitness', 'actividad'] },
  { name: 'award', aliases: ['premio'] },
  { name: 'star', aliases: ['estrella', 'favorito'] },
  { name: 'heart', aliases: ['corazon', 'me gusta'] },
  // Comms
  { name: 'bell', aliases: ['campana', 'notificacion'] },
  { name: 'mail', aliases: ['correo', 'email'] },
  { name: 'message-circle', aliases: ['mensaje', 'chat'] },
  { name: 'phone', aliases: ['telefono'] },
  // Security
  { name: 'lock', aliases: ['candado', 'seguridad'] },
  { name: 'unlock', aliases: ['abrir'] },
  { name: 'shield', aliases: ['escudo', 'seguro'] },
  { name: 'key', aliases: ['llave'] },
  { name: 'eye', aliases: ['ver', 'ojo'] },
  // Transport
  { name: 'truck', aliases: ['camion', 'entrega'] },
  { name: 'navigation', aliases: ['mapa', 'gps'] },
  { name: 'map-pin', aliases: ['ubicacion', 'pin'] },
  { name: 'compass', aliases: ['brujula'] },
  // Money
  { name: 'credit-card', aliases: ['tarjeta', 'pago'] },
  { name: 'dollar-sign', aliases: ['dinero', 'pesos'] },
  { name: 'shopping-bag', aliases: ['compras', 'bolsa'] },
  { name: 'shopping-cart', aliases: ['carrito'] },
  { name: 'tag', aliases: ['etiqueta', 'oferta'] },
  { name: 'gift', aliases: ['regalo'] },
  // Time
  { name: 'clock', aliases: ['reloj', 'tiempo'] },
  { name: 'calendar', aliases: ['calendario', 'fecha'] },
  // Tools
  { name: 'tool', aliases: ['herramienta', 'reparacion'] },
  { name: 'settings', aliases: ['ajustes', 'configuracion'] },
  { name: 'sliders', aliases: ['controles'] },
  // Files
  { name: 'file', aliases: ['archivo'] },
  { name: 'file-text', aliases: ['documento'] },
  { name: 'folder', aliases: ['carpeta'] },
  // Status
  { name: 'check-circle', aliases: ['ok', 'completado'] },
  { name: 'alert-circle', aliases: ['atencion', 'aviso'] },
  { name: 'alert-triangle', aliases: ['advertencia', 'peligro'] },
  { name: 'info', aliases: ['info'] },
  { name: 'help-circle', aliases: ['ayuda'] },
  { name: 'x-circle', aliases: ['cancelar', 'error'] },
  // Misc
  { name: 'camera', aliases: ['camara', 'foto'] },
  { name: 'image', aliases: ['imagen'] },
  { name: 'video', aliases: ['video'] },
  { name: 'mic', aliases: ['microfono'] },
  { name: 'briefcase', aliases: ['trabajo', 'maletin'] },
  { name: 'book', aliases: ['libro', 'biblioteca'] },
  { name: 'book-open', aliases: ['lectura'] },
  { name: 'bookmark', aliases: ['marcador', 'guardar'] },
  { name: 'flag', aliases: ['bandera', 'reportar'] },
  { name: 'feather', aliases: ['pluma'] },
  { name: 'gift', aliases: ['regalo'] },
  { name: 'globe', aliases: ['mundo'] },
];

interface IconPickerProps {
  visible: boolean;
  value?: string;
  onClose: () => void;
  onSelect: (iconName: string) => void;
}

export function IconPicker({ visible, value, onClose, onSelect }: IconPickerProps) {
  const [query, setQuery] = useState('');
  const [recents, setRecents] = useState<string[]>([]);

  useEffect(() => {
    if (!visible) return;
    setQuery('');
    AsyncStorage.getItem(RECENTS_KEY)
      .then((raw) => {
        if (!raw) return;
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) setRecents(parsed.filter((s) => typeof s === 'string'));
        } catch {
          // ignore
        }
      })
      .catch(() => {});
  }, [visible]);

  const normalized = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!normalized) return ICONS;
    return ICONS.filter((entry) => {
      if (entry.name.toLowerCase().includes(normalized)) return true;
      return entry.aliases.some((a) => a.toLowerCase().includes(normalized));
    });
  }, [normalized]);

  const recentEntries = useMemo(() => {
    return recents
      .map((name) => ICONS.find((i) => i.name === name))
      .filter(Boolean) as IconEntry[];
  }, [recents]);

  const pick = async (iconName: string) => {
    onSelect(iconName);
    const next = [iconName, ...recents.filter((r) => r !== iconName)].slice(
      0,
      MAX_RECENTS,
    );
    setRecents(next);
    try {
      await AsyncStorage.setItem(RECENTS_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>Elegir ícono</Text>
            <TouchableOpacity onPress={onClose} hitSlop={8} style={styles.closeBtn}>
              <Feather name="x" size={20} color={COLORS.text.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchWrap}>
            <Feather name="search" size={18} color={COLORS.text.label} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar (wifi, alberca, gym, café…)"
              placeholderTextColor={COLORS.text.label}
              value={query}
              onChangeText={setQuery}
              autoCorrect={false}
              autoCapitalize="none"
            />
            {query ? (
              <TouchableOpacity onPress={() => setQuery('')} hitSlop={6}>
                <Feather name="x" size={16} color={COLORS.text.label} />
              </TouchableOpacity>
            ) : null}
          </View>

          {recentEntries.length > 0 && !normalized ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recientes</Text>
              <View style={styles.grid}>
                {recentEntries.map((e) => (
                  <IconCell
                    key={`recent-${e.name}`}
                    entry={e}
                    selected={value === e.name}
                    onPress={() => pick(e.name)}
                  />
                ))}
              </View>
            </View>
          ) : null}

          <Text style={styles.sectionTitle}>
            {normalized ? `Resultados (${filtered.length})` : 'Todos'}
          </Text>
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.name}
            numColumns={5}
            contentContainerStyle={styles.gridContent}
            columnWrapperStyle={{ gap: 8 }}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Feather name="search" size={24} color={COLORS.text.label} />
                <Text style={styles.emptyText}>
                  Sin resultados para “{query}”.
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <IconCell
                entry={item}
                selected={value === item.name}
                onPress={() => pick(item.name)}
              />
            )}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function IconCell({
  entry,
  selected,
  onPress,
}: {
  entry: IconEntry;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.cell, selected && styles.cellSelected]}
    >
      <Feather
        name={entry.name}
        size={22}
        color={selected ? '#fff' : COLORS.text.primary}
      />
      <Text
        style={[styles.cellLabel, selected && styles.cellLabelSelected]}
        numberOfLines={1}
      >
        {entry.name}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.ui.lightSheet,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
    maxHeight: '88%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#cbd5e1',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 10,
  },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.text.primary },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: COLORS.light.card,
    borderWidth: 1,
    borderColor: COLORS.light.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.light.card,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.light.border,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text.primary,
    padding: 0,
  },
  section: { gap: 6, marginBottom: 12 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.text.label,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gridContent: { paddingBottom: 24, gap: 8 },
  cell: {
    flex: 1,
    minWidth: 60,
    aspectRatio: 1,
    backgroundColor: COLORS.light.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.light.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 4,
  },
  cellSelected: {
    backgroundColor: COLORS.brand.tealDark,
    borderColor: COLORS.brand.tealDark,
  },
  cellLabel: {
    fontSize: 9,
    color: COLORS.text.label,
    textAlign: 'center',
  },
  cellLabelSelected: { color: '#fff', fontWeight: '700' },
  empty: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  emptyText: { color: COLORS.text.label, fontSize: 13 },
});
