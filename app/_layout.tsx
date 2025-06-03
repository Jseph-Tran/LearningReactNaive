import { AuthProvider, useAuth} from "@/lib/auth-context"; 
import {Stack, useRouter, useSegments} from "expo-router";
import { Route } from "expo-router/build/Route";
import {useEffect } from "react";
import { useRoute } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { PaperProvider } from "react-native-paper";
import {GestureHandlerRootView} from "react-native-gesture-handler";

function RouteGuard(props: {children: React.ReactNode}){
  const router = useRouter();
  const { user , isLoadingUser}= useAuth();
  const segments = useSegments()

  useEffect(() => {
    const inAuthGroup = segments[0] === "auth"

    if (!user && !inAuthGroup && !isLoadingUser) {
      router.replace("/auth");
    } else if (user && inAuthGroup && !isLoadingUser){
      router.replace("/");
    }
  }, [user, segments]);

  return <>{props.children}</>;

}

export default function RootLayout() {
  return (
  <GestureHandlerRootView style={{flex:1}}> 
    <AuthProvider> 
    <PaperProvider> 
    <SafeAreaProvider> 
    <RouteGuard> 
      <Stack>
          <Stack.Screen name="(tabs)" options={{headerShown:false}}/>
      </Stack>
    </RouteGuard>
    </SafeAreaProvider>
    </PaperProvider>
    </AuthProvider>
  </GestureHandlerRootView>
  );
}
