import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const RegisterStepPhone = ({
  onNext,
}: {
  onNext: (data: { phone: string }) => void;
}) => {
  const [phone, setPhone] = useState("");
  const [touched, setTouched] = useState(false);

  const isValid = /^\+?[0-9\s\-]{8,20}$/.test(phone);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        padding: 28,
        backgroundColor: "#fff",
      }}
    >
      <Text style={styles.headline}>Numéro de téléphone</Text>
      <TextInput
        style={[
          styles.input,
          !isValid && touched && { borderColor: "#FF5135" },
        ]}
        value={phone}
        placeholder="Ex : +33 6 12 34 56 78"
        keyboardType="phone-pad"
        onChangeText={setPhone}
        onBlur={() => setTouched(true)}
        autoFocus
      />
      {!isValid && touched && (
        <Text style={{ color: "#FF5135", fontWeight: "700" }}>
          Numéro invalide
        </Text>
      )}
      <TouchableOpacity
        style={[
          styles.nextButton,
          { backgroundColor: isValid ? "#FF5135" : "#ddd" },
        ]}
        disabled={!isValid}
        onPress={() => onNext({ phone })}
        activeOpacity={0.85}
      >
        <Text style={{ color: "#fff", fontSize: 22, fontWeight: "bold" }}>
          Suivant
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  headline: {
    fontSize: 25,
    fontWeight: "700",
    marginBottom: 32,
    color: "#0E4A7B",
    letterSpacing: -0.5,
    textAlign: "left",
  },
  input: {
    borderWidth: 2,
    borderColor: "#bbb",
    borderRadius: 14,
    padding: 14,
    fontSize: 18,
    marginBottom: 18,
    backgroundColor: "#fafafa",
    color: "#092C44",
  },
  nextButton: {
    width: "100%",
    padding: 16,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    marginTop: 12,
  },
});

export default RegisterStepPhone;
