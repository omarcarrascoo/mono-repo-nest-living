import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { CommunityReply } from '@/types/api';
import { COLORS } from '@/constants/theme';
import { formatRelative } from '@/lib/datetime';
import { AuthorBadge } from './AuthorBadge';
import { ReactionBar } from './ReactionBar';

interface ReplyItemProps {
  reply: CommunityReply;
  children: CommunityReply[];
  childMap: Map<string, CommunityReply[]>;
  currentUserId?: string;
  isAdmin: boolean;
  onReact: (replyId: string, emoji: string) => void;
  onReply: (parent: CommunityReply) => void;
  onDelete: (reply: CommunityReply) => void;
  /** Max nesting (0,1,2). When at MAX_DEPTH, hide the "Responder" CTA. */
  maxDepth: number;
}

export const ReplyItem: React.FC<ReplyItemProps> = ({
  reply,
  children,
  childMap,
  currentUserId,
  isAdmin,
  onReact,
  onReply,
  onDelete,
  maxDepth,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const isOwner = !!currentUserId && reply.author.id === currentUserId;
  const canReply = reply.depth < maxDepth;
  const canDelete = isOwner || isAdmin;

  const created = reply.createdAt ? new Date(reply.createdAt) : null;
  const subtitle = created ? formatRelative(created) : undefined;

  return (
    <View style={[styles.row, reply.depth > 0 && styles.rowNested]}>
      <View style={styles.head}>
        <AuthorBadge author={reply.author} subtitle={subtitle} size="sm" />
        {canDelete ? (
          <TouchableOpacity
            onPress={() => setMenuOpen((v) => !v)}
            style={styles.menuBtn}
            hitSlop={8}
          >
            <Feather
              name="more-horizontal"
              size={16}
              color={COLORS.text.label}
            />
          </TouchableOpacity>
        ) : null}
      </View>

      {menuOpen && canDelete ? (
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {
            setMenuOpen(false);
            onDelete(reply);
          }}
        >
          <Feather name="trash-2" size={14} color={COLORS.status.error} />
          <Text style={styles.menuItemText}>Eliminar</Text>
        </TouchableOpacity>
      ) : null}

      <Text style={styles.body}>{reply.content}</Text>

      <View style={styles.actions}>
        <ReactionBar
          reactions={reply.reactions}
          myReaction={reply.myReaction}
          onToggle={(e) => onReact(reply.id, e)}
          compact
        />
        {canReply ? (
          <TouchableOpacity
            style={styles.replyBtn}
            onPress={() => onReply(reply)}
            activeOpacity={0.85}
          >
            <Feather
              name="corner-down-right"
              size={12}
              color={COLORS.brand.tealDark}
            />
            <Text style={styles.replyBtnText}>Responder</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {children.length > 0 ? (
        <View style={styles.children}>
          {children.map((c) => (
            <ReplyItem
              key={c.id}
              reply={c}
              children={childMap.get(c.id) ?? []}
              childMap={childMap}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              onReact={onReact}
              onReply={onReply}
              onDelete={onDelete}
              maxDepth={maxDepth}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light.border,
  },
  rowNested: {
    paddingLeft: 16,
    borderLeftWidth: 2,
    borderLeftColor: COLORS.light.border,
    marginLeft: 4,
    marginTop: 4,
    borderBottomWidth: 0,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuBtn: { padding: 4 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    alignSelf: 'flex-end',
    borderRadius: 8,
    backgroundColor: '#fef2f2',
    marginTop: 6,
  },
  menuItemText: { color: COLORS.status.error, fontWeight: '700', fontSize: 12 },
  body: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.text.primary,
    marginTop: 8,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    flexWrap: 'wrap',
    gap: 8,
  },
  replyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  replyBtnText: {
    color: COLORS.brand.tealDark,
    fontSize: 12,
    fontWeight: '800',
  },
  children: {
    marginTop: 8,
    marginLeft: 12,
  },
});
