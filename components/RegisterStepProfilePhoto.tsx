import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const RegisterStepProfilePhoto = ({
  onNext,
}: {
  onNext: (data: {
    photos: {
      uri: string;
      name: string;
      type: string;
      is_main: boolean;
    }[];
  }) => void;
}) => {
  const [photos, setPhotos] = useState<
    { uri: string; name: string; type: string; is_main: boolean }[]
  >([]);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    try {
      setLoading(true);
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission refusée", "Accès aux photos requis");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        allowsEditing: true,
        aspect: [4, 5],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled) {
        const newPhotos = result.assets.map((asset, index) => {
          const uri = asset.uri;
          const filename = uri.split("/").pop() ?? `photo-${Date.now()}.jpg`;
          const ext = filename.split(".").pop()?.toLowerCase() || "jpg";
          const type = ext === "jpg" ? "image/jpeg" : `image/${ext}`;
          return {
            uri: Platform.OS === "web" ? uri : uri,
            name: filename,
            type,
            is_main: photos.length === 0 && index === 0,
          };
        });

        setPhotos((prev) => [...prev, ...newPhotos]);
      }
    } catch (err) {
      Alert.alert("Erreur", "Impossible de sélectionner la photo");
      console.error("Erreur ImagePicker:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (index: number) => {
    const updated = [...photos];
    updated.splice(index, 1);

    // Réassigner la photo principale si elle est supprimée
    if (!updated.some((p) => p.is_main) && updated.length > 0) {
      updated[0].is_main = true;
    }

    setPhotos(updated);
  };

  const handleNext = () => {
    if (photos.length === 0) {
      Alert.alert("Erreur", "Aucune photo sélectionnée");
      return;
    }
    onNext({ photos });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ajoute une ou plusieurs photos</Text>

      <TouchableOpacity
        style={styles.photoPicker}
        onPress={pickImage}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#FF5135" />
        ) : (
          <>
            <Ionicons name="add" size={40} color="#FF5135" />
            <Text style={styles.photoText}>Choisir des photos</Text>
          </>
        )}
      </TouchableOpacity>

      <FlatList
        horizontal
        data={photos}
        keyExtractor={(item, index) => `${item.uri}-${index}`}
        renderItem={({ item, index }) => (
          <View style={styles.photoPreview}>
            <Image source={{ uri: item.uri }} style={styles.photo} />
            <TouchableOpacity
              style={styles.deleteIcon}
              onPress={() => handleDelete(index)}
            >
              <Ionicons name="close-circle" size={22} color="#FF5135" />
            </TouchableOpacity>
            {item.is_main && (
              <Text style={styles.mainBadge}>Photo principale</Text>
            )}
          </View>
        )}
        contentContainerStyle={{ gap: 10, paddingVertical: 20 }}
      />

      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: photos.length ? "#FF5135" : "#ccc" },
        ]}
        onPress={handleNext}
        disabled={photos.length === 0}
      >
        <Text style={styles.buttonText}>Suivant</Text>
      </TouchableOpacity>
    </View>
  );
};

export default RegisterStepProfilePhoto;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 32,
    backgroundColor: "#fff",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#092C44",
    marginBottom: 24,
    textAlign: "center",
  },
  photoPicker: {
    width: 240,
    height: 280,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#FF5135",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  photoText: {
    marginTop: 8,
    fontSize: 16,
    color: "#FF5135",
  },
  photoPreview: {
    position: "relative",
    width: 100,
    height: 120,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#FF5135",
  },
  deleteIcon: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#fff",
    borderRadius: 11,
  },
  mainBadge: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FF5135",
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
    paddingVertical: 2,
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  button: {
    marginTop: 20,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 28,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
