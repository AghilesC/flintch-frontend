import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  withRepeat,
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

// ---- Nouveau : mapping objectif → emoji ----
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

function CardAction({ icon, color, title, subtitle }: any) {
  return (
    <View style={styles.cardAction}>
      <Ionicons
        name={icon}
        size={28}
        color={color}
        style={{ marginBottom: 4 }}
      />
      <Text style={styles.cardTitle}>{title}</Text>
      {subtitle ? <Text style={styles.cardSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const AnimatedView = Animated.createAnimatedComponent(View);
const AnimatedTouchableOpacity =
  Animated.createAnimatedComponent(TouchableOpacity);

function AnimatedObjectif({
  icon,
  text,
  delay = 0,
}: {
  icon: string;
  text: string;
  delay?: number;
}) {
  // ✨ TON GLOW ORIGINAL (rouge)
  const glow = useSharedValue(0.6);

  // ✨ NOUVELLE ANIMATION POP-IN
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(25);
  const scale = useSharedValue(0.7);

  // ✨ EFFET BOUNCY QUAND ON APPUIE
  const touchScale = useSharedValue(1);
  const rotation = useSharedValue(0);

  useEffect(() => {
    // Ton glow original
    glow.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 700 }),
          withTiming(0.7, { duration: 900 }),
          withTiming(1, { duration: 600 })
        ),
        -1,
        true
      )
    );

    // Nouvelle animation d'apparition
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

  const handlePress = () => {
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Bouncy animation
    touchScale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withSpring(1.1, { damping: 6, stiffness: 200 }),
      withSpring(1, { damping: 8, stiffness: 200 })
    );

    // Subtle rotation
    rotation.value = withSequence(
      withTiming(3, { duration: 150 }),
      withTiming(-3, { duration: 150 }),
      withTiming(0, { duration: 150 })
    );
  };

  const animatedStyle = useAnimatedStyle(() => ({
    // TON GLOW ORIGINAL
    shadowColor: "#FF5135",
    shadowOpacity: glow.value,
    shadowRadius: 18 + 6 * glow.value,
    shadowOffset: { width: 0, height: 2 },
    elevation: 7 * glow.value,
    // NOUVELLE ANIMATION POP-IN + BOUNCY
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: (0.96 + 0.08 * glow.value) * scale.value * touchScale.value },
      { rotate: `${rotation.value}deg` },
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

function AnimatedSportTag({
  text,
  delay = 0,
}: {
  text: string;
  delay?: number;
}) {
  // ✨ TON GLOW ORIGINAL (bleu)
  const glow = useSharedValue(0.6);

  // ✨ NOUVELLE ANIMATION POP-IN
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  const scale = useSharedValue(0.8);

  // ✨ EFFET BOUNCY QUAND ON APPUIE
  const touchScale = useSharedValue(1);
  const rotation = useSharedValue(0);

  useEffect(() => {
    // Ton glow original
    glow.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 700 }),
          withTiming(0.7, { duration: 900 }),
          withTiming(1, { duration: 600 })
        ),
        -1,
        true
      )
    );

    // Nouvelle animation d'apparition
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

  const handlePress = () => {
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Bouncy animation
    touchScale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withSpring(1.1, { damping: 6, stiffness: 200 }),
      withSpring(1, { damping: 8, stiffness: 200 })
    );

    // Subtle rotation
    rotation.value = withSequence(
      withTiming(-5, { duration: 150 }),
      withTiming(5, { duration: 150 }),
      withTiming(0, { duration: 150 })
    );
  };

  const animatedStyle = useAnimatedStyle(() => ({
    // TON GLOW ORIGINAL
    shadowColor: "#4CCAF1", // BLEU!
    shadowOpacity: glow.value,
    shadowRadius: 18 + 6 * glow.value,
    shadowOffset: { width: 0, height: 2 },
    elevation: 7 * glow.value,
    // NOUVELLE ANIMATION POP-IN + BOUNCY
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: (0.96 + 0.08 * glow.value) * scale.value * touchScale.value },
      { rotate: `${rotation.value}deg` },
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

export default function ProfileScreen() {
  const [user, setUser] = useState<any>(null);
  const [userPhotos, setUserPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // ✨ NOUVEAU : Animation battement de cœur (heartbeat)
  const heartbeatScale = useSharedValue(1);
  const heartbeatGlow = useSharedValue(0.3);

  useEffect(() => {
    // Battement de cœur réaliste : boom-boom... pause... boom-boom... pause
    heartbeatScale.value = withRepeat(
      withSequence(
        // Premier battement (systole)
        withTiming(1.08, { duration: 100 }),
        withTiming(1, { duration: 100 }),
        // Deuxième battement (diastole)
        withTiming(1.05, { duration: 80 }),
        withTiming(1, { duration: 120 }),
        // Pause entre les battements
        withTiming(1, { duration: 800 })
      ),
      -1,
      false
    );

    // Glow qui suit le battement
    heartbeatGlow.value = withRepeat(
      withSequence(
        // Premier glow
        withTiming(0.8, { duration: 100 }),
        withTiming(0.3, { duration: 100 }),
        // Deuxième glow
        withTiming(0.6, { duration: 80 }),
        withTiming(0.2, { duration: 120 }),
        // Pause glow
        withTiming(0.3, { duration: 800 })
      ),
      -1,
      false
    );
  }, []);

  const heartbeatStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartbeatScale.value }],
    shadowOpacity: heartbeatGlow.value,
    shadowRadius: 15 + heartbeatGlow.value * 10,
    shadowColor: "#FF5135",
    shadowOffset: { width: 0, height: 4 },
    elevation: 5 + heartbeatGlow.value * 5,
  }));

  const heartbeatBarStyle = useAnimatedStyle(() => ({
    opacity: heartbeatGlow.value + 0.4,
    transform: [{ scaleX: heartbeatScale.value }],
  }));

  // ----------- Fetch User dynamique avec useCallback ----------
  const fetchUser = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await axios.get("http://localhost:8000/api/user", {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("📊 User data loaded:", response.data);
      setUser(response.data);
    } catch (error) {
      console.error("Erreur fetch user:", error);
    }
  }, []);

  // ----------- Fetch Photos utilisateur avec useCallback ----------
  const fetchUserPhotos = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      console.log(
        "🔑 Token pour photos:",
        token ? "✅ Présent" : "❌ Manquant"
      );

      const response = await axios.get("http://localhost:8000/api/photos", {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("📸 Response photos:", response.data);
      console.log("📸 Status:", response.status);

      if (response.data.status) {
        console.log("📸 Photos trouvées:", response.data.photos.length);
        setUserPhotos(response.data.photos);

        // Log détaillé des photos
        response.data.photos.forEach((photo: any, index: number) => {
          console.log(`📷 Photo ${index + 1}:`, {
            id: photo.id,
            is_main: photo.is_main,
            photo_url: photo.url,
          });
        });
      } else {
        console.log("📸 Aucune photo ou erreur API");
        setUserPhotos([]);
      }
    } catch (error: any) {
      console.error("💥 Erreur fetch photos:", error);
      console.error("💥 Response:", error.response?.data);
      console.error("💥 Status:", error.response?.status);
      setUserPhotos([]);
    }
  }, []);

  // ✨ Chargement initial - Une seule fois
  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      if (mounted) {
        console.log("🚀 Initial load started");
        await Promise.all([fetchUser(), fetchUserPhotos()]);
        setLoading(false);
        console.log("✅ Initial load completed");
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, []); // Tableau vide = une seule exécution

  // ----------- Calcul de complétion MÉMORISÉ ---------
  const profileCompletion = useMemo(() => {
    if (!user) {
      console.log("❌ User is null - completion = 0");
      return 0;
    }

    let percent = 0;
    console.log("🔧 Calculating completion for:", user.name);

    // 1. Genre (20%)
    if (user.gender) {
      percent += 20;
      console.log("✅ Genre found:", user.gender, "- adding 20%");
    } else {
      console.log("❌ Genre missing - 0%");
    }

    // 2. Niveau sportif (20%)
    if (user.fitness_level) {
      percent += 20;
      console.log(
        "✅ Fitness level found:",
        user.fitness_level,
        "- adding 20%"
      );
    } else {
      console.log("❌ Fitness level missing - 0%");
    }

    // 3. Objectifs (20%)
    if (user.goals && user.goals.length > 0) {
      percent += 20;
      console.log("✅ Goals found:", user.goals.length, "goals - adding 20%");
    } else {
      console.log("❌ Goals missing - 0%");
    }

    // 4. Sports (20%)
    if (user.sports && user.sports.length > 0) {
      percent += 20;
      console.log(
        "✅ Sports found:",
        user.sports.length,
        "sports - adding 20%"
      );
    } else {
      console.log("❌ Sports missing - 0%");
    }

    // 5. Disponibilité (20%) - Vérifier qu'il y a vraiment des créneaux sélectionnés
    const hasAvailability =
      user.availability &&
      Object.keys(user.availability).length > 0 &&
      Object.values(user.availability).some(
        (daySlots: any) =>
          daySlots &&
          Object.keys(daySlots).length > 0 &&
          Object.values(daySlots).some((slot: any) => slot === true)
      );

    if (hasAvailability) {
      percent += 20;
      console.log("✅ Availability found with real slots - adding 20%");
    } else {
      console.log("❌ Availability missing or empty - 0%", user.availability);
    }

    const finalPercent = Math.min(percent, 100);
    console.log(
      "🎯 Final completion:",
      finalPercent +
        "% (Genre:" +
        (user.gender ? "✅" : "❌") +
        " | Level:" +
        (user.fitness_level ? "✅" : "❌") +
        " | Goals:" +
        (user.goals?.length > 0 ? "✅" : "❌") +
        " | Sports:" +
        (user.sports?.length > 0 ? "✅" : "❌") +
        " | Dispo:" +
        (hasAvailability ? "✅" : "❌") +
        ")"
    );
    return finalPercent;
  }, [user]); // Recalcule seulement si user change

  // ----------- Calcul de l'âge MÉMORISÉ ----------
  const userAge = useMemo(() => {
    if (!user?.birthdate) return "";
    const diff = Date.now() - new Date(user.birthdate).getTime();
    return Math.abs(new Date(diff).getUTCFullYear() - 1970);
  }, [user?.birthdate]);

  // ----------- Photo principale MÉMORISÉE ----------
  const mainPhotoUrl = useMemo(() => {
    console.log("🔍 Recherche photo principale...");
    console.log("📊 User photos disponibles:", userPhotos.length);
    console.log("📊 User profile_photo:", user?.profile_photo);

    // ✅ Photo principale dans les photos uploadées
    const mainPhoto = userPhotos.find((photo) => photo.is_main);
    if (mainPhoto) {
      console.log("✅ Photo principale trouvée (is_main):", mainPhoto.url);
      return mainPhoto.url;
    }

    // Fallback 1
    if (userPhotos.length > 0) {
      console.log("✅ Première photo utilisée:", userPhotos[0].url);
      return userPhotos[0].url;
    }

    // Fallback 2
    if (user?.profile_photo) {
      return user.profile_photo;
    }

    console.log("❌ Aucune photo trouvée");
    return null;
  }, [userPhotos, user?.profile_photo]);

  // ----------- Navigation optimisée avec useCallback ----------
  const handleEditProfile = useCallback(async () => {
    await router.push("../(auth)/complete-profile");
    setLoading(true);
    await Promise.all([fetchUser(), fetchUserPhotos()]);
    setLoading(false);
  }, [router, fetchUser, fetchUserPhotos]);

  const renderSports = () => {
    if (!user?.sports || user.sports.length === 0) {
      return (
        <Text style={styles.sportPlaceholder}>Aucun sport sélectionné</Text>
      );
    }
    return (
      <View style={styles.sportsList}>
        {user.sports.slice(0, 5).map((sport: string, idx: number) => (
          <AnimatedSportTag
            key={`${sport}-${idx}`}
            text={sport}
            delay={idx * 120}
          />
        ))}
      </View>
    );
  };

  // ---- Affichage Objectifs en pictos ----
  const renderObjectifs = () => {
    if (!user?.goals || user.goals.length === 0) {
      return null;
    }
    return (
      <View style={styles.objectifsList}>
        {user.goals.slice(0, 5).map((objectif: string, idx: number) => (
          <AnimatedObjectif
            key={`${objectif}-${idx}`}
            icon={objectifsIcons[objectif] || "🎯"}
            text={objectif}
            delay={idx * 120}
          />
        ))}
      </View>
    );
  };

  // --- Barre de progression circulaire à jour ! ---
  const strokeDashoffset = CIRCUMFERENCE * (1 - profileCompletion / 100);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF5135" />
      </View>
    );
  }

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
        {/* Container avec effet heartbeat pour SVG + Photo ensemble */}
        <AnimatedView style={[styles.circleContainer, heartbeatStyle]}>
          <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE}>
            {/* Progress Gradient avec effet pulsation */}
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
              stroke="url(#grad)"
              strokeWidth={STROKE_WIDTH + 1}
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="none"
              transform={`rotate(-90 ${CIRCLE_SIZE / 2} ${CIRCLE_SIZE / 2})`}
            />
          </Svg>

          {/* Photo + crayon avec même effet heartbeat */}
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

          {/* Icône d'édition séparée */}
          <TouchableOpacity
            style={styles.editIcon}
            onPress={handleEditProfile}
            activeOpacity={0.9}
          >
            <Ionicons name="pencil" size={22} color="#fff" />
          </TouchableOpacity>
        </AnimatedView>

        {/* Texte de complétion avec animation heartbeat */}
        <View style={styles.completionTextContainer}>
          <Text style={styles.completionText}>
            {profileCompletion} % COMPLETÉ
          </Text>
          <View style={styles.heartbeatLine}>
            <AnimatedView
              style={[styles.heartbeatIndicator, heartbeatBarStyle]}
            />
          </View>
        </View>
      </View>

      {/* Nom, âge, sports, objectifs */}
      <View style={styles.infoCard}>
        <Text style={styles.name}>
          {user?.name
            ? user.name.charAt(0).toUpperCase() + user.name.slice(1)
            : ""}
          {userAge ? `, ${userAge}` : ""}
        </Text>
        {renderSports()}
        {renderObjectifs()}
      </View>

      {/* Fond gris bas + actions */}
      <View style={styles.bottomGrayWrapper}>
        {/* Cartes actions rapides */}
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
        {/* Card premium Flintch */}
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
}

// --- STYLES ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    paddingTop: 0,
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
  },
  profilePicTouchable: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    width: CIRCLE_SIZE - 26,
    height: CIRCLE_SIZE - 26,
    borderRadius: (CIRCLE_SIZE - 26) / 2,
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
  heartbeatLine: {
    width: 80,
    height: 2,
    backgroundColor: "rgba(255, 81, 53, 0.2)",
    borderRadius: 1,
    overflow: "hidden",
  },
  heartbeatIndicator: {
    width: "100%",
    height: "100%",
    backgroundColor: "#FF5135",
    borderRadius: 1,
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
  // -------- Objectifs en pictos --------
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
  // ---------------------------------------
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
