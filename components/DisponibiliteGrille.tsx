import React, { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

const jours = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const heures = ["6h", "8h", "10h", "12h", "14h", "16h", "18h", "20h", "22h"];

type DisponibilitesType = {
  [jour: string]: string[];
};

type Props = {
  onChange: (disponibilites: DisponibilitesType) => void;
  initial?: DisponibilitesType;
};

export default function DisponibiliteGrille({ onChange, initial }: Props) {
  const [disponibilites, setDisponibilites] = useState<DisponibilitesType>({});

  useEffect(() => {
    if (initial) {
      const base: DisponibilitesType = {};
      jours.forEach((jour) => {
        base[jour] = initial[jour] || [];
      });
      setDisponibilites(base);
    }
  }, [initial]);

  const toggleCase = (jour: string, heure: string) => {
    const current = disponibilites[jour] || [];
    const updated = current.includes(heure)
      ? current.filter((h) => h !== heure)
      : [...current, heure];

    const newDisponibilites = { ...disponibilites, [jour]: updated };
    setDisponibilites(newDisponibilites);
    onChange(newDisponibilites);
  };

  return (
    <View
      style={{
        borderRadius: 12,
        overflow: "hidden",
        backgroundColor: "#f9f9f9",
        borderWidth: 1,
        borderColor: "#ddd",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      {/* Ligne d’en-tête */}
      <View style={{ flexDirection: "row", backgroundColor: "#f2f2f2" }}>
        <View style={{ width: 50 }} />
        {heures.map((heure) => (
          <View
            key={heure}
            style={{ flex: 1, padding: 6, alignItems: "center" }}
          >
            <Text style={{ fontSize: 11, fontWeight: "600", color: "#555" }}>
              {heure}
            </Text>
          </View>
        ))}
      </View>

      {/* Grille */}
      {jours.map((jour) => (
        <View key={jour} style={{ flexDirection: "row" }}>
          <View
            style={{
              width: 50,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "#f2f2f2",
              paddingVertical: 6,
            }}
          >
            <Text style={{ fontWeight: "600", color: "#333" }}>{jour}</Text>
          </View>
          {heures.map((heure) => {
            const active = disponibilites[jour]?.includes(heure);
            return (
              <TouchableOpacity
                key={heure}
                onPress={() => toggleCase(jour, heure)}
                style={{
                  flex: 1,
                  height: 36,
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: active ? "#FF5135" : "#fff",
                  borderWidth: 0.5,
                  borderColor: "#ddd",
                }}
              >
                {active && (
                  <Text style={{ color: "#fff", fontWeight: "bold" }}>✔</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}
