import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

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
};

const RegisterStepSports: React.FC<Props> = ({
  onNext,
  initial = [],
  onSkip,
}) => {
  const [selected, setSelected] = useState<string[]>(initial);
  const [search, setSearch] = useState("");

  const filtered = sportsList.filter((s) =>
    s.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (sport: string) => {
    if (selected.includes(sport)) {
      setSelected(selected.filter((s) => s !== sport));
    } else if (selected.length < 5) {
      setSelected([...selected, sport]);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.progressBar} />
      <Text style={styles.title}>Choisis 5 sports que tu pratiques</Text>
      <Text style={styles.desc}>
        Ajoute tes sports favoris pour trouver des partenaires qui partagent tes
        passions !
      </Text>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#888" />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Quel sport tu aimes ?"
          placeholderTextColor="#bbb"
          style={styles.searchInput}
        />
      </View>
      <View style={styles.sportsWrapper}>
        {filtered.map((sport) => (
          <TouchableOpacity
            key={sport}
            style={[
              styles.sportBtn,
              selected.includes(sport) && styles.sportBtnSelected,
            ]}
            onPress={() => toggle(sport)}
            activeOpacity={0.85}
            disabled={!selected.includes(sport) && selected.length === 5}
          >
            <Text
              style={[
                styles.sportText,
                selected.includes(sport) && styles.sportTextSelected,
              ]}
            >
              {sport} {selected.includes(sport) ? "✓" : "+"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.bottomRow}>
        <TouchableOpacity onPress={onSkip}>
          <Text style={styles.skip}>Passer</Text>
        </TouchableOpacity>
        <Text style={styles.selection}>Sélection : {selected.length}/5</Text>
        <TouchableOpacity
          style={[
            styles.nextBtn,
            { backgroundColor: selected.length > 0 ? "#FF5135" : "#ccc" },
          ]}
          onPress={() => onNext(selected)}
          disabled={selected.length === 0}
          activeOpacity={0.85}
        >
          <Ionicons name="arrow-forward" size={26} color="#fff" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default RegisterStepSports;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#fff",
    minHeight: "100%",
    flexGrow: 1,
  },
  progressBar: {
    height: 3,
    width: "64%",
    backgroundColor: "#FF5135",
    borderRadius: 3,
    marginBottom: 30,
    alignSelf: "flex-start",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 6,
    color: "#0E4A7B",
    textAlign: "left",
  },
  desc: {
    color: "#888",
    fontSize: 15,
    marginBottom: 18,
    textAlign: "left",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#eee",
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 14,
    backgroundColor: "#f5f6fa",
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingLeft: 8,
    fontSize: 16,
    color: "#092C44",
    backgroundColor: "transparent",
  },
  sportsWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    marginBottom: 32,
  },
  sportBtn: {
    backgroundColor: "#f7f8fc",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    margin: 5,
    borderWidth: 1,
    borderColor: "#ececec",
  },
  sportBtnSelected: {
    backgroundColor: "#FF5135",
    borderColor: "#FF5135",
  },
  sportText: {
    fontSize: 16,
    color: "#333",
  },
  sportTextSelected: {
    color: "#fff",
    fontWeight: "700",
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 15,
    marginBottom: 25,
    gap: 14,
  },
  skip: {
    color: "#aaa",
    fontSize: 16,
    padding: 10,
  },
  selection: {
    fontSize: 15,
    color: "#0E4A7B",
    fontWeight: "600",
  },
  nextBtn: {
    padding: 14,
    borderRadius: 30,
    backgroundColor: "#FF5135",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 54,
    minHeight: 54,
  },
});
