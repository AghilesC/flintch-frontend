import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Props = {
  label: string;
  options: string[];
  selected: string[];
  onSelect: (values: string[]) => void;
  max?: number;
};

const MultiSelectDropdown: React.FC<Props> = ({
  label,
  options,
  selected,
  onSelect,
  max = 2,
}) => {
  const [visible, setVisible] = useState(false);

  const toggle = (item: string) => {
    let newSelected = [...selected];
    if (newSelected.includes(item)) {
      newSelected = newSelected.filter((i) => i !== item);
    } else if (newSelected.length < max) {
      newSelected.push(item);
    }
    onSelect(newSelected);
  };

  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setVisible(true)}
      >
        <Text style={{ color: selected.length ? "#092C44" : "#aaa" }}>
          {selected.length
            ? selected.join(", ")
            : `Sélectionner ${label.toLowerCase()}`}
        </Text>
        <Ionicons name="chevron-down" size={18} color="#092C44" />
      </TouchableOpacity>
      <Modal visible={visible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.overlay}
          onPress={() => setVisible(false)}
        >
          <View style={styles.modal}>
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.option}
                  onPress={() => toggle(item)}
                >
                  <Text style={selected.includes(item) ? styles.selected : {}}>
                    {item}
                  </Text>
                  {selected.includes(item) && (
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color="#FF5135"
                      style={{ marginLeft: 8 }}
                    />
                  )}
                </TouchableOpacity>
              )}
            />
            <Text style={{ textAlign: "center", margin: 8 }}>
              Sélection : {selected.length}/{max}
            </Text>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  label: { fontWeight: "600", marginBottom: 5, color: "#092C44" },
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
    maxHeight: 420,
  },
  option: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    flexDirection: "row",
    alignItems: "center",
  },
  selected: { fontWeight: "bold", color: "#FF5135" },
});
export default MultiSelectDropdown;
