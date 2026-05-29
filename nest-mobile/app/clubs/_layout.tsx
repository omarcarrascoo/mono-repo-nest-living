import { Stack } from 'expo-router';

export default function ClubsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="join" />
      <Stack.Screen name="pending" />
    </Stack>
  );
}
