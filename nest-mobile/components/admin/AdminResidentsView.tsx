import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { COLORS } from '@/constants/theme';
import { useAdminStore } from '@/stores/admin-store';
import { DirectoryUser, Role } from '@/types/api';

interface AdminResidentsViewProps {
  /** Render at the top inside the sheet, above the search bar. */
  header?: React.ReactNode;
}

const ROLE_LABEL: Record<Role, string> = {
  admin: 'Admin',
  user: 'Residente',
  kitchen_operator: 'Cocina',
};

const ROLE_COLOR: Record<Role, { bg: string; fg: string }> = {
  admin: { bg: '#fef3c7', fg: '#92400e' },
  user: { bg: '#ccfbf1', fg: '#0f766e' },
  kitchen_operator: { bg: '#e0e7ff', fg: '#4338ca' },
};

function avatarFallback(name: string) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0F766E&color=fff`;
}

export function AdminResidentsView({ header }: AdminResidentsViewProps) {
  const directory = useAdminStore((s) => s.directory);
  const loading = useAdminStore((s) => s.directoryLoading);
  const error = useAdminStore((s) => s.directoryError);
  const fetchDirectory = useAdminStore((s) => s.fetchDirectory);

  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<DirectoryUser | null>(null);

  useEffect(() => {
    void fetchDirectory();
  }, [fetchDirectory]);

  useEffect(() => {
    const handle = setTimeout(() => {
      void fetchDirectory(search.trim() || undefined);
    }, 300);
    return () => clearTimeout(handle);
  }, [search, fetchDirectory]);

  const stats = useMemo(() => {
    const total = directory.length;
    const admins = directory.filter((u) => u.role === 'admin').length;
    const kitchen = directory.filter((u) => u.role === 'kitchen_operator').length;
    return {
      total,
      residents: total - admins - kitchen,
      admins,
      kitchen,
    };
  }, [directory]);

  return (
    <View style={styles.container}>
      <FlatList
        data={directory}
        keyExtractor={(u) => u.id}
        ListHeaderComponent={
          <View>
            {header}
            <View style={styles.statsRow}>
              <StatCard
                label="Residentes"
                value={String(stats.residents)}
                icon="users"
                tint="#0f766e"
                bg="#ccfbf1"
              />
              <StatCard
                label="Admins"
                value={String(stats.admins)}
                icon="shield"
                tint="#92400e"
                bg="#fef3c7"
              />
              <StatCard
                label="Cocina"
                value={String(stats.kitchen)}
                icon="coffee"
                tint="#4338ca"
                bg="#e0e7ff"
              />
            </View>

            <View style={styles.searchWrap}>
              <Feather name="search" size={18} color={COLORS.text.label} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar por nombre, email o unidad"
                placeholderTextColor={COLORS.text.label}
                value={search}
                onChangeText={setSearch}
                autoCorrect={false}
                autoCapitalize="none"
              />
              {search ? (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Feather name="x" size={18} color={COLORS.text.label} />
                </TouchableOpacity>
              ) : null}
            </View>

            <Text style={styles.listTitle}>
              Directorio · {directory.length} {directory.length === 1 ? 'persona' : 'personas'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <ResidentRow user={item} onPress={() => setSelected(item)} />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={loading && directory.length > 0}
            onRefresh={() => fetchDirectory(search.trim() || undefined)}
            tintColor={COLORS.brand.teal}
          />
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.statePad}>
              <ActivityIndicator color={COLORS.brand.teal} />
            </View>
          ) : error ? (
            <View style={styles.statePad}>
              <Text style={styles.stateTitle}>No pudimos cargar el directorio</Text>
              <Text style={styles.stateBody}>{error}</Text>
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={() => fetchDirectory(search.trim() || undefined)}
              >
                <Text style={styles.retryBtnText}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.statePad}>
              <Text style={styles.stateTitle}>
                {search.trim() ? 'Nadie coincide con tu búsqueda' : 'Aún no hay residentes'}
              </Text>
              <Text style={styles.stateBody}>
                {search.trim()
                  ? 'Prueba con otro nombre, email o unidad.'
                  : 'Cuando alguien se registre en tu residencia aparecerá aquí.'}
              </Text>
            </View>
          )
        }
      />

      <ResidentActionsSheet
        user={selected}
        onClose={() => setSelected(null)}
      />
    </View>
  );
}

function StatCard({
  label,
  value,
  icon,
  tint,
  bg,
}: {
  label: string;
  value: string;
  icon: keyof typeof Feather.glyphMap;
  tint: string;
  bg: string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: bg }]}>
        <Feather name={icon} size={16} color={tint} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );
}

function ResidentRow({
  user,
  onPress,
}: {
  user: DirectoryUser;
  onPress: () => void;
}) {
  const roleColor = ROLE_COLOR[user.role];
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <Image
        source={{ uri: user.avatar ?? avatarFallback(user.fullName) }}
        style={styles.avatar}
      />
      <View style={styles.rowBody}>
        <View style={styles.rowHeader}>
          <Text style={styles.rowName} numberOfLines={1}>
            {user.fullName}
          </Text>
          <View style={[styles.rolePill, { backgroundColor: roleColor.bg }]}>
            <Text style={[styles.rolePillText, { color: roleColor.fg }]}>
              {ROLE_LABEL[user.role]}
            </Text>
          </View>
        </View>
        <Text style={styles.rowEmail} numberOfLines={1}>
          {user.email}
        </Text>
        <View style={styles.rowMeta}>
          <Feather name="home" size={12} color={COLORS.text.label} />
          <Text style={styles.rowMetaText}>{user.unitNumber ?? 'Sin unidad'}</Text>
        </View>
      </View>
      <Feather name="chevron-right" size={20} color={COLORS.text.label} />
    </TouchableOpacity>
  );
}

function ResidentActionsSheet({
  user,
  onClose,
}: {
  user: DirectoryUser | null;
  onClose: () => void;
}) {
  const sendBroadcast = useAdminStore((s) => s.sendBroadcast);
  const broadcasting = useAdminStore((s) => s.broadcasting);
  const [composing, setComposing] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  useEffect(() => {
    if (!user) {
      setComposing(false);
      setTitle('');
      setBody('');
    }
  }, [user]);

  if (!user) return null;
  const roleColor = ROLE_COLOR[user.role];

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      Alert.alert('Datos faltantes', 'Necesitamos un título y un cuerpo.');
      return;
    }
    try {
      const res = await sendBroadcast({
        title: title.trim(),
        body: body.trim(),
        audience: 'user',
        userId: user.id,
      });
      Alert.alert('Listo', `Notificación enviada a ${res.sent} dispositivo(s).`);
      onClose();
    } catch (e: any) {
      Alert.alert('No se pudo enviar', e?.message ?? 'Intenta de nuevo.');
    }
  };

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalSheet}
      >
        <View style={styles.modalHandle} />

        <View style={styles.sheetHeader}>
          <Image
            source={{ uri: user.avatar ?? avatarFallback(user.fullName) }}
            style={styles.sheetAvatar}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.sheetName}>{user.fullName}</Text>
            <Text style={styles.sheetEmail}>{user.email}</Text>
            <View style={styles.sheetMetaRow}>
              <View style={[styles.rolePill, { backgroundColor: roleColor.bg }]}>
                <Text style={[styles.rolePillText, { color: roleColor.fg }]}>
                  {ROLE_LABEL[user.role]}
                </Text>
              </View>
              <Text style={styles.sheetMetaText}>
                <Feather name="home" size={12} color={COLORS.text.label} />{' '}
                {user.unitNumber ?? 'Sin unidad'}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Feather name="x" size={20} color={COLORS.text.primary} />
          </TouchableOpacity>
        </View>

        {composing ? (
          <View style={styles.composeBox}>
            <Text style={styles.composeTitle}>Notificar a {user.fullName.split(' ')[0]}</Text>
            <TextInput
              style={styles.composeTitleInput}
              placeholder="Título"
              placeholderTextColor={COLORS.text.label}
              value={title}
              onChangeText={setTitle}
              maxLength={80}
            />
            <TextInput
              style={styles.composeBodyInput}
              placeholder="Mensaje"
              placeholderTextColor={COLORS.text.label}
              value={body}
              onChangeText={setBody}
              multiline
              maxLength={300}
            />
            <View style={styles.composeActions}>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => setComposing(false)}
              >
                <Text style={styles.secondaryBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryBtn, broadcasting && { opacity: 0.6 }]}
                onPress={handleSend}
                disabled={broadcasting}
              >
                {broadcasting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryBtnText}>Enviar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.actionList}>
            <ActionButton
              icon="bell"
              label="Enviar notificación push"
              description="Push individual a este usuario"
              onPress={() => setComposing(true)}
            />
            <ActionButton
              icon="mail"
              label="Copiar correo"
              description={user.email}
              onPress={() => {
                Alert.alert('Correo', user.email);
              }}
            />
          </View>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

function ActionButton({
  icon,
  label,
  description,
  onPress,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.actionBtn} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.actionIcon}>
        <Feather name={icon} size={18} color={COLORS.brand.tealDark} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.actionLabel}>{label}</Text>
        <Text style={styles.actionDescription} numberOfLines={1}>
          {description}
        </Text>
      </View>
      <Feather name="chevron-right" size={18} color={COLORS.text.label} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { paddingHorizontal: 20, paddingBottom: 32 },

  statsRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: COLORS.light.card,
    borderWidth: 1,
    borderColor: COLORS.light.border,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: { fontSize: 18, fontWeight: '700', color: COLORS.text.primary },
  statLabel: { fontSize: 11, color: COLORS.text.label, fontWeight: '500' },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.light.card,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: COLORS.light.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text.primary,
    padding: 0,
  },

  listTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text.label,
    marginTop: 18,
    marginBottom: 8,
    paddingHorizontal: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: COLORS.light.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.light.border,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#e2e8f0',
  },
  rowBody: { flex: 1, gap: 4 },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  rowName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  rowEmail: {
    fontSize: 13,
    color: COLORS.text.secondary,
  },
  rowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rowMetaText: { fontSize: 12, color: COLORS.text.label, fontWeight: '500' },

  rolePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  rolePillText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  separator: { height: 10 },

  statePad: {
    paddingHorizontal: 24,
    paddingVertical: 48,
    alignItems: 'center',
    gap: 8,
  },
  stateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary,
    textAlign: 'center',
  },
  stateBody: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.brand.tealDark,
  },
  retryBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },

  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  modalSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.ui.lightSheet,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 8,
    gap: 16,
  },
  modalHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#cbd5e1',
    marginBottom: 8,
  },

  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  sheetAvatar: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#e2e8f0',
  },
  sheetName: { fontSize: 17, fontWeight: '700', color: COLORS.text.primary },
  sheetEmail: { fontSize: 13, color: COLORS.text.secondary, marginTop: 2 },
  sheetMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  sheetMetaText: { fontSize: 12, color: COLORS.text.label, fontWeight: '500' },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.light.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.light.border,
  },

  actionList: { gap: 10 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: COLORS.light.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.light.border,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#ccfbf1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: { fontSize: 15, fontWeight: '600', color: COLORS.text.primary },
  actionDescription: { fontSize: 12, color: COLORS.text.label, marginTop: 2 },

  composeBox: {
    backgroundColor: COLORS.light.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.light.border,
    gap: 12,
  },
  composeTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text.primary },
  composeTitleInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.text.primary,
    borderWidth: 1,
    borderColor: COLORS.light.border,
  },
  composeBodyInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.text.primary,
    borderWidth: 1,
    borderColor: COLORS.light.border,
    minHeight: 96,
    textAlignVertical: 'top',
  },
  composeActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  secondaryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.light.card,
    borderWidth: 1,
    borderColor: COLORS.light.border,
  },
  secondaryBtnText: { color: COLORS.text.primary, fontWeight: '600', fontSize: 14 },
  primaryBtn: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.brand.tealDark,
    minWidth: 100,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
