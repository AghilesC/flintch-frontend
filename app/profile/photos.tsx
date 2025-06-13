import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface Photo {
  id: number;
  photo_url: string;
  is_main: boolean;
}

const MAX_PHOTOS = 9;

export default function PhotosScreen() {
  const [photos, setPhotos] = useState<Photo[]>([]);

  const showToast = (message: string) => {
    if (Platform.OS === "android") {
      import("react-native").then(({ ToastAndroid }) => {
        ToastAndroid.show(message, ToastAndroid.SHORT);
      });
    } else {
      Alert.alert(message);
    }
  };

  const fetchUserPhotos = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await axios.get("http://127.0.0.1:8000/api/photos", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPhotos(res.data.photos);
    } catch (error) {
      console.log("Erreur fetch photos:", error);
    }
  };

  const uploadPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes:
        Platform.OS === "web"
          ? ImagePicker.MediaTypeOptions.Images
          : [ImagePicker.MediaType.IMAGE],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      const token = await AsyncStorage.getItem("token");

      const formData = new FormData();

      if (Platform.OS === "web") {
        const response = await fetch(asset.uri);
        const blob = await response.blob();
        formData.append(
          "photo",
          new File([blob], "photo.jpg", { type: blob.type })
        );
      } else {
        formData.append("photo", {
          uri: asset.uri,
          name: "photo.jpg",
          type: "image/jpeg",
        } as any);
      }

      try {
        await axios.post("http://127.0.0.1:8000/api/photos/upload", formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
        showToast("Photo ajoutée !");
        fetchUserPhotos();
      } catch (error) {
        console.log("Erreur upload :", error);
        showToast("Erreur lors de l'envoi");
      }
    }
  };

  const deletePhoto = async (photoId: number) => {
    try {
      const token = await AsyncStorage.getItem("token");
      await axios.delete(`http://127.0.0.1:8000/api/photos/${photoId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showToast("Photo supprimée");
      fetchUserPhotos();
    } catch (error) {
      console.log("Erreur suppression photo :", error);
      showToast("Erreur lors de la suppression");
    }
  };

  const setMainPhoto = async (photoId: number) => {
    try {
      const token = await AsyncStorage.getItem("token");
      await axios.post(
        `http://127.0.0.1:8000/api/photos/set-main/${photoId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      showToast("Photo principale mise à jour");
      fetchUserPhotos();
    } catch (error) {
      console.log("Erreur setMainPhoto :", error);
      showToast("Erreur serveur");
    }
  };

  const renderSlot = (index: number) => {
    const photo = photos[index];

    if (photo) {
      return (
        <View key={photo.id} style={styles.photoContainer}>
          <TouchableOpacity onLongPress={() => setMainPhoto(photo.id)}>
            <Image source={{ uri: photo.photo_url }} style={styles.photo} />
            {photo.is_main && (
              <Text style={styles.badge}>Photo principale</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => deletePhoto(photo.id)}
          >
            <Ionicons name="close-circle" size={24} color="white" />
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <TouchableOpacity
        key={`empty-${index}`}
        style={styles.emptySlot}
        onPress={uploadPhoto}
      >
        <Ionicons name="add" size={32} color="#ff4d4d" />
      </TouchableOpacity>
    );
  };

  useEffect(() => {
    fetchUserPhotos();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Modifier le profil</Text>
      <Text style={styles.subtitle}>Ajoute jusqu’à 9 photos.</Text>

      <View style={styles.grid}>
        {Array.from({ length: MAX_PHOTOS }).map((_, index) =>
          renderSlot(index)
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 4 },
  subtitle: { marginBottom: 12, color: "#555" },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    gap: 10,
  },
  photoContainer: {
    position: "relative",
    width: 100,
    height: 100,
    marginBottom: 10,
  },
  photo: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },
  deleteBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 12,
    padding: 2,
  },
  emptySlot: {
    width: 100,
    height: 100,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  badge: {
    position: "absolute",
    bottom: 4,
    left: 4,
    backgroundColor: "gold",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    fontSize: 12,
    fontWeight: "bold",
  },
});
