import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ProfileScreen() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const response = await axios.get("http://localhost:8000/api/user", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(response.data);
      } catch (error) {
        console.error("Erreur fetch user:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleProfilePress = () => {
    router.push("../(auth)/complete-profile");
  };

  const handlePhotosPress = () => {
    router.push("../profile/photos");
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF5864" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Impossible de charger le profil</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mon profil</Text>

      <TouchableOpacity onPress={() => router.push("../profile/photos")}>
        <Image
          source={{
            uri: `http://localhost:8000/storage/${user?.profile_photo}`,
          }}
          style={styles.profileImage}
        />
      </TouchableOpacity>

      <Text style={styles.plusText}>Tinder Plus</Text>

      <TouchableOpacity style={styles.button} onPress={handleProfilePress}>
        <Text style={styles.buttonText}>Modifier mon profil</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={handlePhotosPress}
      >
        <Text style={styles.secondaryButtonText}>Ajouter des photos</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    paddingTop: 60,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
  },
  profileImage: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
    borderColor: "#FF5864",
    marginBottom: 20,
  },
  plusText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FF5864",
    marginBottom: 30,
  },
  button: {
    backgroundColor: "#FF5864",
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 30,
    marginBottom: 15,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  secondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#FF5864",
  },
  secondaryButtonText: {
    color: "#FF5864",
    fontWeight: "bold",
    fontSize: 16,
  },
});
