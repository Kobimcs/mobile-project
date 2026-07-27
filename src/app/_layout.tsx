import { AppColors } from '@/constants/colors';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { ConfirmProvider } from '@/context/confirm-context';
import { registerForPushNotifications } from '@/services/notifications';
import { PublicSans_400Regular, PublicSans_600SemiBold, PublicSans_700Bold } from '@expo-google-fonts/public-sans';
import { Sora_600SemiBold, Sora_700Bold, useFonts } from '@expo-google-fonts/sora';
import * as Notifications from 'expo-notifications';
import { router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';

// Keep the splash screen visible until the app fonts have loaded.
SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { token, role, isLoading } = useAuth();

  // Once signed in, register this device for remote push (no-op in Expo Go).
  useEffect(() => {
    if (token) {
      registerForPushNotifications(token);
    }
  }, [token]);

  // Deep link: tapping a notification opens the screen it points to (via data.url).
  // Notification listeners are native-only; skip on web where they aren't available.
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const goTo = (data: unknown) => {
      const url = (data as { url?: string } | undefined)?.url;
      if (typeof url === 'string') router.push(url as never);
    };
    const sub = Notifications.addNotificationResponseReceivedListener((response) =>
      goTo(response.notification.request.content.data)
    );
    // Handle the app being launched by tapping a notification.
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) goTo(response.notification.request.content.data);
    });
    return () => sub.remove();
  }, []);

  // Wait for the stored session to load before deciding what is reachable,
  // otherwise a logged-in user would briefly see the login screen on launch.
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: AppColors.background }}>
        <ActivityIndicator size="large" color={AppColors.primary} />
      </View>
    );
  }

  const isAuthenticated = !!token;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Auth screens — reachable when signed out */}
      <Stack.Screen name="index" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="reset-password" />

      {/* Any signed-in user — student and shared screens */}
      <Stack.Protected guard={isAuthenticated}>
        <Stack.Screen name="student-dashboard" />
        <Stack.Screen name="profile-settings" />
        <Stack.Screen name="edit-profile" />
        <Stack.Screen name="change-password" />
        <Stack.Screen name="paywall" />
        <Stack.Screen name="timetable" />
        <Stack.Screen name="announcements" />
        <Stack.Screen name="assignments" />
        <Stack.Screen name="exam-venue-search" />
        <Stack.Screen name="my-scores" />
      </Stack.Protected>

      {/* Course rep + admin management screens */}
      <Stack.Protected guard={isAuthenticated && (role === 'course_rep' || role === 'admin')}>
        <Stack.Screen name="rep-panel" />
        <Stack.Screen name="post-announcement" />
        <Stack.Screen name="add-assignment" />
        <Stack.Screen name="manage-timetable" />
        <Stack.Screen name="manage-exam-venues" />
        <Stack.Screen name="upload-score" />
      </Stack.Protected>

      {/* Admin only */}
      <Stack.Protected guard={isAuthenticated && role === 'admin'}>
        <Stack.Screen name="admin-panel" />
        <Stack.Screen name="audit-log" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Sora_600SemiBold,
    Sora_700Bold,
    PublicSans_400Regular,
    PublicSans_600SemiBold,
    PublicSans_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Hold rendering until fonts are ready (or failed) so text doesn't flash in a
  // system font first.
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <AuthProvider>
      <ConfirmProvider>
        <RootNavigator />
      </ConfirmProvider>
    </AuthProvider>
  );
}
