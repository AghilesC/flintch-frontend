import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Tabs } from "expo-router";
import React from "react";
import { Platform, StyleSheet, TouchableOpacity } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import {
  Inter_400Regular,
  Inter_600SemiBold,
  useFonts as useInter,
} from "@expo-google-fonts/inter";
import {
  Poppins_600SemiBold,
  Poppins_700Bold,
  useFonts as usePoppins,
} from "@expo-google-fonts/poppins";
import AppLoading from "expo-app-loading";

// Flintch Colors
const COLORS = {
  primary: "#0E4A7B",
  accent: "#FF5135",
  skyBlue: "#4CCAF1",
  inactive: "#8E9BAE",
  white: "#FFFFFF",
  background: "#F8F9FA",
};

// Enhanced Haptic Tab avec animations premium (version simplifiée)
const PremiumHapticTab = ({
  children,
  onPress,
  accessibilityState,
  ...rest
}: any) => {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const isActive = accessibilityState?.selected;

  React.useEffect(() => {
    if (isActive) {
      // Animation quand l'onglet devient actif
      scale.value = withSpring(1.15, { damping: 8, stiffness: 200 });
      rotation.value = withSequence(
        withTiming(5, { duration: 100 }),
        withTiming(-5, { duration: 100 }),
        withTiming(0, { duration: 100 })
      );
    } else {
      // Animation quand l'onglet devient inactif
      scale.value = withSpring(1, { damping: 12, stiffness: 300 });
      rotation.value = withTiming(0, { duration: 150 });
    }
  }, [isActive]);

  const handlePress = () => {
    // Haptic feedback seulement si on change de tab
    if (!isActive && Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Animation de tap seulement
    scale.value = withSequence(
      withTiming(0.9, { duration: 80 }),
      withSpring(isActive ? 1.15 : 1, { damping: 8, stiffness: 200 })
    );

    // Laisse Expo Router gérer la navigation
    if (onPress) {
      onPress();
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotation.value}deg` }],
  }));

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.8}
      style={styles.tabButton}
      {...rest}
    >
      <Animated.View style={[styles.tabIconContainer, animatedStyle]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};

// Custom Tab Bar Background avec style premium
const PremiumTabBarBackground = () => {
  return <Animated.View style={styles.tabBarBackground} />;
};

export default function TabLayout() {
  // Charge toutes les polices
  const [poppinsLoaded] = usePoppins({
    Poppins_700Bold,
    Poppins_600SemiBold,
  });
  const [interLoaded] = useInter({
    Inter_400Regular,
    Inter_600SemiBold,
  });

  // Bloque le rendu tant que les polices ne sont pas chargées
  if (!poppinsLoaded || !interLoaded) return <AppLoading />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: PremiumHapticTab,
        tabBarBackground: PremiumTabBarBackground,
        tabBarShowLabel: false, // Masque tous les labels
        tabBarStyle: {
          ...Platform.select({
            ios: {
              position: "absolute",
            },
            default: {},
          }),
          backgroundColor: "transparent",
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          height: Platform.OS === "ios" ? 75 : 60, // Réduit la hauteur sans les labels
        },
        tabBarActiveTintColor: COLORS.accent,
        tabBarInactiveTintColor: COLORS.inactive,
        tabBarIconStyle: {
          marginTop: 8, // Plus de marge pour centrer parfaitement
          marginBottom: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={focused ? 26 : 24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "compass" : "compass-outline"}
              size={focused ? 26 : 24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="matches"
        options={{
          title: "Matches",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "heart" : "heart-outline"}
              size={focused ? 26 : 24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "chatbubbles" : "chatbubbles-outline"}
              size={focused ? 26 : 24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={focused ? 26 : 24}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12, // Plus de padding pour centrer
  },
  tabIconContainer: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 36, // Hauteur minimum pour le centrage
  },
  tabBarBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: "rgba(142, 155, 174, 0.2)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
});
