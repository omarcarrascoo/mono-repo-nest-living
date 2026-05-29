import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Avatar } from '@/components/ui/Avatar';
import { COLORS } from '@/constants/theme';
import { useAdminStore } from '@/stores/admin-store';
import { ClubMember, Role } from '@/types/api';

interface AdminResidentsViewProps {
  /** Render at the top inside the sheet, above the search bar. */
  header?: React.ReactNode;
  /** Animated value for parallax effect on the parent sheet. Optional. */
  scrollY?: Animated.Value;
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

const ROLE_CHIPS: { value: Role; label: string }[] = [
  { value: 'user', label: 'Residente' },
  { value: 'admin', label: 'Admin' },
  { value: 'kitchen_operator', label: 'Cocina' },
];

const AnimatedFlatList = Animated.createAnimatedComponent(
  // FlatList type is fine but this avoids importing the type directly
  require('react-native').FlatList,
);

type Tab = 'directory' | 'pending';

export function AdminResidentsView({ header, scrollY }: AdminResidentsViewProps) {
  const directory = useAdminStore((s) => s.directory);
  const loading = useAdminStore((s) => s.directoryLoading);
  const error = useAdminStore((s) => s.directoryError);
  const fetchDirectory = useAdminStore((s) => s.fetchDirectory);

  const pendingMembers = useAdminStore((s) => s.pendingMembers);
  const pendingLoading = useAdminStore((s) => s.pendingLoading);
  const pendingError = useAdminStore((s) => s.pendingError);
  const pendingActionInFlight = useAdminStore((s) => s.pendingActionInFlight);
  const fetchPendingMembers = useAdminStore((s) => s.fetchPendingMembers);
  const approvePendingMember = useAdminStore((s) => s.approvePendingMember);
  const rejectPendingMember = useAdminStore((s) => s.rejectPendingMember);

  const [tab, setTab] = useState<Tab>('directory');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<ClubMember | null>(null);

  const fallbackScrollY = useRef(new Animated.Value(0)).current;
  const scroll = scrollY ?? fallbackScrollY;

  useEffect(() => {
    void fetchDirectory();
    void fetchPendingMembers();
  }, [fetchDirectory, fetchPendingMembers]);

  useEffect(() => {
    if (tab !== 'directory') return;
    const handle = setTimeout(() => {
      void fetchDirectory(search.trim() || undefined);
    }, 300);
    return () => clearTimeout(handle);
  }, [search, fetchDirectory, tab]);

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

  const handleApprove = (m: ClubMember) => {
    Alert.alert(
      'Aceptar al club',
      `¿Aceptar a ${m.fullName} en el club?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aceptar',
          onPress: async () => {
            try {
              await approvePendingMember(m.membershipId);
            } catch (e: any) {
              Alert.alert('Error', e?.message ?? 'No se pudo aceptar.');
            }
          },
        },
      ],
    );
  };

  const handleReject = (m: ClubMember) => {
    Alert.alert(
      'Rechazar solicitud',
      `Esto rechaza la solicitud de ${m.fullName}. Podrá volver a pedir acceso después.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Rechazar',
          style: 'destructive',
          onPress: async () => {
            try {
              await rejectPendingMember(m.membershipId);
            } catch (e: any) {
              Alert.alert('Error', e?.message ?? 'No se pudo rechazar.');
            }
          },
        },
      ],
    );
  };

  const renderHeader = () => (
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
          label="Pendientes"
          value={String(pendingMembers.length)}
          icon="user-plus"
          tint="#c2410c"
          bg="#ffedd5"
        />
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'directory' && styles.tabBtnActive]}
          onPress={() => setTab('directory')}
          activeOpacity={0.85}
        >
          <Text
            style={[styles.tabText, tab === 'directory' && styles.tabTextActive]}
          >
            Directorio
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'pending' && styles.tabBtnActive]}
          onPress={() => setTab('pending')}
          activeOpacity={0.85}
        >
          <Text
            style={[styles.tabText, tab === 'pending' && styles.tabTextActive]}
          >
            Solicitudes
          </Text>
          {pendingMembers.length > 0 ? (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{pendingMembers.length}</Text>
            </View>
          ) : null}
        </TouchableOpacity>
      </View>

      {tab === 'directory' ? (
        <>
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
            Directorio · {directory.length}{' '}
            {directory.length === 1 ? 'persona' : 'personas'}
          </Text>
        </>
      ) : (
        <Text style={styles.listTitle}>
          Solicitudes pendientes · {pendingMembers.length}
        </Text>
      )}
    </View>
  );

  if (tab === 'pending') {
    return (
      <View style={styles.container}>
        <AnimatedFlatList
          data={pendingMembers}
          keyExtractor={(u: ClubMember) => u.membershipId}
          ListHeaderComponent={renderHeader()}
          renderItem={({ item }: { item: ClubMember }) => (
            <PendingRow
              user={item}
              busy={!!pendingActionInFlight[item.membershipId]}
              onApprove={() => handleApprove(item)}
              onReject={() => handleReject(item)}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.listContent}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scroll } } }],
            { useNativeDriver: false },
          )}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={pendingLoading && pendingMembers.length > 0}
              onRefresh={() => fetchPendingMembers()}
              tintColor={COLORS.brand.teal}
            />
          }
          ListEmptyComponent={
            pendingLoading ? (
              <View style={styles.statePad}>
                <ActivityIndicator color={COLORS.brand.teal} />
              </View>
            ) : pendingError ? (
              <View style={styles.statePad}>
                <Text style={styles.stateTitle}>
                  No pudimos cargar las solicitudes
                </Text>
                <Text style={styles.stateBody}>{pendingError}</Text>
                <TouchableOpacity
                  style={styles.retryBtn}
                  onPress={() => fetchPendingMembers()}
                >
                  <Text style={styles.retryBtnText}>Reintentar</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.statePad}>
                <Text style={styles.stateTitle}>Sin solicitudes pendientes</Text>
                <Text style={styles.stateBody}>
                  Cuando alguien pida unirse aparecerá aquí.
                </Text>
              </View>
            )
          }
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AnimatedFlatList
        data={directory}
        keyExtractor={(u: ClubMember) => u.id}
        ListHeaderComponent={renderHeader()}
        renderItem={({ item }: { item: ClubMember }) => (
          <ResidentRow user={item} onPress={() => setSelected(item)} />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scroll } } }],
          { useNativeDriver: false },
        )}
        scrollEventThrottle={16}
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

function PendingRow({
  user,
  busy,
  onApprove,
  onReject,
}: {
  user: ClubMember;
  busy: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <View style={styles.pendingRow}>
      <Avatar
        uri={user.avatar}
        name={user.fullName}
        size={48}
        rounded={16}
      />
      <View style={styles.rowBody}>
        <Text style={styles.rowName} numberOfLines={1}>
          {user.fullName}
        </Text>
        <Text style={styles.rowEmail} numberOfLines={1}>
          {user.email}
        </Text>
        {user.unitNumber ? (
          <View style={styles.rowMeta}>
            <Feather name="home" size={12} color={COLORS.text.label} />
            <Text style={styles.rowMetaText}>{user.unitNumber}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.pendingActions}>
        <TouchableOpacity
          onPress={onReject}
          disabled={busy}
          style={[styles.rejectBtn, busy && { opacity: 0.5 }]}
          activeOpacity={0.85}
          hitSlop={6}
        >
          <Feather name="x" size={18} color="#dc2626" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onApprove}
          disabled={busy}
          style={[styles.approveBtn, busy && { opacity: 0.6 }]}
          activeOpacity={0.85}
          hitSlop={6}
        >
          {busy ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Feather name="check" size={16} color="#fff" />
              <Text style={styles.approveBtnText}>Aceptar</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
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
  user: ClubMember;
  onPress: () => void;
}) {
  const roleColor = ROLE_COLOR[user.role];
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <Avatar
        uri={user.avatar}
        name={user.fullName}
        size={48}
        rounded={16}
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

type SheetMode = 'menu' | 'compose' | 'edit';

function ResidentActionsSheet({
  user,
  onClose,
}: {
  user: ClubMember | null;
  onClose: () => void;
}) {
  const sendBroadcast = useAdminStore((s) => s.sendBroadcast);
  const broadcasting = useAdminStore((s) => s.broadcasting);
  const updateDirectoryUser = useAdminStore((s) => s.updateDirectoryUser);
  const deleteDirectoryUser = useAdminStore((s) => s.deleteDirectoryUser);

  const [mode, setMode] = useState<SheetMode>('menu');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const [editName, setEditName] = useState('');
  const [editUnit, setEditUnit] = useState('');
  const [editRole, setEditRole] = useState<Role>('user');
  const [editAvatar, setEditAvatar] = useState('');
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    if (!user) {
      setMode('menu');
      setTitle('');
      setBody('');
      setSaving(false);
      setRemoving(false);
      return;
    }
    setEditName(user.fullName ?? '');
    setEditUnit(user.unitNumber ?? '');
    setEditRole(user.role);
    setEditAvatar(user.avatar ?? '');
  }, [user]);

  if (!user) return null;
  const roleColor = ROLE_COLOR[user.role];

  const handleSendNotification = async () => {
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

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      await updateDirectoryUser(user.membershipId, {
        role: editRole,
        unitNumber: editUnit.trim() ? editUnit.trim() : null,
      });
      Alert.alert('Listo', 'Cambios guardados.');
      onClose();
    } catch (e: any) {
      Alert.alert('No se pudo guardar', e?.message ?? 'Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar miembro',
      `Esto removerá a ${user.fullName} del club. Su cuenta sigue existiendo pero pierde el acceso. Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, eliminar',
          style: 'destructive',
          onPress: async () => {
            setRemoving(true);
            try {
              await deleteDirectoryUser(user.membershipId);
              onClose();
            } catch (e: any) {
              Alert.alert('Error', e?.message ?? 'No se pudo eliminar.');
              setRemoving(false);
            }
          },
        },
      ],
    );
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
          <Avatar
            uri={user.avatar}
            name={user.fullName}
            size={56}
            rounded={18}
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
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={8}>
            <Feather name="x" size={20} color={COLORS.text.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.sheetScroll}
          contentContainerStyle={styles.sheetScrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {mode === 'compose' ? (
            <View style={styles.composeBox}>
              <Text style={styles.composeTitle}>
                Notificar a {user.fullName.split(' ')[0]}
              </Text>
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
                  onPress={() => setMode('menu')}
                  disabled={broadcasting}
                >
                  <Text style={styles.secondaryBtnText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.primaryBtn, broadcasting && { opacity: 0.6 }]}
                  onPress={handleSendNotification}
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
          ) : mode === 'edit' ? (
            <View style={styles.composeBox}>
              <Text style={styles.composeTitle}>Editar residente</Text>

              <Text style={styles.fieldLabel}>Nombre</Text>
              <TextInput
                style={styles.composeTitleInput}
                placeholder="Nombre completo"
                placeholderTextColor={COLORS.text.label}
                value={editName}
                onChangeText={setEditName}
                maxLength={120}
              />

              <Text style={styles.fieldLabel}>Unidad</Text>
              <TextInput
                style={styles.composeTitleInput}
                placeholder="Ej. A-204 (opcional)"
                placeholderTextColor={COLORS.text.label}
                value={editUnit}
                onChangeText={setEditUnit}
                maxLength={40}
                autoCapitalize="characters"
              />

              <Text style={styles.fieldLabel}>Avatar (URL)</Text>
              <TextInput
                style={styles.composeTitleInput}
                placeholder="https://… (opcional)"
                placeholderTextColor={COLORS.text.label}
                value={editAvatar}
                onChangeText={setEditAvatar}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <Text style={styles.fieldLabel}>Rol</Text>
              <View style={styles.chipRow}>
                {ROLE_CHIPS.map((opt) => {
                  const active = editRole === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      onPress={() => setEditRole(opt.value)}
                      style={[styles.chip, active && styles.chipActive]}
                      activeOpacity={0.85}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.composeActions}>
                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={() => setMode('menu')}
                  disabled={saving}
                >
                  <Text style={styles.secondaryBtnText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.primaryBtn, saving && { opacity: 0.6 }]}
                  onPress={handleSaveEdit}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.primaryBtnText}>Guardar</Text>
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
                onPress={() => setMode('compose')}
              />
              <ActionButton
                icon="edit-3"
                label="Editar datos"
                description="Nombre, rol, unidad y avatar"
                onPress={() => setMode('edit')}
              />
              <ActionButton
                icon="mail"
                label="Copiar correo"
                description={user.email}
                onPress={() => {
                  Alert.alert('Correo', user.email);
                }}
              />
              <TouchableOpacity
                style={[styles.dangerBtn, removing && { opacity: 0.6 }]}
                onPress={handleDelete}
                disabled={removing}
                activeOpacity={0.85}
              >
                {removing ? (
                  <ActivityIndicator color="#dc2626" />
                ) : (
                  <>
                    <Feather name="trash-2" size={16} color="#dc2626" />
                    <Text style={styles.dangerBtnText}>Eliminar usuario</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
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
  listContent: { paddingHorizontal: 20, paddingBottom: 160 },

  tabRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 18,
    backgroundColor: COLORS.light.card,
    padding: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.light.border,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  tabBtnActive: {
    backgroundColor: COLORS.brand.tealDark,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text.label,
  },
  tabTextActive: {
    color: '#fff',
  },
  tabBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    backgroundColor: '#f97316',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },

  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: COLORS.light.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  pendingActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rejectBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.brand.tealDark,
  },
  approveBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },

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
    paddingTop: 8,
    maxHeight: '88%',
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
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light.border,
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

  sheetScroll: { flexGrow: 0 },
  sheetScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 16,
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

  dangerBtn: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  dangerBtnText: { color: '#dc2626', fontWeight: '800', fontSize: 14 },

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
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.text.label,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: COLORS.light.border,
  },
  chipActive: {
    backgroundColor: COLORS.brand.tealDark,
    borderColor: COLORS.brand.tealDark,
  },
  chipText: { fontSize: 13, fontWeight: '600', color: COLORS.text.primary },
  chipTextActive: { color: '#fff' },

  composeActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 4,
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
