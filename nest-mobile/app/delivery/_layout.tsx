import { Stack } from 'expo-router';

export default function DeliveryLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="[id]" />
      <Stack.Screen name="cart" />
      <Stack.Screen name="checkout" />
      <Stack.Screen name="confirmation" />
    </Stack>
  );
}
