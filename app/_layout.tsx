import { useColorScheme } from "@/hooks/useColorScheme";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import "react-native-reanimated";
import Toast from "react-native-toast-message";
import CacheManager from "../utils/CacheManager";
import { AppProvider } from "./contexts/AppContext";
import { NotificationProvider } from "./contexts/NotificationContext";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  // ✅ Optimisation: Nettoyage du cache au démarrage
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Nettoyer le cache expiré au démarrage
        await CacheManager.cleanExpiredCache();
        console.log("🧹 Cache nettoyé au démarrage");
      } catch (error) {
        console.error("❌ Erreur nettoyage cache:", error);
      }
    };

    initializeApp();

    // ✅ Nettoyage périodique du cache (toutes les 30 minutes)
    const cleanupInterval = setInterval(async () => {
      try {
        await CacheManager.cleanExpiredCache();
        console.log("🧹 Nettoyage périodique du cache");
      } catch (error) {
        console.error("❌ Erreur nettoyage périodique:", error);
      }
    }, 30 * 60 * 1000); // 30 minutes

    return () => {
      clearInterval(cleanupInterval);
    };
  }, []);

  if (!loaded) return null;

  return (
    <AppProvider>
      <NotificationProvider>
        <ThemeProvider
          value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
        >
          <>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="splash" />
              <Stack.Screen name="(auth)/login" />
              <Stack.Screen name="(auth)/register" />
              <Stack.Screen name="(auth)/complete-profile" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="chat/[id]" />
              <Stack.Screen name="+not-found" options={{ headerShown: true }} />
            </Stack>
            <StatusBar style="auto" />
            <Toast />
          </>
        </ThemeProvider>
      </NotificationProvider>
    </AppProvider>
  );
}
