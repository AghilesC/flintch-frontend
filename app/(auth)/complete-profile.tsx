import DisponibiliteGrille from "@/components/DisponibiliteGrille";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

interface DropdownSelectorProps {
  label: string;
  options: string[];
  selected: string[]; // supporte multi-selection
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

  const toggleValue = (val: string) => {
    if (selected.includes(val)) {
      onSelect(selected.filter((v) => v !== val));
    } else {
      onSelect([...selected, val]);
    }
  };

  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setVisible(true)}
      >
        <Text style={{ color: selected.length > 0 ? "#092C44" : "#aaa" }}>
          {selected.length > 0
            ? selected.join(", ")
            : `Sélectionner ${label.toLowerCase()}`}
        </Text>
        <Ionicons name="chevron-down" size={18} color="#092C44" />
      </TouchableOpacity>
      <Modal visible={visible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.overlay}
          onPress={() => setVisible(false)}
          activeOpacity={1}
        >
          <View style={styles.modal}>
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.option,
                    selected.includes(item) && { backgroundColor: "#eee" },
                  ]}
                  onPress={() => {
                    if (multiple) {
                      toggleValue(item);
                    } else {
                      onSelect([item]);
                      setVisible(false);
                    }
                  }}
                >
                  <Text style={styles.optionText}>
                    {item}
                    {selected.includes(item) && " ✔"}
                  </Text>
                </TouchableOpacity>
              )}
            />
            {multiple && (
              <TouchableOpacity
                style={styles.modalBtn}
                onPress={() => setVisible(false)}
              >
                <Text style={styles.modalBtnText}>Valider</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
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

export default function CompleteProfile() {
  const [gender, setGender] = useState<string>("");
  const [niveau, setNiveau] = useState<string>("");
  const [objectifs, setObjectifs] = useState<string[]>([]);
  const [sports, setSports] = useState<string[]>([]);
  const [availability, setAvailability] = useState<any>(null);
  const [location, setLocation] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Util pour parser tout ce qui peut arriver (array, stringifié, null)
  const parseArray = (val: any) => {
    if (Array.isArray(val)) return val;
    if (typeof val === "string" && val.startsWith("[")) {
      try {
        const arr = JSON.parse(val);
        // Tableau de string ou d'array de string
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

  const toggleSport = (sport: string) => {
    setSports((prev) =>
      prev.includes(sport) ? prev.filter((s) => s !== sport) : [...prev, sport]
    );
  };

  const handleSave = async () => {
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
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace("/profile")}>
          <Ionicons
            name="arrow-back"
            size={24}
            color="#FF5135"
            style={styles.backIcon}
          />
        </TouchableOpacity>
        <Text style={styles.title}>Modifier le profil</Text>
      </View>

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

      <Text style={styles.label}>Sports pratiqués</Text>
      <View style={styles.sportsWrapper}>
        {sportsList.map((sport, i) => {
          const selected = sports.includes(sport);
          return (
            <TouchableOpacity
              key={i}
              onPress={() => toggleSport(sport)}
              style={[
                styles.sportButton,
                selected
                  ? styles.sportButtonSelected
                  : styles.sportButtonUnselected,
              ]}
            >
              <Text
                style={
                  selected
                    ? styles.sportTextSelected
                    : styles.sportTextUnselected
                }
              >
                {sport}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.label}>Disponibilité (jours / heures)</Text>
      <View style={{ marginBottom: 30 }}>
        <DisponibiliteGrille
          onChange={setAvailability}
          initial={availability}
        />
      </View>

      <TouchableOpacity
        onPress={handleSave}
        disabled={loading}
        style={styles.saveButton}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>Enregistrer</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#fff",
    flexGrow: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  backIcon: {
    marginRight: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0E4A7B",
  },
  label: {
    fontWeight: "600",
    marginBottom: 5,
    color: "#092C44",
  },
  selector: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 12,
    padding: 14,
    marginBottom: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    padding: 30,
  },
  modal: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 10,
    maxHeight: 400,
  },
  option: {
    padding: 15,
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
    borderRadius: 8,
    margin: 12,
    alignItems: "center",
  },
  modalBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  sportsWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 20,
  },
  sportButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    margin: 5,
  },
  sportButtonSelected: {
    backgroundColor: "#FF5135",
    borderColor: "#FF5135",
  },
  sportButtonUnselected: {
    backgroundColor: "#fff",
    borderColor: "#ccc",
  },
  sportTextSelected: {
    color: "#fff",
  },
  sportTextUnselected: {
    color: "#000",
  },
  saveButton: {
    backgroundColor: "#0E4A7B",
    padding: 15,
    borderRadius: 14,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
