import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useRef, useState } from "react";
import {
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Defs, Ellipse, RadialGradient, Stop } from "react-native-svg";

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

type Props = {
  onNext: (sports: string[]) => void;
  initial?: string[];
  onSkip?: () => void;
  currentStep?: number;
  totalSteps?: number;
  onBack?: () => void;
};

const RegisterStepSports: React.FC<Props> = ({
  onNext,
  initial = [],
  onSkip,
  currentStep = 5,
  totalSteps = 8,
  onBack,
}) => {
  const [selected, setSelected] = useState<string[]>(initial);
  const [search, setSearch] = useState("");
  const buttonScale = useRef(new Animated.Value(1)).current;

  // Créer des animations pour chaque sport
  const sportAnimations = useRef(
    sportsList.reduce((acc, sport) => {
      acc[sport] = new Animated.Value(1);
      return acc;
    }, {} as Record<string, Animated.Value>)
  ).current;

  const filtered = sportsList.filter((s) =>
    s.toLowerCase().includes(search.toLowerCase())
  );

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

  const triggerNextBounce = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 1.05,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(buttonScale, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const toggle = (sport: string) => {
    if (selected.includes(sport)) {
      setSelected(selected.filter((s) => s !== sport));
      triggerBounce(sportAnimations[sport]);
    } else if (selected.length < 5) {
      setSelected([...selected, sport]);
      triggerBounce(sportAnimations[sport]);
    } else {
      // Vibration d'erreur si limite atteinte
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  };

  const handleNext = () => {
    if (selected.length > 0) {
      triggerNextBounce();
      onNext(selected);
    }
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSkip?.();
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
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.subtitle}>On passe au concret !</Text>
          <Text style={styles.headline}>
            Ajoute tes sports favoris pour trouver des partenaires qui partagent
            tes passions !
          </Text>

          {/* Barre de recherche */}
          <View style={styles.searchContainer}>
            <Ionicons
              name="search"
              size={20}
              color="rgba(255, 255, 255, 0.7)"
            />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Quel sport tu aimes ?"
              placeholderTextColor="rgba(255, 255, 255, 0.6)"
              style={styles.searchInput}
            />
          </View>

          {/* Compteur de sélection */}
          <Text style={styles.selectionCount}>
            Sélection : {selected.length}/5
          </Text>

          {/* Liste des sports */}
          <View style={styles.sportsContainer}>
            {filtered.map((sport) => {
              const isSelected = selected.includes(sport);
              const isDisabled = !isSelected && selected.length === 5;

              return (
                <Animated.View
                  key={sport}
                  style={{ transform: [{ scale: sportAnimations[sport] }] }}
                >
                  <TouchableOpacity
                    onPress={() => toggle(sport)}
                    activeOpacity={0.8}
                    disabled={isDisabled}
                    style={[
                      styles.sportButton,
                      isSelected && styles.sportButtonSelected,
                      isDisabled && styles.sportButtonDisabled,
                    ]}
                  >
                    <Text
                      style={[
                        styles.sportText,
                        isSelected && styles.sportTextSelected,
                        isDisabled && styles.sportTextDisabled,
                      ]}
                    >
                      {sport}
                    </Text>
                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={18}
                        color="#FFFFFF"
                        style={styles.checkIcon}
                      />
                    )}
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Passer</Text>
          </TouchableOpacity>

          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity
              style={[
                styles.nextButton,
                { opacity: selected.length > 0 ? 1 : 0.5 },
              ]}
              onPress={handleNext}
              disabled={selected.length === 0}
            >
              <Ionicons name="arrow-forward" size={24} color="#FF5135" />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    paddingLeft: 12,
    fontSize: 16,
    color: "#FFFFFF",
    fontFamily: "Satoshi",
  },
  selectionCount: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    marginBottom: 20,
    fontFamily: "Satoshi",
  },
  sportsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
  },
  sportButton: {
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.4)",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    flexDirection: "row",
    minWidth: 120,
  },
  sportButtonSelected: {
    borderColor: "#FFFFFF",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  sportButtonDisabled: {
    opacity: 0.5,
    borderColor: "rgba(255, 255, 255, 0.2)",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  sportText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 15,
    fontWeight: "500",
    fontFamily: "Satoshi",
    textAlign: "center",
  },
  sportTextSelected: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  sportTextDisabled: {
    color: "rgba(255, 255, 255, 0.4)",
  },
  checkIcon: {
    marginLeft: 8,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 40,
    paddingTop: 20,
    paddingHorizontal: 24,
  },
  skipButton: {
    padding: 12,
  },
  skipText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 16,
    fontFamily: "Satoshi",
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
});

export default RegisterStepSports;
