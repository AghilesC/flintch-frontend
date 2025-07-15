import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useRef, useState } from "react";
import {
  Animated,
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Defs, Ellipse, RadialGradient, Stop } from "react-native-svg";

const COMMON_GENDERS = [
  "Non-binaire",
  "Agenre",
  "Androgyne",
  "Bigender",
  "Cisgenre",
  "Femme trans",
  "Homme trans",
  "Genderqueer",
  "Genre fluide",
  "Intersexe",
  "Pangender",
  "Queer",
  "Deux-esprits",
  "Demiboy",
  "Demigirl",
  "Transféminin",
  "Transmasculin",
  "Questionnement",
  "Neutrois",
  "Polygender",
  "Autre",
];

type Props = {
  onNext: (data: { gender: string }) => void;
  gender?: string;
  currentStep?: number;
  totalSteps?: number;
  onBack?: () => void;
};

const RegisterStepGender = ({
  onNext,
  gender = "",
  currentStep = 2,
  totalSteps = 8,
  onBack,
}: Props) => {
  const [selected, setSelected] = useState<string>(gender);
  const [showModal, setShowModal] = useState(false);

  // Animations pour chaque bouton
  const femmeScale = useRef(new Animated.Value(1)).current;
  const hommeScale = useRef(new Animated.Value(1)).current;
  const autreScale = useRef(new Animated.Value(1)).current;

  // Fonction générique pour l'animation de bounce
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
    if (selected) onNext({ gender: selected });
  };

  const isOtherSelected =
    COMMON_GENDERS.includes(selected) &&
    selected !== "Femme" &&
    selected !== "Homme";

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

          {/* Plusieurs ellipses pour créer l'effet fumée étendu */}
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
        <View style={styles.content}>
          <Text style={styles.subtitle}>Okay, 28 ans.</Text>
          <Text style={styles.headline}>Et tu es ?</Text>

          <View style={styles.optionsContainer}>
            {/* Femme */}
            <Animated.View style={{ transform: [{ scale: femmeScale }] }}>
              <TouchableOpacity
                onPress={() => {
                  setSelected("Femme");
                  triggerBounce(femmeScale);
                }}
                activeOpacity={0.8}
                style={[
                  styles.optionButton,
                  selected === "Femme" && styles.optionSelected,
                ]}
              >
                <Text
                  style={[
                    styles.optionText,
                    selected === "Femme" && styles.optionTextSelected,
                  ]}
                >
                  Une femme
                </Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Homme */}
            <Animated.View style={{ transform: [{ scale: hommeScale }] }}>
              <TouchableOpacity
                onPress={() => {
                  setSelected("Homme");
                  triggerBounce(hommeScale);
                }}
                activeOpacity={0.8}
                style={[
                  styles.optionButton,
                  selected === "Homme" && styles.optionSelected,
                ]}
              >
                <Text
                  style={[
                    styles.optionText,
                    selected === "Homme" && styles.optionTextSelected,
                  ]}
                >
                  Un homme
                </Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Autre */}
            <Animated.View style={{ transform: [{ scale: autreScale }] }}>
              <TouchableOpacity
                onPress={() => {
                  setShowModal(true);
                  triggerBounce(autreScale);
                }}
                activeOpacity={0.8}
                style={[
                  styles.optionButton,
                  isOtherSelected && styles.optionSelected,
                ]}
              >
                <Text
                  style={[
                    styles.optionText,
                    isOtherSelected && styles.optionTextSelected,
                  ]}
                >
                  {isOtherSelected ? selected : "Autre…"}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.nextButton, { opacity: selected ? 1 : 0.5 }]}
            onPress={handleNext}
            disabled={!selected}
          >
            <Ionicons name="arrow-forward" size={24} color="#FF5135" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal */}
      <Modal visible={showModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choisir un genre</Text>
            <FlatList
              data={COMMON_GENDERS}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setSelected(item);
                    triggerBounce(autreScale);
                    setShowModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      selected === item && styles.modalItemTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              onPress={() => setShowModal(false)}
              style={styles.modalCloseButton}
            >
              <Text style={styles.modalCloseButtonText}>Fermer</Text>
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
    paddingHorizontal: 24,
  },
  content: {
    maxWidth: 380,
    alignSelf: "center",
    width: "100%",
    paddingTop: "10%",
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
  optionsContainer: {
    gap: 16,
  },
  optionButton: {
    borderRadius: 25,
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.4)",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  optionSelected: {
    borderColor: "#FFFFFF",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  optionText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 16,
    fontWeight: "500",
    fontFamily: "Satoshi",
  },
  optionTextSelected: {
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
    borderWidth: 0,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  // Modal Styles adaptés
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
    textAlign: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
    fontFamily: "Satoshi",
  },
  modalItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  modalItemText: {
    color: "rgba(0,0,0,0.7)",
    fontSize: 16,
    textAlign: "center",
    fontFamily: "Satoshi",
  },
  modalItemTextSelected: {
    color: "#FF5135",
    fontWeight: "600",
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

export default RegisterStepGender;
