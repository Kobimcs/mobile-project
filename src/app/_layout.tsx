import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="timetable" />
      <Stack.Screen name="assignments" />
      <Stack.Screen name="add-assignment" />
      <Stack.Screen name="post-announcement" />
      <Stack.Screen name="announcements" />
      <Stack.Screen name="index" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="student-dashboard" />
      <Stack.Screen name="rep-panel" />
    </Stack>
  );
}