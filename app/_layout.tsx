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
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <>
          <Stack>
            <Stack.Screen name="splash" options={{ headerShown: false }} />
            <Stack.Screen
              name="(auth)/login"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="(auth)/register"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="complete-profile"
              options={{ headerShown: false }}
            />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="auto" />
          <Toast />
        </>
      </ThemeProvider>
    </AppProvider>
  );
}
