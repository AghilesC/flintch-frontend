import DisponibiliteGrille from "@/components/DisponibiliteGrille";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import Toast from "react-native-toast-message";

const { width } = Dimensions.get("window");

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
  success: "#4CAF50",
  error: "#FF5135",
  textSecondary: "#6C7B7F",
  gradientCard1: "#FFFFFF",
  gradientCard2: "#F0F7FF",
};

// ---- Animated Card Component ---- //
interface AnimatedCardProps {
  children: React.ReactNode;
  delay?: number;
  style?: any;
}

const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  delay = 0,
  style,
}) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);
  const scale = useSharedValue(0.95);

  useEffect(() => {
    // Reveal animation only
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) })
    );
    translateY.value = withDelay(
      delay,
      withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) })
    );
    scale.value = withDelay(
      delay,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) })
    );
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>
      <LinearGradient
        colors={[COLORS.gradientCard1, COLORS.gradientCard2]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardGradient}
      >
        {children}
      </LinearGradient>
    </Animated.View>
  );
};

// ---- Animated Sport Chip ---- //
interface AnimatedSportChipProps {
  sport: string;
  selected: boolean;
  onPress: () => void;
}

const AnimatedSportChip: React.FC<AnimatedSportChipProps> = ({
  sport,
  selected,
  onPress,
}) => {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  const handlePress = () => {
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Bouncy animation
    scale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withSpring(1.1, { damping: 6, stiffness: 200 }),
      withSpring(1, { damping: 8, stiffness: 200 })
    );

    // Subtle rotation on selection
    if (!selected) {
      rotation.value = withSequence(
        withTiming(5, { duration: 150 }),
        withTiming(-5, { duration: 150 }),
        withTiming(0, { duration: 150 })
      );
    }

    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        style={[styles.sportChip, selected && styles.sportChipSelected]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <Text
          style={[
            styles.sportChipText,
            selected && styles.sportChipTextSelected,
          ]}
        >
          {sport}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ---- Success Animation Component ---- //
const SuccessAnimation: React.FC<{ visible: boolean }> = ({ visible }) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = withSequence(
        withTiming(0, { duration: 0 }),
        withSpring(1.2, { damping: 6, stiffness: 200 }),
        withSpring(1, { damping: 8, stiffness: 200 })
      );
      opacity.value = withTiming(1, { duration: 300 });
      rotation.value = withSequence(
        withTiming(360, { duration: 600, easing: Easing.out(Easing.cubic) }),
        withTiming(0, { duration: 0 })
      );

      // Auto hide after animation
      setTimeout(() => {
        opacity.value = withTiming(0, { duration: 500 });
        scale.value = withTiming(0, { duration: 500 });
      }, 2000);
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }, { rotate: `${rotation.value}deg` }],
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.successOverlay, animatedStyle]}>
      <View style={styles.successContainer}>
        <Ionicons name="checkmark-circle" size={80} color={COLORS.success} />
        <Text style={styles.successText}>Profil sauvegardé !</Text>
      </View>
    </Animated.View>
  );
};

// ---- Enhanced DropdownSelector ---- //
interface DropdownSelectorProps {
  label: string;
  options: string[];
  selected: string[];
  onSelect: (value: string[]) => void;
  multiple?: boolean;
  icon?: string;
}

const DropdownSelector: React.FC<DropdownSelectorProps> = ({
  label,
  options,
  selected,
  onSelect,
  multiple = false,
  icon,
}) => {
  const [visible, setVisible] = useState(false);
  const isObjectif = label === "Objectif(s)";
  const isGenre = label === "Genre";
  const isNiveau = label === "Niveau sportif";
  const [tempSelected, setTempSelected] = useState<string[]>(selected);

  const focusScale = useSharedValue(1);

  const openModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    focusScale.value = withSequence(
      withTiming(0.98, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );
    setTempSelected(selected);
    setVisible(true);
  };

  const toggleValue = (val: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (isGenre || isNiveau) {
      setTempSelected([val]);
    } else if (tempSelected.includes(val)) {
      setTempSelected(tempSelected.filter((v) => v !== val));
    } else {
      if (isObjectif && tempSelected.length >= 2) return;
      setTempSelected([...tempSelected, val]);
    }
  };

  const canValidate =
    isGenre || isNiveau
      ? tempSelected.length === 1
      : !isObjectif || tempSelected.length >= 1;

  const handleValidate = () => {
    if (canValidate) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSelect(tempSelected);
      setVisible(false);
    }
  };

  const getPlaceholder = () => {
    if (isGenre) return "Ton genre";
    if (isNiveau) return "Ton niveau";
    if (isObjectif) return "Tes objectifs";
    return `Sélectionner ${label.toLowerCase()}`;
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: focusScale.value }],
  }));

  return (
    <View style={styles.selectorContainer}>
      <Text style={styles.selectorLabel}>{label}</Text>
      <Animated.View style={animatedStyle}>
        <TouchableOpacity
          style={[
            styles.selector,
            selected.length > 0 && styles.selectorSelected,
          ]}
          onPress={openModal}
          activeOpacity={0.7}
        >
          <View style={styles.selectorContent}>
            {icon && (
              <Ionicons
                name={icon as any}
                size={20}
                color={
                  selected.length > 0 ? COLORS.primary : COLORS.textSecondary
                }
                style={styles.selectorIcon}
              />
            )}
            <Text
              style={[
                styles.selectorText,
                selected.length > 0 && styles.selectorTextSelected,
              ]}
              numberOfLines={1}
            >
              {selected.length > 0 ? selected.join(", ") : getPlaceholder()}
            </Text>
          </View>
          <Ionicons
            name="chevron-down"
            size={20}
            color={selected.length > 0 ? COLORS.primary : COLORS.textSecondary}
          />
        </TouchableOpacity>
      </Animated.View>

      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Sélectionner {label.toLowerCase()}
              </Text>
              <TouchableOpacity
                onPress={() => setVisible(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={options}
              keyExtractor={(item) => item}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected = tempSelected.includes(item);
                const isDisabled =
                  isGenre || isNiveau
                    ? false
                    : isObjectif && !isSelected && tempSelected.length >= 2;

                return (
                  <TouchableOpacity
                    style={[
                      styles.modalOption,
                      isSelected && styles.modalOptionSelected,
                      isDisabled && styles.modalOptionDisabled,
                    ]}
                    onPress={() => toggleValue(item)}
                    disabled={isDisabled}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        isSelected && styles.modalOptionTextSelected,
                        isDisabled && styles.modalOptionTextDisabled,
                      ]}
                    >
                      {item}
                    </Text>
                    {isSelected && (
                      <Ionicons
                        name="checkmark"
                        size={20}
                        color={COLORS.accent}
                      />
                    )}
                  </TouchableOpacity>
                );
              }}
            />

            <TouchableOpacity
              style={[
                styles.modalValidateButton,
                !canValidate && styles.modalValidateButtonDisabled,
              ]}
              disabled={!canValidate}
              onPress={handleValidate}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.modalValidateButtonText,
                  !canValidate && styles.modalValidateButtonTextDisabled,
                ]}
              >
                Valider
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const sportsList = [
  "🏀 Basket",
  "⚽ Foot",
  "🏐 Volley",
  "🎾 Tennis",
  "🏓 Ping-pong",
  "🏋️ Muscu",
  "🤸 Gym",
  "🏃 Course",
  "🚴 Vélo",
  "🧘 Yoga",
  "⛹️ CrossFit",
  "🥊 Boxe",
  "🥋 Judo",
  "🧗 Escalade",
  "🏄 Surf",
  "🏊 Natation",
  "🎿 Ski",
  "🏌️ Golf",
  "🧍 Stretching",
  "🚶 Marche",
];

const niveauxList = [
  "N'a même pas commencé",
  "Extrêmement débutant",
  "Débutant",
  "Intermédiaire léger",
  "Intermédiaire confirmé",
  "Avancé",
  "Régulièrement",
  "Athlète confirmé",
];

const objectifsList = [
  "Perte de poids",
  "Prise de masse",
  "Cardio",
  "Sèche",
  "Renforcement musculaire",
  "Souplesse",
  "Endurance",
  "Stabilité mentale",
  "Santé générale",
  "Préparation compétition",
  "Remise en forme",
  "Bien-être",
  "Se défouler",
  "Socialiser",
  "Découverte sportive",
  "Performance",
  "Musculation esthétique",
  "Confiance en soi",
  "Prendre du plaisir",
  "Récupération/blessure",
];

export default function CompleteProfile() {
  const [gender, setGender] = useState<string>("");
  const [niveau, setNiveau] = useState<string>("");
  const [objectifs, setObjectifs] = useState<string[]>([]);
  const [sports, setSports] = useState<string[]>([]);
  const [availability, setAvailability] = useState<any>(null);
  const [location, setLocation] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const router = useRouter();

  const parseArray = (val: any) => {
    if (Array.isArray(val)) return val;
    if (typeof val === "string" && val.startsWith("[")) {
      try {
        const arr = JSON.parse(val);
        if (Array.isArray(arr) && typeof arr[0] === "string") return arr;
        if (Array.isArray(arr) && Array.isArray(arr[0])) return arr[0];
      } catch (e) {}
    }
    return [];
  };

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem("token");
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const locationData = await Location.getCurrentPositionAsync({});
        const coords = `${locationData.coords.latitude},${locationData.coords.longitude}`;
        setLocation(coords);
      }
      try {
        const response = await axios.get("http://localhost:8000/api/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = response.data;
        setGender(data.gender || "");
        setNiveau(data.fitness_level || "");
        setObjectifs(parseArray(data.goals));
        setSports(parseArray(data.sports));
        setAvailability(data.availability || {});
      } catch (error) {
        Toast.show({
          type: "error",
          text1: "Erreur",
          text2: "Impossible de charger les données",
        });
      }
    })();
  }, []);

  const toggleSport = (sport: string) => {
    if (sports.includes(sport)) {
      if (sports.length === 1) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Toast.show({
          type: "info",
          text1: "Minimum requis",
          text2: "Au moins 1 sport doit être sélectionné",
        });
        return;
      }
      setSports((prev) => prev.filter((s) => s !== sport));
    } else {
      if (sports.length >= 5) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Toast.show({
          type: "info",
          text1: "Maximum atteint",
          text2: "5 sports maximum",
        });
        return;
      }
      setSports((prev) => [...prev, sport]);
    }
  };

  const handleSave = async () => {
    if (!gender || !niveau || sports.length < 1 || objectifs.length < 1) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show({
        type: "error",
        text1: "Formulaire incomplet",
        text2: "Veuillez remplir tous les champs",
      });
      return;
    }

    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const token = await AsyncStorage.getItem("token");
      await axios.post(
        "http://localhost:8000/api/update-profile",
        {
          gender,
          fitness_level: niveau,
          goals: objectifs,
          sports,
          availability,
          location,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setShowSuccess(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      setTimeout(() => {
        router.push("/profile");
      }, 2500);
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Une erreur est survenue",
      });
    }
    setLoading(false);
  };

  const isFormValid =
    gender && niveau && sports.length > 0 && objectifs.length > 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Animated Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerBackground}>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.back();
                }}
                style={styles.backButton}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
              </TouchableOpacity>

              <View style={styles.titleContainer}>
                <Text style={styles.headerTitle}>Modifier le profil</Text>
              </View>

              <View style={styles.rightSpacer} />
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Personal Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations personnelles</Text>
          <AnimatedCard delay={200}>
            <View style={styles.card}>
              <DropdownSelector
                label="Genre"
                selected={gender ? [gender] : []}
                options={["Homme", "Femme", "Non-binaire", "Autre"]}
                onSelect={(arr) => setGender(arr[0] || "")}
                icon="person-outline"
              />
              <DropdownSelector
                label="Niveau sportif"
                selected={niveau ? [niveau] : []}
                options={niveauxList}
                onSelect={(arr) => setNiveau(arr[0] || "")}
                icon="fitness-outline"
              />
            </View>
          </AnimatedCard>
        </View>

        {/* Goals Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tes objectifs</Text>
          <AnimatedCard delay={400}>
            <View style={styles.card}>
              <DropdownSelector
                label="Objectif(s)"
                selected={objectifs}
                options={objectifsList}
                onSelect={setObjectifs}
                multiple
                icon="heart-outline"
              />
              <Text style={styles.helperText}>
                Sélectionne jusqu'à 2 objectifs principaux
              </Text>
            </View>
          </AnimatedCard>
        </View>

        {/* Sports Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sports pratiqués</Text>
          <AnimatedCard delay={600}>
            <View style={styles.card}>
              <Text style={styles.subsectionTitle}>
                Choisis tes sports favoris ({sports.length}/5)
              </Text>
              <View style={styles.sportsGrid}>
                {sportsList.map((sport, i) => (
                  <AnimatedSportChip
                    key={i}
                    sport={sport}
                    selected={sports.includes(sport)}
                    onPress={() => toggleSport(sport)}
                  />
                ))}
              </View>
              <Text style={styles.helperText}>
                Minimum 1 sport, maximum 5 sports
              </Text>
            </View>
          </AnimatedCard>
        </View>

        {/* Availability Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Disponibilités</Text>
          <AnimatedCard delay={800}>
            <View style={styles.card}>
              <Text style={styles.subsectionTitle}>
                Quand es-tu disponible pour t'entraîner ?
              </Text>
              <View style={styles.availabilityContainer}>
                <DisponibiliteGrille
                  onChange={setAvailability}
                  initial={availability}
                />
              </View>
            </View>
          </AnimatedCard>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          onPress={handleSave}
          disabled={loading || !isFormValid}
          style={[
            styles.saveButton,
            (!isFormValid || loading) && styles.saveButtonDisabled,
          ]}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} size="small" />
          ) : (
            <>
              <Text style={styles.saveButtonText}>Enregistrer</Text>
              <Ionicons name="checkmark" size={20} color={COLORS.white} />
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Success Animation Overlay */}
      <SuccessAnimation visible={showSuccess} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  headerContainer: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderRadius: 0, // Pas de border radius
  },
  headerBackground: {
    backgroundColor: COLORS.white,
    borderRadius: 0, // Pas de border radius
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 10, // Encore plus réduit
    paddingBottom: 8, // Très fin
    backgroundColor: "transparent",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.lightGray,
    justifyContent: "center",
    alignItems: "center",
  },
  titleContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.primary,
    textAlign: "center",
  },
  rightSpacer: {
    width: 40, // Même largeur que le bouton retour pour équilibrer
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 120,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: 16,
  },
  cardGradient: {
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  card: {
    backgroundColor: "transparent",
  },
  selectorContainer: {
    marginBottom: 20,
  },
  selectorLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.midnight,
    marginBottom: 8,
  },
  selector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
  },
  selectorSelected: {
    borderColor: COLORS.primary,
    backgroundColor: "rgba(240, 247, 255, 0.9)",
  },
  selectorContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  selectorIcon: {
    marginRight: 12,
  },
  selectorText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    flex: 1,
  },
  selectorTextSelected: {
    color: COLORS.primary,
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    maxHeight: "80%",
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.primary,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.lightGray,
    justifyContent: "center",
    alignItems: "center",
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  modalOptionSelected: {
    backgroundColor: "#FFF7F5",
  },
  modalOptionDisabled: {
    opacity: 0.5,
  },
  modalOptionText: {
    fontSize: 16,
    color: COLORS.midnight,
    flex: 1,
  },
  modalOptionTextSelected: {
    color: COLORS.accent,
    fontWeight: "500",
  },
  modalOptionTextDisabled: {
    color: COLORS.textSecondary,
  },
  modalValidateButton: {
    backgroundColor: COLORS.accent,
    marginHorizontal: 20,
    marginVertical: 16,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  modalValidateButtonDisabled: {
    backgroundColor: "#E5E7EB",
  },
  modalValidateButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.white,
  },
  modalValidateButtonTextDisabled: {
    color: COLORS.textSecondary,
  },
  subsectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.midnight,
    marginBottom: 16,
  },
  helperText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
    fontStyle: "italic",
  },
  sportsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  sportChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    marginBottom: 8,
  },
  sportChipSelected: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accent,
  },
  sportChipText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.midnight,
  },
  sportChipTextSelected: {
    color: COLORS.white,
    fontWeight: "600",
  },
  availabilityContainer: {
    backgroundColor: "rgba(248, 249, 250, 0.8)",
    borderRadius: 16,
    padding: 16,
  },
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
    backgroundColor: COLORS.accent,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 20,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  saveButtonDisabled: {
    backgroundColor: "#E5E7EB",
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.white,
    marginRight: 8,
  },
  successOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent", // Enlevé le background sombre
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  successContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 40,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  successText: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.success,
    marginTop: 16,
  },
});
