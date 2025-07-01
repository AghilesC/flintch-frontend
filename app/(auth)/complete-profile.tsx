import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import axios from "axios";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
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
  Dimensions,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeInUp,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import Toast from "react-native-toast-message";

// ✅ IMPORTS DES COMPOSANTS
import EditProfileTab from "./EditProfileTab";
import PreviewProfileTab from "./PreviewProfileTab";

// ✅ IMPORTS OPTIMISÉS
import CacheManager from "../../utils/CacheManager";
import { useApp } from "../contexts/AppContext";

const { width } = Dimensions.get("window");

// ✅ INTERFACES TYPESCRIPT
interface BeautifulHeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onBack: () => void;
}

interface SuccessAnimationProps {
  visible: boolean;
  isFocused: boolean;
  router: any;
}

// ✨ COULEURS ULTRA MODERNES
const COLORS = {
  primary: "#FF5135",
  primaryLight: "#FF7A5C",
  primaryDark: "#E63E1F",
  gradientStart: "#FF5135",
  gradientEnd: "#FF8A6B",
  white: "#FFFFFF",
  lightGray: "#F8F9FA",
  softGray: "#F1F3F4",
  overlay: "rgba(255, 81, 53, 0.1)",
  overlayDark: "rgba(0, 0, 0, 0.4)",
  success: "#4CAF50",
  textSecondary: "#6C7B7F",
  shadow: "rgba(255, 81, 53, 0.25)",
  glass: "rgba(255, 255, 255, 0.1)",
};

// ✨ HEADER COMPONENT ULTRA MODERNE
const BeautifulHeader = React.memo<BeautifulHeaderProps>(
  ({ activeTab, onTabChange, onBack }) => {
    const tabIndicatorPosition = useSharedValue(activeTab === "edit" ? 0 : 1);
    const headerOpacity = useSharedValue(1);

    // Animation de l'indicateur
    const tabIndicatorStyle = useAnimatedStyle(() => ({
      transform: [
        {
          translateX: interpolate(
            tabIndicatorPosition.value,
            [0, 1],
            [0, (width - 120) / 2]
          ),
        },
      ],
    }));

    // Animation du header pour le mode sombre
    const headerStyle = useAnimatedStyle(() => ({
      opacity: headerOpacity.value,
    }));

    const handleTabPress = useCallback(
      (tab: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        tabIndicatorPosition.value = withSpring(tab === "edit" ? 0 : 1, {
          damping: 20,
          stiffness: 300,
        });

        onTabChange(tab);
      },
      [onTabChange]
    );

    // Met à jour la position quand activeTab change
    useEffect(() => {
      tabIndicatorPosition.value = withSpring(activeTab === "edit" ? 0 : 1, {
        damping: 20,
        stiffness: 300,
      });
    }, [activeTab]);

    return (
      <Animated.View style={[styles.beautifulHeader, headerStyle]}>
        {/* Gradient Background - toujours mode clair */}
        <LinearGradient
          colors={[COLORS.white, COLORS.softGray]}
          style={styles.headerGradient}
        >
          {/* Glass Effect Overlay */}
          <View style={styles.glassOverlay} />

          <View style={styles.headerContent}>
            {/* Back Button avec animation - toujours mode clair */}
            <TouchableOpacity
              onPress={onBack}
              style={styles.modernBackButton}
              activeOpacity={0.7}
            >
              <Animated.View style={styles.backButtonInner}>
                <Ionicons name="arrow-back" size={22} color={COLORS.primary} />
              </Animated.View>
            </TouchableOpacity>

            {/* Tabs Container Ultra Moderne */}
            <View style={styles.ultraModernTabsContainer}>
              <View style={styles.tabsBackground}>
                {/* Animated Indicator avec gradient */}
                <Animated.View
                  style={[styles.modernTabIndicator, tabIndicatorStyle]}
                >
                  <LinearGradient
                    colors={[COLORS.gradientStart, COLORS.primary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.indicatorGradient}
                  />
                </Animated.View>

                {/* Tab Edit */}
                <TouchableOpacity
                  style={styles.modernTab}
                  onPress={() => handleTabPress("edit")}
                  activeOpacity={0.8}
                >
                  <View style={styles.tabContentWrapper}>
                    <Ionicons
                      name="create-outline"
                      size={18}
                      color={
                        activeTab === "edit"
                          ? COLORS.white
                          : COLORS.textSecondary
                      }
                      style={styles.tabIcon}
                    />
                    <Text
                      style={[
                        styles.modernTabText,
                        activeTab === "edit" && styles.modernTabTextActive,
                      ]}
                    >
                      Modifier
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Tab Preview */}
                <TouchableOpacity
                  style={styles.modernTab}
                  onPress={() => handleTabPress("preview")}
                  activeOpacity={0.8}
                >
                  <View style={styles.tabContentWrapper}>
                    <Ionicons
                      name="eye-outline"
                      size={18}
                      color={
                        activeTab === "preview"
                          ? COLORS.white
                          : COLORS.textSecondary
                      }
                      style={styles.tabIcon}
                    />
                    <Text
                      style={[
                        styles.modernTabText,
                        activeTab === "preview" && styles.modernTabTextActive,
                      ]}
                    >
                      Aperçu
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Floating Badge */}
              {activeTab === "preview" && (
                <Animated.View
                  style={styles.floatingBadge}
                  entering={FadeInUp.delay(200).springify()}
                >
                  <LinearGradient
                    colors={[COLORS.primaryLight, COLORS.gradientEnd]}
                    style={styles.badgeGradient}
                  >
                    <Text style={styles.badgeText}>✨ Aperçu Live</Text>
                  </LinearGradient>
                </Animated.View>
              )}
            </View>

            {/* Right Spacer */}
            <View style={styles.rightSpacer} />
          </View>

          {/* Decorative Bottom Border - toujours orange */}
          <View style={styles.bottomBorder}>
            <LinearGradient
              colors={["transparent", COLORS.primary, "transparent"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.borderGradient}
            />
          </View>
        </LinearGradient>
      </Animated.View>
    );
  }
);

// ✨ SUCCESS ANIMATION COMPONENT
const SuccessAnimation = React.memo<SuccessAnimationProps>(
  ({ visible, isFocused, router }) => {
    const translateY = useSharedValue(500);
    const opacity = useSharedValue(0);

    useEffect(() => {
      if (visible && isFocused) {
        translateY.value = withSpring(0, {
          damping: 15,
          stiffness: 150,
        });
        opacity.value = withTiming(1, { duration: 300 });

        setTimeout(() => {
          if (router) {
            router.replace("/profile");
          }
        }, 1000);
      } else {
        translateY.value = 500;
        opacity.value = 0;
      }
    }, [visible, isFocused, router]);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ translateY: translateY.value }],
      opacity: opacity.value,
    }));

    if (!visible || !isFocused) return null;

    return (
      <View style={styles.successOverlay}>
        <Animated.View style={[styles.successContainer, animatedStyle]}>
          <View style={styles.checkmarkContainer}>
            <LinearGradient
              colors={[COLORS.success, "#81C784"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.checkmarkGradient}
            >
              <Ionicons name="checkmark" size={40} color={COLORS.white} />
            </LinearGradient>
          </View>
          <Text style={styles.successText}>Profil mis à jour !</Text>
        </Animated.View>
      </View>
    );
  }
);

// ✨ COMPOSANT PRINCIPAL
const CompleteProfile = React.memo(() => {
  const { state, fetchUser } = useApp();
  const { user } = state;

  // ✅ STATE OPTIMISÉ
  const [gender, setGender] = useState("");
  const [niveau, setNiveau] = useState("");
  const [objectifs, setObjectifs] = useState<string[]>([]);
  const [sports, setSports] = useState<string[]>([]);
  const [availability, setAvailability] = useState<any>(null);
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);

  // ✨ NOUVEAU: STATE POUR LES ONGLETS
  const [activeTab, setActiveTab] = useState("edit");

  // ✅ REFS POUR ÉVITER LES APPELS MULTIPLES
  const isLoadingRef = useRef(false);
  const hasLoadedRef = useRef(false);
  const mountedRef = useRef(true);
  const saveTimeoutRef = useRef<number | null>(null);

  // ✨ ANIMATION VALUES
  const buttonScale = useSharedValue(1);
  const buttonOpacity = useSharedValue(1);

  const router = useRouter();

  // ✅ COMPUTED VALUES
  const isFormValid = useMemo(() => {
    return gender && niveau && sports.length > 0 && objectifs.length > 0;
  }, [gender, niveau, sports.length, objectifs.length]);

  // ✅ FOCUS EFFECT
  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      mountedRef.current = true;

      if (!hasLoadedRef.current) {
        loadUserData();
      }

      return () => {
        setIsFocused(false);
        mountedRef.current = false;

        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
      };
    }, [])
  );

  // ✅ CLEANUP
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      isLoadingRef.current = false;
      hasLoadedRef.current = false;
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // ✅ FONCTION POUR PARSER LES ARRAYS
  const parseArray = useCallback((val: any): string[] => {
    if (Array.isArray(val)) return val;
    if (typeof val === "string" && val.startsWith("[")) {
      try {
        const arr = JSON.parse(val);
        if (Array.isArray(arr) && typeof arr[0] === "string") return arr;
        if (Array.isArray(arr) && Array.isArray(arr[0])) return arr[0];
      } catch (e) {
        console.warn("Error parsing array:", e);
      }
    }
    return [];
  }, []);

  // ✅ LOAD USER DATA
  const loadUserData = useCallback(async () => {
    if (isLoadingRef.current || !mountedRef.current) return;

    try {
      isLoadingRef.current = true;

      const cachedUser = CacheManager.getMemoryCache("current_user");
      if (cachedUser && !hasLoadedRef.current) {
        setUserDataFromCache(cachedUser);
        hasLoadedRef.current = true;
        isLoadingRef.current = false;
        return;
      }

      const persistentUser = await CacheManager.getPersistentCache(
        "current_user"
      );
      if (persistentUser && !hasLoadedRef.current && mountedRef.current) {
        setUserDataFromCache(persistentUser);
        hasLoadedRef.current = true;
        CacheManager.setMemoryCache(
          "current_user",
          persistentUser,
          10 * 60 * 1000
        );
        isLoadingRef.current = false;
        return;
      }

      if (!mountedRef.current) {
        isLoadingRef.current = false;
        return;
      }

      const token = await AsyncStorage.getItem("token");
      if (!token) {
        isLoadingRef.current = false;
        return;
      }

      const response = await axios.get("http://localhost:8000/api/me", {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });

      if (!mountedRef.current) {
        isLoadingRef.current = false;
        return;
      }

      const data = response.data;
      setUserDataFromAPI(data);
      hasLoadedRef.current = true;

      CacheManager.setMemoryCache("current_user", data, 10 * 60 * 1000);
      await CacheManager.setPersistentCache(
        "current_user",
        data,
        30 * 60 * 1000
      );
    } catch (error) {
      console.error("❌ Error loading user data:", error);
      if (mountedRef.current) {
        Toast.show({
          type: "error",
          text1: "Erreur",
          text2: "Impossible de charger les données",
        });
      }
    } finally {
      isLoadingRef.current = false;
    }
  }, []);

  // ✅ SETTERS
  const setUserDataFromCache = useCallback(
    (data: any) => {
      if (!mountedRef.current) return;

      setGender(data.gender || "");
      setNiveau(data.fitness_level || "");
      setObjectifs(parseArray(data.goals));
      setSports(parseArray(data.sports));
      setAvailability(data.availability || {});
      if (data.location) setLocation(data.location);
    },
    [parseArray]
  );

  const setUserDataFromAPI = useCallback(
    (data: any) => {
      if (!mountedRef.current) return;

      setGender(data.gender || "");
      setNiveau(data.fitness_level || "");
      setObjectifs(parseArray(data.goals));
      setSports(parseArray(data.sports));
      setAvailability(data.availability || {});
    },
    [parseArray]
  );

  // ✅ LOCATION LOADING
  const loadLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted" && mountedRef.current) {
        const locationData = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Low,
        });
        if (mountedRef.current) {
          const coords = `${locationData.coords.latitude},${locationData.coords.longitude}`;
          setLocation(coords);
        }
      }
    } catch (error) {
      console.warn("Error getting location:", error);
    }
  }, []);

  // ✅ CHARGEMENT INITIAL
  useEffect(() => {
    if (isFocused && !hasLoadedRef.current) {
      loadLocation();
    }
  }, [isFocused, loadLocation]);

  // ✅ TOGGLE SPORT
  const toggleSport = useCallback(
    (sport: string) => {
      if (!isFocused || !mountedRef.current) return;

      setSports((prevSports: string[]) => {
        if (prevSports.includes(sport)) {
          if (prevSports.length === 1) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            Toast.show({
              type: "info",
              text1: "Minimum requis",
              text2: "Au moins 1 sport doit être sélectionné",
            });
            return prevSports;
          }
          return prevSports.filter((s: string) => s !== sport);
        } else {
          if (prevSports.length >= 5) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            Toast.show({
              type: "info",
              text1: "Maximum atteint",
              text2: "5 sports maximum",
            });
            return prevSports;
          }
          return [...prevSports, sport];
        }
      });
    },
    [isFocused]
  );

  // ✅ HANDLE SAVE
  const handleSave = useCallback(async () => {
    if (!isFocused || !mountedRef.current || loading) return;

    if (!gender || !niveau || sports.length < 1 || objectifs.length < 1) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show({
        type: "error",
        text1: "Formulaire incomplet",
        text2: "Veuillez remplir tous les champs requis",
        visibilityTime: 3000,
        autoHide: true,
        topOffset: 100,
      });
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);

    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("No token");

      const updateData = {
        gender,
        fitness_level: niveau,
        goals: objectifs,
        sports,
        availability,
        location,
      };

      await axios.post("http://localhost:8000/api/update-profile", updateData, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 15000,
      });

      if (!mountedRef.current) return;

      CacheManager.setMemoryCache("current_user", null, 0);
      await CacheManager.invalidateCache("current_user");

      await fetchUser(true);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowSuccess(true);

      saveTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current) {
          setShowSuccess(false);
          router.replace("/profile");
        }
      }, 1000) as number;
    } catch (error) {
      console.error("❌ Error saving profile:", error);
      if (mountedRef.current) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Toast.show({
          type: "error",
          text1: "Erreur de sauvegarde",
          text2: "Veuillez réessayer dans quelques instants",
          visibilityTime: 4000,
          autoHide: true,
          topOffset: 100,
        });
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [
    isFocused,
    loading,
    gender,
    niveau,
    sports,
    objectifs,
    availability,
    location,
    router,
    fetchUser,
  ]);

  // ✨ HANDLE TAB CHANGE
  const handleTabChange = useCallback((tab: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActiveTab(tab);
  }, []);

  // ✨ BOUTON SAVE
  const handleSavePress = useCallback(() => {
    if (!isFocused || loading || !isFormValid) return;

    buttonScale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withSpring(1, { damping: 8, stiffness: 200 })
    );

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    handleSave();
  }, [isFocused, loading, isFormValid, handleSave]);

  // ✨ STYLES ANIMÉS
  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
    opacity: buttonOpacity.value,
  }));

  // ✨ EFFET DE LOADING
  useEffect(() => {
    if (loading) {
      buttonOpacity.value = withTiming(0.8, { duration: 200 });
    } else {
      buttonOpacity.value = withTiming(1, { duration: 200 });
    }
  }, [loading]);

  // ✅ BACK HANDLER
  const handleBack = useCallback(() => {
    if (!isFocused) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, [isFocused, router]);

  // ✅ RENDU MINIMAL SI PAS FOCUS
  if (!isFocused) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
        <View style={styles.minimalistContainer}>
          <Text style={styles.minimalistText}>Profil</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.white}
        translucent
      />

      {/* ✨ BEAUTIFUL HEADER */}
      <BeautifulHeader
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onBack={handleBack}
      />

      {/* CONTENT */}
      <View style={styles.contentContainer}>
        {activeTab === "edit" ? (
          <EditProfileTab
            gender={gender}
            setGender={setGender}
            niveau={niveau}
            setNiveau={setNiveau}
            objectifs={objectifs}
            setObjectifs={setObjectifs}
            sports={sports}
            setSports={setSports}
            availability={availability}
            setAvailability={setAvailability}
            toggleSport={toggleSport}
            isFocused={isFocused}
          />
        ) : (
          <PreviewProfileTab
            user={user}
            sports={sports}
            objectifs={objectifs}
            niveau={niveau}
          />
        )}
      </View>

      {/* SAVE BUTTON - Seulement pour l'onglet edit */}
      {activeTab === "edit" && (
        <View style={styles.bottomContainer}>
          <Animated.View style={animatedButtonStyle}>
            <TouchableOpacity
              onPress={handleSavePress}
              disabled={loading || !isFormValid}
              style={[
                styles.saveButton,
                (!isFormValid || loading) && styles.saveButtonDisabled,
              ]}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={
                  !isFormValid || loading
                    ? ["#E5E7EB", "#D1D5DB"]
                    : [COLORS.gradientStart, COLORS.primary]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveButtonGradient}
              >
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator color={COLORS.white} size="small" />
                    <Text style={styles.loadingText}>Sauvegarde...</Text>
                  </View>
                ) : (
                  <View style={styles.saveButtonContent}>
                    <Text style={styles.saveButtonText}>Enregistrer</Text>
                    <View style={styles.iconContainer}>
                      <Ionicons
                        name="checkmark"
                        size={20}
                        color={COLORS.white}
                      />
                    </View>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}

      {/* SUCCESS ANIMATION */}
      <SuccessAnimation
        visible={showSuccess}
        isFocused={isFocused}
        router={router}
      />
    </View>
  );
});

CompleteProfile.displayName = "CompleteProfile";

export default CompleteProfile;

// ✨ STYLES ULTRA MODERNES
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },

  // ✅ STYLES MINIMALISTES
  minimalistContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.lightGray,
  },
  minimalistText: {
    fontSize: 24,
    fontWeight: "600",
    color: COLORS.primary,
  },

  // ✨ BEAUTIFUL HEADER STYLES
  beautifulHeader: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    zIndex: 100,
  },

  headerGradient: {
    paddingTop: StatusBar.currentHeight || 44,
    paddingBottom: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    overflow: "hidden",
  },

  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.glass,
    backdropFilter: "blur(10px)",
  },

  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
  },

  modernBackButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.overlay,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },

  backButtonInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
  },

  ultraModernTabsContainer: {
    flex: 1,
    alignItems: "center",
    position: "relative",
  },

  tabsBackground: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 30,
    padding: 6,
    position: "relative",
    width: width - 120,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },

  modernTabIndicator: {
    position: "absolute",
    top: 6,
    left: 6,
    height: 44,
    width: "48%",
    borderRadius: 22,
    zIndex: 1,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },

  indicatorGradient: {
    flex: 1,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },

  modernTab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    zIndex: 2,
  },

  tabContentWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  tabIcon: {
    marginRight: 6,
  },

  modernTabText: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },

  modernTabTextActive: {
    color: COLORS.white,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  floatingBadge: {
    position: "absolute",
    top: -12,
    right: -20,
    borderRadius: 15,
    overflow: "hidden",
    shadowColor: COLORS.primaryLight,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  badgeGradient: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },

  badgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.white,
    textAlign: "center",
  },

  rightSpacer: {
    width: 44,
  },

  bottomBorder: {
    height: 3,
    marginTop: 10,
    marginHorizontal: 40,
    borderRadius: 2,
    overflow: "hidden",
  },

  borderGradient: {
    flex: 1,
  },

  // ✨ CONTENT STYLES
  contentContainer: {
    flex: 1,
  },

  // ✨ SAVE BUTTON STYLES
  bottomContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(10px)",
    paddingHorizontal: 16,
    paddingVertical: 20,
    paddingBottom: 34,
  },
  saveButton: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  saveButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonGradient: {
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.white,
    marginRight: 8,
  },
  iconContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 12,
    padding: 4,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.white,
    marginLeft: 8,
  },

  // ✨ SUCCESS ANIMATION STYLES
  successOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  successContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 40,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 25,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    minWidth: 280,
    maxWidth: 320,
  },
  checkmarkContainer: {
    marginBottom: 16,
    borderRadius: 50,
    overflow: "hidden",
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 15,
  },
  checkmarkGradient: {
    padding: 8,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  successText: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.success,
    marginBottom: 8,
    textAlign: "center",
  },
});
