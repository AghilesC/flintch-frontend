import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import axios from "axios";
import { router } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  Modal,
  PanResponder,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ReanimatedAnimated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

// ✅ IMPORTS OPTIMISÉS
import PreviewProfileTab from "../(auth)/PreviewProfileTab"; // ✅ IMPORT DU COMPOSANT PREVIEW
import { useImagePreloader } from "../../hooks/useImageCache";
import CacheManager from "../../utils/CacheManager";
import { useApp } from "../contexts/AppContext";

const { width, height } = Dimensions.get("window");
const SWIPE_THRESHOLD = 120;
const SWIPE_OUT_DURATION = 250;

// Flintch Branding Colors
const COLORS = {
  primary: "#0E4A7B",
  accent: "#FF5135",
  gradientStart: "#0E4A7B",
  gradientEnd: "#195A96",
  skyBlue: "#4CCAF1",
  midnight: "#092C44",
  white: "#FFFFFF",
  lightGray: "#F8F9FA",
  cardShadow: "rgba(9, 44, 68, 0.15)",
  overlay: "rgba(0, 0, 0, 0.4)",
  textGray: "#8E9BAE",
  divider: "#F0F0F0",
};

interface UserProfile {
  id: number;
  name: string;
  email: string;
  age?: number;
  bio?: string;
  location?: string;
  interests?: string[];
  photos?: string[];
  sports?: string[];
  fitness_level?: string;
  created_at: string;
  birthdate?: string; // ✅ AJOUT pour PreviewProfileTab
  goals?: string[]; // ✅ AJOUT pour PreviewProfileTab
}

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
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (item): item is string =>
            item && typeof item === "string" && item.trim() !== ""
        );
      }
    } catch {
      return data
        .split(",")
        .map((s: string) => s.trim())
        .filter((s: string) => s !== "");
    }
  }

  return [];
};

// ✅ MODAL PROFIL DÉTAILLÉ COMPLET ET CORRIGÉ
const ProfileDetailModal = React.memo(
  ({
    visible,
    profile,
    onClose,
  }: {
    visible: boolean;
    profile: UserProfile | null;
    onClose: () => void;
  }) => {
    const slideAnimation = useRef(new Animated.Value(height)).current;
    const overlayAnimation = useRef(new Animated.Value(0)).current;

    // ✅ FONCTION POUR FERMER AVEC ANIMATION INVERSE
    const handleClosePress = useCallback(() => {
      // Animation inverse de l'ouverture
      Animated.parallel([
        Animated.timing(overlayAnimation, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(slideAnimation, {
            toValue: -30, // Petit dépassement vers le haut
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnimation, {
            toValue: height, // Puis slide down
            duration: 250,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        onClose();
      });
    }, [slideAnimation, overlayAnimation, onClose]);

    useEffect(() => {
      if (visible) {
        // ✅ Animation d'entrée inversée - slide up avec bounce
        Animated.parallel([
          Animated.timing(overlayAnimation, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(slideAnimation, {
              toValue: -50, // Petit dépassement vers le haut
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.spring(slideAnimation, {
              toValue: 0,
              friction: 6,
              tension: 80,
              useNativeDriver: true,
            }),
          ]),
        ]).start();
      } else {
        // Animation de sortie
        Animated.parallel([
          Animated.timing(overlayAnimation, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnimation, {
            toValue: height,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      }
    }, [visible]);

    // ✅ PAN RESPONDER SEULEMENT POUR LA ZONE DU HANDLE
    const handlePanResponder = useMemo(
      () =>
        PanResponder.create({
          onStartShouldSetPanResponder: () => true,
          onMoveShouldSetPanResponder: (_, gestureState) => {
            return (
              gestureState.dy > 0 &&
              Math.abs(gestureState.dy) > Math.abs(gestureState.dx)
            );
          },
          onPanResponderGrant: () => {
            slideAnimation.stopAnimation();
          },
          onPanResponderMove: (_, gestureState) => {
            const newValue = Math.max(0, gestureState.dy);
            slideAnimation.setValue(newValue);
          },
          onPanResponderRelease: (_, gestureState) => {
            const SWIPE_THRESHOLD = 150;
            const VELOCITY_THRESHOLD = 0.8;

            if (
              gestureState.dy > SWIPE_THRESHOLD ||
              gestureState.vy > VELOCITY_THRESHOLD
            ) {
              Animated.parallel([
                Animated.timing(slideAnimation, {
                  toValue: height,
                  duration: 300,
                  useNativeDriver: true,
                }),
                Animated.timing(overlayAnimation, {
                  toValue: 0,
                  duration: 300,
                  useNativeDriver: true,
                }),
              ]).start(() => {
                onClose();
              });
            } else {
              Animated.spring(slideAnimation, {
                toValue: 0,
                friction: 8,
                tension: 100,
                useNativeDriver: true,
              }).start();
            }
          },
        }),
      [slideAnimation, overlayAnimation, onClose]
    );

    if (!profile) return null;

    return (
      <Modal
        visible={visible}
        transparent
        animationType="none"
        statusBarTranslucent
      >
        <Animated.View
          style={[
            styles.profileModalOverlay,
            {
              opacity: overlayAnimation,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.overlayTouchable}
            activeOpacity={1}
            onPress={onClose}
          />

          <Animated.View
            style={[
              styles.profileModalContent,
              {
                transform: [{ translateY: slideAnimation }],
              },
            ]}
          >
            {/* ✅ JUSTE AJOUT DU PAN RESPONDER SUR TON HANDLE EXISTANT */}
            <View
              style={styles.modalHandleZone}
              {...handlePanResponder.panHandlers}
            >
              <View style={styles.modalHandle} />
            </View>

            {/* ✅ Bouton de fermeture avec animation inverse */}
            <TouchableOpacity
              style={styles.profileCloseButton}
              onPress={handleClosePress}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color={COLORS.accent} />
            </TouchableOpacity>

            {/* Contenu du profil - INCHANGÉ */}
            <PreviewProfileTab
              user={profile}
              sports={normalizeArray(profile.sports)}
              objectifs={normalizeArray(profile.goals)}
              niveau={profile.fitness_level || ""}
            />
          </Animated.View>
        </Animated.View>
      </Modal>
    );
  }
);

// ✅ COMPOSANT SPORT BADGE AVEC ANIMATION ET INTERACTION
const SportBadge = React.memo(
  ({
    sport,
    index,
    isShared,
    onPress,
    isVisible = true,
  }: {
    sport: string;
    index: number;
    isShared: boolean;
    onPress: () => void;
    isVisible?: boolean;
  }) => {
    const [showText, setShowText] = useState(false);
    const heartbeatScale = useSharedValue(1);
    const opacity = useSharedValue(isVisible ? 1 : 0);
    const expandWidth = useSharedValue(48);

    useEffect(() => {
      if (isShared && isVisible) {
        opacity.value = withTiming(1, { duration: 300 });

        const startHeartbeat = () => {
          heartbeatScale.value = withDelay(
            index * 300,
            withRepeat(
              withSequence(
                withTiming(1.08, { duration: 150 }),
                withTiming(1, { duration: 150 }),
                withTiming(1.05, { duration: 100 }),
                withTiming(1, { duration: 200 }),
                withTiming(1, { duration: 1000 })
              ),
              -1,
              false
            )
          );
        };

        setTimeout(startHeartbeat, 1500);
      } else if (isVisible) {
        opacity.value = withTiming(1, { duration: 300 });
      } else {
        opacity.value = withTiming(0, { duration: 200 });
      }
    }, [isShared, index, isVisible]);

    const handleExpand = () => {
      setShowText(true);
      expandWidth.value = withSpring(120, { damping: 12, stiffness: 150 });

      setTimeout(() => {
        setShowText(false);
        expandWidth.value = withSpring(48, { damping: 12, stiffness: 150 });
      }, 2000);

      onPress();
    };

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: heartbeatScale.value }],
      opacity: opacity.value,
      width: expandWidth.value,
    }));

    const getSportEmoji = (sport: string): string => {
      const parts = sport.split(" ");
      return parts[0] || "🏋️";
    };

    const getSportName = (sport: string): string => {
      const parts = sport.split(" ");
      let name = parts.slice(1).join(" ") || sport;

      if (name.length > 12) {
        name = name.substring(0, 10) + "..";
      }

      return name;
    };

    if (!isVisible) return null;

    return (
      <ReanimatedAnimated.View
        style={[
          styles.interestBadge,
          isShared && styles.sharedSportBadge,
          showText && styles.expandedBadge,
          animatedStyle,
        ]}
      >
        <TouchableOpacity
          onPress={handleExpand}
          activeOpacity={0.8}
          style={styles.badgeContent}
        >
          {showText ? (
            <Text
              style={[styles.sportText, isShared && styles.sharedSportText]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              {getSportName(sport)}
            </Text>
          ) : (
            <Text
              style={[styles.sportEmoji, isShared && styles.sharedSportEmoji]}
            >
              {getSportEmoji(sport)}
            </Text>
          )}
        </TouchableOpacity>
      </ReanimatedAnimated.View>
    );
  }
);

// ✅ MODAL FULL SCREEN AVEC PHOTO - LAYOUT CENTRÉ
const PartnershipModal = React.memo(
  ({
    visible,
    currentProfile,
    onClose,
    onSendMessage,
  }: {
    visible: boolean;
    currentProfile: UserProfile | null;
    onClose: () => void;
    onSendMessage: () => void;
  }) => {
    const fadeAnimation = useRef(new Animated.Value(0)).current;
    const scaleAnimation = useRef(new Animated.Value(1.1)).current;
    const slideAnimation = useRef(new Animated.Value(50)).current;
    const logoAnimation = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      if (visible) {
        fadeAnimation.setValue(0);
        scaleAnimation.setValue(1.1);
        slideAnimation.setValue(50);
        logoAnimation.setValue(0);

        Animated.sequence([
          Animated.parallel([
            Animated.timing(fadeAnimation, {
              toValue: 1,
              duration: 500,
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnimation, {
              toValue: 1,
              duration: 500,
              useNativeDriver: true,
            }),
          ]),
          Animated.spring(logoAnimation, {
            toValue: 1,
            friction: 6,
            tension: 80,
            useNativeDriver: true,
          }),
          Animated.spring(slideAnimation, {
            toValue: 0,
            friction: 8,
            tension: 100,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        fadeAnimation.setValue(0);
        scaleAnimation.setValue(1.1);
        slideAnimation.setValue(50);
        logoAnimation.setValue(0);
      }
    }, [visible]);

    if (!visible) return null;

    const photoUrl =
      currentProfile?.photos?.[0] || "https://placekitten.com/400/600";

    return (
      <Modal visible={visible} transparent animationType="none">
        <Animated.View
          style={[
            styles.fullScreenContainer,
            {
              opacity: fadeAnimation,
              transform: [{ scale: scaleAnimation }],
            },
          ]}
        >
          <Image
            source={{ uri: photoUrl }}
            style={styles.fullScreenImage}
            resizeMode="cover"
          />

          <View style={styles.darkOverlay} />

          <Animated.View
            style={[
              styles.closeButtonContainer,
              {
                opacity: logoAnimation,
                transform: [
                  {
                    scale: logoAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.5, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.partnershipCloseButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={24} color={COLORS.white} />
            </TouchableOpacity>
          </Animated.View>

          <View style={styles.centeredContent}>
            <Animated.View
              style={[
                styles.centeredLogoContainer,
                {
                  transform: [
                    {
                      scale: logoAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.5, 1],
                      }),
                    },
                    {
                      translateY: logoAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [30, 0],
                      }),
                    },
                  ],
                  opacity: logoAnimation,
                },
              ]}
            >
              <Text style={styles.centeredTaktLogo}>Takt!</Text>
            </Animated.View>

            <Animated.View
              style={[
                styles.centeredMessageContainer,
                {
                  transform: [{ translateY: slideAnimation }],
                  opacity: slideAnimation.interpolate({
                    inputRange: [0, 50],
                    outputRange: [1, 0],
                  }),
                },
              ]}
            >
              <Text style={styles.centeredMatchMessage}>
                Nouveau partenaire{"\n"}d'entraînement !
              </Text>
              <Text style={styles.centeredActionMessage}>
                Propose un RDV sportif pour commencer
              </Text>
            </Animated.View>
          </View>

          <Animated.View
            style={[
              styles.bottomButtons,
              {
                transform: [{ translateY: slideAnimation }],
                opacity: slideAnimation.interpolate({
                  inputRange: [0, 50],
                  outputRange: [1, 0],
                }),
              },
            ]}
          >
            <TouchableOpacity
              style={styles.laterButton}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.laterButtonText}>Plus tard</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.proposeButton}
              onPress={onSendMessage}
              activeOpacity={0.8}
            >
              <Text style={styles.proposeButtonText}>Proposer un RDV</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </Modal>
    );
  }
);

// ✅ COMPOSANT OPTIMISÉ AVEC MEMO - MODIFIÉ pour inclure les sports en commun
const ProfileCard = React.memo(
  ({
    profile,
    currentPhotoIndex,
    onNavigateNext,
    onNavigatePrevious,
    panHandlers,
    cardStyle,
    swipeLabels,
    isFocused,
    userSports,
    onArrowPress, // ✅ NOUVEAU: Handler pour la flèche
  }: {
    profile: UserProfile;
    currentPhotoIndex: number;
    onNavigateNext: () => void;
    onNavigatePrevious: () => void;
    panHandlers: any;
    cardStyle: any;
    swipeLabels: any;
    isFocused: boolean;
    userSports: string[];
    onArrowPress: () => void; // ✅ NOUVEAU
  }) => {
    const [showAllSports, setShowAllSports] = useState(false);

    const isSharedSport = useCallback(
      (sport: string): boolean => {
        return userSports.some(
          (userSport) =>
            userSport.toLowerCase().trim() === sport.toLowerCase().trim()
        );
      },
      [userSports]
    );

    const sortedSports = useMemo(() => {
      const profileSports = normalizeArray(profile.sports);
      return profileSports.sort((a, b) => {
        const aIsShared = isSharedSport(a);
        const bIsShared = isSharedSport(b);

        if (aIsShared && !bIsShared) return -1;
        if (!aIsShared && bIsShared) return 1;
        return 0;
      });
    }, [profile.sports, isSharedSport]);

    const visibleSports = showAllSports
      ? sortedSports
      : sortedSports.slice(0, 3);
    const remainingSportsCount = sortedSports.length - 3;

    const handleSportPress = useCallback(() => {
      // L'animation est gérée directement dans SportBadge
    }, []);

    const handleShowMorePress = useCallback(() => {
      setShowAllSports(!showAllSports);
    }, [showAllSports]);

    const profilePhotos = profile.photos || [];
    const currentPhoto =
      profilePhotos[currentPhotoIndex] || "https://placekitten.com/400/600";

    useEffect(() => {
      console.log("🔍 DEBUG ProfileCard - Profil reçu:", {
        name: profile.name,
        age: profile.age,
        fitness_level: profile.fitness_level,
        allKeys: Object.keys(profile),
      });
    }, [profile]);

    return (
      <Animated.View style={[styles.cardContainer, cardStyle]} {...panHandlers}>
        <Image source={{ uri: currentPhoto }} style={styles.profileImage} />

        {/* Photo indicators */}
        <View style={styles.indicatorsContainer}>
          {[...Array(profilePhotos.length || 1)].map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                {
                  backgroundColor:
                    index === currentPhotoIndex
                      ? COLORS.white
                      : "rgba(255,255,255,0.4)",
                },
              ]}
            />
          ))}
        </View>

        {/* Interest badges - Sports avec gestion complète */}
        {sortedSports.length > 0 && (
          <View style={styles.interestBadges}>
            {visibleSports.map((sport, index) => (
              <SportBadge
                key={`${sport}-${index}`}
                sport={sport}
                index={index}
                isShared={isSharedSport(sport)}
                onPress={handleSportPress}
                isVisible={true}
              />
            ))}

            {remainingSportsCount > 0 && (
              <TouchableOpacity
                style={styles.interestBadge}
                onPress={handleShowMorePress}
                activeOpacity={0.8}
              >
                <Text style={styles.plusText}>
                  {showAllSports ? "-" : `+${remainingSportsCount}`}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Zones de navigation photo */}
        {isFocused && (
          <>
            <TouchableOpacity
              style={styles.leftPhotoZone}
              onPress={onNavigatePrevious}
              activeOpacity={1}
            />
            <TouchableOpacity
              style={styles.rightPhotoZone}
              onPress={onNavigateNext}
              activeOpacity={1}
            />
          </>
        )}

        {/* Profile Info */}
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>
            {profile.name}
            {profile.age ? `, ${profile.age}` : ""}
          </Text>
          {profile.fitness_level ? (
            <Text style={styles.profileFitnessLevel}>
              • {profile.fitness_level}
            </Text>
          ) : (
            <Text style={styles.profileFitnessLevel}>
              • Niveau non renseigné
            </Text>
          )}
          {profile.bio && (
            <Text style={styles.profileBio} numberOfLines={2}>
              {profile.bio}
            </Text>
          )}
        </View>

        {/* ✅ Flèche pour ouvrir le profil */}
        <TouchableOpacity
          style={styles.profileArrow}
          activeOpacity={0.8}
          onPress={onArrowPress}
        >
          <Ionicons name="chevron-down" size={24} color={COLORS.accent} />
        </TouchableOpacity>

        {/* Swipe Labels */}
        {isFocused && swipeLabels}
      </Animated.View>
    );
  }
);

const ExploreScreen = React.memo(() => {
  const { state } = useApp();
  const { user } = state;

  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showPartnershipModal, setShowPartnershipModal] = useState(false);
  const [showProfileDetail, setShowProfileDetail] = useState(false); // ✅ NOUVEAU
  const [isFocused, setIsFocused] = useState(true);
  const [isSwipeInProgress, setIsSwipeInProgress] = useState(false);
  const [treatedUserIds, setTreatedUserIds] = useState<Set<number>>(new Set());

  const userSports = useMemo(() => {
    return normalizeArray(user?.sports);
  }, [user?.sports]);

  useEffect(() => {
    console.log("🎯 Sports de l'utilisateur connecté:", userSports);
  }, [userSports]);

  useEffect(() => {
    const loadTreatedUsers = async () => {
      try {
        const stored = await AsyncStorage.getItem("treated_user_ids");
        if (stored) {
          const ids = JSON.parse(stored);
          setTreatedUserIds(new Set(ids));
          console.log(
            "📋 Liste des users traités chargée:",
            ids.length,
            "users"
          );
        }
      } catch (error) {
        console.error("❌ Erreur chargement treated users:", error);
      }
    };

    loadTreatedUsers();
  }, []);

  const isLoadingRef = useRef(false);
  const hasLoadedRef = useRef(false);
  const lastFetchTime = useRef(0);
  const mountedRef = useRef(true);

  const { preloadImages } = useImagePreloader();

  const position = useRef(new Animated.ValueXY()).current;
  const swipeAnimatedValue = useRef(new Animated.Value(0)).current;

  const rejectButtonScale = useRef(new Animated.Value(1)).current;
  const superLikeButtonScale = useRef(new Animated.Value(1)).current;
  const likeButtonScale = useRef(new Animated.Value(1)).current;
  const moreButtonScale = useRef(new Animated.Value(1)).current;

  const addTreatedUser = useCallback(async (userId: number) => {
    try {
      setTreatedUserIds((prev) => {
        const newSet = new Set([...prev, userId]);
        AsyncStorage.setItem(
          "treated_user_ids",
          JSON.stringify([...newSet])
        ).catch((err) =>
          console.error("❌ Erreur sauvegarde treated users:", err)
        );

        console.log(
          "🚫 User ajouté à la liste des traités:",
          userId,
          "Total:",
          newSet.size
        );
        return newSet;
      });
    } catch (error) {
      console.error("❌ Erreur ajout treated user:", error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      console.log("🎯 ExploreScreen focused");
      setIsFocused(true);
      mountedRef.current = true;

      if (!hasLoadedRef.current) {
        loadProfiles();
      }

      return () => {
        console.log("😴 ExploreScreen blurred - pausing animations");
        setIsFocused(false);
        mountedRef.current = false;
        position.setValue({ x: 0, y: 0 });
        swipeAnimatedValue.setValue(0);
        rejectButtonScale.setValue(1);
        superLikeButtonScale.setValue(1);
        likeButtonScale.setValue(1);
        moreButtonScale.setValue(1);
      };
    }, [])
  );

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      isLoadingRef.current = false;
      hasLoadedRef.current = false;
    };
  }, []);

  const loadProfiles = useCallback(
    async (force = false) => {
      if (isLoadingRef.current) {
        console.log("⚠️ Already loading profiles, skipping...");
        return;
      }

      const now = Date.now();
      const THROTTLE_TIME = 15 * 1000;
      if (!force && now - lastFetchTime.current < THROTTLE_TIME) {
        console.log("⚠️ Too soon since last fetch, skipping...");
        return;
      }

      if (!mountedRef.current) {
        console.log("⚠️ Component unmounted, skipping fetch");
        return;
      }

      try {
        console.log("🌐 Starting loadProfiles, force:", force);
        isLoadingRef.current = true;
        lastFetchTime.current = now;

        if (!force) {
          const cachedProfiles =
            CacheManager.getMemoryCache("discover_profiles");
          if (cachedProfiles && cachedProfiles.length > 0) {
            console.log(
              "⚡ Profiles loaded from MEMORY cache:",
              cachedProfiles.length
            );
            if (mountedRef.current) {
              setProfiles(cachedProfiles);
              setLoading(false);
              hasLoadedRef.current = true;

              const allPhotoUrls = cachedProfiles
                .flatMap((profile: UserProfile) => profile.photos || [])
                .filter(Boolean)
                .slice(0, 20);

              if (allPhotoUrls.length > 0) {
                console.log("🖼️ Preloading", allPhotoUrls.length, "photos");
                preloadImages(allPhotoUrls);
              }
            }
            isLoadingRef.current = false;
            return;
          }
        }

        if (!force) {
          const persistentProfiles = await CacheManager.getPersistentCache(
            "discover_profiles"
          );
          if (
            persistentProfiles &&
            persistentProfiles.length > 0 &&
            mountedRef.current
          ) {
            console.log(
              "📦 Profiles loaded from persistent cache:",
              persistentProfiles.length
            );
            setProfiles(persistentProfiles);
            setLoading(false);
            hasLoadedRef.current = true;

            CacheManager.setMemoryCache(
              "discover_profiles",
              persistentProfiles,
              10 * 60 * 1000
            );

            const allPhotoUrls = persistentProfiles
              .flatMap((profile: UserProfile) => profile.photos || [])
              .filter(Boolean)
              .slice(0, 20);

            if (allPhotoUrls.length > 0) {
              console.log("🖼️ Preloading", allPhotoUrls.length, "photos");
              preloadImages(allPhotoUrls);
            }
            isLoadingRef.current = false;
            return;
          }
        }

        if (!mountedRef.current) {
          console.log("⚠️ Component unmounted before API call");
          isLoadingRef.current = false;
          return;
        }

        console.log("🌐 Fetching profiles from API");
        if (mountedRef.current) {
          setLoading(true);
        }

        const token = await AsyncStorage.getItem("token");
        if (!token) {
          throw new Error("Token non trouvé");
        }

        const response = await axios.get("http://localhost:8000/api/discover", {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        });

        if (!mountedRef.current) {
          console.log("⚠️ Component unmounted during API call");
          isLoadingRef.current = false;
          return;
        }

        const data = response.data.data || response.data;
        console.log(
          "✅ API Response received:",
          Array.isArray(data) ? data.length : "invalid data"
        );

        if (Array.isArray(data)) {
          console.log("🔍 DEBUG - Données reçues de l'API:");
          console.log("Nombre de profils:", data.length);
          if (data.length > 0) {
            console.log("Premier profil complet:", data[0]);
            console.log(
              "fitness_level du premier profil:",
              data[0]?.fitness_level
            );
            console.log(
              "Clés disponibles dans le profil:",
              Object.keys(data[0])
            );
          }

          setProfiles(data);
          hasLoadedRef.current = true;

          CacheManager.setMemoryCache(
            "discover_profiles",
            data,
            10 * 60 * 1000
          );
          await CacheManager.setPersistentCache(
            "discover_profiles",
            data,
            15 * 60 * 1000
          );

          const allPhotoUrls = data
            .flatMap((profile: UserProfile) => profile.photos || [])
            .filter(Boolean)
            .slice(0, 20);

          if (allPhotoUrls.length > 0) {
            console.log("🖼️ Preloading", allPhotoUrls.length, "photos");
            preloadImages(allPhotoUrls);
          }
        } else {
          console.warn("⚠️ Invalid API response format:", data);
          setProfiles([]);
        }
      } catch (error) {
        console.error("❌ Erreur chargement profils:", error);
        if (mountedRef.current) {
          Alert.alert("Erreur", "Impossible de charger les profils.");
        }
      } finally {
        isLoadingRef.current = false;
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    },
    [preloadImages]
  );

  useEffect(() => {
    if (isFocused && !hasLoadedRef.current && !isLoadingRef.current) {
      console.log("🚀 Initial load triggered");
      loadProfiles();
    }
  }, [isFocused, loadProfiles]);

  useEffect(() => {
    setCurrentPhotoIndex(0);
  }, [currentIndex]);

  const handleOptimisticSwipe = useCallback(
    (direction: "left" | "right") => {
      if (isSwipeInProgress || !mountedRef.current) return;

      setIsSwipeInProgress(true);

      const x = direction === "right" ? width : -width;
      Animated.timing(position, {
        toValue: { x, y: 0 },
        duration: SWIPE_OUT_DURATION,
        useNativeDriver: false,
      }).start(() => {
        if (mountedRef.current) {
          if (direction === "left") {
            setCurrentIndex((prev) => prev + 1);
            position.setValue({ x: 0, y: 0 });
            swipeAnimatedValue.setValue(0);
            setIsSwipeInProgress(false);
          }
        }
      });

      handleApiCall(direction);
    },
    [profiles, currentIndex, position, swipeAnimatedValue, isSwipeInProgress]
  );

  const handleApiCall = useCallback(
    async (direction: "left" | "right") => {
      const profile = profiles[currentIndex];
      const token = await AsyncStorage.getItem("token");
      if (!token || !profile) return;

      try {
        if (direction === "right") {
          const res = await axios.post(
            "http://localhost:8000/api/matches",
            { user_id: profile.id },
            {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 5000,
            }
          );

          if (mountedRef.current) {
            if (res.data?.is_mutual) {
              console.log("🎉 MATCH ! La carte revient au centre");

              Animated.spring(position, {
                toValue: { x: 0, y: 0 },
                friction: 6,
                tension: 100,
                useNativeDriver: false,
              }).start(() => {
                if (mountedRef.current) {
                  swipeAnimatedValue.setValue(0);
                  setIsSwipeInProgress(false);

                  setTimeout(() => {
                    if (mountedRef.current) {
                      setShowPartnershipModal(true);
                    }
                  }, 300);
                }
              });
            } else {
              console.log("👍 Like simple, passage à la carte suivante");

              await addTreatedUser(profile.id);

              setCurrentIndex((prev) => prev + 1);
              position.setValue({ x: 0, y: 0 });
              swipeAnimatedValue.setValue(0);
              setIsSwipeInProgress(false);
            }
          }
        } else {
          await axios.post(
            "http://localhost:8000/api/reject",
            { user_id: profile.id },
            {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 5000,
            }
          );

          if (mountedRef.current) {
            await addTreatedUser(profile.id);
          }
        }
      } catch (err) {
        console.error("❌ Erreur API (en arrière-plan):", err);

        if (mountedRef.current) {
          console.log("⚠️ Erreur API - passage forcé à la carte suivante");

          if (direction === "right") {
            setCurrentIndex((prev) => prev + 1);
            position.setValue({ x: 0, y: 0 });
            swipeAnimatedValue.setValue(0);
            setIsSwipeInProgress(false);
          }
        }
      }
    },
    [profiles, currentIndex, position, swipeAnimatedValue, addTreatedUser]
  );

  const forceSwipe = useCallback(
    (direction: "left" | "right") => {
      if (!isFocused || !mountedRef.current || isSwipeInProgress) return;
      handleOptimisticSwipe(direction);
    },
    [handleOptimisticSwipe, isFocused, isSwipeInProgress]
  );

  const resetPosition = useCallback(() => {
    if (!isFocused || !mountedRef.current) return;

    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      friction: 4,
      useNativeDriver: false,
    }).start();
    swipeAnimatedValue.setValue(0);
  }, [position, swipeAnimatedValue, isFocused]);

  const navigateToNextPhoto = useCallback(() => {
    const profile = profiles[currentIndex];
    const photos = profile?.photos || [];
    if (photos.length <= 1) return;

    setCurrentPhotoIndex((prevIndex) =>
      prevIndex < photos.length - 1 ? prevIndex + 1 : prevIndex
    );
  }, [profiles, currentIndex]);

  const navigateToPreviousPhoto = useCallback(() => {
    setCurrentPhotoIndex((prevIndex) =>
      prevIndex > 0 ? prevIndex - 1 : prevIndex
    );
  }, []);

  const animateButton = useCallback(
    (buttonScale: Animated.Value, callback?: () => void) => {
      if (!isFocused || !mountedRef.current) return;

      Animated.sequence([
        Animated.timing(buttonScale, {
          toValue: 0.85,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.spring(buttonScale, {
          toValue: 1,
          friction: 3,
          tension: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (callback && mountedRef.current) callback();
      });
    },
    [isFocused]
  );

  const handleRejectPress = useCallback(() => {
    animateButton(rejectButtonScale, () => handleOptimisticSwipe("left"));
  }, [animateButton, rejectButtonScale, handleOptimisticSwipe]);

  const handleSuperLikePress = useCallback(() => {
    animateButton(superLikeButtonScale, () =>
      Alert.alert("Super Connect!", "Fonctionnalité premium")
    );
  }, [animateButton, superLikeButtonScale]);

  const handleLikePress = useCallback(() => {
    animateButton(likeButtonScale, () => handleOptimisticSwipe("right"));
  }, [animateButton, likeButtonScale, handleOptimisticSwipe]);

  const handleMorePress = useCallback(() => {
    animateButton(moreButtonScale, () => setShowOptionsModal(true));
  }, [animateButton, moreButtonScale]);

  const handlePartnershipClose = useCallback(() => {
    setShowPartnershipModal(false);

    const currentProfile = profiles[currentIndex];
    if (currentProfile) {
      console.log(
        "🚪 Fermeture modal - suppression de la carte:",
        currentProfile.id
      );

      addTreatedUser(currentProfile.id);

      setProfiles((prevProfiles) =>
        prevProfiles.filter((profile) => profile.id !== currentProfile.id)
      );

      CacheManager.setMemoryCache("chat_conversations", null, 0);
      CacheManager.invalidateCache("chat_conversations");
      console.log("🗑️ Cache chat invalidé pour refresh après 'Plus tard'");
    }
  }, [profiles, currentIndex, addTreatedUser]);

  const handleStartChatting = useCallback(() => {
    const currentProfile = profiles[currentIndex];

    if (currentProfile) {
      console.log(
        "🎯 Début handleStartChatting pour profil:",
        currentProfile.id
      );

      addTreatedUser(currentProfile.id);

      setProfiles((prevProfiles) =>
        prevProfiles.filter((profile) => profile.id !== currentProfile.id)
      );

      setShowPartnershipModal(false);

      try {
        console.log("🎯 Navigation vers l'onglet Chat avec Expo Router");

        CacheManager.setMemoryCache("chat_conversations", null, 0);
        CacheManager.invalidateCache("chat_conversations");
        console.log("🗑️ Cache chat invalidé pour refresh");

        router.push("/chat");
        console.log("✅ Navigation réussie vers /chat");
      } catch (error) {
        console.error("❌ Erreur de navigation Expo Router:", error);

        try {
          router.navigate("/chat" as any);
          console.log("✅ Navigation fallback réussie avec navigate");
        } catch (error2) {
          console.error("❌ Erreur navigation fallback:", error2);
        }
      }
    }
  }, [profiles, currentIndex, addTreatedUser]);

  const handleRefresh = useCallback(async () => {
    console.log("🔄 Manual refresh triggered");

    CacheManager.setMemoryCache("discover_profiles", null, 0);
    await CacheManager.invalidateCache("discover_profiles");

    hasLoadedRef.current = false;
    lastFetchTime.current = 0;
    setCurrentIndex(0);

    await loadProfiles(true);
  }, [loadProfiles]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () =>
          isFocused && mountedRef.current && !isSwipeInProgress,
        onPanResponderMove: (_, gesture) => {
          if (!isFocused || !mountedRef.current || isSwipeInProgress) return;
          position.setValue({ x: gesture.dx, y: gesture.dy });
          swipeAnimatedValue.setValue(gesture.dx);
        },
        onPanResponderRelease: (_, gesture) => {
          if (!isFocused || !mountedRef.current || isSwipeInProgress) return;
          if (gesture.dx > SWIPE_THRESHOLD) handleOptimisticSwipe("right");
          else if (gesture.dx < -SWIPE_THRESHOLD) handleOptimisticSwipe("left");
          else resetPosition();
        },
      }),
    [
      isFocused,
      position,
      swipeAnimatedValue,
      handleOptimisticSwipe,
      resetPosition,
      isSwipeInProgress,
    ]
  );

  const cardStyle = useMemo(() => {
    if (!isFocused || !mountedRef.current) {
      return {
        transform: [{ rotate: "0deg" }, { scale: 1 }],
      };
    }

    const rotate = swipeAnimatedValue.interpolate({
      inputRange: [-width / 2, 0, width / 2],
      outputRange: ["-5deg", "0deg", "5deg"],
    });

    const scale = swipeAnimatedValue.interpolate({
      inputRange: [-width, 0, width],
      outputRange: [0.95, 1, 0.95],
      extrapolate: "clamp",
    });

    return {
      ...position.getLayout(),
      transform: [{ rotate }, { scale }],
    };
  }, [position, swipeAnimatedValue, isFocused]);

  const swipeLabels = useMemo(() => {
    if (!isFocused || !mountedRef.current) {
      return null;
    }

    const connectOpacity = swipeAnimatedValue.interpolate({
      inputRange: [0, 150],
      outputRange: [0, 1],
      extrapolate: "clamp",
    });

    const rejectOpacity = swipeAnimatedValue.interpolate({
      inputRange: [-150, 0],
      outputRange: [1, 0],
      extrapolate: "clamp",
    });

    const connectScale = swipeAnimatedValue.interpolate({
      inputRange: [0, 150],
      outputRange: [0.8, 1.1],
      extrapolate: "clamp",
    });

    const rejectScale = swipeAnimatedValue.interpolate({
      inputRange: [-150, 0],
      outputRange: [1.1, 0.8],
      extrapolate: "clamp",
    });

    return (
      <>
        <Animated.View
          style={[
            styles.swipeLabel,
            styles.connectLabel,
            {
              opacity: connectOpacity,
              transform: [{ scale: connectScale }],
            },
          ]}
        >
          <View style={styles.connectLabelInner}>
            <View style={styles.connectEmojiContainer}>
              <Text style={styles.connectEmoji}>💪</Text>
            </View>
            <Text style={styles.connectText}>PARTENAIRE</Text>
            <View style={styles.connectSubtext}>
              <Text style={styles.connectSubtextText}>LET'S TRAIN!</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.swipeLabel,
            styles.rejectLabel,
            {
              opacity: rejectOpacity,
              transform: [{ scale: rejectScale }],
            },
          ]}
        >
          <View style={styles.rejectLabelInner}>
            <View style={styles.rejectIconContainer}>
              <Ionicons name="close" size={48} color={COLORS.white} />
            </View>
            <Text style={styles.rejectText}>SKIP</Text>
            <View style={styles.rejectSubtext}>
              <Text style={styles.rejectSubtextText}>NEXT ONE</Text>
            </View>
          </View>
        </Animated.View>
      </>
    );
  }, [swipeAnimatedValue, isFocused]);

  const currentProfile = profiles[currentIndex];

  // ✅ NOUVEAU: Handler pour ouvrir le profil détaillé
  const handleOpenProfileDetail = useCallback(() => {
    console.log("🔍 Ouverture du profil détaillé");
    setShowProfileDetail(true);
  }, []);

  if (!isFocused) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
        <View style={styles.minimalistContainer}>
          <Text style={styles.minimalistText}>Explore</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={styles.loadingText}>Recherche de partenaires...</Text>
      </View>
    );
  }

  if (currentIndex >= profiles.length) {
    return (
      <View style={styles.emptyContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
        <Ionicons name="barbell" size={80} color="#ccc" />
        <Text style={styles.emptyTitle}>Plus de profils disponibles</Text>
        <Text style={styles.emptyText}>
          Revenez plus tard pour découvrir de nouveaux partenaires
          d'entraînement !
        </Text>
        <TouchableOpacity
          style={styles.emptyRefreshButton}
          onPress={handleRefresh}
        >
          <Text style={styles.refreshButtonText}>Actualiser</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>Takt</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerRefreshButton}
            onPress={handleRefresh}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={20} color={COLORS.textGray} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.shieldButton} activeOpacity={0.7}>
            <Ionicons
              name="shield-checkmark"
              size={24}
              color={COLORS.textGray}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Profile Card */}
      {currentProfile && (
        <View style={styles.cardsContainer}>
          <ProfileCard
            profile={currentProfile}
            currentPhotoIndex={currentPhotoIndex}
            onNavigateNext={navigateToNextPhoto}
            onNavigatePrevious={navigateToPreviousPhoto}
            panHandlers={panResponder.panHandlers}
            cardStyle={cardStyle}
            swipeLabels={swipeLabels}
            isFocused={isFocused}
            userSports={userSports}
            onArrowPress={handleOpenProfileDetail} // ✅ NOUVEAU
          />
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <Animated.View style={{ transform: [{ scale: rejectButtonScale }] }}>
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={handleRejectPress}
            activeOpacity={0.8}
            disabled={isSwipeInProgress}
          >
            <Ionicons name="close" size={24} color="#FF4757" />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={{ transform: [{ scale: superLikeButtonScale }] }}>
          <TouchableOpacity
            style={[styles.actionButton, styles.superLikeButton]}
            onPress={handleSuperLikePress}
            activeOpacity={0.8}
          >
            <Ionicons name="flash" size={20} color="#FFB84D" />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={{ transform: [{ scale: likeButtonScale }] }}>
          <TouchableOpacity
            style={[styles.actionButton, styles.likeButton]}
            onPress={handleLikePress}
            activeOpacity={0.8}
            disabled={isSwipeInProgress}
          >
            <Ionicons name="thumbs-up" size={24} color="#4CCAF1" />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={{ transform: [{ scale: moreButtonScale }] }}>
          <TouchableOpacity
            style={[styles.actionButton, styles.moreButton]}
            onPress={handleMorePress}
            activeOpacity={0.8}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color="#8E9AAF" />
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Partnership Modal */}
      <PartnershipModal
        visible={showPartnershipModal}
        currentProfile={currentProfile}
        onClose={handlePartnershipClose}
        onSendMessage={handleStartChatting}
      />

      {/* ✅ NOUVEAU: Modal de profil détaillé */}
      <ProfileDetailModal
        visible={showProfileDetail}
        profile={currentProfile}
        onClose={() => setShowProfileDetail(false)}
      />

      {/* Options Modal */}
      <Modal
        visible={showOptionsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOptionsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowOptionsModal(false)}
            >
              <Ionicons name="close" size={24} color="#999" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalOption}>
              <Text style={styles.modalOptionText}>Share profile</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalOption}>
              <Text style={styles.modalOptionText}>Report</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalOption}>
              <Text style={styles.modalOptionText}>Block</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowOptionsModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
});

ExploreScreen.displayName = "ExploreScreen";

export default ExploreScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  minimalistContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.lightGray,
  },
  minimalistText: {
    fontSize: 24,
    fontWeight: "600",
    color: COLORS.midnight,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.white,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.midnight,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    backgroundColor: COLORS.lightGray,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.midnight,
    marginTop: 20,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
  },
  emptyRefreshButton: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 24,
  },
  refreshButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
  cardsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 120,
  },
  cardContainer: {
    width: width - 32,
    height: height * 0.7,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: COLORS.white,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  profileImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  leftPhotoZone: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "25%",
    height: "60%",
    zIndex: 8,
  },
  rightPhotoZone: {
    position: "absolute",
    top: 0,
    right: 0,
    width: "30%",
    height: "60%",
    zIndex: 8,
  },
  indicatorsContainer: {
    position: "absolute",
    top: 20,
    left: 20,
    right: 20,
    flexDirection: "row",
    zIndex: 10,
  },
  indicator: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 2,
  },
  interestBadges: {
    position: "absolute",
    top: 60,
    left: 20,
    zIndex: 15,
  },
  interestBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 16,
    alignSelf: "flex-start",
  },
  expandedBadge: {
    borderRadius: 24,
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  badgeContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  sharedSportBadge: {
    backgroundColor: COLORS.accent,
    borderWidth: 2,
    borderColor: "#FFB84D",
    shadowColor: COLORS.accent,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 15,
    transform: [{ scale: 1.1 }],
  },
  sportEmoji: {
    fontSize: 24,
  },
  sharedSportEmoji: {
    fontSize: 26,
    textShadowColor: "rgba(255, 255, 255, 0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  sportText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.midnight,
    textAlign: "center",
  },
  sharedSportText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.white,
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    backgroundColor: COLORS.white,
  },
  headerLeft: {
    flex: 1,
  },
  logoContainer: {
    alignSelf: "flex-start",
  },
  logoText: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.accent,
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerRefreshButton: {
    padding: 8,
  },
  shieldButton: {
    padding: 8,
  },
  plusText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.accent,
  },
  profileInfo: {
    position: "absolute",
    bottom: 24,
    left: 24,
    right: 24,
    zIndex: 5,
  },
  profileName: {
    fontSize: 32,
    fontWeight: "700",
    color: COLORS.white,
    marginBottom: 4,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  profileFitnessLevel: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.white,
    marginBottom: 8,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    opacity: 0.9,
  },
  profileBio: {
    fontSize: 16,
    color: "rgba(255,255,255,0.95)",
    lineHeight: 22,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  profileArrow: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 20,
  },
  swipeLabel: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
    zIndex: 5,
  },
  connectLabel: {
    top: "30%",
    left: "15%",
    transform: [{ rotate: "-15deg" }],
  },
  connectLabelInner: {
    backgroundColor: COLORS.skyBlue,
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderRadius: 20,
    borderWidth: 4,
    borderColor: "#81D4FA",
    alignItems: "center",
    minWidth: 140,
    shadowColor: COLORS.skyBlue,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 15,
  },
  connectEmojiContainer: {
    backgroundColor: COLORS.white,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    borderWidth: 3,
    borderColor: "#81D4FA",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  connectEmoji: {
    fontSize: 28,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  connectText: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.white,
    letterSpacing: 2,
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    marginBottom: 4,
  },
  connectSubtext: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  connectSubtextText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.white,
    letterSpacing: 1,
  },
  rejectLabel: {
    top: "30%",
    right: "15%",
    transform: [{ rotate: "15deg" }],
  },
  rejectLabelInner: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderRadius: 20,
    borderWidth: 4,
    borderColor: "#FF7961",
    alignItems: "center",
    minWidth: 140,
    shadowColor: COLORS.accent,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 15,
  },
  rejectIconContainer: {
    backgroundColor: COLORS.white,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    borderWidth: 3,
    borderColor: "#FF7961",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  rejectText: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.white,
    letterSpacing: 2,
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    marginBottom: 4,
  },
  rejectSubtext: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  rejectSubtextText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.white,
    letterSpacing: 1,
  },
  actionButtons: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  actionButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 8,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.06)",
  },
  rejectButton: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
  },
  superLikeButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
  },
  likeButton: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
  },
  moreButton: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 16,
  },
  closeButton: {
    alignSelf: "flex-end",
    padding: 8,
    marginBottom: 16,
  },
  modalOption: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    borderRadius: 24,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.accent,
    backgroundColor: COLORS.white,
  },
  modalOptionText: {
    fontSize: 16,
    color: COLORS.accent,
    textAlign: "center",
    fontWeight: "500",
  },
  cancelButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: 16,
    borderRadius: 24,
    marginTop: 16,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.white,
    textAlign: "center",
  },
  fullScreenContainer: {
    flex: 1,
    position: "relative",
  },
  fullScreenImage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
  },
  darkOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
  },
  closeButtonContainer: {
    position: "absolute",
    top: height > 800 ? 60 : 40,
    right: width > 400 ? 30 : 20,
    zIndex: 10,
  },
  partnershipCloseButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    backdropFilter: "blur(10px)",
    shadowColor: "rgba(0, 0, 0, 0.3)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  centeredContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: width > 400 ? 40 : 24,
  },
  centeredLogoContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  centeredTaktLogo: {
    fontSize: width > 400 ? 84 : width > 350 ? 72 : 60,
    fontWeight: "900",
    color: "#FF5135",
    textAlign: "center",
    letterSpacing: width > 400 ? -3 : -2,
    textShadowColor: "rgba(0, 0, 0, 0.4)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 12,
  },
  centeredMessageContainer: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  centeredMatchMessage: {
    fontSize: width > 400 ? 26 : width > 350 ? 22 : 20,
    fontWeight: "700",
    color: COLORS.white,
    textAlign: "center",
    marginBottom: 16,
    lineHeight: width > 400 ? 34 : 28,
    textShadowColor: "rgba(0, 0, 0, 0.6)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 6,
    paddingHorizontal: 10,
  },
  centeredActionMessage: {
    fontSize: width > 400 ? 17 : 15,
    fontWeight: "500",
    color: COLORS.white,
    textAlign: "center",
    opacity: 0.9,
    lineHeight: width > 400 ? 24 : 22,
    textShadowColor: "rgba(0, 0, 0, 0.6)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
    paddingHorizontal: 10,
  },
  bottomButtons: {
    position: "absolute",
    bottom: height > 800 ? 40 : 20,
    left: width > 400 ? 40 : 24,
    right: width > 400 ? 40 : 24,
    gap: 14,
  },
  laterButton: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingVertical: height > 800 ? 20 : 18,
    paddingHorizontal: 32,
    borderRadius: 18,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.25)",
    backdropFilter: "blur(20px)",
    shadowColor: "rgba(0, 0, 0, 0.3)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  proposeButton: {
    backgroundColor: "#FF5135",
    paddingVertical: height > 800 ? 22 : 20,
    paddingHorizontal: 32,
    borderRadius: 18,
    alignItems: "center",
    shadowColor: "#FF5135",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  laterButtonText: {
    color: COLORS.white,
    fontSize: width > 400 ? 17 : 16,
    fontWeight: "600",
    textShadowColor: "rgba(0, 0, 0, 0.4)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    letterSpacing: 0.3,
  },
  proposeButtonText: {
    color: COLORS.white,
    fontSize: width > 400 ? 17 : 16,
    fontWeight: "700",
    letterSpacing: 0.8,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  // ✅ NOUVEAUX STYLES POUR LE MODAL DE PROFIL DÉTAILLÉ
  profileModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  overlayTouchable: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "10%",
  },
  profileModalContent: {
    flex: 1,
    backgroundColor: COLORS.white,
    marginTop: 50,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  modalHandle: {
    position: "absolute",
    top: 12,
    left: "50%",
    marginLeft: -20,
    width: 40,
    height: 4,
    backgroundColor: "#D1D5DB",
    borderRadius: 2,
    zIndex: 100,
  },
  profileCloseButton: {
    position: "absolute",
    top: 15,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 200, // ✅ Z-index plus élevé
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.08)",
  },
  // ✅ AJOUTE CE STYLE À TES STYLES EXISTANTS
  modalHandleZone: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 50, // Zone interactive autour du handle
    justifyContent: "center",
    alignItems: "center",
    zIndex: 101, // Au-dessus du handle
  },
});
