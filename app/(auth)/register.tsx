import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Import des composants d'étape
import RegisterStepFitnessGoals from "../../components/RegisterStepFitnessGoals";
import RegisterStepGender from "../../components/RegisterStepGender";
import RegisterStepHeightWeight from "../../components/RegisterStepHeightWeight";
import RegisterStepNameBirthday from "../../components/RegisterStepNameBirthday";
import RegisterStepPhone from "../../components/RegisterStepPhone";
import RegisterStepProfilePhoto from "../../components/RegisterStepProfilePhoto";
import RegisterStepSports from "../../components/RegisterStepSports";

const getStr = (val: string | string[] | undefined) =>
  Array.isArray(val) ? val[0] ?? "" : val || "";

const TOTAL_STEPS = 7;

const RegisterScreen = () => {
  const params = useLocalSearchParams();
  const [name] = useState(getStr(params.name));
  const [email] = useState(getStr(params.email));
  const [provider] = useState(getStr(params.provider));
  const [providerToken] = useState(getStr(params.provider_token));
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<any>({});
  const [sports, setSports] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<any>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const router = useRouter();

  useEffect(() => {
    // Animation de progression
    Animated.timing(progressAnim, {
      toValue: ((step + 1) / (TOTAL_STEPS + 1)) * 100,
      duration: 300,
      useNativeDriver: false,
    }).start();

    // Animation de transition entre les étapes
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

  const uploadPhoto = async (token: string, file: any, is_main: boolean) => {
    try {
      if (!file?.uri || !file?.name || !file?.type) {
        throw new Error("Fichier photo incomplet");
      }

      const formData = new FormData();

      if (Platform.OS === "web") {
        const blob = await fetch(file.uri).then((res) => res.blob());
        formData.append(
          "photo",
          new File([blob], file.name, { type: file.type })
        );
      } else {
        formData.append("photo", {
          uri: file.uri,
          name: file.name,
          type: file.type,
        } as any);
      }

      formData.append("is_main", is_main ? "1" : "0");

      const res = await axios.post(
        "http://localhost:8000/api/photos/upload",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("✅ Upload réussi:", res.data);
    } catch (err) {
      console.error("💥 Upload photo échoué:", err);
    }
  };

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
      phone: profile.phone,
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
    }
  };

  const getStepInfo = () => {
    const stepInfos = [
      { title: "Informations", icon: "person" },
      { title: "Genre", icon: "male-female" },
      { title: "Mensurations", icon: "fitness" },
      { title: "Objectifs", icon: "trophy" },
      { title: "Sports", icon: "basketball" },
      { title: "Contact", icon: "call" },
      { title: "Photos", icon: "camera" },
      { title: "Validation", icon: "checkmark-circle" },
    ];
    return stepInfos[step] || { title: "Inscription", icon: "create" };
  };

  const renderHeader = () => {
    const stepInfo = getStepInfo();

    return (
      <LinearGradient
        colors={["#FF5135", "#FFA958"]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.header}
      >
        <SafeAreaView>
          <View style={styles.headerContent}>
            <TouchableOpacity
              onPress={handleBack}
              disabled={step === 0}
              style={[
                styles.backButton,
                step === 0 && styles.backButtonDisabled,
              ]}
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color={step === 0 ? "rgba(255,255,255,0.3)" : "#fff"}
              />
            </TouchableOpacity>

            <View style={styles.headerTitleContainer}>
              <View style={styles.headerIconContainer}>
                <Ionicons name={stepInfo.icon as any} size={20} color="#fff" />
              </View>
              <Text style={styles.headerTitle}>{stepInfo.title}</Text>
              <Text style={styles.headerSubtitle}>
                Étape {step + 1} sur {TOTAL_STEPS + 1}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                Alert.alert(
                  "Abandonner l'inscription ?",
                  "Vos données seront perdues",
                  [
                    { text: "Continuer", style: "cancel" },
                    {
                      text: "Abandonner",
                      style: "destructive",
                      onPress: () => router.back(),
                    },
                  ]
                );
              }}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 100],
                      outputRange: ["0%", "100%"],
                    }),
                  },
                ]}
              />
            </View>
            <View style={styles.progressDots}>
              {[...Array(TOTAL_STEPS + 1)].map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.progressDot,
                    index <= step && styles.progressDotActive,
                  ]}
                />
              ))}
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  };

  // Composants d'étape avec animation fade
  const steps = [
    // Étape 0: Nom et date de naissance
    <Animated.View key="step0" style={{ flex: 1, opacity: fadeAnim }}>
      <RegisterStepNameBirthday
        onNext={({ name, birthdate }) => {
          setProfile({ ...profile, name, birthdate });
          setStep(1);
        }}
        name={name}
      />
    </Animated.View>,

    // Étape 1: Genre
    <Animated.View key="step1" style={{ flex: 1, opacity: fadeAnim }}>
      <RegisterStepGender
        onNext={(gender) => {
          setProfile({ ...profile, gender });
          setStep(2);
        }}
        gender={profile.gender}
      />
    </Animated.View>,

    // Étape 2: Taille et poids
    <Animated.View key="step2" style={{ flex: 1, opacity: fadeAnim }}>
      <RegisterStepHeightWeight
        onNext={({ height, weight }) => {
          setProfile({ ...profile, height, weight });
          setStep(3);
        }}
        height={profile.height}
        weight={profile.weight}
      />
    </Animated.View>,

    // Étape 3: Objectifs fitness
    <Animated.View key="step3" style={{ flex: 1, opacity: fadeAnim }}>
      <RegisterStepFitnessGoals
        onNext={({ fitness_level, goals }) => {
          setProfile({ ...profile, fitness_level, goals });
          setStep(4);
        }}
        fitness_level={profile.fitness_level}
        goals={profile.goals}
      />
    </Animated.View>,

    // Étape 4: Sports
    <Animated.View key="step4" style={{ flex: 1, opacity: fadeAnim }}>
      <RegisterStepSports
        initial={sports}
        onNext={(selected) => {
          setSports(selected);
          setStep(5);
        }}
        onSkip={() => setStep(5)}
      />
    </Animated.View>,

    // Étape 5: Téléphone
    <Animated.View key="step5" style={{ flex: 1, opacity: fadeAnim }}>
      <RegisterStepPhone
        onNext={({ phone }) => {
          setProfile({ ...profile, phone });
          setStep(6);
        }}
        phone={profile.phone}
      />
    </Animated.View>,

    // Étape 6: Photos
    <Animated.View key="step6" style={{ flex: 1, opacity: fadeAnim }}>
      <RegisterStepProfilePhoto
        onNext={({ photos }) => {
          setProfile({ ...profile, photos });
          setStep(7);
        }}
      />
    </Animated.View>,
  ];

  // Étape finale
  const renderFinalStep = () => (
    <ScrollView contentContainerStyle={styles.finalStep}>
      <Animated.View style={[styles.finalCard, { opacity: fadeAnim }]}>
        <LinearGradient
          colors={["rgba(255,81,53,0.1)", "rgba(255,169,88,0.1)"]}
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

          <View style={styles.summaryContainer}>
            <View style={styles.summaryItem}>
              <Ionicons name="person" size={20} color="#666" />
              <Text style={styles.summaryText}>
                {profile.name || "Non renseigné"}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Ionicons name="mail" size={20} color="#666" />
              <Text style={styles.summaryText}>{email}</Text>
            </View>
            {profile.phone && (
              <View style={styles.summaryItem}>
                <Ionicons name="call" size={20} color="#666" />
                <Text style={styles.summaryText}>{profile.phone}</Text>
              </View>
            )}
          </View>

          {loading ? (
            <ActivityIndicator
              size="large"
              color="#FF5135"
              style={{ marginTop: 30 }}
            />
          ) : (
            <TouchableOpacity
              style={styles.validateButton}
              onPress={register}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["#FF5135", "#FFA958"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.validateButtonGradient}
              >
                <Text style={styles.validateButtonText}>
                  Valider mon inscription
                </Text>
                <Ionicons
                  name="arrow-forward"
                  size={20}
                  color="#fff"
                  style={{ marginLeft: 8 }}
                />
              </LinearGradient>
            </TouchableOpacity>
          )}
        </LinearGradient>
      </Animated.View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      {renderHeader()}
      <View style={styles.mainContent}>
        {step < steps.length ? steps[step] : renderFinalStep()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 0 : 25,
    // Les propriétés shadow et elevation ont été supprimées ici
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  backButtonDisabled: {
    opacity: 0.5,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
  },
  headerIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  progressContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  progressBar: {
    height: 4,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#fff",
    borderRadius: 2,
  },
  progressDots: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 8,
    gap: 6,
  },
  progressDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  progressDotActive: {
    backgroundColor: "#fff",
  },
  mainContent: {
    flex: 1,
  },
  finalStep: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100%",
  },
  finalCard: {
    width: "100%",
    maxWidth: 400,
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
    backgroundColor: "#f8f8f8",
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
