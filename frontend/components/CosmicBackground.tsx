import React from 'react';
import { ImageBackground, StyleSheet, View, Platform } from 'react-native';

const BG_IMAGE = require('../assets/images/fond_duelo.webp');

export default function CosmicBackground({ children }: { children: React.ReactNode }) {
  // On web, CSS body background handles the cosmic image
  if (Platform.OS === 'web') {
    return (
      <View style={styles.webBg}>
        {children}
      </View>
    );
  }

  // On native, use ImageBackground
  return (
    <ImageBackground
      source={BG_IMAGE}
      style={styles.bg}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      {children}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
  },
  webBg: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
});
