import React from 'react';
import { ImageBackground, StyleSheet, View, Platform } from 'react-native';

const BG_IMAGE = require('../assets/images/fond_duelo.webp');

export default function CosmicBackground({ children }: { children: React.ReactNode }) {
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
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
});
