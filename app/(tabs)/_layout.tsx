import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Tabs } from "expo-router";
import React, { useEffect, useMemo } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
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
import { useApp } from "../contexts/AppContext";
import { useNotifications } from "../contexts/NotificationContext"; // ✅ AJOUT

// Flintch Colors
const COLORS = {
  primary: "#0E4A7B",
  accent: "#FF5135",
  skyBlue: "#4CCAF1",
  inactive: "#8E9BAE",
  white: "#FFFFFF",
  background: "#F8F9FA",
};

// ✅ COMPOSANT BADGE SIMPLIFIÉ
const NotificationBadge = React.memo(({ count }: { count: number }) => {
  const scale = useSharedValue(count > 0 ? 1 : 0);

  React.useEffect(() => {
    if (count > 0) {
      scale.value = withSequence(
        withSpring(1.3, { damping: 6 }),
        withSpring(1, { damping: 8 })
      );
    } else {
      scale.value = withSpring(0, { damping: 8 });
    }
  }, [count]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (count <= 0) return null;

  return (
    <Animated.View style={[styles.badge, animatedStyle]}>
      <Text style={styles.badgeText}>
        {count > 99 ? "99+" : count.toString()}
      </Text>
    </Animated.View>
  );
});

// ✅ COMPOSANT ICÔNE SIMPLIFIÉ
const IconWithBadge = React.memo(
  ({
    name,
    outlineName,
    size,
    color,
    focused,
    badgeCount = 0,
  }: {
    name: keyof typeof Ionicons.glyphMap;
    outlineName: keyof typeof Ionicons.glyphMap;
    size: number;
    color: string;
    focused: boolean;
    badgeCount?: number;
  }) => {
    return (
      <View style={styles.iconContainer}>
        <Ionicons
          name={focused ? name : outlineName}
          size={focused ? size + 2 : size}
          color={color}
        />
        <NotificationBadge count={badgeCount} />
      </View>
    );
  }
);

// ✅ TAB BUTTON ULTRA SIMPLIFIÉ (sans animations complexes)
function SimpleTabButton(props: any) {
  const { children, onPress, accessibilityState } = props;
  const isActive = accessibilityState?.selected;

  const handlePress = () => {
    // Haptic simple
    if (!isActive && Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (onPress) {
      onPress();
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      style={[styles.tabButton, isActive && styles.tabButtonActive]}
    >
      <View style={styles.tabIconContainer}>{children}</View>
    </TouchableOpacity>
  );
}

export default function TabLayout() {
  // ✅ Context optimisé
  const { state } = useApp();
  const { unreadCount, refreshUnreadCount } = useNotifications(); // ✅ AJOUT

  // ✅ Log pour debug
  useEffect(() => {
    console.log("🎯 TabLayout - unreadCount:", unreadCount);
  }, [unreadCount]);

  // ✅ Refresh au montage
  useEffect(() => {
    refreshUnreadCount();
  }, [refreshUnreadCount]);

  // ✅ Mémoise les notifications
  const notifications = useMemo(
    () => ({
      chat: unreadCount, // ✅ MODIFIÉ: Utilise unreadCount du NotificationContext
      matches: state.notifications.matches,
    }),
    [unreadCount, state.notifications.matches] // ✅ MODIFIÉ: unreadCount au lieu de state.notifications.chat
  );

  // Polices
  const [poppinsLoaded] = usePoppins({
    Poppins_700Bold,
    Poppins_600SemiBold,
  });
  const [interLoaded] = useInter({
    Inter_400Regular,
    Inter_600SemiBold,
  });

  // ✅ Options simplifiées et sûres
  const screenOptions = useMemo(
    () => ({
      headerShown: false,
      tabBarButton: SimpleTabButton, // ✅ Fonction simple
      tabBarShowLabel: false,
      tabBarStyle: {
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: "rgba(142, 155, 174, 0.2)",
        height: Platform.OS === "ios" ? 85 : 70,
        paddingTop: 10,
        paddingBottom: Platform.OS === "ios" ? 25 : 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8,
      },
      tabBarActiveTintColor: COLORS.accent,
      tabBarInactiveTintColor: COLORS.inactive,
    }),
    []
  );

  // Bloque si polices pas chargées
  if (!poppinsLoaded || !interLoaded) return <AppLoading />;

  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <IconWithBadge
              name="home"
              outlineName="home-outline"
              size={24}
              color={color}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          tabBarIcon: ({ color, focused }) => (
            <IconWithBadge
              name="compass"
              outlineName="compass-outline"
              size={24}
              color={color}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="matches"
        options={{
          title: "Matches",
          tabBarIcon: ({ color, focused }) => (
            <IconWithBadge
              name="heart"
              outlineName="heart-outline"
              size={24}
              color={color}
              focused={focused}
              badgeCount={notifications.matches}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          tabBarIcon: ({ color, focused }) => (
            <IconWithBadge
              name="chatbubbles"
              outlineName="chatbubbles-outline"
              size={24}
              color={color}
              focused={focused}
              badgeCount={notifications.chat} // ✅ Utilise unreadCount via notifications.chat
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <IconWithBadge
              name="person"
              outlineName="person-outline"
              size={24}
              color={color}
              focused={focused}
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
    paddingVertical: 8,
  },
  tabButtonActive: {
    // Style optionnel pour état actif
  },
  tabIconContainer: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 32,
  },
  iconContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: -8,
    right: -12,
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: COLORS.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 14,
    textAlign: "center",
  },
});
