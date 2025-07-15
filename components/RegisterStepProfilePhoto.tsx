import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Defs, Ellipse, RadialGradient, Stop } from "react-native-svg";

type PhotoData = {
  uri: string;
  name: string;
  type: string;
  is_main: boolean;
};

type Props = {
  onNext: (data: { photos: PhotoData[] }) => void;
  onSkip?: () => void;
  photos?: PhotoData[];
  currentStep?: number;
  totalSteps?: number;
  onBack?: () => void;
};

const RegisterStepProfilePhoto: React.FC<Props> = ({
  onNext,
  onSkip,
  photos: initialPhotos = [],
  currentStep = 6,
  totalSteps = 7,
  onBack,
}) => {
  const [photos, setPhotos] = useState<PhotoData[]>(initialPhotos);
  const [loading, setLoading] = useState(false);
  const buttonScale = useRef(new Animated.Value(1)).current;
  const photoPickerScale = useRef(new Animated.Value(1)).current;

  const triggerBounce = (animValue: Animated.Value) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.timing(animValue, {
        toValue: 1.05,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(animValue, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const pickImage = async () => {
    try {
      triggerBounce(photoPickerScale);
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
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err) {
      Alert.alert("Erreur", "Impossible de sélectionner la photo");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      console.error("Erreur ImagePicker:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updated = [...photos];
    updated.splice(index, 1);

    // Réassigner la photo principale si elle est supprimée
    if (!updated.some((p) => p.is_main) && updated.length > 0) {
      updated[0].is_main = true;
    }

    setPhotos(updated);
  };

  const setAsMain = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const updated = photos.map((photo, i) => ({
      ...photo,
      is_main: i === index,
    }));
    setPhotos(updated);
  };

  const handleNext = () => {
    if (photos.length === 0) {
      Alert.alert("Erreur", "Aucune photo sélectionnée");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    triggerBounce(buttonScale);
    onNext({ photos });
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSkip?.();
  };

  return (
    <View style={styles.container}>
      {/* Effet fumée blanche en haut à droite */}
      <View style={styles.smokeContainer}>
        <Svg height="100%" width="100%" style={StyleSheet.absoluteFillObject}>
          <Defs>
            <RadialGradient id="smoke1" cx="85%" cy="15%" r="75%">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
              <Stop offset="25%" stopColor="#FFFFFF" stopOpacity="0.3" />
              <Stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.2" />
              <Stop offset="75%" stopColor="#FFFFFF" stopOpacity="0.1" />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </RadialGradient>
            <RadialGradient id="smoke2" cx="70%" cy="25%" r="60%">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.35" />
              <Stop offset="40%" stopColor="#FFFFFF" stopOpacity="0.2" />
              <Stop offset="80%" stopColor="#FFFFFF" stopOpacity="0.08" />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </RadialGradient>
            <RadialGradient id="smoke3" cx="95%" cy="5%" r="55%">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.45" />
              <Stop offset="30%" stopColor="#FFFFFF" stopOpacity="0.25" />
              <Stop offset="70%" stopColor="#FFFFFF" stopOpacity="0.1" />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </RadialGradient>
            <RadialGradient id="smoke4" cx="60%" cy="35%" r="50%">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.25" />
              <Stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.12" />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </RadialGradient>
          </Defs>

          <Ellipse
            cx="85%"
            cy="15%"
            rx="75%"
            ry="60%"
            fill="url(#smoke1)"
            transform="rotate(25 85 15)"
          />
          <Ellipse
            cx="70%"
            cy="25%"
            rx="60%"
            ry="45%"
            fill="url(#smoke2)"
            transform="rotate(-15 70 25)"
          />
          <Ellipse
            cx="95%"
            cy="5%"
            rx="55%"
            ry="40%"
            fill="url(#smoke3)"
            transform="rotate(45 95 5)"
          />
          <Ellipse
            cx="60%"
            cy="35%"
            rx="50%"
            ry="35%"
            fill="url(#smoke4)"
            transform="rotate(-25 60 35)"
          />
        </Svg>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          {onBack && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={onBack}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          <View style={styles.progressContainer}>
            {[...Array(totalSteps + 1)].map((_, index) => (
              <View
                key={index}
                style={[
                  styles.progressSegment,
                  index <= currentStep && styles.progressSegmentActive,
                ]}
              />
            ))}
          </View>
        </View>
      </View>

      <View style={styles.contentWrapper}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.headline}>Ajoute tes plus belles photos</Text>
          <Text style={styles.subtitle}>
            Montre qui tu es vraiment ! Au moins une photo est requise pour
            continuer.
          </Text>

          {/* Photo Picker */}
          <Animated.View style={{ transform: [{ scale: photoPickerScale }] }}>
            <TouchableOpacity
              style={styles.photoPicker}
              onPress={pickImage}
              activeOpacity={0.8}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="large" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="camera" size={40} color="#FFFFFF" />
                  <Text style={styles.photoPickerText}>Choisir des photos</Text>
                  <Text style={styles.photoPickerSubtext}>
                    Galerie • Appareil photo
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Photos Counter */}
          {photos.length > 0 && (
            <Text style={styles.photosCount}>
              {photos.length} photo{photos.length > 1 ? "s" : ""} sélectionnée
              {photos.length > 1 ? "s" : ""}
            </Text>
          )}

          {/* Photos Preview */}
          {photos.length > 0 && (
            <View style={styles.photosSection}>
              <Text style={styles.sectionTitle}>Tes photos</Text>
              <FlatList
                horizontal
                data={photos}
                keyExtractor={(item, index) => `${item.uri}-${index}`}
                renderItem={({ item, index }) => (
                  <View style={styles.photoPreview}>
                    <TouchableOpacity
                      onPress={() => setAsMain(index)}
                      activeOpacity={0.8}
                    >
                      <Image source={{ uri: item.uri }} style={styles.photo} />
                      {item.is_main && (
                        <View style={styles.mainBadge}>
                          <Ionicons name="star" size={12} color="#FFFFFF" />
                          <Text style={styles.mainBadgeText}>Principale</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDelete(index)}
                    >
                      <Ionicons name="close-circle" size={22} color="#FF5135" />
                    </TouchableOpacity>
                  </View>
                )}
                contentContainerStyle={styles.photosList}
                showsHorizontalScrollIndicator={false}
              />
              <Text style={styles.photoHint}>
                Appuie sur une photo pour la définir comme principale
              </Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          {onSkip && (
            <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
              <Text style={styles.skipText}>Passer</Text>
            </TouchableOpacity>
          )}

          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity
              style={[
                styles.nextButton,
                { opacity: photos.length > 0 ? 1 : 0.5 },
              ]}
              onPress={handleNext}
              disabled={photos.length === 0}
            >
              <Ionicons name="arrow-forward" size={24} color="#FF5135" />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FF5135",
  },
  smokeContainer: {
    position: "absolute",
    top: 0,
    right: 0,
    width: "100%",
    height: "80%",
    zIndex: 0,
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 45 : 35,
    paddingBottom: 10,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    zIndex: 1,
  },
  progressContainer: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
  },
  progressSegment: {
    flex: 1,
    height: 3,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 2,
  },
  progressSegmentActive: {
    backgroundColor: "#FFFFFF",
  },
  contentWrapper: {
    flex: 1,
    justifyContent: "space-between",
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
  },
  headline: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 8,
    color: "#FFFFFF",
    textAlign: "center",
    fontFamily: "Satoshi",
    lineHeight: 30,
  },
  subtitle: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 15,
    marginBottom: 32,
    textAlign: "center",
    lineHeight: 22,
    fontFamily: "Satoshi",
  },
  photoPicker: {
    height: 200,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.4)",
    borderStyle: "dashed",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  photoPickerText: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: "Satoshi",
  },
  photoPickerSubtext: {
    marginTop: 4,
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    fontFamily: "Satoshi",
  },
  photosCount: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    marginBottom: 24,
    fontFamily: "Satoshi",
  },
  photosSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 16,
    fontFamily: "Satoshi",
  },
  photosList: {
    gap: 12,
    paddingVertical: 8,
  },
  photoPreview: {
    position: "relative",
    width: 120,
    height: 150,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  mainBadge: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    gap: 4,
  },
  mainBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FF5135",
    fontFamily: "Satoshi",
  },
  deleteButton: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "#FFFFFF",
    borderRadius: 11,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  photoHint: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "center",
    marginTop: 12,
    fontFamily: "Satoshi",
    fontStyle: "italic",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 40,
    paddingTop: 20,
    paddingHorizontal: 24,
  },
  skipButton: {
    padding: 12,
  },
  skipText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 16,
    fontFamily: "Satoshi",
  },
  nextButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default RegisterStepProfilePhoto;
