import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useRef, useState } from "react";
import {
  Animated,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

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
};

const RegisterStepGender = ({ onNext, gender = "" }: Props) => {
  const [selected, setSelected] = useState<string>(gender);
  const [showModal, setShowModal] = useState(false);

  // MODIFIÉ: Une animation par bouton
  const femmeScale = useRef(new Animated.Value(1)).current;
  const hommeScale = useRef(new Animated.Value(1)).current;
  const autreScale = useRef(new Animated.Value(1)).current;

  // NOUVEAU: Fonction générique pour l'animation de bounce
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
    <LinearGradient
      colors={["#FFA958", "#FF5135"]}
      start={{ x: 1, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.fullScreenGradient}
    >
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.headline}>
            Quel est le genre qui te décrit le mieux ?
          </Text>
          <Text style={styles.subtitle}>
            Cette information reste privée et nous aide à personnaliser ton
            expérience.
          </Text>

          {/* MODIFIÉ: Le conteneur n'est plus animé */}
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
                <LinearGradient
                  colors={["rgba(255,255,255,0.1)", "rgba(255,255,255,0.05)"]}
                  style={styles.buttonGlass}
                />
                <Text style={styles.optionText}>Femme</Text>
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
                <LinearGradient
                  colors={["rgba(255,255,255,0.1)", "rgba(255,255,255,0.05)"]}
                  style={styles.buttonGlass}
                />
                <Text style={styles.optionText}>Homme</Text>
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
                <LinearGradient
                  colors={["rgba(255,255,255,0.1)", "rgba(255,255,255,0.05)"]}
                  style={styles.buttonGlass}
                />
                <Text style={styles.optionText}>
                  {isOtherSelected ? selected : "Autre…"}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            onPress={handleNext}
            disabled={!selected}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={
                selected ? ["#FFFFFF", "#DDDDDD"] : ["#AAAAAA", "#999999"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.nextButton}
            >
              <Text
                style={[
                  styles.nextButtonText,
                  { color: selected ? "#FF5135" : "#777777" },
                ]}
              >
                Suivant
              </Text>
            </LinearGradient>
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
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  fullScreenGradient: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 20,
    justifyContent: "flex-end",
  },
  content: {
    maxWidth: 400,
    alignSelf: "center",
    width: "100%",
    marginBottom: 40,
  },
  footer: {
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 40,
    paddingTop: 8,
  },
  headline: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
    color: "#fff",
    letterSpacing: -0.5,
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    textAlign: "center",
  },
  subtitle: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 15,
    marginBottom: 28,
    textAlign: "center",
    lineHeight: 22,
  },
  optionsContainer: {
    gap: 16,
  },
  optionButton: {
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.2)",
    backgroundColor: "transparent",
  },
  optionSelected: {
    borderColor: "#FFFFFF",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  optionText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  buttonGlass: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  nextButton: {
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 40,
    alignItems: "center",
    justifyContent: "center",
    width: 300,
    maxWidth: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 8,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: "700",
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
    backgroundColor: "#2c2c2c",
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    padding: 20,
    textAlign: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  modalItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  modalItemText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 16,
    textAlign: "center",
  },
  modalItemTextSelected: {
    color: "#fff",
    fontWeight: "bold",
  },
  modalCloseButton: {
    backgroundColor: "rgba(255,255,255,0.1)",
    padding: 16,
  },
  modalCloseButtonText: {
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 16,
  },
});

export default RegisterStepGender;
