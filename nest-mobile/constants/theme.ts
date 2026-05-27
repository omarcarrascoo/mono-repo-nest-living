/**
 * Theme configuration
 * Updated to remove blue tones and enforce an Earth/Forest Green aesthetic.
 */

import { Platform, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const DIMENSIONS = {
  width,
  height,
};

export const THEME = {
  spacing: {
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
  },
  shadows: {
    default: {
      shadowColor: '#1a2e26', // Sombra verdosa oscura
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    card: {
      shadowColor: '#2dd4bf', 
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.2,
      shadowRadius: 20,
      elevation: 8,
    }
  }
};

export const COLORS = {
  background: {
    base: '#242f36ff', // Tu base original (Sage Green)
    dark: '#111a20ff',   // Verde muy oscuro para estados deshabilitados
    
    // EL CAMBIO CLAVE: De Azul-Gris a Verde-Bosque Transparente
    glass: 'rgba(20, 28, 40, 0.45)', 
    glassActive: 'rgba(45, 212, 191, 0.08)',
  },
  text: {
    title: '#f1f8f6',     // Blanco roto verdoso
    subtitle: '#bccbc6',  // Gris piedra (antes era azulado)
    label: '#8da399',     // Verde grisáceo para etiquetas
    input: '#e2e8f0',
    placeholder: '#6e8582', // Gris verdoso oscuro
    inverse: '#ffffff',
    primary: '#192a37ff',
    secondary: '#5c706a',
    muted: '#8da399',
    light: '#d1fae5',     // Texto claro con tinte menta
  },
  brand: {
    teal: '#2dd4bf',
    tealDark: '#0f766e',
    cyan: '#155e75', // Oscurecido para no resaltar en azul brillante
  },
  border: {
    subtle: 'rgba(255, 255, 255, 0.1)', // Un poco más visible
    light: '#cbd5e1',
  },
  status: {
    error: '#f87171',
    success: '#34d399',
    warning: '#fbbf24',
    info: '#38bdf8',
  },
  light: {
    background: '#ffffff',
    backgroundSecondary: '#ffffffff', // Fondo muy claro con tinte teal (Mint 50)
    textPrimary: '#0f172a',
    textSecondary: '#64748b',
    border: '#e2e8f0',
    card: '#ffffff',
  },
  ui: { 
    lightSheet: '#F8FAFC', 
    white: '#ffffff', 
    glass: 'rgba(255,255,255,0.08)' 
  },
  promotions: {
    pillBg: '#ccfbf1',
    pillText: '#0f766e',
    badgeSuccessBg: '#ecfdf5',
    badgeSuccessBorder: '#d1fae5',
    overlayDark: 'rgba(0,0,0,0.8)',
    overlayGlass: 'rgba(255,255,255,0.2)',
    overlayBorder: 'rgba(255,255,255,0.3)',
  }
};




export const GRADIENTS = {
  // Orb Superior: Verde Lima / Menta (Luz)
  blueOrb: ['#4ade80', '#10b981', 'transparent'] as const, 
  
  // Orb Inferior: Verde Bosque Profundo (Sombra)
  greenOrb: ['#115e59', '#042f2e', 'transparent'] as const, 
  
  // Overlay: Transición suave de tu color base a casi negro-verde
  overlay: ['rgba(71, 105, 104, 0.6)', 'rgba(12, 28, 24, 0.95)'] as const, 
  
  buttonPrimary: ['#1b7b8cff', '#0f766e'] as const,
  buttonDisabled: ['#2d403d', '#2d403d'] as const,
  bottomFade: ['transparent', 'rgba(0,0,0,0.8)'] as const,
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});