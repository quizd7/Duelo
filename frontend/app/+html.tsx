import { ScrollViewStyleReset } from 'expo-router/html';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
        />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: `
          html, body, #root {
            background: #050510 !important;
            background-image: url('${API_URL}/api/static/fond_duelo.webp') !important;
            background-size: cover !important;
            background-position: center !important;
            background-attachment: fixed !important;
            background-repeat: no-repeat !important;
          }
          /* Remove any opaque backgrounds from Expo Router wrappers */
          #root > div > div {
            background-color: transparent !important;
          }
          /* Subtle overlay for readability */
          body::before {
            content: '';
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0, 0, 10, 0.15);
            pointer-events: none;
            z-index: 0;
          }
        `}} />
      </head>
      <body>{children}</body>
    </html>
  );
}
