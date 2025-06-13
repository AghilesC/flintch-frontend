import { Picker } from "@react-native-picker/picker";
import React, { useState } from "react";
import {
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const screen = Dimensions.get("window");
const inputBirthdayWidth = Math.max(
  Math.floor((screen.width - 32 * 2 - 8) / 3), // padding réduit à 16px
  80
);

const MONTHS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];
const YEARS: number[] = [];
for (let y = 2025; y >= 1945; y--) YEARS.push(y);

type Props = {
  onNext: (data: { name: string; birthdate: string }) => void;
  name?: string;
};

const RegisterStepNameBirthday = ({ onNext, name = "" }: Props) => {
  const [localName, setLocalName] = useState(name);
  const [day, setDay] = useState<number | "">("");
  const [month, setMonth] = useState<number | "">("");
  const [year, setYear] = useState<number | "">("");
  const [touched, setTouched] = useState(false);

  const isNameValid = localName.trim().length >= 3;
  let isDateValid = false;
  let age = 0;
  const d = Number(day),
    m = Number(month),
    y = Number(year);
  if (d && m && y) {
    const dt = new Date(y, m - 1, d);
    const today = new Date();
    age = today.getFullYear() - dt.getFullYear();
    if (
      dt.getDate() === d &&
      dt.getMonth() === m - 1 &&
      dt.getFullYear() === y
    ) {
      const monthDiff = today.getMonth() - dt.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dt.getDate()))
        age--;
      isDateValid = age >= 18;
    }
  }

  let errorMsg = "";
  if (!isNameValid && touched)
    errorMsg = "Le prénom doit faire au moins 3 lettres";
  else if ((d || m || y) && !isDateValid) {
    if (d && m && y) {
      if (age < 18) errorMsg = "Tu dois avoir au moins 18 ans pour t’inscrire.";
      else errorMsg = "Date invalide.";
    } else {
      errorMsg = "Date incomplète.";
    }
  }

  const canNext = isNameValid && isDateValid;
  const birthdate =
    y && m && d
      ? `${y}-${m.toString().padStart(2, "0")}-${d.toString().padStart(2, "0")}`
      : "";

  let nbDays = 31;
  if (m && y) nbDays = new Date(y, m, 0).getDate();
  const daysList = Array.from({ length: nbDays }, (_, i) => i + 1);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: "#fff" }}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.inner}>
          <View style={styles.progressBar} />

          <Text style={styles.headline}>Commence par te présenter.</Text>
          <Text style={styles.label}>Ton prénom</Text>
          <TextInput
            style={[
              styles.input,
              !isNameValid && touched && { borderColor: "#FF5135" },
            ]}
            value={localName}
            onChangeText={(t) => setLocalName(t)}
            placeholder="Prénom"
            onBlur={() => setTouched(true)}
            autoFocus
          />

          <Text style={styles.label}>Ton anniversaire</Text>
          <View style={styles.pickerRow}>
            <View style={[styles.pickerCol, { width: inputBirthdayWidth }]}>
              <Picker
                selectedValue={day}
                onValueChange={setDay}
                style={styles.picker}
                dropdownIconColor="#0E4A7B"
              >
                <Picker.Item label="Jour" value="" color="#A9B7C9" />
                {daysList.map((d) => (
                  <Picker.Item
                    key={d}
                    label={d.toString()}
                    value={d}
                    color="#0E4A7B"
                  />
                ))}
              </Picker>
            </View>
            <View
              style={[styles.pickerCol, { width: inputBirthdayWidth + 10 }]}
            >
              <Picker
                selectedValue={month}
                onValueChange={setMonth}
                style={styles.picker}
                dropdownIconColor="#0E4A7B"
              >
                <Picker.Item label="Mois" value="" color="#A9B7C9" />
                {MONTHS.map((m, i) => (
                  <Picker.Item
                    key={m}
                    label={m}
                    value={i + 1}
                    color="#0E4A7B"
                  />
                ))}
              </Picker>
            </View>
            <View style={[styles.pickerCol, { width: inputBirthdayWidth + 8 }]}>
              <Picker
                selectedValue={year}
                onValueChange={setYear}
                style={styles.picker}
                dropdownIconColor="#0E4A7B"
              >
                <Picker.Item label="Année" value="" color="#A9B7C9" />
                {YEARS.map((y) => (
                  <Picker.Item
                    key={y}
                    label={y.toString()}
                    value={y}
                    color="#0E4A7B"
                  />
                ))}
              </Picker>
            </View>
          </View>

          <Text
            style={[
              styles.helpText,
              !!errorMsg && { color: "#FF5135", fontWeight: "700" },
            ]}
          >
            {errorMsg
              ? errorMsg
              : "Il n'est jamais trop tôt pour lancer le compte à rebours"}
          </Text>

          <TouchableOpacity
            style={[
              styles.nextButton,
              { backgroundColor: canNext ? "#FF5135" : "#ddd" },
            ]}
            disabled={!canNext}
            onPress={() => onNext({ name: localName.trim(), birthdate })}
            activeOpacity={0.85}
          >
            <Text style={styles.nextButtonText}>Suivant</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default RegisterStepNameBirthday;

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: 24,
    backgroundColor: "#fff",
  },
  inner: {
    width: "100%",
    maxWidth: 390, // iPhone 14 max width
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 32,
    backgroundColor: "#fff",
    borderRadius: 16,
  },
  progressBar: {
    height: 3,
    width: "22%",
    backgroundColor: "#FF5135",
    borderRadius: 3,
    marginBottom: 26,
    alignSelf: "center",
  },
  headline: {
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 28,
    color: "#0E4A7B",
    letterSpacing: -0.5,
    textAlign: "left",
    alignSelf: "flex-start",
  },
  label: {
    fontWeight: "700",
    marginBottom: 8,
    fontSize: 16,
    color: "#092C44",
    textAlign: "left",
    alignSelf: "flex-start",
  },
  input: {
    borderWidth: 2,
    borderColor: "#bbb",
    borderRadius: 14,
    padding: 14,
    fontSize: 18,
    marginBottom: 22,
    backgroundColor: "#fafafa",
    color: "#092C44",
    width: "100%",
    textAlign: "left",
  },
  pickerRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginBottom: 8,
    width: "100%",
  },
  pickerCol: {
    backgroundColor: "#fafafa",
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#bbb",
    justifyContent: "center",
    marginRight: 2,
    overflow: "hidden",
  },
  picker: {
    width: "100%",
    color: "#092C44",
    fontSize: 17,
  },
  helpText: {
    color: "#888",
    marginBottom: 24,
    fontSize: 13,
    textAlign: "center",
  },
  nextButton: {
    width: "80%",
    minWidth: 120,
    maxWidth: 250,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    marginTop: 18,
    alignSelf: "center",
  },
  nextButtonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginTop: -1,
    letterSpacing: 1,
  },
});
