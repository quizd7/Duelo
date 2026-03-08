import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Platform } from 'react-native';
import { useEffect } from 'react';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

function useCosmicBackground() {
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const bgUrl = `${API_URL}/api/static/fond_duelo.webp`;
    const style = document.createElement('style');
    style.id = 'duelo-cosmic-bg';
    style.textContent = `
      html, body, #root {
        background: #050510 url('${bgUrl}') center/cover fixed no-repeat !important;
      }
      #root > div,
      #root > div > div,
      #root > div > div > div,
      #root > div > div > div > div {
        background-color: transparent !important;
      }
      body::before {
        content: '';
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 10, 0.15);
        pointer-events: none;
        z-index: 0;
      }
    `;
    document.head.appendChild(style);
    return () => { style.remove(); };
  }, []);
}

export default function RootLayout() {
  useCosmicBackground();

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: 'transparent' },
          animation: 'slide_from_right',
          animationDuration: 300,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
