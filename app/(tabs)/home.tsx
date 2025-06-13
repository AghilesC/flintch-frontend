import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const HomeScreen = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          router.replace("/login");
          return;
        }

        const response = await axios.get("http://127.0.0.1:8000/api/user", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setUser(response.data);
      } catch (error: any) {
        console.log("Erreur récupération utilisateur :", error);

        // Si token invalide/expiré, on logout direct
        if (error.response && error.response.status === 401) {
          await AsyncStorage.removeItem("token");
          router.replace("/login");
        } else {
          Alert.alert("Erreur", "Impossible de récupérer les informations.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        await axios.post(
          "http://127.0.0.1:8000/api/logout",
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }
      await AsyncStorage.removeItem("token");
      router.replace("/login");
    } catch (error) {
      console.error("Erreur logout :", error);
      Alert.alert("Erreur", "Déconnexion échouée.");
    }
  };

  // Pour tes tests dev, purge AsyncStorage
  const purgeToken = async () => {
    await AsyncStorage.clear();
    Alert.alert("AsyncStorage vidé !");
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Bienvenue, {user?.name || "Utilisateur"} 👋
      </Text>
      <Text style={styles.email}>{user?.email}</Text>

      <View style={{ marginTop: 30 }}>
        <Button title="Se déconnecter" onPress={handleLogout} />
      </View>

      {/* POUR DEV UNIQUEMENT */}
      <TouchableOpacity onPress={purgeToken}>
        <Text style={{ textAlign: "center", marginTop: 24, color: "#888" }}>
          [Purger le token pour tests]
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    marginBottom: 10,
    textAlign: "center",
  },
  email: {
    fontSize: 16,
    textAlign: "center",
    color: "#666",
  },
});
