import React, { useState } from "react";
import {
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Génére 140 à 210 cm → pieds/pouces inclus
const HEIGHTS = Array.from({ length: 71 }, (_, i) => 140 + i); // 140 à 210 cm
const WEIGHTS = Array.from({ length: 221 }, (_, i) => 30 + i); // 30 à 250 kg

function formatHeight(cm: number) {
  const inchesTotal = cm / 2.54;
  const feet = Math.floor(inchesTotal / 12);
  const inches = Math.round(inchesTotal % 12);
  return `${cm} cm / ${feet}'${inches}"`;
}

function formatWeight(kg: number) {
  const lbs = Math.round(kg * 2.20462);
  return `${kg} kg / ${lbs} lbs`;
}

type Props = {
  onNext: (data: { height: string; weight: string }) => void;
  height?: string;
  weight?: string;
};

const windowHeight = Dimensions.get("window").height;

const RegisterStepHeightWeight = ({ onNext, height, weight }: Props) => {
  const [selectedHeight, setSelectedHeight] = useState(height || "170");
  const [selectedWeight, setSelectedWeight] = useState(weight || "70");

  return (
    <View style={{ flex: 1, padding: 28, backgroundColor: "#fff" }}>
      <Text style={styles.headline}>Maintenant, parlons de toi</Text>
      <Text style={styles.subtitle}>
        Occupons-nous d'abord des infos de base.
        {"\n"}Nous pourrons ensuite nous concentrer sur ce qui est vraiment
        important.
      </Text>

      <Text style={styles.label}>Ta taille</Text>
      <FlatList
        data={HEIGHTS}
        keyExtractor={(item) => `${item}`}
        style={{ height: windowHeight * 0.18 }}
        showsVerticalScrollIndicator={false}
        initialScrollIndex={HEIGHTS.findIndex((h) => `${h}` === selectedHeight)}
        getItemLayout={(_, index) => ({
          length: 44,
          offset: 44 * index,
          index,
        })}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setSelectedHeight(`${item}`)}
            style={[
              styles.item,
              selectedHeight === `${item}` && styles.selectedItem,
            ]}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: selectedHeight === `${item}` ? "700" : "400",
                color: "#222",
              }}
            >
              {formatHeight(item)}
            </Text>
          </TouchableOpacity>
        )}
      />

      <Text style={[styles.label, { marginTop: 30 }]}>Ton poids</Text>
      <FlatList
        data={WEIGHTS}
        keyExtractor={(item) => `${item}`}
        style={{ height: windowHeight * 0.18 }}
        showsVerticalScrollIndicator={false}
        initialScrollIndex={Number(weight) ? Number(weight) - 30 : 40}
        getItemLayout={(_, index) => ({
          length: 44,
          offset: 44 * index,
          index,
        })}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setSelectedWeight(`${item}`)}
            style={[
              styles.item,
              selectedWeight === `${item}` && styles.selectedItem,
            ]}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: selectedWeight === `${item}` ? "700" : "400",
                color: "#222",
              }}
            >
              {formatWeight(item)}
            </Text>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity
        onPress={() =>
          onNext({ height: selectedHeight, weight: selectedWeight })
        }
        style={styles.nextButton}
        activeOpacity={0.85}
      >
        <Text style={{ color: "#fff", fontSize: 22, fontWeight: "bold" }}>
          Suivant
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => onNext({ height: "", weight: "" })}
        style={{ marginTop: 10, alignItems: "center" }}
      >
        <Text style={{ color: "#0E4A7B", fontSize: 16, opacity: 0.7 }}>
          Passer
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  headline: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 10,
    color: "#0E4A7B",
    letterSpacing: -0.5,
  },
  subtitle: {
    color: "#888",
    fontSize: 16,
    marginBottom: 28,
  },
  label: {
    fontSize: 17,
    fontWeight: "600",
    color: "#222",
    marginBottom: 12,
    marginTop: 5,
  },
  item: {
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 10,
  },
  selectedItem: {
    backgroundColor: "#F1F6FA",
  },
  nextButton: {
    marginTop: 32,
    backgroundColor: "#FF5135",
    borderRadius: 22,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },
});

export default RegisterStepHeightWeight;
