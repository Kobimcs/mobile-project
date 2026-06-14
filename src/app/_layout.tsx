import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Auth screens */}
      <Stack.Screen name="index" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />

      {/* Student screens */}
      <Stack.Screen name="student-dashboard" />
      <Stack.Screen name="profile-settings" />
      <Stack.Screen name="timetable" />
      <Stack.Screen name="announcements" />
      <Stack.Screen name="assignments" />
      <Stack.Screen name="exam-venue-search" />


      {/* Course rep screens */}
      <Stack.Screen name="rep-panel" />
      <Stack.Screen name="post-announcement" />
      <Stack.Screen name="add-assignment" />
      <Stack.Screen name="manage-timetable" />
      <Stack.Screen name="manage-exam-venues" />
    </Stack>
  );
}