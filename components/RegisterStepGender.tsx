import React, { useState } from "react";
import {
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

  const handleNext = () => {
    if (selected) onNext({ gender: selected });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headline}>
        Quel est le genre qui te décrit le mieux ?
      </Text>

      {/* Femme */}
      <TouchableOpacity
        style={[styles.option, selected === "Femme" && styles.optionSelected]}
        onPress={() => setSelected("Femme")}
        activeOpacity={0.8}
      >
        <Text style={styles.optionText}>Femme</Text>
        <View
          style={[styles.radio, selected === "Femme" && styles.radioSelected]}
        />
      </TouchableOpacity>

      {/* Homme */}
      <TouchableOpacity
        style={[styles.option, selected === "Homme" && styles.optionSelected]}
        onPress={() => setSelected("Homme")}
        activeOpacity={0.8}
      >
        <Text style={styles.optionText}>Homme</Text>
        <View
          style={[styles.radio, selected === "Homme" && styles.radioSelected]}
        />
      </TouchableOpacity>

      {/* Autre... ouvre une modal */}
      <TouchableOpacity
        style={[
          styles.option,
          COMMON_GENDERS.includes(selected) &&
            selected !== "Femme" &&
            selected !== "Homme" &&
            styles.optionSelected,
        ]}
        onPress={() => setShowModal(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.optionText}>
          {COMMON_GENDERS.includes(selected) &&
          selected !== "Femme" &&
          selected !== "Homme"
            ? selected
            : "Autre…"}
        </Text>
        <View
          style={[
            styles.radio,
            COMMON_GENDERS.includes(selected) &&
              selected !== "Femme" &&
              selected !== "Homme" &&
              styles.radioSelected,
          ]}
        />
      </TouchableOpacity>

      {/* Modal déroulante */}
      <Modal visible={showModal} transparent animationType="fade">
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.15)" }}
          onPress={() => setShowModal(false)}
          activeOpacity={1}
        >
          <View style={styles.modalBox}>
            <FlatList
              data={COMMON_GENDERS}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    selected === item && { backgroundColor: "#E8F1FB" },
                  ]}
                  onPress={() => {
                    setSelected(item);
                    setShowModal(false);
                  }}
                >
                  <Text
                    style={{
                      color: "#092C44",
                      fontWeight: selected === item ? "bold" : "normal",
                      fontSize: 17,
                    }}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Next button */}
      <TouchableOpacity
        style={[
          styles.nextButton,
          selected
            ? { backgroundColor: "#FF5135" }
            : { backgroundColor: "#ddd" },
        ]}
        disabled={!selected}
        onPress={handleNext}
        activeOpacity={0.9}
      >
        <Text style={{ color: "#fff", fontSize: 22, fontWeight: "bold" }}>
          Suivant
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 28,
    backgroundColor: "#fff",
    justifyContent: "center",
  },
  headline: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 20,
    color: "#0E4A7B",
    letterSpacing: -0.5,
    textAlign: "left",
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F6F7F9",
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 18,
    marginBottom: 16,
    justifyContent: "space-between",
  },
  optionSelected: {
    backgroundColor: "#E8F1FB",
    borderColor: "#0E4A7B",
    borderWidth: 1.5,
  },
  optionText: {
    fontSize: 18,
    color: "#092C44",
    fontWeight: "600",
  },
  radio: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: "#bbb",
    backgroundColor: "#fff",
  },
  radioSelected: {
    borderColor: "#0E4A7B",
    backgroundColor: "#0E4A7B33",
  },
  nextButton: {
    width: "100%",
    padding: 16,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    marginTop: 22,
  },
  modalBox: {
    backgroundColor: "#fff",
    marginHorizontal: 30,
    marginTop: "55%",
    borderRadius: 18,
    paddingVertical: 10,
    elevation: 8,
    maxHeight: 360,
  },
  modalItem: {
    paddingVertical: 16,
    paddingHorizontal: 22,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
});

export default RegisterStepGender;
