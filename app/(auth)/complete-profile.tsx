import DisponibiliteGrille from "@/components/DisponibiliteGrille";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Toast from "react-native-toast-message";

// ---- DropdownSelector pro ---- //
interface DropdownSelectorProps {
  label: string;
  options: string[];
  selected: string[];
  onSelect: (value: string[]) => void;
  multiple?: boolean;
}
const DropdownSelector: React.FC<DropdownSelectorProps> = ({
  label,
  options,
  selected,
  onSelect,
  multiple = false,
}) => {
  const [visible, setVisible] = useState(false);
  const isObjectif = label === "Objectif(s)";
  const [tempSelected, setTempSelected] = useState<string[]>(selected);

  const openModal = () => {
    setTempSelected(selected);
    setVisible(true);
  };
  const toggleValue = (val: string) => {
    if (tempSelected.includes(val)) {
      setTempSelected(tempSelected.filter((v) => v !== val));
    } else {
      if (isObjectif && tempSelected.length >= 2) return;
      setTempSelected([...tempSelected, val]);
    }
  };
  const canValidate = !isObjectif || tempSelected.length >= 1;
  const handleValidate = () => {
    if (canValidate) {
      onSelect(tempSelected);
      setVisible(false);
    }
  };

  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={styles.selector}
        onPress={openModal}
        activeOpacity={0.85}
      >
        <Text style={{ color: selected.length > 0 ? "#092C44" : "#aaa" }}>
          {selected.length > 0
            ? selected.join(", ")
            : `Sélectionner ${label.toLowerCase()}`}
        </Text>
        <Ionicons name="chevron-down" size={18} color="#092C44" />
      </TouchableOpacity>
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.option,
                    tempSelected.includes(item) && {
                      backgroundColor: "#F5F6FA",
                    },
                  ]}
                  onPress={() => toggleValue(item)}
                  disabled={
                    isObjectif &&
                    !tempSelected.includes(item) &&
                    tempSelected.length >= 2
                  }
                >
                  <Text
                    style={[
                      styles.optionText,
                      tempSelected.includes(item) && { color: "#FF5135" },
                      isObjectif &&
                        !tempSelected.includes(item) &&
                        tempSelected.length >= 2 && { color: "#bbb" },
                    ]}
                  >
                    {item}
                    {tempSelected.includes(item) ? "  ✔" : ""}
                  </Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={[
                styles.modalBtn,
                !canValidate && { backgroundColor: "#ddd" },
              ]}
              disabled={!canValidate}
              onPress={handleValidate}
            >
              <Text
                style={[styles.modalBtnText, !canValidate && { color: "#aaa" }]}
              >
                Valider
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

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
  "N’a même pas commencé",
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

export default function CompleteProfile() {
  const [gender, setGender] = useState<string>("");
  const [niveau, setNiveau] = useState<string>("");
  const [objectifs, setObjectifs] = useState<string[]>([]);
  const [sports, setSports] = useState<string[]>([]);
  const [availability, setAvailability] = useState<any>(null);
  const [location, setLocation] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // --- Animation valeurs ---
  const screenHeight = Dimensions.get("window").height;
  const translateY = useSharedValue(screenHeight * 0.28); // start un peu en bas
  const opacity = useSharedValue(0.6);
  const scale = useSharedValue(0.96);
  const shadow = useSharedValue(2);

  // Anim: entrée smooth (up + scale)
  useEffect(() => {
    translateY.value = withTiming(0, {
      duration: 420,
      easing: Easing.out(Easing.exp),
    });
    opacity.value = withTiming(1, {
      duration: 540,
      easing: Easing.out(Easing.cubic),
    });
    scale.value = withTiming(1, {
      duration: 420,
      easing: Easing.out(Easing.exp),
    });
    shadow.value = withTiming(12, {
      duration: 520,
      easing: Easing.out(Easing.cubic),
    });
  }, []);

  // Anim: fermeture
  const handleGoBack = () => {
    opacity.value = withTiming(0.2, {
      duration: 250,
      easing: Easing.in(Easing.exp),
    });
    scale.value = withTiming(0.94, {
      duration: 340,
      easing: Easing.in(Easing.exp),
    });
    shadow.value = withTiming(1, {
      duration: 300,
      easing: Easing.in(Easing.exp),
    });
    translateY.value = withTiming(
      screenHeight * 0.25,
      {
        duration: 370,
        easing: Easing.in(Easing.exp),
      },
      (finished) => {
        if (finished) runOnJS(router.replace)("/profile");
      }
    );
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    opacity: opacity.value,
    shadowOpacity: 0.16 + 0.16 * (shadow.value / 12),
    shadowRadius: shadow.value,
    shadowColor: "#000",
    elevation: shadow.value,
    borderTopLeftRadius: 38,
    borderTopRightRadius: 38,
  }));

  // Utilitaire pour parser string/array
  const parseArray = (val: any) => {
    if (Array.isArray(val)) return val;
    if (typeof val === "string" && val.startsWith("[")) {
      try {
        const arr = JSON.parse(val);
        if (Array.isArray(arr) && typeof arr[0] === "string") return arr;
        if (Array.isArray(arr) && Array.isArray(arr[0])) return arr[0];
      } catch (e) {}
    }
    return [];
  };

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem("token");
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const locationData = await Location.getCurrentPositionAsync({});
        const coords = `${locationData.coords.latitude},${locationData.coords.longitude}`;
        setLocation(coords);
      }
      try {
        const response = await axios.get("http://localhost:8000/api/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = response.data;
        setGender(data.gender || "");
        setNiveau(data.fitness_level || "");
        setObjectifs(parseArray(data.goals));
        setSports(parseArray(data.sports));
        setAvailability(data.availability || {});
      } catch (error) {
        Toast.show({
          type: "error",
          text1: "Erreur",
          text2: "Impossible de charger les données ❌",
        });
      }
    })();
  }, []);

  // Limiter sports à min 1, max 5
  const toggleSport = (sport: string) => {
    if (sports.includes(sport)) {
      if (sports.length === 1) {
        Toast.show({
          type: "info",
          text1: "Choix minimum",
          text2: "Tu dois sélectionner au moins 1 sport 🏀",
        });
        return;
      }
      setSports((prev) => prev.filter((s) => s !== sport));
    } else {
      if (sports.length >= 5) {
        Toast.show({
          type: "info",
          text1: "Maximum atteint",
          text2: "Tu peux sélectionner jusqu'à 5 sports maximum !",
        });
        return;
      }
      setSports((prev) => [...prev, sport]);
    }
  };

  const handleSave = async () => {
    if (sports.length < 1) {
      Toast.show({
        type: "error",
        text1: "Sport manquant",
        text2: "Sélectionne au moins 1 sport !",
      });
      return;
    }
    if (objectifs.length < 1) {
      Toast.show({
        type: "error",
        text1: "Objectif manquant",
        text2: "Sélectionne au moins 1 objectif !",
      });
      return;
    }
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      await axios.post(
        "http://localhost:8000/api/update-profile",
        {
          gender,
          fitness_level: niveau,
          goals: objectifs,
          sports,
          availability,
          location,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Toast.show({
        type: "success",
        text1: "Succès",
        text2: "Profil enregistré avec succès ✅",
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Une erreur est survenue 😥",
      });
    }
    setLoading(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F7F8FA" }}>
      {/* Un backdrop semi-transparent */}
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: "#000",
            opacity: opacity.value * 0.18,
            zIndex: 1,
          },
        ]}
      />
      {/* Le panneau animé */}
      <Animated.View style={[{ flex: 1, zIndex: 2 }, animatedStyle]}>
        <ScrollView contentContainerStyle={styles.bgContainer}>
          {/* HEADER */}
          <View style={styles.headerCard}>
            <TouchableOpacity onPress={handleGoBack}>
              <Ionicons
                name="arrow-back"
                size={24}
                color="#FF5135"
                style={styles.backIcon}
              />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Modifier le profil</Text>
          </View>
          {/* MAIN CARD */}
          <View style={styles.mainCard}>
            <DropdownSelector
              label="Genre"
              selected={gender ? [gender] : []}
              options={["Homme", "Femme", "Non-binaire", "Autre"]}
              onSelect={(arr) => setGender(arr[0] || "")}
            />
            <DropdownSelector
              label="Niveau sportif"
              selected={niveau ? [niveau] : []}
              options={niveauxList}
              onSelect={(arr) => setNiveau(arr[0] || "")}
            />
            <DropdownSelector
              label="Objectif(s)"
              selected={objectifs}
              options={objectifsList}
              onSelect={setObjectifs}
              multiple
            />
            {objectifs.length < 1 && (
              <Text style={{ color: "#FF5135", marginBottom: 8 }}>
                Choisis au moins 1 objectif
              </Text>
            )}

            <Text style={styles.sectionLabel}>Sports pratiqués</Text>
            <View style={styles.sportsGrid}>
              {sportsList.map((sport, i) => {
                const selected = sports.includes(sport);
                return (
                  <TouchableOpacity
                    key={i}
                    onPress={() => toggleSport(sport)}
                    style={[
                      styles.sportPill,
                      selected && styles.sportPillSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.sportPillText,
                        selected && styles.sportPillTextSelected,
                      ]}
                    >
                      {sport}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.sectionLabel}>
              Disponibilité (jours / heures)
            </Text>
            <View style={styles.dispoCard}>
              <DisponibiliteGrille
                onChange={setAvailability}
                initial={availability}
              />
            </View>
          </View>

          <TouchableOpacity
            onPress={handleSave}
            disabled={loading}
            style={styles.saveBtn}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>Enregistrer</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

// ---- STYLES ----
const styles = StyleSheet.create({
  bgContainer: {
    backgroundColor: "#F7F8FA",
    padding: 0,
    flexGrow: 1,
    alignItems: "center",
  },
  headerCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 22,
    paddingBottom: 10,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    width: "100%",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    elevation: 2,
    zIndex: 10,
    borderTopLeftRadius: 38,
    borderTopRightRadius: 38,
  },
  backIcon: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0E4A7B",
  },
  mainCard: {
    backgroundColor: "#fff",
    width: "94%",
    borderRadius: 28,
    padding: 20,
    marginTop: 20,
    marginBottom: 20,
    elevation: 4,
    shadowColor: "#091e42",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 18,
  },
  label: {
    fontWeight: "600",
    marginBottom: 5,
    color: "#092C44",
    fontSize: 15,
  },
  sectionLabel: {
    fontWeight: "700",
    marginBottom: 8,
    marginTop: 18,
    color: "#0E4A7B",
    fontSize: 17,
  },
  selector: {
    borderWidth: 1.2,
    borderColor: "#eee",
    borderRadius: 16,
    padding: 16,
    marginBottom: 13,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F8FAFD",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.14)",
    justifyContent: "center",
    padding: 28,
  },
  modal: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 8,
    maxHeight: 400,
    elevation: 7,
  },
  option: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  optionText: {
    fontSize: 16,
    color: "#0E4A7B",
  },
  modalBtn: {
    backgroundColor: "#FF5135",
    padding: 13,
    borderRadius: 10,
    margin: 14,
    alignItems: "center",
  },
  modalBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    letterSpacing: 0.6,
  },
  sportsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
    marginTop: 0,
  },
  sportPill: {
    paddingVertical: 8,
    paddingHorizontal: 17,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: "#ccc",
    backgroundColor: "#F6F8FB",
    margin: 4,
    alignItems: "center",
  },
  sportPillSelected: {
    backgroundColor: "#FF5135",
    borderColor: "#FF5135",
    shadowColor: "#FF5135",
    shadowOpacity: 0.09,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
  },
  sportPillText: {
    fontSize: 16,
    color: "#092C44",
    fontWeight: "600",
  },
  sportPillTextSelected: {
    color: "#fff",
    fontWeight: "bold",
  },
  dispoCard: {
    backgroundColor: "#F5F6FA",
    borderRadius: 17,
    padding: 10,
    marginVertical: 10,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 1,
  },
  saveBtn: {
    backgroundColor: "#FF5135",
    padding: 16,
    borderRadius: 24,
    marginTop: 10,
    marginBottom: 30,
    alignItems: "center",
    width: "88%",
    shadowColor: "#FF5135",
    shadowOpacity: 0.17,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 2,
  },
  saveBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
    letterSpacing: 0.5,
  },
});
