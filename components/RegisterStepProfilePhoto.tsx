import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const RegisterStepProfilePhoto = ({
  onNext,
  profile_photo,
}: {
  onNext: (data: {
    profile_photo: string;
    file: { uri: string; name: string; type: string } | null;
  }) => void;
  profile_photo?: string;
}) => {
  const [photoUri, setPhotoUri] = useState(profile_photo || "");
  const [photoFile, setPhotoFile] = useState<{
    uri: string;
    name: string;
    type: string;
  } | null>(null);
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
        allowsEditing: true,
        aspect: [4, 5],
        quality: 0.8,
        base64: false, // important: pas de base64
      });

      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];
        const uri = asset.uri;
        const filename = uri.split("/").pop() ?? `photo-${Date.now()}.jpg`;
        const ext = filename.split(".").pop()?.toLowerCase() || "jpg";
        const type = ext === "jpg" ? "image/jpeg" : `image/${ext}`;

        const formattedFile = {
          uri: Platform.OS === "web" ? uri : uri,
          name: filename,
          type,
        };

        setPhotoUri(uri);
        setPhotoFile(formattedFile);
      }
    } catch (err) {
      Alert.alert("Erreur", "Impossible de sélectionner la photo");
      console.error("Erreur ImagePicker:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (!photoUri || !photoFile) {
      Alert.alert("Erreur", "Aucune photo sélectionnée");
      return;
    }
    onNext({ profile_photo: photoUri, file: photoFile });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ajoute une photo</Text>

      <TouchableOpacity
        style={styles.photoContainer}
        onPress={pickImage}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#FF5135" />
        ) : photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.photo} />
        ) : (
          <>
            <Ionicons name="add" size={40} color="#FF5135" />
            <Text style={styles.photoText}>Choisir une photo</Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: photoUri ? "#FF5135" : "#ccc" },
        ]}
        onPress={handleNext}
        disabled={!photoUri || !photoFile}
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
  },
  photoContainer: {
    width: 240,
    height: 280,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#FF5135",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
  },
  photo: {
    width: "100%",
    height: "100%",
    borderRadius: 14,
  },
  photoText: {
    marginTop: 8,
    fontSize: 16,
    color: "#FF5135",
  },
  button: {
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
