import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PaperProvider } from 'react-native-paper';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { theme } from '../src/theme';

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { isAuthenticated, isLoading, isPartner } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      if (isPartner) {
        router.replace('/(partner)/dashboard');
      } else {
        router.replace('/(user)/home');
      }
    }
  }, [isAuthenticated, isLoading, segments]);

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PaperProvider theme={theme}>
          <RootLayoutNav />
        </PaperProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
