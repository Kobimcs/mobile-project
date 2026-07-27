module.exports = () => ({
  expo: {
    name: 'mobile-project',
    slug: 'mobile-project',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'mobileproject',
    userInterfaceStyle: 'automatic',
    ios: {
      icon: './assets/expo.icon',
      // Mirrors the Android <queries> plugin below: iOS also requires apps to
      // declare which URL schemes they intend to query with canOpenURL, or it
      // returns false for `maps://` even with a maps app installed.
      infoPlist: {
        LSApplicationQueriesSchemes: ['maps'],
      },
    },
    android: {
      package: 'com.knust.classmate',
      // EAS Build injects a real file path via the GOOGLE_SERVICES_JSON secret
      // file env var; local dev falls back to the file at the project root.
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON || './google-services.json',
      adaptiveIcon: {
        // Matches the near-black backdrop in icon.png (sampled, not a guess) so
        // the logo's white elements (person, calendar) keep contrast.
        backgroundColor: '#0D0D0F',
        foregroundImage: './assets/images/android-icon-foreground.png',
        monochromeImage: './assets/images/android-icon-monochrome.png',
      },
      predictiveBackGestureEnabled: false,
    },
    web: {
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      [
        'expo-splash-screen',
        {
          // Same sampled near-black as android.adaptiveIcon.backgroundColor —
          // keeps the logo's white elements visible.
          backgroundColor: '#0D0D0F',
          image: './assets/images/splash-icon.png',
          imageWidth: 200,
          resizeMode: 'contain',
        },
      ],
      'expo-secure-store',
      'expo-notifications',
      'expo-sharing',
      'expo-dev-client',
      // Adds the Android <queries> entry so canOpenURL('geo:...') works — see
      // plugins/withMapsQueries.js.
      './plugins/withMapsQueries',
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: '7513c8ee-89dc-4da6-9eed-5887a22e51ce',
      },
    },
    owner: 'pa-alieu25s-team',
  },
});
