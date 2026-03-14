import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { useEffect, useMemo } from "react";
import Toast from "react-native-toast-message";

import { useAuthStore } from "@/stores/auth.store";

export default function RootLayout() {
  const queryClient = useMemo(() => new QueryClient(), []);
  const hydrate = useAuthStore((state) => state.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>

      <Toast />
    </QueryClientProvider>
  );
}
