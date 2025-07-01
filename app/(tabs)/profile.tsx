import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import Svg, {
  Circle,
  Defs,
  Stop,
  LinearGradient as SvgGradient,
} from "react-native-svg";

// Import des systèmes existants
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import axios from "axios";
import { useImagePreloader } from "../../hooks/useImageCache";
import CacheManager from "../../utils/CacheManager";
import { useApp } from "../contexts/AppContext";

// ---- Mapping objectif → emoji ----
const objectifsIcons: { [key: string]: string } = {
  "Perte de poids": "⚖️",
  "Prise de masse": "💪",
  Cardio: "🏃",
  Sèche: "🔥",
  "Renforcement musculaire": "🦾",
  Souplesse: "🤸",
  Endurance: "⏱️",
  "Stabilité mentale": "🧘",
  "Santé générale": "💙",
  "Préparation compétition": "🏆",
  "Remise en forme": "🦵",
  "Bien-être": "🧖",
  "Se défouler": "🥊",
  Socialiser: "🤝",
  "Découverte sportive": "🔎",
  Performance: "⚡",
  "Musculation esthétique": "👙",
  "Confiance en soi": "😎",
  "Prendre du plaisir": "😃",
  "Récupération/blessure": "🩹",
};

const CIRCLE_SIZE = 150;
const STROKE_WIDTH = 8;
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// ✅ FONCTION UTILITAIRE POUR NORMALISER LES DONNÉES
const normalizeArray = (data: unknown): string[] => {
  if (!data) return [];

  if (Array.isArray(data)) {
    return data.filter(
      (item): item is string =>
        item && typeof item === "string" && item.trim() !== ""
    );
  }

  if (typeof data === "string") {
    try {
      // Essayer de parser en JSON d'abord
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (item): item is string =>
            item && typeof item === "string" && item.trim() !== ""
        );
      }
    } catch {
      // Si ce n'est pas du JSON, essayer de split
      return data
        .split(",")
        .map((s: string) => s.trim())
        .filter((s: string) => s !== "");
    }
  }

  return [];
};

// ✨ COMPOSANTS OPTIMISÉS AVEC MEMO
const CardAction = React.memo(
  ({
    icon,
    color,
    title,
    subtitle,
  }: {
    icon: string;
    color: string;
    title: string;
    subtitle?: string;
  }) => {
    return (
      <View style={styles.cardAction}>
        <Ionicons
          name={icon as any}
          size={28}
          color={color}
          style={{ marginBottom: 4 }}
        />
        <Text style={styles.cardTitle}>{title}</Text>
        {subtitle ? <Text style={styles.cardSubtitle}>{subtitle}</Text> : null}
      </View>
    );
  }
);

const AnimatedView = Animated.createAnimatedComponent(View);
const AnimatedTouchableOpacity =
  Animated.createAnimatedComponent(TouchableOpacity);

// ✨ ANIMATIONS PLUS LÉGÈRES - PAS D'INFINI
const AnimatedObjectif = React.memo(
  ({
    icon,
    text,
    delay = 0,
  }: {
    icon: string;
    text: string;
    delay?: number;
  }) => {
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(25);
    const scale = useSharedValue(0.7);
    const touchScale = useSharedValue(1);

    useEffect(() => {
      // Animation d'apparition uniquement
      opacity.value = withDelay(delay, withTiming(1, { duration: 500 }));
      translateY.value = withDelay(delay, withTiming(0, { duration: 600 }));
      scale.value = withDelay(
        delay,
        withSequence(
          withTiming(1.15, { duration: 250 }),
          withTiming(0.95, { duration: 150 }),
          withTiming(1, { duration: 100 })
        )
      );
    }, []);

    const handlePress = useCallback(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      touchScale.value = withSequence(
        withTiming(0.95, { duration: 100 }),
        withSpring(1.05, { damping: 8 }),
        withSpring(1, { damping: 8 })
      );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
      opacity: opacity.value,
      transform: [
        { translateY: translateY.value },
        { scale: scale.value * touchScale.value },
      ],
    }));

    return (
      <AnimatedTouchableOpacity
        style={[styles.objectifTag, animatedStyle]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <Text style={styles.objectifEmoji}>{icon}</Text>
        <Text style={styles.objectifText}>{text}</Text>
      </AnimatedTouchableOpacity>
    );
  }
);

const AnimatedSportTag = React.memo(
  ({ text, delay = 0 }: { text: string; delay?: number }) => {
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(20);
    const scale = useSharedValue(0.8);
    const touchScale = useSharedValue(1);

    useEffect(() => {
      opacity.value = withDelay(delay, withTiming(1, { duration: 600 }));
      translateY.value = withDelay(delay, withTiming(0, { duration: 700 }));
      scale.value = withDelay(
        delay,
        withSequence(
          withTiming(1.1, { duration: 300 }),
          withTiming(1, { duration: 200 })
        )
      );
    }, []);

    const handlePress = useCallback(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      touchScale.value = withSequence(
        withTiming(0.95, { duration: 100 }),
        withSpring(1.05, { damping: 8 }),
        withSpring(1, { damping: 8 })
      );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
      opacity: opacity.value,
      transform: [
        { translateY: translateY.value },
        { scale: scale.value * touchScale.value },
      ],
    }));

    return (
      <AnimatedTouchableOpacity
        style={[styles.sportTag, animatedStyle]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <Text style={styles.sportText}>{text}</Text>
      </AnimatedTouchableOpacity>
    );
  }
);

// ✅ COMPOSANT PRINCIPAL AVEC MEMO POUR 0 REFRESH
const ProfileScreen = React.memo(() => {
  // ✅ UTILISATION DU CONTEXTE EXISTANT
  const { state } = useApp();
  const { user } = state;

  // 🚀 STATE LOCAL OPTIMISÉ
  const [userPhotos, setUserPhotos] = useState<any[]>([]);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(true);
  const photosLoadedRef = useRef(false);

  const router = useRouter();
  const { preloadImages } = useImagePreloader();

  // ✅ OPTIMISATION: Stoppe les opérations si pas focus
  useFocusEffect(
    useCallback(() => {
      console.log("🎯 ProfileScreen focused");
      setIsFocused(true);
      return () => {
        console.log("😴 ProfileScreen blurred - pausing operations");
        setIsFocused(false);
      };
    }, [])
  );

  // ✅ DEBUG USER DATA
  useEffect(() => {
    if (user) {
      console.log("=== 🔍 COMPLETE USER DEBUG ===");
      console.log("Full user object:", user);
      console.log("Sports raw:", user.sports);
      console.log("Goals raw:", user.goals);
      console.log("Sports type:", typeof user.sports);
      console.log("Goals type:", typeof user.goals);
      console.log("Sports isArray:", Array.isArray(user.sports));
      console.log("Goals isArray:", Array.isArray(user.goals));
      console.log("===============================");
    }
  }, [user]);

  // ✨ ANIMATION HEARTBEAT PLUS LÉGÈRE
  const heartbeatScale = useSharedValue(1);

  useEffect(() => {
    if (!isFocused) return; // ✅ Pas d'animation si pas focus

    const animateHeartbeat = () => {
      heartbeatScale.value = withSequence(
        withTiming(1.05, { duration: 150 }),
        withTiming(1, { duration: 150 }),
        withTiming(1.03, { duration: 100 }),
        withTiming(1, { duration: 200 })
      );
    };

    const interval = setInterval(animateHeartbeat, 3000);
    return () => clearInterval(interval);
  }, [isFocused]);

  // 🚀 FETCH PHOTOS ULTRA OPTIMISÉ
  const fetchUserPhotos = useCallback(async () => {
    if (photosLoadedRef.current || !isFocused) return; // ✅ Skip si pas focus

    try {
      // 🚀 CACHE MÉMOIRE EN PREMIER (ultra rapide)
      const memoryPhotos = CacheManager.getMemoryCache("user_photos");
      if (memoryPhotos && memoryPhotos.length > 0) {
        console.log("⚡ Photos loaded from MEMORY cache (instant)");
        setUserPhotos(memoryPhotos);
        photosLoadedRef.current = true;

        const photoUrls = memoryPhotos.map((p: any) => p.url).filter(Boolean);
        if (photoUrls.length > 0) {
          preloadImages(photoUrls);
        }
        return;
      }

      // 🚀 Cache persistant
      const cachedPhotos = await CacheManager.getPersistentCache("user_photos");
      if (cachedPhotos && cachedPhotos.length > 0) {
        console.log("📦 Photos loaded from persistent cache");
        setUserPhotos(cachedPhotos);
        photosLoadedRef.current = true;

        // ⚡ Cache mémoire pour accès ultra-rapide
        CacheManager.setMemoryCache(
          "user_photos",
          cachedPhotos,
          10 * 60 * 1000
        ); // 10min

        const photoUrls = cachedPhotos.map((p: any) => p.url).filter(Boolean);
        if (photoUrls.length > 0) {
          preloadImages(photoUrls);
        }
        return;
      }

      // 🌐 API en dernier recours
      if (!isFocused) return; // ✅ Double check avant API

      console.log("🌐 Fetching photos from API (background)");
      setPhotosLoading(true);

      const token = await AsyncStorage.getItem("token");
      if (!token) {
        setPhotosLoading(false);
        return;
      }

      const response = await axios.get("http://localhost:8000/api/photos", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.status && response.data.photos) {
        const photos = response.data.photos;
        setUserPhotos(photos);
        photosLoadedRef.current = true;

        // ✅ Double cache pour performance maximale
        CacheManager.setMemoryCache("user_photos", photos, 10 * 60 * 1000);
        await CacheManager.setPersistentCache(
          "user_photos",
          photos,
          30 * 60 * 1000
        );

        const photoUrls = photos.map((p: any) => p.url).filter(Boolean);
        if (photoUrls.length > 0) {
          preloadImages(photoUrls);
        }
      }
    } catch (error) {
      console.error("❌ Error fetching photos:", error);
    } finally {
      setPhotosLoading(false);
    }
  }, [preloadImages, isFocused]);

  // ✅ CHARGEMENT INTELLIGENT
  useEffect(() => {
    if (!isFocused || photosLoadedRef.current) return;
    fetchUserPhotos();
  }, [fetchUserPhotos, isFocused]);

  // ✅ CALCULS MÉMOISÉS OPTIMISÉS
  const profileCompletion = useMemo(() => {
    if (!user) return 0;

    let percent = 0;
    if (user.gender) percent += 20;
    if (user.fitness_level) percent += 20;
    if (user.goals && Array.isArray(user.goals) && user.goals.length > 0)
      percent += 20;
    if (user.sports && Array.isArray(user.sports) && user.sports.length > 0)
      percent += 20;

    const hasAvailability =
      user.availability &&
      Object.values(user.availability).some(
        (daySlots: any) =>
          daySlots && Object.values(daySlots).some((slot: any) => slot === true)
      );
    if (hasAvailability) percent += 20;

    return Math.min(percent, 100);
  }, [
    user?.gender,
    user?.fitness_level,
    user?.goals?.length,
    user?.sports?.length,
    user?.availability,
  ]);

  const userAge = useMemo(() => {
    if (!user?.birthdate) return "";
    const diff = Date.now() - new Date(user.birthdate).getTime();
    return Math.abs(new Date(diff).getUTCFullYear() - 1970);
  }, [user?.birthdate]);

  const mainPhotoUrl = useMemo(() => {
    const mainPhoto = userPhotos.find((photo) => photo.is_main);
    if (mainPhoto) return mainPhoto.url;
    if (userPhotos.length > 0) return userPhotos[0].url;
    return user?.profile_photo || null;
  }, [userPhotos, user?.profile_photo]);

  // ✅ NAVIGATION OPTIMISÉE
  const handleEditProfile = useCallback(async () => {
    await router.push("../(auth)/complete-profile");
    await CacheManager.invalidateCache("user_photos");
    photosLoadedRef.current = false;
    fetchUserPhotos();
  }, [router, fetchUserPhotos]);

  // ✅ RENDER SPORTS CORRIGÉ
  const renderSports = useMemo(() => {
    console.log("🏃 DEBUG - Raw user.sports:", user?.sports);
    console.log("🏃 DEBUG - Type of user.sports:", typeof user?.sports);

    const sportsArray = normalizeArray(user?.sports);

    console.log("🏃 DEBUG - Normalized sports array:", sportsArray);

    if (sportsArray.length === 0) {
      return (
        <Text style={styles.sportPlaceholder}>Aucun sport sélectionné</Text>
      );
    }

    return (
      <View style={styles.sportsList}>
        {sportsArray.slice(0, 5).map((sport: string, idx: number) => (
          <AnimatedSportTag
            key={`${sport}-${idx}`}
            text={sport}
            delay={idx * 40}
          />
        ))}
      </View>
    );
  }, [user?.sports]);

  // ✅ REMPLACEZ votre renderObjectifs existant par celui-ci:
  const renderObjectifs = useMemo(() => {
    console.log("🎯 DEBUG - Raw user.goals:", user?.goals);
    console.log("🎯 DEBUG - Type of user.goals:", typeof user?.goals);

    const goalsArray = normalizeArray(user?.goals);

    console.log("🎯 DEBUG - Normalized goals array:", goalsArray);

    if (goalsArray.length === 0) {
      return null;
    }

    return (
      <View style={styles.objectifsList}>
        {goalsArray.slice(0, 5).map((objectif: string, idx: number) => (
          <AnimatedObjectif
            key={`${objectif}-${idx}`}
            icon={objectifsIcons[objectif] || "🎯"}
            text={objectif}
            delay={idx * 40}
          />
        ))}
      </View>
    );
  }, [user?.goals]);

  // ✅ AJOUTEZ ce useEffect pour le debugging (temporaire):
  useEffect(() => {
    if (user) {
      console.log("=== 🔍 COMPLETE USER DEBUG ===");
      console.log("Full user object:", user);
      console.log("Sports raw:", user.sports);
      console.log("Goals raw:", user.goals);
      console.log("Sports type:", typeof user.sports);
      console.log("Goals type:", typeof user.goals);
      console.log("Sports isArray:", Array.isArray(user.sports));
      console.log("Goals isArray:", Array.isArray(user.goals));
      console.log("===============================");
    }
  }, [user]);

  // ✅ STYLES ANIMÉS MÉMOISÉS
  const heartbeatStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartbeatScale.value }],
  }));

  const strokeDashoffset = useMemo(
    () => CIRCUMFERENCE * (1 - profileCompletion / 100),
    [profileCompletion]
  );

  // ✅ RENDU MINIMAL SI PAS FOCUS (économise ressources)
  if (!isFocused) {
    return (
      <View style={styles.container}>
        <View style={styles.minimalistContainer}>
          <Text style={styles.name}>
            {user?.name
              ? user.name.charAt(0).toUpperCase() + user.name.slice(1)
              : "Profile"}
          </Text>
        </View>
      </View>
    );
  }

  // ✅ EARLY RETURN SI PAS D'USER
  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Impossible de charger le profil</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HERO + Barre circulaire avec battement de cœur */}
      <View style={styles.gradientBg}>
        <AnimatedView style={[styles.circleContainer, heartbeatStyle]}>
          {/* ✅ SVG PROGRESS CIRCLE */}
          <Svg
            width={CIRCLE_SIZE}
            height={CIRCLE_SIZE}
            style={styles.progressSvg}
            pointerEvents="none"
          >
            <Defs>
              <SvgGradient id="grad" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0%" stopColor="#FF5135" />
                <Stop offset="50%" stopColor="#FF7D31" />
                <Stop offset="100%" stopColor="#4CCAF1" />
              </SvgGradient>
            </Defs>
            <Circle
              cx={CIRCLE_SIZE / 2}
              cy={CIRCLE_SIZE / 2}
              r={RADIUS}
              stroke="rgba(0,0,0,0.1)"
              strokeWidth={STROKE_WIDTH}
              fill="none"
            />
            <Circle
              cx={CIRCLE_SIZE / 2}
              cy={CIRCLE_SIZE / 2}
              r={RADIUS}
              stroke="url(#grad)"
              strokeWidth={STROKE_WIDTH + 1}
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="none"
              transform={`rotate(-90 ${CIRCLE_SIZE / 2} ${CIRCLE_SIZE / 2})`}
            />
          </Svg>

          <TouchableOpacity
            style={styles.profilePicTouchable}
            onPress={handleEditProfile}
            activeOpacity={0.85}
          >
            {mainPhotoUrl ? (
              <Image
                source={{ uri: mainPhotoUrl }}
                style={styles.profileImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.placeholderImage}>
                <Ionicons name="person" size={60} color="#ccc" />
              </View>
            )}
          </TouchableOpacity>

          {photosLoading && (
            <View style={styles.photoLoadingOverlay}>
              <ActivityIndicator size="small" color="#FF5135" />
            </View>
          )}

          <TouchableOpacity
            style={styles.editIcon}
            onPress={handleEditProfile}
            activeOpacity={0.9}
          >
            <Ionicons name="pencil" size={22} color="#fff" />
          </TouchableOpacity>
        </AnimatedView>

        <View style={styles.completionTextContainer}>
          <Text style={styles.completionText}>
            {profileCompletion}% COMPLETÉ
          </Text>
        </View>
      </View>

      {/* Infos utilisateur */}
      <View style={styles.infoCard}>
        <Text style={styles.name}>
          {user?.name
            ? user.name.charAt(0).toUpperCase() + user.name.slice(1)
            : ""}
          {userAge ? `, ${userAge}` : ""}
        </Text>
        {renderSports}
        {renderObjectifs}
      </View>

      {/* Actions */}
      <View style={styles.bottomGrayWrapper}>
        <View style={styles.quickActions}>
          <CardAction
            icon="star"
            color="#0E4A7B"
            title="0 Super Like"
            subtitle="OBTIENS-EN PLUS"
          />
          <CardAction
            icon="flash"
            color="#FF5135"
            title="Mes Boosts"
            subtitle="OBTIENS-EN PLUS"
          />
          <CardAction
            icon="flame"
            color="#4CCAF1"
            title="Abonnements"
            subtitle=""
          />
        </View>

        <View style={styles.premiumCard}>
          <Text style={styles.premiumText}>
            Tu es à court de Like ? {"\n"}
            <Text style={{ fontWeight: "400", color: "#092C44" }}>
              Débloque des Likes illimités et plus de fonctionnalités Flintch
              Plus !
            </Text>
          </Text>
          <TouchableOpacity style={styles.premiumButton}>
            <Text style={styles.premiumButtonText}>Obtenir Flintch Plus</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
});

ProfileScreen.displayName = "ProfileScreen";

export default ProfileScreen;

// Styles avec ajout pour version minimale
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    paddingTop: 0,
  },
  // ✅ NOUVEAU: Style pour version minimale
  minimalistContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
  },
  gradientBg: {
    width: "100%",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 34,
    paddingBottom: 22,
    borderBottomLeftRadius: 70,
    borderBottomRightRadius: 70,
    backgroundColor: "#fff",
  },
  circleContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: "transparent",
    marginBottom: 5,
    position: "relative",
  },
  progressSvg: {
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 1,
  },
  profilePicTouchable: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    width: CIRCLE_SIZE - 26,
    height: CIRCLE_SIZE - 26,
    borderRadius: (CIRCLE_SIZE - 26) / 2,
    zIndex: 0,
  },
  profileImage: {
    width: CIRCLE_SIZE - 26,
    height: CIRCLE_SIZE - 26,
    borderRadius: (CIRCLE_SIZE - 26) / 2,
    overflow: "hidden",
  },
  placeholderImage: {
    width: CIRCLE_SIZE - 26,
    height: CIRCLE_SIZE - 26,
    borderRadius: (CIRCLE_SIZE - 26) / 2,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e0e0e0",
    borderStyle: "dashed",
  },
  photoLoadingOverlay: {
    position: "absolute",
    bottom: 10,
    right: 50,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 12,
    padding: 4,
    zIndex: 5,
  },
  editIcon: {
    position: "absolute",
    right: 10,
    top: 110,
    backgroundColor: "#FF5135",
    borderRadius: 16,
    padding: 6,
    elevation: 3,
    shadowColor: "#FF5135",
    shadowOpacity: 0.25,
    shadowRadius: 5,
    zIndex: 10,
  },
  completionTextContainer: {
    alignItems: "center",
    marginTop: 15,
  },
  completionText: {
    color: "#FF5135",
    fontWeight: "700",
    fontSize: 15,
    letterSpacing: 1,
    textAlign: "center",
    marginBottom: 8,
  },
  infoCard: {
    alignItems: "center",
    marginTop: -20,
    marginBottom: 10,
  },
  name: {
    fontSize: 32,
    fontFamily: "Poppins_700Bold",
    color: "#092C44",
    textAlign: "center",
    marginBottom: 5,
  },
  sportsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 8,
    gap: 8,
  },
  sportTag: {
    backgroundColor: "#F5F6FA",
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginHorizontal: 4,
    marginBottom: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  sportText: {
    fontSize: 16,
    color: "#092C44",
    fontFamily: "Inter_600SemiBold",
  },
  sportPlaceholder: {
    fontSize: 17,
    color: "#bbb",
    marginBottom: 22,
    fontFamily: "Inter_400Regular",
  },
  objectifsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 2,
    gap: 8,
  },
  objectifTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF4F0",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 7,
    margin: 4,
    shadowColor: "#FF5135",
    shadowOpacity: 0.09,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 2,
  },
  objectifEmoji: {
    fontSize: 17,
    marginRight: 6,
  },
  objectifText: {
    fontSize: 15,
    color: "#FF5135",
    fontFamily: "Inter_600SemiBold",
  },
  bottomGrayWrapper: {
    backgroundColor: "#F5F6FA",
    width: "98%",
    alignSelf: "center",
    marginTop: 18,
    paddingTop: 16,
    paddingBottom: 300,
    paddingHorizontal: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 1,
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "97%",
    alignSelf: "center",
    marginTop: 0,
    marginBottom: 18,
    gap: 12,
  },
  cardAction: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    alignItems: "center",
    paddingVertical: 16,
    marginHorizontal: 4,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0E4A7B",
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 11,
    color: "#FF5135",
    fontWeight: "700",
    letterSpacing: 1,
  },
  premiumCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    marginTop: 4,
    marginBottom: 2,
    padding: 18,
    alignItems: "center",
    width: "96%",
    alignSelf: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 1,
  },
  premiumText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FF5135",
    marginBottom: 10,
    textAlign: "center",
  },
  premiumButton: {
    backgroundColor: "#FF5135",
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 26,
    marginTop: 4,
  },
  premiumButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
  },
});
