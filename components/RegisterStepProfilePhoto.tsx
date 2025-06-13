import React, { useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
// import * as ImagePicker from "expo-image-picker"; // à activer si tu veux picker direct

const RegisterStepProfilePhoto = ({
  onNext,
}: {
  onNext: (data: { profile_photo: string }) => void;
}) => {
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  // Pour une version sans picker (fais "skip" si tu veux)
  const handlePickPhoto = async () => {
    // Ici tu peux utiliser expo-image-picker (décommenter plus tard)
    // const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images });
    // if (!result.cancelled) {
    //   setPhotoUri(result.uri);
    // }
    // Version démo : simulate upload
    setPhotoUri("https://randomuser.me/api/portraits/men/1.jpg");
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 28,
        backgroundColor: "#fff",
      }}
    >
      <Text style={styles.headline}>Ajoute une photo de profil</Text>
      <TouchableOpacity style={styles.photoButton} onPress={handlePickPhoto}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.photo} />
        ) : (
          <Text style={{ color: "#0E4A7B" }}>Choisir une photo</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.nextButton,
          { backgroundColor: photoUri ? "#FF5135" : "#ddd" },
        ]}
        disabled={!photoUri}
        onPress={() => onNext({ profile_photo: photoUri || "" })}
        activeOpacity={0.85}
      >
        <Text style={{ color: "#fff", fontSize: 22, fontWeight: "bold" }}>
          Terminer
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
    textAlign: "center",
  },
  photoButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#e9eef6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#0E4A7B",
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    resizeMode: "cover",
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

export default RegisterStepProfilePhoto;
