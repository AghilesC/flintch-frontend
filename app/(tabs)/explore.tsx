import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  Modal,
  PanResponder,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width, height } = Dimensions.get("window");
const SWIPE_THRESHOLD = 120;
const SWIPE_OUT_DURATION = 250;

// Flintch Branding Colors
const COLORS = {
  primary: "#0E4A7B",
  accent: "#FF5135",
  gradientStart: "#0E4A7B",
  gradientEnd: "#195A96",
  skyBlue: "#4CCAF1",
  midnight: "#092C44",
  white: "#FFFFFF",
  lightGray: "#F8F9FA",
  cardShadow: "rgba(9, 44, 68, 0.15)",
  overlay: "rgba(0, 0, 0, 0.4)",
};

interface UserProfile {
  id: number;
  name: string;
  email: string;
  age?: number;
  bio?: string;
  location?: string;
  interests?: string[];
  photos?: string[];
  sports?: string[]; // Sports aimés par l'utilisateur depuis la BDD
  created_at: string;
}

const ExploreScreen = () => {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showOptionsModal, setShowOptionsModal] = useState(false);

  const position = useRef(new Animated.ValueXY()).current;
  const swipeAnimatedValue = useRef(new Animated.Value(0)).current;

  // Animation values pour les boutons
  const rejectButtonScale = useRef(new Animated.Value(1)).current;
  const superLikeButtonScale = useRef(new Animated.Value(1)).current;
  const likeButtonScale = useRef(new Animated.Value(1)).current;
  const moreButtonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadProfiles();
  }, []);

  // Réinitialiser l'index des photos quand on change de profil
  useEffect(() => {
    setCurrentPhotoIndex(0);
  }, [currentIndex]);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("Token non trouvé");

      const response = await axios.get("http://localhost:8000/api/discover", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = response.data.data || response.data;
      setProfiles(data);
    } catch (error) {
      console.error("Erreur chargement profils :", error);
      Alert.alert("Erreur", "Impossible de charger les profils.");
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = async (direction: "left" | "right") => {
    const profile = profiles[currentIndex];
    const token = await AsyncStorage.getItem("token");
    if (!token || !profile) return;

    try {
      if (direction === "right") {
        const res = await axios.post(
          "http://localhost:8000/api/matches",
          { user_id: profile.id },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (res.data?.is_mutual) {
          Alert.alert(
            "🎉 C'est un match !",
            `${profile.name} vous a liké aussi !`
          );
        }
      } else {
        await axios.post(
          "http://localhost:8000/api/reject",
          { user_id: profile.id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
    } catch (err) {
      console.error("Erreur swipe :", err);
    }

    position.setValue({ x: 0, y: 0 });
    swipeAnimatedValue.setValue(0);
    setCurrentIndex((prev) => prev + 1);
  };

  const forceSwipe = (direction: "left" | "right") => {
    const x = direction === "right" ? width : -width;
    Animated.timing(position, {
      toValue: { x, y: 0 },
      duration: SWIPE_OUT_DURATION,
      useNativeDriver: false,
    }).start(() => handleSwipe(direction));
  };

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      friction: 4,
      useNativeDriver: false,
    }).start();
    swipeAnimatedValue.setValue(0);
  };

  // Navigation entre les photos
  const navigateToNextPhoto = () => {
    const profile = profiles[currentIndex];
    if (!profile?.photos || profile.photos.length <= 1) return;

    setCurrentPhotoIndex((prevIndex) =>
      prevIndex < profile.photos.length - 1 ? prevIndex + 1 : prevIndex
    );
  };

  const navigateToPreviousPhoto = () => {
    setCurrentPhotoIndex((prevIndex) =>
      prevIndex > 0 ? prevIndex - 1 : prevIndex
    );
  };

  // Animation des boutons
  const animateButton = (
    buttonScale: Animated.Value,
    callback?: () => void
  ) => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.85,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(buttonScale, {
        toValue: 1,
        friction: 3,
        tension: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (callback) callback();
    });
  };

  const handleRejectPress = () => {
    animateButton(rejectButtonScale, () => forceSwipe("left"));
  };

  const handleSuperLikePress = () => {
    animateButton(superLikeButtonScale, () =>
      Alert.alert("Super Connect!", "Fonctionnalité premium")
    );
  };

  const handleLikePress = () => {
    animateButton(likeButtonScale, () => forceSwipe("right"));
  };

  const handleMorePress = () => {
    animateButton(moreButtonScale, () => setShowOptionsModal(true));
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
        swipeAnimatedValue.setValue(gesture.dx);
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) forceSwipe("right");
        else if (gesture.dx < -SWIPE_THRESHOLD) forceSwipe("left");
        else resetPosition();
      },
    })
  ).current;

  const getCardStyle = () => {
    const rotate = swipeAnimatedValue.interpolate({
      inputRange: [-width / 2, 0, width / 2],
      outputRange: ["-5deg", "0deg", "5deg"],
    });

    const scale = swipeAnimatedValue.interpolate({
      inputRange: [-width, 0, width],
      outputRange: [0.95, 1, 0.95],
      extrapolate: "clamp",
    });

    return {
      ...position.getLayout(),
      transform: [{ rotate }, { scale }],
    };
  };

  // Animation pour les labels de swipe
  const getSwipeLabels = () => {
    const connectOpacity = swipeAnimatedValue.interpolate({
      inputRange: [0, 150],
      outputRange: [0, 1],
      extrapolate: "clamp",
    });

    const rejectOpacity = swipeAnimatedValue.interpolate({
      inputRange: [-150, 0],
      outputRange: [1, 0],
      extrapolate: "clamp",
    });

    const connectScale = swipeAnimatedValue.interpolate({
      inputRange: [0, 150],
      outputRange: [0.8, 1.1],
      extrapolate: "clamp",
    });

    const rejectScale = swipeAnimatedValue.interpolate({
      inputRange: [-150, 0],
      outputRange: [1.1, 0.8],
      extrapolate: "clamp",
    });

    return { connectOpacity, rejectOpacity, connectScale, rejectScale };
  };

  const currentProfile = profiles[currentIndex];

  // Extrait l'emoji du sport (ex: "🏀 Basket" -> "🏀")
  const getSportEmoji = (sport: string): string => {
    // Maintenant que la BDD est corrigée, on extrait juste l'emoji
    const parts = sport.split(" ");
    return parts[0] || "🏋️"; // Premier élément = emoji
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={styles.loadingText}>Recherche de partenaires...</Text>
      </View>
    );
  }

  if (currentIndex >= profiles.length) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="barbell" size={80} color="#ccc" />
        <Text style={styles.emptyTitle}>Plus de profils disponibles</Text>
        <Text style={styles.emptyText}>
          Revenez plus tard pour découvrir de nouveaux partenaires
          d'entraînement !
        </Text>
        <TouchableOpacity style={styles.refreshButton} onPress={loadProfiles}>
          <Text style={styles.refreshButtonText}>Actualiser</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Profile Card */}
      {currentProfile && (
        <View style={styles.cardsContainer}>
          <Animated.View
            style={[styles.cardContainer, getCardStyle()]}
            {...panResponder.panHandlers}
          >
            <Image
              source={{
                uri:
                  currentProfile.photos?.[currentPhotoIndex] ||
                  "https://placekitten.com/400/600",
              }}
              style={styles.profileImage}
            />

            {/* Zones de navigation photo invisibles */}
            <TouchableOpacity
              style={styles.leftPhotoZone}
              onPress={navigateToPreviousPhoto}
              activeOpacity={1}
            />
            <TouchableOpacity
              style={styles.rightPhotoZone}
              onPress={navigateToNextPhoto}
              activeOpacity={1}
            />

            {/* Photo indicators */}
            <View style={styles.indicatorsContainer}>
              {[...Array(currentProfile.photos?.length || 1)].map(
                (_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.indicator,
                      {
                        backgroundColor:
                          index === currentPhotoIndex
                            ? COLORS.white
                            : "rgba(255,255,255,0.4)",
                      },
                    ]}
                  />
                )
              )}
            </View>

            {/* Interest badges - Sports aimés depuis la BDD */}
            {currentProfile.sports && currentProfile.sports.length > 0 && (
              <View style={styles.interestBadges}>
                {currentProfile.sports.slice(0, 3).map((sport, index) => (
                  <View key={index} style={styles.interestBadge}>
                    <Text style={styles.sportEmoji}>
                      {getSportEmoji(sport)}
                    </Text>
                  </View>
                ))}
                {currentProfile.sports.length > 3 && (
                  <View style={styles.interestBadge}>
                    <Text style={styles.plusText}>
                      +{currentProfile.sports.length - 3}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Profile Info */}
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{currentProfile.name}</Text>
              {currentProfile.age && (
                <Text style={styles.profileAge}>{currentProfile.age}</Text>
              )}
              {currentProfile.bio && (
                <Text style={styles.profileBio} numberOfLines={2}>
                  {currentProfile.bio}
                </Text>
              )}
            </View>

            {/* Swipe Labels */}
            {(() => {
              const {
                connectOpacity,
                rejectOpacity,
                connectScale,
                rejectScale,
              } = getSwipeLabels();
              return (
                <>
                  <Animated.View
                    style={[
                      styles.swipeLabel,
                      styles.connectLabel,
                      {
                        opacity: connectOpacity,
                        transform: [{ scale: connectScale }],
                      },
                    ]}
                  >
                    <View style={styles.connectLabelInner}>
                      <View style={styles.connectEmojiContainer}>
                        <Text style={styles.connectEmoji}>💪</Text>
                      </View>
                      <Text style={styles.connectText}>CONNECT</Text>
                      <View style={styles.connectSubtext}>
                        <Text style={styles.connectSubtextText}>
                          LET'S TRAIN!
                        </Text>
                      </View>
                    </View>
                  </Animated.View>

                  <Animated.View
                    style={[
                      styles.swipeLabel,
                      styles.rejectLabel,
                      {
                        opacity: rejectOpacity,
                        transform: [{ scale: rejectScale }],
                      },
                    ]}
                  >
                    <View style={styles.rejectLabelInner}>
                      <View style={styles.rejectIconContainer}>
                        <Ionicons name="close" size={48} color={COLORS.white} />
                      </View>
                      <Text style={styles.rejectText}>PASS</Text>
                      <View style={styles.rejectSubtext}>
                        <Text style={styles.rejectSubtextText}>NOT TODAY</Text>
                      </View>
                    </View>
                  </Animated.View>
                </>
              );
            })()}
          </Animated.View>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <Animated.View style={{ transform: [{ scale: rejectButtonScale }] }}>
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={handleRejectPress}
            activeOpacity={0.8}
          >
            <Ionicons name="close" size={24} color="#FF4757" />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={{ transform: [{ scale: superLikeButtonScale }] }}>
          <TouchableOpacity
            style={[styles.actionButton, styles.superLikeButton]}
            onPress={handleSuperLikePress}
            activeOpacity={0.8}
          >
            <Ionicons name="flash" size={20} color="#FFB84D" />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={{ transform: [{ scale: likeButtonScale }] }}>
          <TouchableOpacity
            style={[styles.actionButton, styles.likeButton]}
            onPress={handleLikePress}
            activeOpacity={0.8}
          >
            <Ionicons name="thumbs-up" size={24} color="#4CCAF1" />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={{ transform: [{ scale: moreButtonScale }] }}>
          <TouchableOpacity
            style={[styles.actionButton, styles.moreButton]}
            onPress={handleMorePress}
            activeOpacity={0.8}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color="#8E9AAF" />
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Options Modal */}
      <Modal
        visible={showOptionsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOptionsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowOptionsModal(false)}
            >
              <Ionicons name="close" size={24} color="#999" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalOption}>
              <Text style={styles.modalOptionText}>Share profile</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalOption}>
              <Text style={styles.modalOptionText}>Report</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalOption}>
              <Text style={styles.modalOptionText}>Block</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowOptionsModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ExploreScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.white,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.midnight,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    backgroundColor: COLORS.lightGray,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.midnight,
    marginTop: 20,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
  },
  refreshButton: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 24,
  },
  refreshButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
  cardsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 120,
  },
  cardContainer: {
    width: width - 32,
    height: height * 0.7,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: COLORS.white,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  profileImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  // Zones de navigation photo
  leftPhotoZone: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "30%",
    height: "70%", // Jusqu'aux infos du profil
    zIndex: 10,
  },
  rightPhotoZone: {
    position: "absolute",
    top: 0,
    right: 0,
    width: "30%",
    height: "70%", // Jusqu'aux infos du profil
    zIndex: 10,
  },
  indicatorsContainer: {
    position: "absolute",
    top: 20,
    left: 20,
    right: 20,
    flexDirection: "row",
    zIndex: 5,
  },
  indicator: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 2,
  },
  interestBadges: {
    position: "absolute",
    top: 60,
    left: 20,
    zIndex: 5,
  },
  interestBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  sportEmoji: {
    fontSize: 24,
  },
  plusText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.accent,
  },
  profileInfo: {
    position: "absolute",
    bottom: 24,
    left: 24,
    right: 24,
    zIndex: 5,
  },
  profileName: {
    fontSize: 32,
    fontWeight: "700",
    color: COLORS.white,
    marginBottom: 4,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  profileAge: {
    fontSize: 28,
    fontWeight: "400",
    color: COLORS.white,
    marginBottom: 8,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  profileBio: {
    fontSize: 16,
    color: "rgba(255,255,255,0.95)",
    lineHeight: 22,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  swipeLabel: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
    zIndex: 5,
  },
  connectLabel: {
    top: "30%",
    left: "15%",
    transform: [{ rotate: "-15deg" }],
  },
  connectLabelInner: {
    backgroundColor: COLORS.skyBlue,
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderRadius: 20,
    borderWidth: 4,
    borderColor: "#81D4FA",
    alignItems: "center",
    minWidth: 140,
    shadowColor: COLORS.skyBlue,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 15,
  },
  connectEmojiContainer: {
    backgroundColor: COLORS.white,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    borderWidth: 3,
    borderColor: "#81D4FA",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  connectEmoji: {
    fontSize: 28,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  connectText: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.white,
    letterSpacing: 2,
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    marginBottom: 4,
  },
  connectSubtext: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  connectSubtextText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.white,
    letterSpacing: 1,
  },
  rejectLabel: {
    top: "30%",
    right: "15%",
    transform: [{ rotate: "15deg" }],
  },
  rejectLabelInner: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderRadius: 20,
    borderWidth: 4,
    borderColor: "#FF7961",
    alignItems: "center",
    minWidth: 140,
    shadowColor: COLORS.accent,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 15,
  },
  rejectIconContainer: {
    backgroundColor: COLORS.white,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    borderWidth: 3,
    borderColor: "#FF7961",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  rejectText: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.white,
    letterSpacing: 2,
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    marginBottom: 4,
  },
  rejectSubtext: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  rejectSubtextText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.white,
    letterSpacing: 1,
  },
  actionButtons: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  actionButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 8,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.06)",
  },
  rejectButton: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
  },
  superLikeButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
  },
  likeButton: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
  },
  moreButton: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 16,
  },
  closeButton: {
    alignSelf: "flex-end",
    padding: 8,
    marginBottom: 16,
  },
  modalOption: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    borderRadius: 24,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.accent,
    backgroundColor: COLORS.white,
  },
  modalOptionText: {
    fontSize: 16,
    color: COLORS.accent,
    textAlign: "center",
    fontWeight: "500",
  },
  cancelButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: 16,
    borderRadius: 24,
    marginTop: 16,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.white,
    textAlign: "center",
  },
});
