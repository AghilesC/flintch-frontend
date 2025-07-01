import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useState } from "react";
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  Extrapolate,
  FadeInUp,
  interpolate,
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const { height, width } = Dimensions.get("window");
const HEADER_HEIGHT = height * 0.9;
const CARD_HEIGHT = height * 0.85;

// ✨ COULEURS ULTRA MODERNES
const COLORS = {
  primary: "#FF5135",
  primaryLight: "#FF7A5C",
  white: "#FFFFFF",
  lightGray: "#F8F9FA",
  softGray: "#F1F3F4",
  textSecondary: "#6C7B7F",
  textPrimary: "#2D3748",
  gray: "#8E8E93",
  progressBg: "rgba(255, 255, 255, 0.3)",
};

// ✅ MAPPING OBJECTIFS → RECHERCHE
const objectifsToRecherche = {
  "Perte de poids": "Une motivation",
  "Prise de masse": "Un partenaire d'entraînement",
  Cardio: "Quelqu'un d'actif",
  Sèche: "Un coach",
  "Renforcement musculaire": "Un partenaire gym",
  Souplesse: "Du yoga ensemble",
  Endurance: "Un running buddy",
  "Stabilité mentale": "Du bien-être",
  "Santé générale": "Une vie saine",
  "Préparation compétition": "Un niveau élevé",
  "Remise en forme": "Une nouvelle aventure",
  "Bien-être": "De la détente",
  "Se défouler": "Du fun",
  Socialiser: "De nouveaux amis",
  "Découverte sportive": "De la découverte",
  Performance: "De la compétition",
  "Musculation esthétique": "Un physique au top",
  "Confiance en soi": "De la motivation",
  "Prendre du plaisir": "Du plaisir",
  "Récupération/blessure": "De la récupération",
};

// ✅ FONCTION UTILITAIRE POUR NORMALISER LES DONNÉES
const normalizeArray = (data: any): string[] => {
  if (!data) return [];
  if (Array.isArray(data)) {
    return data.filter(
      (item) => item && typeof item === "string" && item.trim() !== ""
    );
  }
  if (typeof data === "string") {
    try {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (item) => item && typeof item === "string" && item.trim() !== ""
        );
      }
    } catch {
      return data
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s !== "");
    }
  }
  return [];
};

// ✅ INTERFACES TYPESCRIPT
interface User {
  birthdate?: string;
  name?: string;
  photos?: string[];
  bio?: string;
  sports?: any;
  goals?: any;
  fitness_level?: string;
}

interface PreviewProfileTabProps {
  user: User | null;
  sports: string[];
  objectifs: string[];
  niveau: string;
}

// ✨ PROGRESS DOT ULTRA MAGIQUE
const MagicProgressDot = React.memo(
  ({
    index,
    scrollY,
    totalSections,
    sectionNames,
  }: {
    index: number;
    scrollY: Animated.SharedValue<number>;
    totalSections: number;
    sectionNames: string[];
  }) => {
    const sectionOffset = HEADER_HEIGHT + index * CARD_HEIGHT;

    const dotStyle = useAnimatedStyle(() => {
      const currentSection = Math.round(
        (scrollY.value - HEADER_HEIGHT + CARD_HEIGHT / 2) / CARD_HEIGHT
      );
      const isActive = currentSection === index;
      const isPassed = currentSection > index;
      const scale = isActive ? withSpring(1.4) : withSpring(isPassed ? 1.2 : 1);

      return {
        transform: [{ scale }],
      };
    });

    const fillStyle = useAnimatedStyle(() => {
      const currentSection = Math.round(
        (scrollY.value - HEADER_HEIGHT + CARD_HEIGHT / 2) / CARD_HEIGHT
      );
      const isActive = currentSection === index;
      const isPassed = currentSection > index;

      const fillProgress = isPassed
        ? 1
        : interpolate(
            scrollY.value,
            [sectionOffset - CARD_HEIGHT / 3, sectionOffset + CARD_HEIGHT / 3],
            [0, 1],
            Extrapolate.CLAMP
          );

      return {
        width: `${fillProgress * 100}%`,
        opacity: withTiming(isActive || isPassed ? 1 : 0.3, { duration: 300 }),
      };
    });

    const glowStyle = useAnimatedStyle(() => {
      const currentSection = Math.round(
        (scrollY.value - HEADER_HEIGHT + CARD_HEIGHT / 2) / CARD_HEIGHT
      );
      const isActive = currentSection === index;

      return {
        opacity: withTiming(isActive ? 1 : 0, { duration: 300 }),
        transform: [{ scale: withSpring(isActive ? 1 : 0.5) }],
      };
    });

    const labelStyle = useAnimatedStyle(() => {
      const currentSection = Math.round(
        (scrollY.value - HEADER_HEIGHT + CARD_HEIGHT / 2) / CARD_HEIGHT
      );
      const isActive = currentSection === index;

      return {
        opacity: withTiming(isActive ? 1 : 0, { duration: 400 }),
        transform: [
          { translateX: withSpring(isActive ? 0 : 20) },
          { scale: withSpring(isActive ? 1 : 0.8) },
        ],
      };
    });

    return (
      <View style={styles.magicDotContainer}>
        <Animated.View style={[styles.dotGlow, glowStyle]} />
        <Animated.View style={[styles.progressDot, dotStyle]}>
          <Animated.View style={[styles.dotFill, fillStyle]} />
        </Animated.View>
        <Animated.View style={[styles.dotLabel, labelStyle]}>
          <LinearGradient
            colors={["rgba(255, 81, 53, 0.95)", "rgba(255, 122, 92, 0.95)"]}
            style={styles.labelGradient}
          >
            <Text style={styles.labelText}>{sectionNames[index]}</Text>
          </LinearGradient>
        </Animated.View>
      </View>
    );
  }
);

// ✨ PROGRESS INDICATOR ULTRA MAGIQUE
const ProgressIndicator = React.memo(
  ({
    scrollY,
    totalSections,
    sectionNames,
  }: {
    scrollY: Animated.SharedValue<number>;
    totalSections: number;
    sectionNames: string[];
  }) => {
    const indicatorStyle = useAnimatedStyle(() => {
      const progress = interpolate(
        scrollY.value,
        [0, (totalSections - 1) * CARD_HEIGHT + HEADER_HEIGHT],
        [0, 1],
        Extrapolate.CLAMP
      );

      return {
        height: `${progress * 100}%`,
      };
    });

    const trackStyle = useAnimatedStyle(() => {
      const pulseScale = interpolate(
        scrollY.value % (CARD_HEIGHT / 4),
        [0, CARD_HEIGHT / 8, CARD_HEIGHT / 4],
        [1, 1.05, 1],
        Extrapolate.CLAMP
      );

      return {
        transform: [{ scaleX: pulseScale }],
      };
    });

    return (
      <View style={styles.progressContainer}>
        <Animated.View style={[styles.progressTrack, trackStyle]}>
          <Animated.View style={[styles.progressFill, indicatorStyle]}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryLight, COLORS.primary]}
              style={styles.progressGradient}
            />
          </Animated.View>
        </Animated.View>

        <View style={styles.progressDots}>
          {Array.from({ length: totalSections }).map((_, index) => (
            <MagicProgressDot
              key={index}
              index={index}
              scrollY={scrollY}
              totalSections={totalSections}
              sectionNames={sectionNames}
            />
          ))}
        </View>
      </View>
    );
  }
);

// ✨ PARTICLE EFFECT COMPONENT
const FloatingParticle = React.memo(({ delay = 0 }: { delay?: number }) => {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const animate = () => {
      translateY.value = withTiming(-200, {
        duration: 4000 + Math.random() * 2000,
      });
      opacity.value = withTiming(1, { duration: 1000 });

      setTimeout(() => {
        opacity.value = withTiming(0, { duration: 1000 });
        translateY.value = 0;
        setTimeout(animate, 1000);
      }, 3000);
    };

    setTimeout(animate, delay);
  }, []);

  const particleStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.particle, particleStyle]}>
      <LinearGradient
        colors={[COLORS.primary, "transparent"]}
        style={styles.particleGradient}
      />
    </Animated.View>
  );
});

// ✨ SECTION CARD ULTRA IMMERSIVE
const ImmersiveCard = React.memo(
  ({
    children,
    index,
    scrollY,
    title,
    icon,
    totalSections,
  }: {
    children: React.ReactNode;
    index: number;
    scrollY: Animated.SharedValue<number>;
    title: string;
    icon: string;
    totalSections: number;
  }) => {
    const cardOffset = HEADER_HEIGHT + index * CARD_HEIGHT;

    const cardStyle = useAnimatedStyle(() => {
      const inputRange = [
        cardOffset - CARD_HEIGHT,
        cardOffset,
        cardOffset + CARD_HEIGHT * 0.7,
        cardOffset + CARD_HEIGHT,
      ];

      const translateY = interpolate(
        scrollY.value,
        inputRange,
        [CARD_HEIGHT * 0.3, 0, 0, -CARD_HEIGHT * 0.3],
        Extrapolate.CLAMP
      );

      const scale = interpolate(
        scrollY.value,
        [
          cardOffset - CARD_HEIGHT * 0.5,
          cardOffset,
          cardOffset + CARD_HEIGHT * 0.5,
        ],
        [0.85, 1, 0.85],
        Extrapolate.CLAMP
      );

      const opacity = interpolate(
        scrollY.value,
        [
          cardOffset - CARD_HEIGHT,
          cardOffset - CARD_HEIGHT * 0.3,
          cardOffset + CARD_HEIGHT * 0.3,
          cardOffset + CARD_HEIGHT,
        ],
        [0, 1, 1, 0],
        Extrapolate.CLAMP
      );

      const rotateZ = interpolate(
        scrollY.value,
        [
          cardOffset - CARD_HEIGHT * 0.2,
          cardOffset,
          cardOffset + CARD_HEIGHT * 0.2,
        ],
        [-2, 0, 2],
        Extrapolate.CLAMP
      );

      return {
        transform: [{ translateY }, { scale }, { rotateZ: `${rotateZ}deg` }],
        opacity,
      };
    });

    const headerStyle = useAnimatedStyle(() => {
      const translateY = interpolate(
        scrollY.value,
        [cardOffset - CARD_HEIGHT * 0.2, cardOffset],
        [50, 0],
        Extrapolate.CLAMP
      );

      const scale = interpolate(
        scrollY.value,
        [cardOffset - CARD_HEIGHT * 0.1, cardOffset + CARD_HEIGHT * 0.1],
        [0.9, 1],
        Extrapolate.CLAMP
      );

      return {
        transform: [{ translateY }, { scale }],
      };
    });

    const contentStyle = useAnimatedStyle(() => {
      const translateY = interpolate(
        scrollY.value,
        [cardOffset - CARD_HEIGHT * 0.1, cardOffset + CARD_HEIGHT * 0.1],
        [30, 0],
        Extrapolate.CLAMP
      );

      const translateX = interpolate(
        scrollY.value,
        [
          cardOffset - CARD_HEIGHT * 0.05,
          cardOffset,
          cardOffset + CARD_HEIGHT * 0.05,
        ],
        [-10, 0, 10],
        Extrapolate.CLAMP
      );

      return {
        transform: [{ translateY }, { translateX }],
      };
    });

    const glowStyle = useAnimatedStyle(() => {
      const currentSection = Math.round(
        (scrollY.value - HEADER_HEIGHT + CARD_HEIGHT / 2) / CARD_HEIGHT
      );
      const isActive = currentSection === index;

      return {
        shadowOpacity: withTiming(isActive ? 0.4 : 0.2, { duration: 500 }),
        shadowRadius: withTiming(isActive ? 50 : 30, { duration: 500 }),
      };
    });

    return (
      <Animated.View style={[styles.immersiveCard, cardStyle]}>
        <View style={styles.particlesContainer}>
          <FloatingParticle delay={0} />
          <FloatingParticle delay={1000} />
          <FloatingParticle delay={2000} />
        </View>

        <Animated.View style={[styles.cardBackground, glowStyle]}>
          <LinearGradient
            colors={[
              "rgba(255, 255, 255, 0.98)",
              "rgba(255, 255, 255, 0.9)",
              "rgba(255, 247, 245, 0.95)",
            ]}
            style={styles.cardGradient}
          >
            <View style={styles.meshBackground}>
              <LinearGradient
                colors={[
                  "rgba(255, 81, 53, 0.03)",
                  "transparent",
                  "rgba(255, 122, 92, 0.02)",
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.meshGradient}
              />
            </View>

            <Animated.View style={[styles.cardMagicHeader, headerStyle]}>
              <View style={styles.magicIconContainer}>
                <LinearGradient
                  colors={[COLORS.primary, COLORS.primaryLight]}
                  style={styles.iconGradient}
                >
                  <Ionicons name={icon as any} size={28} color={COLORS.white} />
                </LinearGradient>

                <View style={styles.iconPulse}>
                  <LinearGradient
                    colors={["rgba(255, 81, 53, 0.2)", "transparent"]}
                    style={styles.pulseGradient}
                  />
                </View>
              </View>

              <View style={styles.titleContainer}>
                <Text style={styles.cardMagicTitle}>{title}</Text>
                <View style={styles.titleUnderline} />

                <View style={styles.titleDecoration}>
                  <View style={styles.decorativeDot} />
                  <View style={styles.decorativeDot} />
                  <View style={styles.decorativeDot} />
                </View>
              </View>
            </Animated.View>

            <Animated.View style={[styles.cardContent, contentStyle]}>
              {children}
            </Animated.View>
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    );
  }
);

// ✨ COMPOSANT PRINCIPAL PREVIEW TAB ULTRA IMMERSIF
const PreviewProfileTab = React.memo<PreviewProfileTabProps>(
  ({ user, sports, objectifs, niveau }) => {
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
    const [currentSection, setCurrentSection] = useState(0);
    const [isPhotoNavigationActive, setIsPhotoNavigationActive] =
      useState(true);
    const scrollY = useSharedValue(0);

    // ✅ COMPUTED VALUES
    const userAge = useMemo(() => {
      if (!user?.birthdate) return "";
      const diff = Date.now() - new Date(user.birthdate).getTime();
      return Math.abs(new Date(diff).getUTCFullYear() - 1970);
    }, [user?.birthdate]);

    const sportsArray = useMemo(
      () => normalizeArray(sports.length > 0 ? sports : user?.sports),
      [sports, user?.sports]
    );

    const goalsArray = useMemo(
      () => normalizeArray(objectifs.length > 0 ? objectifs : user?.goals),
      [objectifs, user?.goals]
    );

    const mainRecherche = useMemo(() => {
      if (goalsArray.length === 0) return "Une aventure sportive";
      const mainGoal = goalsArray[0];
      return (
        objectifsToRecherche[mainGoal as keyof typeof objectifsToRecherche] ||
        "Une belle rencontre"
      );
    }, [goalsArray]);

    const sectionNames = useMemo(() => {
      const names = ["Je recherche", "À propos", "Essentiels"];
      if (goalsArray.length > 0) names.push("Objectifs");
      if (sportsArray.length > 0) names.push("Sports");
      return names;
    }, [goalsArray.length, sportsArray.length]);

    const totalSections = useMemo(() => {
      let count = 3; // "Je recherche", "À propos", "Les essentiels"
      if (goalsArray.length > 0) count += 1;
      if (sportsArray.length > 0) count += 1;
      return count;
    }, [goalsArray.length, sportsArray.length]);

    const userPhotos = useMemo(() => user?.photos || [], [user?.photos]);

    // Reset photo index when user changes
    useEffect(() => {
      setCurrentPhotoIndex(0);
    }, [user?.photos]);

    // ✨ SCROLL HANDLER ULTRA INTELLIGENT
    const scrollHandler = useAnimatedScrollHandler({
      onScroll: (event) => {
        scrollY.value = event.contentOffset.y;

        const scrollPosition = event.contentOffset.y;
        const photoNavShouldBeActive = scrollPosition <= 50;

        runOnJS(setIsPhotoNavigationActive)(photoNavShouldBeActive);

        const newSection = Math.round(
          (event.contentOffset.y - HEADER_HEIGHT + CARD_HEIGHT / 2) /
            CARD_HEIGHT
        );
        const clampedSection = Math.max(
          0,
          Math.min(newSection, totalSections - 1)
        );

        runOnJS(setCurrentSection)(clampedSection);
      },
    });

    // ✨ HEADER ANIMATIONS MAGIQUES
    const headerStyle = useAnimatedStyle(() => {
      const opacity = interpolate(
        scrollY.value,
        [0, HEADER_HEIGHT * 0.3, HEADER_HEIGHT * 0.8],
        [1, 0.6, 0.3],
        Extrapolate.CLAMP
      );

      const scale = interpolate(
        scrollY.value,
        [0, HEADER_HEIGHT],
        [1, 1.15],
        Extrapolate.CLAMP
      );

      return {
        opacity,
        transform: [{ scale }],
      };
    });

    const overlayStyle = useAnimatedStyle(() => {
      const opacity = interpolate(
        scrollY.value,
        [0, HEADER_HEIGHT * 0.2, HEADER_HEIGHT * 0.7],
        [0.2, 0.5, 0.9],
        Extrapolate.CLAMP
      );

      return { opacity };
    });

    const nameStyle = useAnimatedStyle(() => {
      const translateY = interpolate(
        scrollY.value,
        [0, HEADER_HEIGHT * 0.5],
        [0, -100],
        Extrapolate.CLAMP
      );

      const scale = interpolate(
        scrollY.value,
        [0, HEADER_HEIGHT * 0.3],
        [1, 0.8],
        Extrapolate.CLAMP
      );

      const opacity = interpolate(
        scrollY.value,
        [0, HEADER_HEIGHT * 0.4, HEADER_HEIGHT * 0.7],
        [1, 1, 0],
        Extrapolate.CLAMP
      );

      return {
        transform: [{ translateY }, { scale }],
        opacity,
      };
    });

    const currentPhoto = userPhotos[currentPhotoIndex] || null;

    return (
      <View style={styles.container}>
        {/* ✨ ZONES TACTILES PHOTO AU NIVEAU ROOT */}
        {userPhotos.length > 1 && isPhotoNavigationActive && (
          <>
            {/* Zone gauche - photo précédente */}
            <TouchableOpacity
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "35%",
                height: HEADER_HEIGHT * 0.75,
                zIndex: 99998,
                justifyContent: "center",
                alignItems: "flex-start",
                paddingLeft: 20,
              }}
              onPress={() => {
                setCurrentPhotoIndex((prev) =>
                  prev > 0 ? prev - 1 : userPhotos.length - 1
                );
              }}
              activeOpacity={0.7}
            >
              <View style={styles.photoNavIndicator}>
                <Ionicons name="chevron-back" size={24} color={COLORS.white} />
              </View>
            </TouchableOpacity>

            {/* Zone droite - photo suivante */}
            <TouchableOpacity
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                width: "35%",
                height: HEADER_HEIGHT * 0.75,
                zIndex: 99998,
                justifyContent: "center",
                alignItems: "flex-end",
                paddingRight: 20,
              }}
              onPress={() => {
                setCurrentPhotoIndex((prev) =>
                  prev < userPhotos.length - 1 ? prev + 1 : 0
                );
              }}
              activeOpacity={0.7}
            >
              <View style={styles.photoNavIndicator}>
                <Ionicons
                  name="chevron-forward"
                  size={24}
                  color={COLORS.white}
                />
              </View>
            </TouchableOpacity>
          </>
        )}

        {/* ✨ PROGRESS INDICATOR ULTRA MAGIQUE */}
        <ProgressIndicator
          scrollY={scrollY}
          totalSections={totalSections}
          sectionNames={sectionNames}
        />

        {/* ✨ HEADER PHOTO ULTRA IMMERSIF */}
        <Animated.View style={[styles.header, headerStyle]}>
          {currentPhoto ? (
            <>
              <Image
                source={{ uri: currentPhoto }}
                style={styles.headerImage}
                resizeMode="cover"
              />

              {/* INDICATEURS DE PHOTOS ULTRA MODERNES */}
              {userPhotos.length > 1 && (
                <View style={styles.photoIndicators}>
                  {userPhotos.map((_: string, index: number) => (
                    <Animated.View
                      key={index}
                      style={[
                        styles.indicator,
                        {
                          backgroundColor:
                            index === currentPhotoIndex
                              ? COLORS.white
                              : COLORS.progressBg,
                          width: index === currentPhotoIndex ? 24 : 16,
                          opacity: isPhotoNavigationActive ? 1 : 0.6,
                        },
                      ]}
                      entering={FadeInUp.delay(index * 100).springify()}
                    />
                  ))}
                </View>
              )}

              {/* Indicateur d'état navigation - centré au milieu */}
              {!isPhotoNavigationActive && userPhotos.length > 1 && (
                <View style={styles.navigationStatusIndicator}>
                  <Text style={styles.navigationStatusText}>
                    ⬆️ Remontez pour changer de photo
                  </Text>
                </View>
              )}
            </>
          ) : (
            <View style={styles.placeholderImage}>
              <LinearGradient
                colors={[COLORS.softGray, COLORS.lightGray]}
                style={styles.placeholderGradient}
              >
                <Ionicons name="person" size={80} color={COLORS.gray} />
                <Text style={styles.noPhotosText}>Aucune photo</Text>
              </LinearGradient>
            </View>
          )}

          {/* OVERLAY MAGIQUE */}
          <Animated.View style={[styles.overlay, overlayStyle]}>
            <LinearGradient
              colors={[
                "transparent",
                "transparent",
                "rgba(0, 0, 0, 0.3)",
                "rgba(0, 0, 0, 0.8)",
              ]}
              style={styles.overlayGradient}
            />
          </Animated.View>

          {/* NOM FLOTTANT MAGIQUE */}
          <Animated.View style={[styles.nameContainer, nameStyle]}>
            <Text style={styles.userName}>
              {user?.name
                ? user.name.charAt(0).toUpperCase() + user.name.slice(1)
                : "Utilisateur"}
            </Text>
            {userAge && (
              <View style={styles.ageContainer}>
                <Text style={styles.userAge}>{userAge} ans</Text>
              </View>
            )}
          </Animated.View>
        </Animated.View>

        {/* ✨ CONTENT SCROLLABLE ULTRA IMMERSIF */}
        <Animated.ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { height: HEADER_HEIGHT + totalSections * CARD_HEIGHT + 100 },
          ]}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          bounces={true}
          decelerationRate="normal"
        >
          {/* SPACER POUR LA PHOTO */}
          <View style={styles.headerSpacer} />

          {/* CARD 1: JE RECHERCHE */}
          <ImmersiveCard
            index={0}
            scrollY={scrollY}
            title="Je recherche"
            icon="eye-outline"
            totalSections={totalSections}
          >
            <View style={styles.rechercheContainer}>
              <Text style={styles.rechercheText}>{mainRecherche}</Text>
              <View style={styles.rechercheDecoration}>
                <View style={styles.decorationDot} />
                <View style={styles.decorationLine} />
                <View style={styles.decorationDot} />
              </View>
            </View>
          </ImmersiveCard>

          {/* CARD 2: À PROPOS */}
          <ImmersiveCard
            index={1}
            scrollY={scrollY}
            title="À propos de moi"
            icon="chatbubble-outline"
            totalSections={totalSections}
          >
            <View style={styles.aproposContainer}>
              <Text style={styles.aproposText}>
                {sportsArray.length > 0 ? (
                  <>
                    Passionné(e) de{" "}
                    {sportsArray.slice(0, 2).map((sport, index) => (
                      <Text key={index} style={styles.sportHighlight}>
                        {sport.split(" ").slice(1).join(" ")}
                        {index < Math.min(sportsArray.length, 2) - 1
                          ? " et "
                          : ""}
                      </Text>
                    ))}
                    {sportsArray.length > 2 && (
                      <Text style={styles.moreText}>
                        {" "}
                        et {sportsArray.length - 2} autre(s)
                      </Text>
                    )}
                  </>
                ) : (
                  "Toujours prêt(e) pour de nouvelles aventures !"
                )}
              </Text>
            </View>
          </ImmersiveCard>

          {/* CARD 3: ESSENTIELS */}
          <ImmersiveCard
            index={2}
            scrollY={scrollY}
            title="Les essentiels"
            icon="flash-outline"
            totalSections={totalSections}
          >
            <View style={styles.essentielsGrid}>
              <View style={styles.essentialTag}>
                <View style={styles.essentialIcon}>
                  <Ionicons
                    name="location-outline"
                    size={20}
                    color={COLORS.primary}
                  />
                </View>
                <Text style={styles.essentialText}>Proche de vous</Text>
              </View>
              <View style={styles.essentialTag}>
                <View style={styles.essentialIcon}>
                  <Ionicons
                    name="fitness-outline"
                    size={20}
                    color={COLORS.primary}
                  />
                </View>
                <Text style={styles.essentialText}>Gym</Text>
              </View>
              {(niveau || user?.fitness_level) && (
                <View style={styles.essentialTag}>
                  <View style={styles.essentialIcon}>
                    <Ionicons
                      name="trending-up-outline"
                      size={20}
                      color={COLORS.primary}
                    />
                  </View>
                  <Text style={styles.essentialText}>
                    {niveau || user?.fitness_level}
                  </Text>
                </View>
              )}
            </View>
          </ImmersiveCard>

          {/* CARD 4: OBJECTIFS (conditionnelle) */}
          {goalsArray.length > 0 && (
            <ImmersiveCard
              index={3}
              scrollY={scrollY}
              title="Mes objectifs"
              icon="target-outline"
              totalSections={totalSections}
            >
              <View style={styles.objectifsContainer}>
                {goalsArray.slice(0, 3).map((goal, index) => (
                  <View key={index} style={styles.objectifItem}>
                    <View style={styles.objectifIcon}>
                      <Text style={styles.objectifEmoji}>
                        {goal.includes("Perte")
                          ? "🔥"
                          : goal.includes("Prise")
                          ? "💪"
                          : goal.includes("Cardio")
                          ? "❤️"
                          : goal.includes("Bien")
                          ? "🧘"
                          : "⚡"}
                      </Text>
                    </View>
                    <Text style={styles.objectifText}>{goal}</Text>
                  </View>
                ))}
              </View>
            </ImmersiveCard>
          )}

          {/* CARD 5: SPORTS (conditionnelle) */}
          {sportsArray.length > 0 && (
            <ImmersiveCard
              index={goalsArray.length > 0 ? 4 : 3}
              scrollY={scrollY}
              title="Mes sports"
              icon="basketball-outline"
              totalSections={totalSections}
            >
              <View style={styles.sportsContainer}>
                <View style={styles.sportsGrid}>
                  {sportsArray.slice(0, 6).map((sport, index) => (
                    <View key={index} style={styles.sportChip}>
                      <Text style={styles.sportEmoji}>
                        {sport.split(" ")[0]}
                      </Text>
                      <Text style={styles.sportName}>
                        {sport.split(" ").slice(1).join(" ")}
                      </Text>
                    </View>
                  ))}
                </View>
                {sportsArray.length > 6 && (
                  <Text style={styles.moreSports}>
                    +{sportsArray.length - 6} autre(s) sport(s)
                  </Text>
                )}
              </View>
            </ImmersiveCard>
          )}
        </Animated.ScrollView>
      </View>
    );
  }
);

PreviewProfileTab.displayName = "PreviewProfileTab";

export default PreviewProfileTab;

// ✨ STYLES ULTRA IMMERSIFS
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },

  // ✨ PROGRESS INDICATOR ULTRA MAGIQUE
  progressContainer: {
    position: "absolute",
    right: 20,
    top: 120,
    bottom: 120,
    zIndex: 100,
    width: 6,
    alignItems: "center",
  },
  progressTrack: {
    flex: 1,
    width: 3,
    backgroundColor: COLORS.progressBg,
    borderRadius: 3,
    overflow: "hidden",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  progressFill: {
    width: "100%",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressGradient: {
    flex: 1,
  },
  progressDots: {
    position: "absolute",
    top: 0,
    bottom: 0,
    justifyContent: "space-between",
    alignItems: "center",
    right: -2,
  },

  // Magic Progress Dots
  magicDotContainer: {
    alignItems: "center",
    position: "relative",
  },
  progressDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.progressBg,
    overflow: "hidden",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  dotFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 5,
  },
  dotGlow: {
    position: "absolute",
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    opacity: 0.3,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  dotLabel: {
    position: "absolute",
    right: 25,
    minWidth: 120,
    alignItems: "flex-end",
  },
  labelGradient: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  labelText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.white,
    textAlign: "center",
  },

  // ✨ HEADER ULTRA IMMERSIF
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: HEADER_HEIGHT,
    zIndex: 1,
  },
  headerImage: {
    width: "100%",
    height: "100%",
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
  },
  placeholderGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noPhotosText: {
    fontSize: 16,
    color: COLORS.gray,
    marginTop: 12,
    fontWeight: "500",
  },

  // ✨ NAVIGATION PHOTOS
  photoNavIndicator: {
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 25,
    padding: 12,
    opacity: 0.8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },

  // ✨ INDICATEURS ULTRA MODERNES
  photoIndicators: {
    position: "absolute",
    top: 60,
    left: 20,
    right: 20,
    flexDirection: "row",
    gap: 6,
    zIndex: 5,
    alignItems: "center",
    pointerEvents: "none",
  },
  indicator: {
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.white,
  },

  // Indicateur d'état navigation - centré au milieu de la photo
  navigationStatusIndicator: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -25, // La moitié de la hauteur approximative du composant
    marginLeft: -120, // La moitié de la largeur (240px / 2)
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.5)",
    width: 240,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 10,
  },
  navigationStatusText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 0.5,
  },

  // Overlay magique
  overlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "60%",
    zIndex: 2,
    pointerEvents: "none",
  },
  overlayGradient: {
    flex: 1,
  },

  // Nom flottant
  nameContainer: {
    position: "absolute",
    bottom: 80,
    left: 24,
    right: 24,
    zIndex: 3,
    alignItems: "center",
    pointerEvents: "none",
  },
  userName: {
    fontSize: 42,
    fontWeight: "900",
    color: COLORS.white,
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 12,
    letterSpacing: -1,
    marginBottom: 8,
  },
  ageContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  userAge: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.white,
    textAlign: "center",
  },

  // ✨ SCROLL CONTENT
  scrollView: {
    flex: 1,
    zIndex: 2,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  headerSpacer: {
    height: HEADER_HEIGHT,
  },

  // ✨ CARTES IMMERSIVES
  immersiveCard: {
    height: CARD_HEIGHT,
    marginBottom: 20,
    justifyContent: "center",
    position: "relative",
  },
  particlesContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
    pointerEvents: "none",
  },
  particle: {
    position: "absolute",
    width: 4,
    height: 4,
    borderRadius: 2,
    left: Math.random() * width,
    top: "80%",
  },
  particleGradient: {
    width: "100%",
    height: "100%",
    borderRadius: 2,
  },
  cardBackground: {
    flex: 1,
    borderRadius: 32,
    overflow: "hidden",
    shadowColor: "rgba(255, 81, 53, 0.25)",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 40,
    elevation: 20,
    position: "relative",
    zIndex: 2,
  },
  cardGradient: {
    flex: 1,
    padding: 32,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)",
    position: "relative",
  },
  meshBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  meshGradient: {
    flex: 1,
    opacity: 0.6,
  },

  // Header magique des cartes
  cardMagicHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 32,
    gap: 20,
    zIndex: 3,
    position: "relative",
  },
  magicIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
    position: "relative",
  },
  iconGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  iconPulse: {
    position: "absolute",
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 30,
    zIndex: -1,
  },
  pulseGradient: {
    flex: 1,
    borderRadius: 30,
  },
  titleContainer: {
    flex: 1,
    position: "relative",
  },
  cardMagicTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  titleUnderline: {
    width: 60,
    height: 4,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
    marginBottom: 8,
  },
  titleDecoration: {
    flexDirection: "row",
    gap: 4,
  },
  decorativeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primaryLight,
    opacity: 0.6,
  },

  // Contenu des cartes
  cardContent: {
    flex: 1,
    justifyContent: "center",
    zIndex: 3,
    position: "relative",
  },

  // "Je recherche"
  rechercheContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  rechercheText: {
    fontSize: 26,
    fontWeight: "700",
    color: COLORS.textPrimary,
    textAlign: "center",
    lineHeight: 40,
    marginBottom: 40,
    letterSpacing: -0.3,
  },
  rechercheDecoration: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  decorationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  decorationLine: {
    width: 100,
    height: 3,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },

  // "À propos"
  aproposContainer: {
    justifyContent: "center",
    paddingVertical: 20,
  },
  aproposText: {
    fontSize: 22,
    lineHeight: 36,
    color: COLORS.textSecondary,
    textAlign: "center",
    letterSpacing: -0.2,
  },
  sportHighlight: {
    color: COLORS.primary,
    fontWeight: "800",
    backgroundColor: "rgba(255, 81, 53, 0.1)",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  moreText: {
    color: COLORS.gray,
    fontStyle: "italic",
    fontSize: 18,
  },

  // "Essentiels"
  essentielsGrid: {
    gap: 24,
  },
  essentialTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 81, 53, 0.05)",
    paddingHorizontal: 28,
    paddingVertical: 20,
    borderRadius: 28,
    gap: 20,
    borderWidth: 1.5,
    borderColor: "rgba(255, 81, 53, 0.2)",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  essentialIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: "rgba(255, 81, 53, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  essentialText: {
    fontSize: 19,
    fontWeight: "700",
    color: COLORS.textPrimary,
    flex: 1,
    letterSpacing: -0.2,
  },

  // Objectifs
  objectifsContainer: {
    gap: 28,
  },
  objectifItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
    backgroundColor: "rgba(255, 247, 245, 0.8)",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 81, 53, 0.1)",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  objectifIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 81, 53, 0.2)",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  objectifEmoji: {
    fontSize: 26,
  },
  objectifText: {
    flex: 1,
    fontSize: 19,
    fontWeight: "700",
    color: COLORS.textPrimary,
    letterSpacing: -0.2,
  },

  // Sports
  sportsContainer: {
    gap: 28,
  },
  sportsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 18,
  },
  sportChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderRadius: 28,
    gap: 14,
    borderWidth: 1.5,
    borderColor: "rgba(255, 81, 53, 0.15)",
    minWidth: (width - 100) / 2,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 15,
    elevation: 6,
  },
  sportEmoji: {
    fontSize: 22,
  },
  sportName: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.textPrimary,
    flex: 1,
    letterSpacing: -0.1,
  },
  moreSports: {
    fontSize: 17,
    color: COLORS.primary,
    textAlign: "center",
    fontWeight: "600",
    backgroundColor: "rgba(255, 81, 53, 0.1)",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    overflow: "hidden",
  },
});
