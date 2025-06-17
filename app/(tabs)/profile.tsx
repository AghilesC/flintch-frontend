import { Ionicons } from "@expo/vector-icons";
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
import Svg, {
  Circle,
  Defs,
  Stop,
  LinearGradient as SvgGradient,
} from "react-native-svg";

const CIRCLE_SIZE = 150;
const STROKE_WIDTH = 8;
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function CardAction({ icon, color, title, subtitle }: any) {
  return (
    <View style={styles.cardAction}>
      <Ionicons
        name={icon}
        size={28}
        color={color}
        style={{ marginBottom: 4 }}
      />
      <Text style={styles.cardTitle}>{title}</Text>
      {subtitle ? <Text style={styles.cardSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export default function ProfileScreen() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // ----------- Fetch User dynamique ----------
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

  useEffect(() => {
    fetchUser();
    // eslint-disable-next-line
  }, []);

  // ----------- Dynamique pour SVG ---------
  const getProfileCompletion = () => {
    if (!user) return 0;
    let percent = 40;
    if (user.sports && user.sports.length >= 1) percent += 20;
    if (user.profile_photo) percent += 20;
    if (user.goals && user.goals.length) percent += 10;
    if (user.bio) percent += 10;
    return Math.min(percent, 100);
  };

  const getAge = (birthdate: string) => {
    if (!birthdate) return "";
    const diff = Date.now() - new Date(birthdate).getTime();
    return Math.abs(new Date(diff).getUTCFullYear() - 1970);
  };

  const renderSports = () => {
    if (!user.sports || user.sports.length === 0) {
      return (
        <Text style={styles.sportPlaceholder}>Aucun sport sélectionné</Text>
      );
    }
    return (
      <View style={styles.sportsList}>
        {user.sports.slice(0, 5).map((sport: string, idx: number) => (
          <View style={styles.sportTag} key={sport + idx}>
            <Text style={styles.sportText}>{sport}</Text>
          </View>
        ))}
      </View>
    );
  };

  // --- Barre de progression circulaire à jour ! ---
  const completion = getProfileCompletion();
  const strokeDashoffset = CIRCUMFERENCE * (1 - completion / 100);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF5135" />
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
      {/* HERO + Barre circulaire */}
      <View style={styles.gradientBg}>
        <View style={styles.circleContainer}>
          <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE} key={completion}>
            {/* Cercle gris fond */}
            <Circle
              cx={CIRCLE_SIZE / 2}
              cy={CIRCLE_SIZE / 2}
              r={RADIUS}
              stroke="#eee"
              strokeWidth={STROKE_WIDTH}
              fill="none"
            />
            {/* Progress Gradient */}
            <Defs>
              <SvgGradient id="grad" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0%" stopColor="#FF5135" />
                <Stop offset="100%" stopColor="#FF7D31" />
              </SvgGradient>
            </Defs>
            <Circle
              cx={CIRCLE_SIZE / 2}
              cy={CIRCLE_SIZE / 2}
              r={RADIUS}
              stroke="url(#grad)"
              strokeWidth={STROKE_WIDTH}
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="none"
              rotation="-90"
              origin={`${CIRCLE_SIZE / 2},${CIRCLE_SIZE / 2}`}
            />
          </Svg>
          {/* Photo + crayon cliquables */}
          <TouchableOpacity
            style={styles.profilePicTouchable}
            onPress={async () => {
              // Va sur complete-profile, puis au retour, refetch les infos pour update la progressbar !
              await router.push("../(auth)/complete-profile");
              setLoading(true);
              await fetchUser();
            }}
            activeOpacity={0.85}
          >
            <Image
              source={{
                uri: user?.profile_photo?.startsWith("http")
                  ? user.profile_photo
                  : `http://localhost:8000/storage/${user?.profile_photo}`,
              }}
              style={styles.profileImage}
              resizeMode="cover"
            />
            <TouchableOpacity
              style={styles.editIcon}
              onPress={async () => {
                await router.push("../(auth)/complete-profile");
                setLoading(true);
                await fetchUser();
              }}
              activeOpacity={0.9}
            >
              <Ionicons name="pencil" size={22} color="#fff" />
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
        <Text style={styles.completionText}>{completion} % COMPLETÉ</Text>
      </View>

      {/* Nom, âge, sports */}
      <View style={styles.infoCard}>
        <Text style={styles.name}>
          {user?.name
            ? user.name.charAt(0).toUpperCase() + user.name.slice(1)
            : ""}
          {user?.birthdate ? `, ${getAge(user.birthdate)}` : ""}
        </Text>
        {renderSports()}
      </View>

      {/* Fond gris bas + actions */}
      <View style={styles.bottomGrayWrapper}>
        {/* Cartes actions rapides */}
        <View style={styles.quickActions}>
          <CardAction
            icon="star"
            color="#0E4A7B"
            title="0 Super Like"
            subtitle="OBTIENS-EN PLUS"
          />
          <CardAction
            icon="flash"
            color="#FF5135"
            title="Mes Boosts"
            subtitle="OBTIENS-EN PLUS"
          />
          <CardAction
            icon="flame"
            color="#4CCAF1"
            title="Abonnements"
            subtitle=""
          />
        </View>
        {/* Card premium Flintch */}
        <View style={styles.premiumCard}>
          <Text style={styles.premiumText}>
            Tu es à court de Like ? {"\n"}
            <Text style={{ fontWeight: "400", color: "#092C44" }}>
              Débloque des Likes illimités et plus de fonctionnalités Flintch
              Plus !
            </Text>
          </Text>
          <TouchableOpacity style={styles.premiumButton}>
            <Text style={styles.premiumButtonText}>Obtenir Flintch Plus</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// --- STYLES ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    paddingTop: 0,
  },
  gradientBg: {
    width: "100%",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 34,
    paddingBottom: 22,
    borderBottomLeftRadius: 70,
    borderBottomRightRadius: 70,
    backgroundColor: "#fff",
  },
  circleContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    marginBottom: 5,
  },
  profilePicTouchable: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
  },
  profileImage: {
    width: CIRCLE_SIZE - 26,
    height: CIRCLE_SIZE - 26,
    borderRadius: (CIRCLE_SIZE - 26) / 2,
    borderWidth: 4,
    borderColor: "#fff",
    backgroundColor: "#eee",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 5,
  },
  editIcon: {
    position: "absolute",
    right: 12,
    top: 12,
    backgroundColor: "#FF5135",
    borderRadius: 16,
    padding: 6,
    borderWidth: 2,
    borderColor: "#fff",
    elevation: 3,
    shadowColor: "#FF5135",
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  completionText: {
    color: "#FF5135",
    fontWeight: "700",
    fontSize: 15,
    marginTop: 10,
    letterSpacing: 1,
    textAlign: "center",
  },
  infoCard: {
    alignItems: "center",
    marginTop: -20,
    marginBottom: 10,
  },
  name: {
    fontSize: 32,
    fontFamily: "Poppins_700Bold",
    color: "#092C44",
    textAlign: "center",
    marginBottom: 5,
  },
  sportsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 8,
    gap: 8,
  },
  sportTag: {
    backgroundColor: "#F5F6FA",
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginHorizontal: 4,
    marginBottom: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  sportText: {
    fontSize: 16,
    color: "#092C44",
    fontFamily: "Inter_600SemiBold",
  },
  sportPlaceholder: {
    fontSize: 17,
    color: "#bbb",
    marginBottom: 22,
    fontFamily: "Inter_400Regular",
  },
  bottomGrayWrapper: {
    backgroundColor: "#F5F6FA",
    width: "98%",
    alignSelf: "center",
    marginTop: 18,
    paddingTop: 16,
    paddingBottom: 300,
    paddingHorizontal: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 1,
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "97%",
    alignSelf: "center",
    marginTop: 0,
    marginBottom: 18,
    gap: 12,
  },
  cardAction: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    alignItems: "center",
    paddingVertical: 16,
    marginHorizontal: 4,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0E4A7B",
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 11,
    color: "#FF5135",
    fontWeight: "700",
    letterSpacing: 1,
  },
  premiumCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    marginTop: 4,
    marginBottom: 2,
    padding: 18,
    alignItems: "center",
    width: "96%",
    alignSelf: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 1,
  },
  premiumText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FF5135",
    marginBottom: 10,
    textAlign: "center",
  },
  premiumButton: {
    backgroundColor: "#FF5135",
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 26,
    marginTop: 4,
  },
  premiumButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
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
});
