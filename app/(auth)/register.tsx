// screens/register.tsx

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Import des nouveaux composants d'étape
import RegisterStepBirthday from "../../components/RegisterStepBirthday";
import RegisterStepFitnessGoals from "../../components/RegisterStepFitnessGoals";
import RegisterStepGender from "../../components/RegisterStepGender";
import RegisterStepHeightWeight from "../../components/RegisterStepHeightWeight";
import RegisterStepName from "../../components/RegisterStepName";
import RegisterStepProfilePhoto from "../../components/RegisterStepProfilePhoto";
import RegisterStepSports from "../../components/RegisterStepSports";

// ... (le composant PlaceholderStep reste le même)
const PlaceholderStep = ({
  title,
  onNext,
  onSkip,
  onBack,
  currentStep,
  totalSteps,
}: any) => (
  <View
    style={{
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
      backgroundColor: "#4c2889",
    }}
  >
    {onBack && (
      <TouchableOpacity
        onPress={onBack}
        style={{ position: "absolute", top: 60, left: 20 }}
      >
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>
    )}
    <Text style={{ fontSize: 24, color: "#fff", marginBottom: 20 }}>
      {title}
    </Text>
    <TouchableOpacity
      style={{
        backgroundColor: "rgba(255,255,255,0.2)",
        padding: 16,
        borderRadius: 12,
        marginTop: 10,
      }}
      onPress={() => (onNext ? onNext({}) : onSkip ? onSkip() : null)}
    >
      <Text style={{ color: "#fff" }}>Suivant</Text>
    </TouchableOpacity>
    {onSkip && (
      <TouchableOpacity
        style={{ padding: 16, borderRadius: 12 }}
        onPress={onSkip}
      >
        <Text style={{ color: "#fff", opacity: 0.7 }}>Passer</Text>
      </TouchableOpacity>
    )}
  </View>
);

const getStr = (val: string | string[] | undefined) =>
  Array.isArray(val) ? val[0] ?? "" : val || "";

// Le nombre total d'étapes est maintenant 7
const TOTAL_STEPS = 7;

const RegisterScreen = () => {
  const params = useLocalSearchParams();
  const [initialName] = useState(getStr(params.name)); // Renommé pour clarté
  const [email] = useState(getStr(params.email));
  const [provider] = useState(getStr(params.provider));
  const [providerToken] = useState(getStr(params.provider_token));
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<any>({ name: initialName }); // Pré-remplir le nom
  const [sports, setSports] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<any>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const router = useRouter();

  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0.3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [step]);

  // La fonction uploadPhoto pour gérer l'envoi des photos
  const uploadPhoto = async (token: string, photo: any, is_main: boolean) => {
    try {
      const formData = new FormData();
      formData.append("photo", {
        uri: photo.uri,
        type: photo.type,
        name: photo.name,
      } as any);
      formData.append("is_main", is_main.toString());

      const response = await axios.post(
        "http://localhost:8000/api/profile-photos",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error("Erreur upload photo:", error);
      throw error;
    }
  };

  // La fonction `register` reste inchangée
  const register = async () => {
    setLoading(true);
    setValidationErrors(null);
    const gender =
      typeof profile.gender === "object"
        ? profile.gender.gender
        : profile.gender;
    const payload = {
      name: profile.name,
      birthdate: profile.birthdate,
      email,
      gender,
      height: profile.height,
      weight: profile.weight,
      sports,
      fitness_level: profile.fitness_level,
      goals: profile.goals,
      profile_photo: null,
      provider,
      provider_token: providerToken,
    };
    try {
      const res = await axios.post(
        "http://localhost:8000/api/social-register",
        payload
      );
      const token = res.data.token;
      await AsyncStorage.setItem("token", token);

      if (profile.photos?.length > 0) {
        for (const photo of profile.photos) {
          await uploadPhoto(token, photo, photo.is_main);
        }
      }
      router.replace("/(tabs)/home");
    } catch (error: any) {
      if (error.response?.status === 422) {
        setValidationErrors(error.response.data.errors);
        Alert.alert("Validation", "Corrigez les champs requis");
      } else {
        Alert.alert("Erreur", error.message || "Échec de l'inscription");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    } else {
      router.replace("/(auth)/login"); // Au lieu de router.back()
    }
  };

  // Mise à jour du tableau des étapes
  const steps = [
    // Étape 0: Prénom
    <Animated.View key="step0" style={{ flex: 1, opacity: fadeAnim }}>
      <RegisterStepName
        onNext={({ name }) => {
          setProfile({ ...profile, name });
          setStep(1); // Passe à l'étape de la date de naissance
        }}
        name={profile.name}
        currentStep={step}
        totalSteps={TOTAL_STEPS}
        onBack={handleBack}
      />
    </Animated.View>,

    // Étape 1: Date de naissance
    <Animated.View key="step1" style={{ flex: 1, opacity: fadeAnim }}>
      <RegisterStepBirthday
        onNext={({ birthdate }) => {
          setProfile({ ...profile, birthdate });
          setStep(2); // Passe à l'étape du genre
        }}
        currentStep={step}
        totalSteps={TOTAL_STEPS}
        onBack={handleBack}
      />
    </Animated.View>,

    // Étape 2: Genre
    <Animated.View key="step2" style={{ flex: 1, opacity: fadeAnim }}>
      <RegisterStepGender
        onNext={({ gender }) => {
          setProfile({ ...profile, gender });
          setStep(3); // Passe à l'étape suivante
        }}
        gender={profile.gender}
        currentStep={step}
        totalSteps={TOTAL_STEPS}
        onBack={handleBack}
      />
    </Animated.View>,

    // Étape 3: Taille et poids
    <Animated.View key="step3" style={{ flex: 1, opacity: fadeAnim }}>
      <RegisterStepHeightWeight
        onNext={({ height, weight }) => {
          setProfile({ ...profile, height, weight });
          setStep(4); // Passe à l'étape suivante
        }}
        height={profile.height}
        weight={profile.weight}
        currentStep={step}
        totalSteps={TOTAL_STEPS}
        onBack={handleBack}
      />
    </Animated.View>,

    // Étape 4: Objectifs fitness
    <Animated.View key="step4" style={{ flex: 1, opacity: fadeAnim }}>
      <RegisterStepFitnessGoals
        onNext={({ fitness_level, goals }) => {
          setProfile({ ...profile, fitness_level, goals });
          setStep(5); // Passe à l'étape suivante
        }}
        fitness_level={profile.fitness_level}
        goals={profile.goals}
        currentStep={step}
        totalSteps={TOTAL_STEPS}
        onBack={handleBack}
      />
    </Animated.View>,

    // Étape 5: Sports - NOUVEAU COMPOSANT INTÉGRÉ
    <Animated.View key="step5" style={{ flex: 1, opacity: fadeAnim }}>
      <RegisterStepSports
        onNext={(selectedSports) => {
          setSports(selectedSports);
          setStep(6);
        }}
        onSkip={() => {
          setSports([]);
          setStep(6);
        }}
        initial={sports}
        currentStep={step}
        totalSteps={TOTAL_STEPS}
        onBack={handleBack}
      />
    </Animated.View>,

    // Étape 6: Photos - NOUVEAU COMPOSANT INTÉGRÉ
    <Animated.View key="step6" style={{ flex: 1, opacity: fadeAnim }}>
      <RegisterStepProfilePhoto
        onNext={({ photos }) => {
          setProfile({ ...profile, photos });
          setStep(7); // Aller à l'étape finale
        }}
        onSkip={() => {
          setProfile({ ...profile, photos: [] });
          setStep(7); // Aller à l'étape finale
        }}
        photos={profile.photos}
        currentStep={step}
        totalSteps={TOTAL_STEPS}
        onBack={handleBack}
      />
    </Animated.View>,
  ];

  // Le rendu de l'étape finale `renderFinalStep` reste inchangé
  const renderFinalStep = () => (
    <ScrollView contentContainerStyle={styles.finalStep}>
      <Animated.View style={[styles.finalCard, { opacity: fadeAnim }]}>
        <LinearGradient
          colors={["#ffffff", "#f9f9f9"]}
          style={styles.finalCardGradient}
        >
          <View style={styles.checkmarkContainer}>
            <LinearGradient
              colors={["#4CAF50", "#45a049"]}
              style={styles.checkmarkCircle}
            >
              <Ionicons name="checkmark" size={50} color="#fff" />
            </LinearGradient>
          </View>

          <Text style={styles.finalTitle}>
            Inscription presque terminée ! 🎉
          </Text>
          <Text style={styles.finalSubtitle}>
            Vérifie tes informations et valide ton inscription
          </Text>

          {/* Résumé des informations */}
          <View style={styles.summaryContainer}>
            <View style={styles.summaryItem}>
              <Ionicons name="person" size={20} color="#FF5135" />
              <Text style={styles.summaryText}>
                {profile.name || "Non renseigné"}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Ionicons name="calendar" size={20} color="#FF5135" />
              <Text style={styles.summaryText}>
                {profile.birthdate || "Non renseigné"}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Ionicons name="body" size={20} color="#FF5135" />
              <Text style={styles.summaryText}>
                {profile.gender || "Non renseigné"}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Ionicons name="fitness" size={20} color="#FF5135" />
              <Text style={styles.summaryText}>
                {profile.height && profile.weight
                  ? `${profile.height}cm - ${profile.weight}kg`
                  : "Non renseigné"}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Ionicons name="trophy" size={20} color="#FF5135" />
              <Text style={styles.summaryText}>
                {sports.length > 0 ? `${sports.length} sports` : "Aucun sport"}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Ionicons name="camera" size={20} color="#FF5135" />
              <Text style={styles.summaryText}>
                {profile.photos?.length > 0
                  ? `${profile.photos.length} photo${
                      profile.photos.length > 1 ? "s" : ""
                    }`
                  : "Aucune photo"}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.validateButton}
            onPress={register}
            disabled={loading}
          >
            <LinearGradient
              colors={["#FF5135", "#E6452E"]}
              style={styles.validateButtonGradient}
            >
              <Text style={styles.validateButtonText}>
                {loading ? "Inscription..." : "Valider mon inscription ✨"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.mainContent}>
        {step < steps.length ? steps[step] : renderFinalStep()}
      </View>
    </View>
  );
};

// Les styles restent inchangés
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1F2937",
  },
  mainContent: {
    flex: 1,
  },
  finalStep: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100%",
    backgroundColor: "#1F2937",
  },
  finalCard: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  finalCardGradient: {
    padding: 32,
    borderRadius: 24,
    alignItems: "center",
  },
  checkmarkContainer: {
    marginBottom: 24,
  },
  checkmarkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  finalTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  finalSubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 32,
  },
  summaryContainer: {
    width: "100%",
    backgroundColor: "rgba(0,0,0,0.03)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  summaryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    gap: 12,
  },
  summaryText: {
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
  validateButton: {
    width: "100%",
  },
  validateButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 28,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    shadowColor: "#FF5135",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  validateButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
});

export default RegisterScreen;
