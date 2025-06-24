// ✅ Nouvelle version de register.tsx avec support multi-photos
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
} from "react-native";
import RegisterStepFitnessGoals from "../../components/RegisterStepFitnessGoals";
import RegisterStepGender from "../../components/RegisterStepGender";
import RegisterStepHeightWeight from "../../components/RegisterStepHeightWeight";
import RegisterStepNameBirthday from "../../components/RegisterStepNameBirthday";
import RegisterStepPhone from "../../components/RegisterStepPhone";
import RegisterStepProfilePhoto from "../../components/RegisterStepProfilePhoto";
import RegisterStepSports from "../../components/RegisterStepSports";

const getStr = (val: string | string[] | undefined) =>
  Array.isArray(val) ? val[0] ?? "" : val || "";

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

  const router = useRouter();

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

  const steps = [
    <RegisterStepNameBirthday
      onNext={({ name, birthdate }) => {
        setProfile({ ...profile, name, birthdate });
        setStep(1);
      }}
      name={name}
    />,
    <RegisterStepGender
      onNext={(gender) => {
        setProfile({ ...profile, gender });
        setStep(2);
      }}
      gender={profile.gender}
    />,
    <RegisterStepHeightWeight
      onNext={({ height, weight }) => {
        setProfile({ ...profile, height, weight });
        setStep(3);
      }}
      height={profile.height}
      weight={profile.weight}
    />,
    <RegisterStepFitnessGoals
      onNext={({ fitness_level, goals }) => {
        setProfile({ ...profile, fitness_level, goals });
        setStep(4);
      }}
      fitness_level={profile.fitness_level}
      goals={profile.goals}
    />,
    <RegisterStepSports
      initial={sports}
      onNext={(selected) => {
        setSports(selected);
        setStep(5);
      }}
      onSkip={() => setStep(5)}
    />,
    <RegisterStepPhone
      onNext={({ phone }) => {
        setProfile({ ...profile, phone });
        setStep(6);
      }}
      phone={profile.phone}
    />,
    <RegisterStepProfilePhoto
      onNext={({ photos }) => {
        setProfile({ ...profile, photos });
        setStep(7);
      }}
    />,
  ];

  if (step < steps.length) return steps[step];

  return (
    <ScrollView contentContainerStyle={{ padding: 32 }}>
      <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 20 }}>
        Terminer mon inscription
      </Text>

      {loading ? (
        <ActivityIndicator size="large" color="#FF5135" />
      ) : (
        <TouchableOpacity
          style={{
            backgroundColor: "#FF5135",
            padding: 16,
            borderRadius: 20,
            alignItems: "center",
          }}
          onPress={register}
        >
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold" }}>
            Valider mon inscription
          </Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

export default RegisterScreen;
