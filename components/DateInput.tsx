import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useState } from "react";
import { Button, Platform, Text, TextInput, View } from "react-native";

type Props = {
  label?: string;
  value: string;
  onChange: (date: string) => void;
};

export const DateInput = ({ label, value, onChange }: Props) => {
  const [show, setShow] = useState(false);

  const handleChange = (event: any, selectedDate?: Date) => {
    setShow(Platform.OS === "ios");
    if (selectedDate) {
      const formatted = selectedDate.toISOString().split("T")[0];
      onChange(formatted);
    }
  };

  return (
    <View style={{ marginBottom: 20 }}>
      {label && (
        <Text style={{ fontWeight: "bold", marginBottom: 5 }}>{label}</Text>
      )}

      {Platform.OS === "web" ? (
        <TextInput
          style={{
            borderWidth: 1,
            borderColor: "#aaa",
            borderRadius: 8,
            padding: 10,
          }}
          value={value}
          onChangeText={onChange}
          placeholder="YYYY-MM-DD"
          type="date"
        />
      ) : (
        <>
          <Button
            title={value ? value : "Sélectionner la date"}
            onPress={() => setShow(true)}
          />
          {show && (
            <DateTimePicker
              value={value ? new Date(value) : new Date(2000, 0, 1)}
              mode="date"
              display="default"
              onChange={handleChange}
            />
          )}
        </>
      )}
    </View>
  );
};
