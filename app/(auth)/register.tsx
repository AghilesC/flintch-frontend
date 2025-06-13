import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import RegisterStepFitnessGoals from "../../components/RegisterStepFitnessGoals";
import RegisterStepGender from "../../components/RegisterStepGender";
import RegisterStepHeightWeight from "../../components/RegisterStepHeightWeight";
import RegisterStepNameBirthday from "../../components/RegisterStepNameBirthday";
import RegisterStepPhone from "../../components/RegisterStepPhone";
import RegisterStepProfilePhoto from "../../components/RegisterStepProfilePhoto";
import RegisterStepSports from "../../components/RegisterStepSports";

// Helper pour string | string[] → string
const getStr = (val: string | string[] | undefined) => {
  if (Array.isArray(val)) return val[0] ?? "";
  if (typeof val === "string") return val;
  return "";
};

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

  const router = useRouter();

  // Étapes
  switch (step) {
    case 0:
      return (
        <RegisterStepNameBirthday
          onNext={({ name, birthdate }) => {
            setProfile({ ...profile, name, birthdate });
            setStep(1);
          }}
          name={name}
        />
      );
    case 1:
      return (
        <RegisterStepGender
          onNext={(gender) => {
            setProfile({ ...profile, gender });
            setStep(2);
          }}
          gender={profile.gender}
        />
      );
    case 2:
      return (
        <RegisterStepHeightWeight
          onNext={({ height, weight }) => {
            setProfile({ ...profile, height, weight });
            setStep(3);
          }}
          height={profile.height}
          weight={profile.weight}
        />
      );
    case 3:
      return (
        <RegisterStepFitnessGoals
          onNext={({ fitness_level, goals }) => {
            setProfile({ ...profile, fitness_level, goals });
            setStep(4);
          }}
          fitness_level={profile.fitness_level}
          goals={profile.goals}
        />
      );
    case 4:
      return (
        <RegisterStepSports
          initial={sports}
          onNext={(selected) => {
            setSports(selected);
            setStep(5);
          }}
          onSkip={() => setStep(5)}
        />
      );
    case 5:
      return (
        <RegisterStepPhone
          onNext={({ phone }) => {
            setProfile({ ...profile, phone });
            setStep(6);
          }}
          phone={profile.phone}
        />
      );
    case 6:
      return (
        <RegisterStepProfilePhoto
          onNext={({ profile_photo }) => {
            setProfile({ ...profile, profile_photo });
            setStep(7);
          }}
          profile_photo={profile.profile_photo}
        />
      );
    default:
      return (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 32,
            backgroundColor: "#fff",
          }}
        >
          <Text
            style={{
              fontSize: 22,
              fontWeight: "700",
              color: "#0E4A7B",
              textAlign: "center",
            }}
          >
            Vérification…
          </Text>
          <Text style={{ marginTop: 18, color: "#333", textAlign: "center" }}>
            {JSON.stringify({ ...profile, sports, email }, null, 2)}
          </Text>
          {loading ? (
            <ActivityIndicator
              size="large"
              color="#FF5135"
              style={{ marginTop: 24 }}
            />
          ) : (
            <TouchableOpacity
              onPress={async () => {
                setLoading(true);

                // CORRECTION GENDER
                const gender =
                  typeof profile.gender === "object" && profile.gender?.gender
                    ? profile.gender.gender
                    : profile.gender;

                const payload = {
                  ...profile,
                  gender,
                  sports,
                  email,
                  provider,
                  provider_token: providerToken,
                };

                // DEBUG
                console.log(">>> register payload", payload);

                // Vérifie champs obligatoires côté front
                if (
                  !(
                    payload.name &&
                    payload.birthdate &&
                    payload.email &&
                    payload.gender &&
                    payload.height &&
                    payload.weight &&
                    payload.fitness_level &&
                    payload.goals &&
                    payload.provider &&
                    payload.provider_token
                  )
                ) {
                  Alert.alert(
                    "Erreur",
                    "Tous les champs obligatoires doivent être remplis."
                  );
                  setLoading(false);
                  return;
                }

                try {
                  const res = await axios.post(
                    "http://127.0.0.1:8000/api/social-register",
                    payload
                  );
                  if (res.data.token) {
                    await AsyncStorage.setItem("token", res.data.token);
                  }
                  router.replace("/(tabs)/home" as const);
                } catch (error: any) {
                  const messages = error.response?.data?.errors;
                  Alert.alert(
                    "Erreur",
                    error.response?.data?.message ||
                      (messages
                        ? Object.values(messages).flat().join("\n")
                        : "Une erreur est survenue.")
                  );
                } finally {
                  setLoading(false);
                }
              }}
              style={{
                marginTop: 28,
                backgroundColor: "#FF5135",
                borderRadius: 22,
                paddingVertical: 14,
                paddingHorizontal: 36,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: "#fff",
                  fontWeight: "bold",
                  fontSize: 20,
                  textAlign: "center",
                }}
              >
                Valider mon inscription
              </Text>
            </TouchableOpacity>
          )}
        </View>
      );
  }
};

export default RegisterScreen;
