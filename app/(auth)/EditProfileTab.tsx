import DisponibiliteGrille from "@/components/DisponibiliteGrille";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Dimensions,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
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

const { width } = Dimensions.get("window");

// ✨ COULEURS
const COLORS = {
  primary: "#FF5135",
  primaryLight: "#FF7A5C",
  primaryDark: "#E63E1F",
  accent: "#FF8A6B",
  gradientStart: "#FF5135",
  gradientEnd: "#FF8A6B",
  skyBlue: "#4CCAF1",
  midnight: "#092C44",
  white: "#FFFFFF",
  lightGray: "#F8F9FA",
  softGray: "#F1F3F4",
  cardShadow: "rgba(255, 81, 53, 0.15)",
  overlay: "rgba(255, 81, 53, 0.1)",
  overlayDark: "rgba(0, 0, 0, 0.4)",
  success: "#4CAF50",
  error: "#FF5135",
  textSecondary: "#6C7B7F",
  textPrimary: "#2D3748",
  gradientCard1: "#FFFFFF",
  gradientCard2: "#FFF7F5",
};

// ✅ DONNÉES STATIQUES
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

const genderList = ["Homme", "Femme", "Non-binaire", "Autre"];

// ✅ INTERFACES TYPESCRIPT
interface AnimatedCardProps {
  children: React.ReactNode;
  delay?: number;
  style?: ViewStyle;
  isFocused: boolean;
}

interface AnimatedSportChipProps {
  sport: string;
  selected: boolean;
  onPress: () => void;
  isFocused: boolean;
}

interface DropdownSelectorProps {
  label: string;
  options: string[];
  selected: string[];
  onSelect: (values: string[]) => void;
  multiple?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  isFocused: boolean;
}

interface EditProfileTabProps {
  gender: string;
  setGender: (gender: string) => void;
  niveau: string;
  setNiveau: (niveau: string) => void;
  objectifs: string[];
  setObjectifs: (objectifs: string[]) => void;
  sports: string[];
  setSports: (sports: string[]) => void;
  availability: any;
  setAvailability: (availability: any) => void;
  toggleSport: (sport: string) => void;
  isFocused: boolean;
}

// ---- Animated Card Component ---- //
const AnimatedCard = React.memo<AnimatedCardProps>(
  ({ children, delay = 0, style, isFocused }) => {
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(30);
    const scale = useSharedValue(0.95);

    useEffect(() => {
      if (!isFocused) {
        opacity.value = 1;
        translateY.value = 0;
        scale.value = 1;
        return;
      }

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
    }, [delay, isFocused]);

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
  }
);

// ---- Animated Sport Chip ---- //
const AnimatedSportChip = React.memo<AnimatedSportChipProps>(
  ({ sport, selected, onPress, isFocused }) => {
    const scale = useSharedValue(1);
    const rotation = useSharedValue(0);

    const handlePress = useCallback(() => {
      if (!isFocused) return;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      scale.value = withSequence(
        withTiming(0.95, { duration: 100 }),
        withSpring(1.1, { damping: 6, stiffness: 200 }),
        withSpring(1, { damping: 8, stiffness: 200 })
      );

      if (!selected) {
        rotation.value = withSequence(
          withTiming(5, { duration: 150 }),
          withTiming(-5, { duration: 150 }),
          withTiming(0, { duration: 150 })
        );
      }

      onPress();
    }, [onPress, selected, isFocused]);

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
  }
);

// ---- Enhanced DropdownSelector ---- //
const DropdownSelector = React.memo<DropdownSelectorProps>(
  ({
    label,
    options,
    selected,
    onSelect,
    multiple = false,
    icon,
    isFocused,
  }) => {
    const [visible, setVisible] = useState(false);
    const [tempSelected, setTempSelected] = useState(selected);

    const focusScale = useSharedValue(1);

    const isObjectif = useMemo(() => label === "Objectif(s)", [label]);
    const isGenre = useMemo(() => label === "Genre", [label]);
    const isNiveau = useMemo(() => label === "Niveau sportif", [label]);

    const openModal = useCallback(() => {
      if (!isFocused) return;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      focusScale.value = withSequence(
        withTiming(0.98, { duration: 100 }),
        withTiming(1, { duration: 100 })
      );
      setTempSelected(selected);
      setVisible(true);
    }, [isFocused, selected]);

    const toggleValue = useCallback(
      (val: string) => {
        if (!isFocused) return;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        setTempSelected((prev: string[]) => {
          if (isGenre || isNiveau) {
            return [val];
          } else if (prev.includes(val)) {
            return prev.filter((v: string) => v !== val);
          } else {
            if (isObjectif && prev.length >= 2) return prev;
            return [...prev, val];
          }
        });
      },
      [isGenre, isNiveau, isObjectif, isFocused]
    );

    const canValidate = useMemo(() => {
      return isGenre || isNiveau
        ? tempSelected.length === 1
        : !isObjectif || tempSelected.length >= 1;
    }, [isGenre, isNiveau, isObjectif, tempSelected.length]);

    const handleValidate = useCallback(() => {
      if (canValidate && isFocused) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onSelect(tempSelected);
        setVisible(false);
      }
    }, [canValidate, onSelect, tempSelected, isFocused]);

    const getPlaceholder = useMemo(() => {
      if (isGenre) return "Ton genre";
      if (isNiveau) return "Ton niveau";
      if (isObjectif) return "Tes objectifs";
      return `Sélectionner ${label.toLowerCase()}`;
    }, [isGenre, isNiveau, isObjectif, label]);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: focusScale.value }],
    }));

    const renderModalItem = useCallback(
      ({ item }: { item: string }) => {
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
              <Ionicons name="checkmark" size={20} color={COLORS.primary} />
            )}
          </TouchableOpacity>
        );
      },
      [tempSelected, isGenre, isNiveau, isObjectif, toggleValue]
    );

    const keyExtractor = useCallback((item: string) => item, []);

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
                  name={icon}
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
                {selected.length > 0 ? selected.join(", ") : getPlaceholder}
              </Text>
            </View>
            <Ionicons
              name="chevron-down"
              size={20}
              color={
                selected.length > 0 ? COLORS.primary : COLORS.textSecondary
              }
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
                  <Ionicons
                    name="close"
                    size={24}
                    color={COLORS.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              <FlatList
                data={options}
                keyExtractor={keyExtractor}
                showsVerticalScrollIndicator={false}
                renderItem={renderModalItem}
                removeClippedSubviews={true}
                maxToRenderPerBatch={10}
                windowSize={10}
                initialNumToRender={10}
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
  }
);

// ✨ COMPOSANT PRINCIPAL EDIT TAB
const EditProfileTab = React.memo<EditProfileTabProps>(
  ({
    gender,
    setGender,
    niveau,
    setNiveau,
    objectifs,
    setObjectifs,
    sports,
    setSports,
    availability,
    setAvailability,
    toggleSport,
    isFocused,
  }) => {
    const sportsCount = useMemo(() => sports.length, [sports.length]);

    // ✅ RENDER FUNCTIONS
    const renderSportChip = useCallback(
      (sport: string, index: number) => (
        <AnimatedSportChip
          key={`${sport}-${index}`}
          sport={sport}
          selected={sports.includes(sport)}
          onPress={() => toggleSport(sport)}
          isFocused={isFocused}
        />
      ),
      [sports, toggleSport, isFocused]
    );

    return (
      <ScrollView
        style={styles.tabContent}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        scrollEventThrottle={16}
      >
        {/* Personal Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations personnelles</Text>
          <AnimatedCard delay={200} isFocused={isFocused}>
            <View style={styles.card}>
              <DropdownSelector
                label="Genre"
                selected={gender ? [gender] : []}
                options={genderList}
                onSelect={(arr: string[]) => setGender(arr[0] || "")}
                icon="person-outline"
                isFocused={isFocused}
              />
              <DropdownSelector
                label="Niveau sportif"
                selected={niveau ? [niveau] : []}
                options={niveauxList}
                onSelect={(arr: string[]) => setNiveau(arr[0] || "")}
                icon="fitness-outline"
                isFocused={isFocused}
              />
            </View>
          </AnimatedCard>
        </View>

        {/* Goals Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tes objectifs</Text>
          <AnimatedCard delay={400} isFocused={isFocused}>
            <View style={styles.card}>
              <DropdownSelector
                label="Objectif(s)"
                selected={objectifs}
                options={objectifsList}
                onSelect={setObjectifs}
                multiple
                icon="heart-outline"
                isFocused={isFocused}
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
          <AnimatedCard delay={600} isFocused={isFocused}>
            <View style={styles.card}>
              <Text style={styles.subsectionTitle}>
                Choisis tes sports favoris ({sportsCount}/5)
              </Text>
              <View style={styles.sportsGrid}>
                {sportsList.map(renderSportChip)}
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
          <AnimatedCard delay={800} isFocused={isFocused}>
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
    );
  }
);

EditProfileTab.displayName = "EditProfileTab";

export default EditProfileTab;

// ✨ STYLES
const styles = StyleSheet.create({
  tabContent: {
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
    letterSpacing: 0.5,
  },
  cardGradient: {
    borderRadius: 20,
    padding: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 81, 53, 0.1)",
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
    backgroundColor: "rgba(255, 247, 245, 0.9)",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
    backgroundColor: COLORS.overlayDark,
    justifyContent: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    maxHeight: "80%",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 25,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: COLORS.gradientCard2,
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
    backgroundColor: COLORS.gradientCard2,
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
    color: COLORS.primary,
    fontWeight: "500",
  },
  modalOptionTextDisabled: {
    color: COLORS.textSecondary,
  },
  modalValidateButton: {
    marginHorizontal: 20,
    marginVertical: 16,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalValidateButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  modalValidateButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.white,
    textAlign: "center",
    paddingVertical: 16,
    backgroundColor: COLORS.primary,
  },
  modalValidateButtonTextDisabled: {
    color: COLORS.textSecondary,
    backgroundColor: "#E5E7EB",
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
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
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
});
