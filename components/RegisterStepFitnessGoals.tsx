import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useRef, useState } from "react";
import {
  Animated,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Defs, Ellipse, RadialGradient, Stop } from "react-native-svg";

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
  "Ne sait pas encore",
];

type Props = {
  onNext: (data: { fitness_level: string; goals: string[] }) => void;
  fitness_level?: string;
  goals?: string[];
  currentStep?: number;
  totalSteps?: number;
  onBack?: () => void;
};

const RegisterStepFitnessGoals: React.FC<Props> = ({
  onNext,
  fitness_level = "",
  goals = [],
  currentStep = 4,
  totalSteps = 8,
  onBack,
}) => {
  const [niveau, setNiveau] = useState(fitness_level);
  const [selectedGoals, setSelectedGoals] = useState<string[]>(goals);
  const [showNiveauModal, setShowNiveauModal] = useState(false);
  const [showObjectifsModal, setShowObjectifsModal] = useState(false);

  const buttonScale = useRef(new Animated.Value(1)).current;
  const niveauScale = useRef(new Animated.Value(1)).current;
  const objectifsScale = useRef(new Animated.Value(1)).current;

  const isValid =
    niveau && selectedGoals.length > 0 && selectedGoals.length <= 2;

  const triggerBounce = (animValue: Animated.Value) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.timing(animValue, {
        toValue: 1.05,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(animValue, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleNext = () => {
    if (isValid) {
      triggerBounce(buttonScale);
      onNext({ fitness_level: niveau, goals: selectedGoals });
    }
  };

  const handleGoalToggle = (goal: string) => {
    setSelectedGoals((prev) => {
      // Si on clique sur "Ne sait pas encore"
      if (goal === "Ne sait pas encore") {
        if (prev.includes(goal)) {
          // Désélectionner "Ne sait pas encore"
          return prev.filter((g) => g !== goal);
        } else {
          // Sélectionner seulement "Ne sait pas encore" et vider le reste
          return [goal];
        }
      }

      // Si on clique sur autre chose que "Ne sait pas encore"
      if (prev.includes(goal)) {
        // Désélectionner l'objectif
        return prev.filter((g) => g !== goal);
      } else {
        // Si "Ne sait pas encore" est déjà sélectionné, le remplacer par le nouveau choix
        if (prev.includes("Ne sait pas encore")) {
          return [goal];
        }
        // Sinon, ajouter l'objectif si on n'a pas atteint la limite de 2
        else if (prev.length < 2) {
          return [...prev, goal];
        }
      }
      return prev;
    });
  };

  return (
    <View style={styles.container}>
      {/* Effet fumée blanche en haut à droite */}
      <View style={styles.smokeContainer}>
        <Svg height="100%" width="100%" style={StyleSheet.absoluteFillObject}>
          <Defs>
            <RadialGradient id="smoke1" cx="85%" cy="15%" r="75%">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
              <Stop offset="25%" stopColor="#FFFFFF" stopOpacity="0.3" />
              <Stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.2" />
              <Stop offset="75%" stopColor="#FFFFFF" stopOpacity="0.1" />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </RadialGradient>
            <RadialGradient id="smoke2" cx="70%" cy="25%" r="60%">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.35" />
              <Stop offset="40%" stopColor="#FFFFFF" stopOpacity="0.2" />
              <Stop offset="80%" stopColor="#FFFFFF" stopOpacity="0.08" />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </RadialGradient>
            <RadialGradient id="smoke3" cx="95%" cy="5%" r="55%">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.45" />
              <Stop offset="30%" stopColor="#FFFFFF" stopOpacity="0.25" />
              <Stop offset="70%" stopColor="#FFFFFF" stopOpacity="0.1" />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </RadialGradient>
            <RadialGradient id="smoke4" cx="60%" cy="35%" r="50%">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.25" />
              <Stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.12" />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </RadialGradient>
          </Defs>

          <Ellipse
            cx="85%"
            cy="15%"
            rx="75%"
            ry="60%"
            fill="url(#smoke1)"
            transform="rotate(25 85 15)"
          />
          <Ellipse
            cx="70%"
            cy="25%"
            rx="60%"
            ry="45%"
            fill="url(#smoke2)"
            transform="rotate(-15 70 25)"
          />
          <Ellipse
            cx="95%"
            cy="5%"
            rx="55%"
            ry="40%"
            fill="url(#smoke3)"
            transform="rotate(45 95 5)"
          />
          <Ellipse
            cx="60%"
            cy="35%"
            rx="50%"
            ry="35%"
            fill="url(#smoke4)"
            transform="rotate(-25 60 35)"
          />
        </Svg>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          {onBack && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={onBack}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          <View style={styles.progressContainer}>
            {[...Array(totalSteps + 1)].map((_, index) => (
              <View
                key={index}
                style={[
                  styles.progressSegment,
                  index <= currentStep && styles.progressSegmentActive,
                ]}
              />
            ))}
          </View>
        </View>
      </View>

      <View style={styles.contentWrapper}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.subtitle}>C'est noté !</Text>
          <Text style={styles.headline}>
            Maintenant, parlons de ton niveau sportif et de tes objectifs !
          </Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Niveau sportif</Text>
            <Animated.View style={{ transform: [{ scale: niveauScale }] }}>
              <TouchableOpacity
                style={[
                  styles.dropdownButton,
                  niveau && styles.dropdownButtonSelected,
                ]}
                onPress={() => {
                  setShowNiveauModal(true);
                  triggerBounce(niveauScale);
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.dropdownText,
                    niveau && styles.dropdownTextSelected,
                  ]}
                >
                  {niveau || "Sélectionner votre niveau"}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={18}
                  color={niveau ? "#FFFFFF" : "rgba(255, 255, 255, 0.8)"}
                />
              </TouchableOpacity>
            </Animated.View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {selectedGoals.includes("Ne sait pas encore")
                ? "Objectif (exclusif)"
                : `Objectif(s) (${selectedGoals.length}/2)`}
            </Text>
            <Animated.View style={{ transform: [{ scale: objectifsScale }] }}>
              <TouchableOpacity
                style={[
                  styles.dropdownButton,
                  selectedGoals.length > 0 && styles.dropdownButtonSelected,
                ]}
                onPress={() => {
                  setShowObjectifsModal(true);
                  triggerBounce(objectifsScale);
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.dropdownText,
                    selectedGoals.length > 0 && styles.dropdownTextSelected,
                  ]}
                >
                  {selectedGoals.length > 0
                    ? selectedGoals.join(", ")
                    : "Sélectionner vos objectifs"}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={18}
                  color={
                    selectedGoals.length > 0
                      ? "#FFFFFF"
                      : "rgba(255, 255, 255, 0.8)"
                  }
                />
              </TouchableOpacity>
            </Animated.View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity
              style={[styles.nextButton, { opacity: isValid ? 1 : 0.5 }]}
              onPress={handleNext}
              disabled={!isValid}
            >
              <Ionicons name="arrow-forward" size={24} color="#FF5135" />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>

      {/* Modal Niveau Sportif */}
      <Modal visible={showNiveauModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choisir votre niveau sportif</Text>
            <FlatList
              data={niveauxList}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setNiveau(item);
                    triggerBounce(niveauScale);
                    setShowNiveauModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      niveau === item && styles.modalItemTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                  {niveau === item && (
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color="#FF5135"
                    />
                  )}
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              onPress={() => setShowNiveauModal(false)}
              style={styles.modalCloseButton}
            >
              <Text style={styles.modalCloseButtonText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Objectifs */}
      <Modal visible={showObjectifsModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choisir vos objectifs (max 2)</Text>
            <Text style={styles.modalSubtitle}>
              {selectedGoals.length}/2 sélectionné(s)
            </Text>
            <FlatList
              data={objectifsList}
              keyExtractor={(item) => item}
              renderItem={({ item }) => {
                const isSelected = selectedGoals.includes(item);
                const hasUnsureGoal =
                  selectedGoals.includes("Ne sait pas encore");
                const isUnsureGoal = item === "Ne sait pas encore";

                // Logique de désactivation :
                // - Si "Ne sait pas encore" est sélectionné, désactiver tous les autres
                // - Si un autre objectif est sélectionné, désactiver "Ne sait pas encore"
                // - Si on a déjà 2 objectifs (hors "Ne sait pas encore"), désactiver les non-sélectionnés
                const canSelect =
                  isSelected ||
                  (isUnsureGoal &&
                    !hasUnsureGoal &&
                    selectedGoals.length === 0) ||
                  (!isUnsureGoal &&
                    !hasUnsureGoal &&
                    selectedGoals.length < 2) ||
                  (isUnsureGoal && hasUnsureGoal) ||
                  (!isUnsureGoal &&
                    hasUnsureGoal &&
                    selectedGoals.length === 1);

                return (
                  <TouchableOpacity
                    style={[
                      styles.modalItem,
                      !canSelect && styles.modalItemDisabled,
                    ]}
                    onPress={() => canSelect && handleGoalToggle(item)}
                    disabled={!canSelect}
                  >
                    <Text
                      style={[
                        styles.modalItemText,
                        isSelected && styles.modalItemTextSelected,
                        !canSelect && styles.modalItemTextDisabled,
                      ]}
                    >
                      {item}
                    </Text>
                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={18}
                        color="#FF5135"
                      />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
            <TouchableOpacity
              onPress={() => setShowObjectifsModal(false)}
              style={styles.modalCloseButton}
            >
              <Text style={styles.modalCloseButtonText}>Confirmer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FF5135",
  },
  smokeContainer: {
    position: "absolute",
    top: 0,
    right: 0,
    width: "100%",
    height: "80%",
    zIndex: 0,
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 45 : 35,
    paddingBottom: 10,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    zIndex: 1,
  },
  progressContainer: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
  },
  progressSegment: {
    flex: 1,
    height: 3,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 2,
  },
  progressSegmentActive: {
    backgroundColor: "#FFFFFF",
  },
  contentWrapper: {
    flex: 1,
    justifyContent: "space-between",
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
  },
  headline: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 18,
    color: "#FFFFFF",
    textAlign: "center",
    fontFamily: "Satoshi",
    lineHeight: 30,
  },
  subtitle: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 15,
    marginBottom: 8,
    textAlign: "center",
    lineHeight: 22,
    fontFamily: "Satoshi",
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
    color: "#FFFFFF",
    fontFamily: "Satoshi",
  },
  dropdownButton: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  dropdownButtonSelected: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  dropdownText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
    fontFamily: "Satoshi",
    flex: 1,
  },
  dropdownTextSelected: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  footer: {
    justifyContent: "flex-end",
    alignItems: "flex-end",
    paddingBottom: 40,
    paddingTop: 20,
    paddingHorizontal: 24,
  },
  nextButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    maxHeight: "70%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
    padding: 20,
    paddingBottom: 10,
    textAlign: "center",
    fontFamily: "Satoshi",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "rgba(0,0,0,0.6)",
    paddingHorizontal: 20,
    paddingBottom: 10,
    textAlign: "center",
    fontFamily: "Satoshi",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  modalItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalItemDisabled: {
    opacity: 0.5,
  },
  modalItemText: {
    color: "rgba(0,0,0,0.7)",
    fontSize: 16,
    fontFamily: "Satoshi",
    flex: 1,
  },
  modalItemTextSelected: {
    color: "#FF5135",
    fontWeight: "600",
  },
  modalItemTextDisabled: {
    color: "rgba(0,0,0,0.3)",
  },
  modalCloseButton: {
    backgroundColor: "#FF5135",
    padding: 16,
  },
  modalCloseButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    textAlign: "center",
    fontSize: 16,
    fontFamily: "Satoshi",
  },
});

export default RegisterStepFitnessGoals;
