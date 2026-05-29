import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';
import {
  UploadKind,
  UploadMime,
  uploadsService,
} from '@/services/uploads.service';

interface ImageUploaderProps {
  /** URL ya guardada (si existe). El componente la muestra como preview. */
  value?: string;
  /** Llamado con la URL pública final una vez completado el upload. */
  onChange: (publicUrl: string | null) => void;
  /** Determina la "carpeta" del archivo en R2 (amenity/product/avatar/post). */
  kind: UploadKind;
  /** Variante visual: card (rectángulo grande) o avatar (círculo pequeño). */
  variant?: 'card' | 'avatar';
  /** Override del aspect ratio del card (default 16:9). */
  aspectRatio?: number;
  label?: string;
}

const MAX_BYTES = 5 * 1024 * 1024;

function inferMime(uri: string): UploadMime | null {
  const ext = uri.split('?')[0].split('.').pop()?.toLowerCase();
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  return null;
}

export function ImageUploader({
  value,
  onChange,
  kind,
  variant = 'card',
  aspectRatio,
  label,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const pickAndUpload = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        'Sin permisos',
        'Necesitamos acceso a tu galería para subir la foto.',
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: variant === 'avatar' ? [1, 1] : [16, 9],
      quality: 0.85,
    });
    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];
    const fileSize = asset.fileSize ?? 0;
    if (fileSize > MAX_BYTES) {
      Alert.alert(
        'Imagen muy grande',
        `Máximo ${(MAX_BYTES / 1024 / 1024).toFixed(0)} MB. Esta pesa ${(
          fileSize / 1024 / 1024
        ).toFixed(1)} MB.`,
      );
      return;
    }
    const mime = (asset.mimeType as UploadMime) ?? inferMime(asset.uri);
    if (!mime) {
      Alert.alert(
        'Formato no soportado',
        'Usa JPG, PNG o WebP.',
      );
      return;
    }

    setLocalPreview(asset.uri);
    setUploading(true);
    setProgress(0);
    try {
      const signed = await uploadsService.sign({
        kind,
        contentType: mime,
        contentLength: fileSize || 1,
      });
      const publicUrl = await uploadsService.uploadDirect(
        asset.uri,
        signed,
        (pct) => setProgress(pct),
      );
      onChange(publicUrl);
      // Una vez que el value externo se actualice, podemos limpiar el local.
      setLocalPreview(null);
    } catch (e: any) {
      setLocalPreview(null);
      Alert.alert(
        'No pudimos subir la imagen',
        e?.message ?? 'Intenta de nuevo en un momento.',
      );
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const clear = () => {
    Alert.alert('Quitar imagen', '¿Seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Quitar',
        style: 'destructive',
        onPress: () => onChange(null),
      },
    ]);
  };

  const previewSrc = localPreview ?? value ?? null;
  const hasImage = !!previewSrc;

  if (variant === 'avatar') {
    return (
      <View style={styles.avatarWrap}>
        <Pressable
          onPress={pickAndUpload}
          disabled={uploading}
          style={styles.avatarBox}
        >
          {hasImage ? (
            <Image source={{ uri: previewSrc! }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarEmpty}>
              <Feather name="camera" size={22} color={COLORS.text.label} />
            </View>
          )}
          {uploading ? (
            <View style={styles.overlay}>
              <ActivityIndicator color="#fff" />
              <Text style={styles.overlayText}>{progress || 0}%</Text>
            </View>
          ) : null}
          <View style={styles.editBadge}>
            <Feather name="edit-2" size={12} color="#fff" />
          </View>
        </Pressable>
        {hasImage && !uploading ? (
          <TouchableOpacity onPress={clear} style={styles.clearLink}>
            <Text style={styles.clearLinkText}>Quitar foto</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.cardWrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Pressable
        onPress={pickAndUpload}
        disabled={uploading}
        style={[
          styles.card,
          { aspectRatio: aspectRatio ?? 16 / 9 },
          hasImage && styles.cardWithImage,
        ]}
      >
        {hasImage ? (
          <Image source={{ uri: previewSrc! }} style={styles.cardImage} />
        ) : (
          <View style={styles.cardEmpty}>
            <Feather name="image" size={26} color={COLORS.text.label} />
            <Text style={styles.cardEmptyTitle}>Toca para subir</Text>
            <Text style={styles.cardEmptyHint}>JPG · PNG · WebP · ≤ 5 MB</Text>
          </View>
        )}
        {uploading ? (
          <View style={styles.overlay}>
            <ActivityIndicator color="#fff" size="large" />
            <Text style={styles.overlayText}>Subiendo {progress || 0}%</Text>
          </View>
        ) : null}
      </Pressable>
      {hasImage && !uploading ? (
        <View style={styles.actions}>
          <TouchableOpacity onPress={pickAndUpload} style={styles.actionBtn}>
            <Feather name="refresh-cw" size={14} color={COLORS.brand.tealDark} />
            <Text style={styles.actionBtnText}>Cambiar</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={clear} style={styles.actionBtnDanger}>
            <Feather name="trash-2" size={14} color="#dc2626" />
            <Text style={styles.actionBtnDangerText}>Quitar</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  cardWrap: { gap: 8 },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text.label,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    borderRadius: 16,
    backgroundColor: COLORS.light.card,
    borderWidth: 1,
    borderColor: COLORS.light.border,
    borderStyle: 'dashed',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardWithImage: { borderStyle: 'solid' },
  cardImage: { width: '100%', height: '100%' },
  cardEmpty: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
  },
  cardEmptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  cardEmptyHint: {
    fontSize: 11,
    color: COLORS.text.label,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  overlayText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#ccfbf1',
    borderWidth: 1,
    borderColor: COLORS.brand.tealDark,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.brand.tealDark,
  },
  actionBtnDanger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  actionBtnDangerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#dc2626',
  },

  // ---- Avatar variant ----
  avatarWrap: { alignItems: 'center', gap: 6 },
  avatarBox: { position: 'relative' },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#e2e8f0',
  },
  avatarEmpty: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.light.card,
    borderWidth: 2,
    borderColor: COLORS.light.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.brand.tealDark,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  clearLink: { paddingVertical: 4 },
  clearLinkText: {
    fontSize: 12,
    color: '#dc2626',
    fontWeight: '600',
  },
});
