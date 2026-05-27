import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { FeedPostData } from '../../types/feed';
import { COLORS } from '@/constants/theme';

interface FeedPostCardProps {
  item: FeedPostData;
  onPress?: () => void;
  onLike?: () => void;
  onReply?: () => void;
}

export const FeedPostCard: React.FC<FeedPostCardProps> = ({ item, onLike, onReply }) => {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image source={{ uri: item.author.avatar }} style={styles.avatar} />
        <View>
          <Text style={styles.name}>{item.author.name}</Text>
          <Text style={styles.handle}>{item.author.handle}</Text>
        </View>
        <TouchableOpacity style={{ marginLeft: 'auto' }}>
          <Feather name="more-horizontal" size={20} color={COLORS.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.tagPill}>
        <Text style={styles.tagText}>{item.tag}</Text>
      </View>

      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.body}>{item.content}</Text>
      <Text style={styles.time}>{item.time}</Text>

      {/* Reactions Info */}
      <View style={styles.reactionRow}>
        <Text style={styles.statsText}>{item.likes} likes</Text>
        <Text style={styles.dot}>·</Text>
        <Text style={styles.statsText}>{item.replies} respuestas</Text>
      </View>

      {/* Actions */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={onLike}>
          <Feather name="thumbs-up" size={16} color={COLORS.ui.white} />
          <Text style={styles.actionBtnText}>Me gusta</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={onReply}>
          <Feather name="message-square" size={16} color={COLORS.ui.white} />
          <Text style={styles.actionBtnText}>Responder</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.divider} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { paddingHorizontal: 24, marginBottom: 10 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  name: { fontSize: 16, fontWeight: '700', color: COLORS.text.primary },
  handle: { fontSize: 13, color: COLORS.text.secondary },
  tagPill: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border.subtle, marginBottom: 12 },
  tagText: { fontSize: 12, fontWeight: '600', color: COLORS.text.primary },
  title: { fontSize: 18, fontWeight: '800', color: COLORS.text.primary, marginBottom: 8, lineHeight: 24 },
  body: { fontSize: 16, color: '#484848', lineHeight: 24, marginBottom: 12 },
  time: { fontSize: 13, color: COLORS.text.secondary, marginBottom: 16 },
  reactionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  reactionIcons: { flexDirection: 'row', marginRight: 8 },
  bubble: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#FFF', shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 1 },
  statsText: { fontSize: 13, color: COLORS.text.primary },
  dot: { marginHorizontal: 6, color: COLORS.text.secondary },
  actionRow: { flexDirection: 'row', gap: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.background.base, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  actionBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.ui.white },
  divider: { height: 1, backgroundColor: '#EBEBEB', marginTop: 24 },
});