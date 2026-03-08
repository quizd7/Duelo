import { Platform, StyleSheet } from 'react-native';

// ── Néon-Cristal Design Tokens ──
export const NEON = {
  cyan: '#00FFFF',
  purple: '#8A2BE2',
  pink: '#FF00FF',
  gold: '#FFD700',
  green: '#00FF9D',
};

export const GLASS = {
  // Glass panel background
  bg: 'rgba(8, 8, 24, 0.65)',
  bgDark: 'rgba(5, 5, 18, 0.75)',
  bgLight: 'rgba(15, 15, 40, 0.55)',

  // Neon borders
  borderCyan: 'rgba(0, 255, 255, 0.25)',
  borderPurple: 'rgba(138, 43, 226, 0.35)',
  borderBright: 'rgba(0, 255, 255, 0.45)',
  borderSubtle: 'rgba(100, 100, 255, 0.15)',

  // Uniform border radius
  radius: 16,
  radiusLg: 20,
  radiusSm: 12,

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  textMuted: 'rgba(255, 255, 255, 0.45)',
};

// ── Glass Panel Styles (reusable) ──
export const glassPanel = StyleSheet.create({
  container: {
    backgroundColor: GLASS.bg,
    borderRadius: GLASS.radius,
    borderWidth: 1,
    borderColor: GLASS.borderCyan,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      } as any,
      default: {},
    }),
  },
  containerBright: {
    backgroundColor: GLASS.bg,
    borderRadius: GLASS.radius,
    borderWidth: 1.5,
    borderColor: GLASS.borderBright,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      } as any,
      default: {},
    }),
  },
  containerSubtle: {
    backgroundColor: GLASS.bgLight,
    borderRadius: GLASS.radius,
    borderWidth: 1,
    borderColor: GLASS.borderSubtle,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      } as any,
      default: {},
    }),
  },
});

// ── Header / Footer glass bar style ──
export const glassBar = StyleSheet.create({
  header: {
    backgroundColor: GLASS.bgDark,
    borderBottomWidth: 1,
    borderBottomColor: GLASS.borderCyan,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      } as any,
      default: {},
    }),
  },
  footer: {
    backgroundColor: GLASS.bgDark,
    borderTopWidth: 1,
    borderTopColor: GLASS.borderCyan,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      } as any,
      default: {},
    }),
  },
});

// ── Modal glass overlay ──
export const glassModal = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      } as any,
      default: {},
    }),
  },
  content: {
    backgroundColor: GLASS.bgDark,
    borderRadius: GLASS.radiusLg,
    borderWidth: 1.5,
    borderColor: GLASS.borderCyan,
    padding: 24,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
      } as any,
      default: {},
    }),
  },
});
