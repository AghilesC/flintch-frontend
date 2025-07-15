// components/RegisterStepName.tsx

import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Defs, Ellipse, RadialGradient, Stop } from "react-native-svg";

const RegisterStepName = ({
  onNext,
  name = "",
  currentStep = 0,
  totalSteps = 8, // Mis à jour
  onBack,
}: any) => {
  const [localName, setLocalName] = useState(name);

  const isNameValid = useMemo(() => {
    const trimmedName = localName.trim();
    if (trimmedName.length < 1) return false;
    const lettersOnlyRegex = /^[a-zA-ZÀ-ÿ\s'-]+$/; // Regex améliorée
    return lettersOnlyRegex.test(trimmedName);
  }, [localName]);

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

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={styles.contentWrapper}>
          <View style={styles.content}>
            <Text style={styles.subtitle}>Dis nous qui débarque.</Text>
            <Text style={styles.headline}>Tu t'appelles ?</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={localName}
                placeholder="Saisis ton prénom"
                placeholderTextColor="rgba(255,255,255,0.7)"
                onChangeText={setLocalName}
                autoFocus={true}
              />
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.nextButton, { opacity: isNameValid ? 1 : 0.5 }]}
              onPress={() => onNext({ name: localName.trim() })}
              disabled={!isNameValid}
            >
              <Ionicons name="arrow-forward" size={24} color="#FF5135" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

// --- Styles avec la police Satoshi ---
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
  question: {
    fontSize: 24,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 20,
    lineHeight: 30,
    fontFamily: "Satoshi",
  },
  inputContainer: {
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 20,
    paddingVertical: 4,
  },
  input: {
    fontSize: 16,
    color: "#FFFFFF",
    paddingVertical: 14,
    paddingHorizontal: 0,
    fontFamily: "Satoshi",
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
  headline: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 18,
    color: "#FFFFFF",
    textAlign: "center",
    fontFamily: "Satoshi",
  },
  subtitle: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 15,
    marginBottom: 8,
    textAlign: "center",
    lineHeight: 22,
    fontFamily: "Satoshi",
  },
});

export default RegisterStepName;
