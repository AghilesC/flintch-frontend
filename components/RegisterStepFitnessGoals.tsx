import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MultiSelectDropdown from "./MultiSelectDropdown";

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

type Props = {
  onNext: (data: { fitness_level: string; goals: string[] }) => void;
  fitness_level?: string;
  goals?: string[];
};

const RegisterStepFitnessGoals: React.FC<Props> = ({
  onNext,
  fitness_level = "",
  goals = [],
}) => {
  const [niveau, setNiveau] = useState(fitness_level);
  const [selectedGoals, setSelectedGoals] = useState<string[]>(goals);

  const isValid =
    niveau && selectedGoals.length > 0 && selectedGoals.length <= 2;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Niveau sportif & Objectif(s)</Text>
      <Text style={styles.subtitle}>
        Renseigne ton niveau et tes objectifs sportifs principaux. Max 2
        objectifs.
      </Text>
      <View style={{ marginBottom: 24 }}>
        <Text style={styles.label}>Niveau sportif</Text>
        <View style={styles.dropdown}>
          {niveauxList.map((item) => (
            <TouchableOpacity
              key={item}
              style={[
                styles.niveauBtn,
                niveau === item && styles.niveauBtnSelected,
              ]}
              onPress={() => setNiveau(item)}
            >
              <Text
                style={
                  niveau === item
                    ? styles.niveauTextSelected
                    : styles.niveauText
                }
              >
                {item}
              </Text>
              {niveau === item && (
                <Ionicons
                  name="checkmark-circle"
                  size={18}
                  color="#FF5135"
                  style={{ marginLeft: 8 }}
                />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <MultiSelectDropdown
        label="Objectif(s)"
        options={objectifsList}
        selected={selectedGoals}
        onSelect={setSelectedGoals}
        max={2}
      />

      <TouchableOpacity
        style={[styles.nextBtn, !isValid && { opacity: 0.5 }]}
        onPress={() =>
          isValid && onNext({ fitness_level: niveau, goals: selectedGoals })
        }
        disabled={!isValid}
      >
        <Ionicons name="arrow-forward" size={22} color="#fff" />
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: "#fff",
    justifyContent: "center",
  },
  title: { fontWeight: "700", fontSize: 22, marginBottom: 8, color: "#0E4A7B" },
  subtitle: { color: "#333", marginBottom: 18, fontSize: 15 },
  label: { fontWeight: "600", marginBottom: 8, color: "#092C44" },
  dropdown: {
    backgroundColor: "#f6f6f6",
    borderRadius: 12,
    marginBottom: 20,
    padding: 6,
  },
  niveauBtn: {
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    marginBottom: 4,
    backgroundColor: "#fff",
  },
  niveauBtnSelected: { backgroundColor: "#FFEEE8" },
  niveauText: { color: "#092C44" },
  niveauTextSelected: { color: "#FF5135", fontWeight: "bold" },
  nextBtn: {
    backgroundColor: "#FF5135",
    borderRadius: 30,
    width: 58,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-end",
    marginTop: 40,
    shadowColor: "#FF5135",
    shadowOpacity: 0.18,
    shadowRadius: 8,
  },
});
export default RegisterStepFitnessGoals;
