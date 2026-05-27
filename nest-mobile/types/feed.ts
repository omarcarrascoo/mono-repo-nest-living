// src/types/feed.ts

export interface UserAuthor {
  name: string;
  avatar: string;
  handle?: string; // Ejemplo: @sienna · Level 2
  role?: string;   // Ejemplo: Community Manager
}

export interface FeaturedPostData {
  id: string;
  author: UserAuthor;
  badgeIcon: string; // Nombre del icono Feather
  title: string;
  preview: string;
  image: string; // Background image (no usada en el diseño actual pero preparada)
}

export interface FeedPostData {
  id: string;
  author: UserAuthor;
  tag: string;
  title: string;
  content: string;
  time: string;
  likes: number;
  replies: number;
  reactions: string[]; // ['❤️', '👍']
}