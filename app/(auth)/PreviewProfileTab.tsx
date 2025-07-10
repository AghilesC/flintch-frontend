import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  withRepeat,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const { height, width } = Dimensions.get("window");
const HEADER_HEIGHT = height * 0.9;
const CARD_HEIGHT = height * 0.45;

// ✨ COULEURS ULTRA MODERNES
const COLORS = {
  primary: "#FF5135",
  primaryLight: "#FFA958",
  white: "#FFFFFF",
  lightGray: "#F8F9FA",
  softGray: "#F1F3F4",
  textSecondary: "#6C7B7F",
  textPrimary: "#2D3748",
  gray: "#8E8E93",
  progressBg: "rgba(255, 255, 255, 0.3)",
};

// ✨ GRADIENT UNIFORME POUR TOUS LES ÉLÉMENTS ORANGE
const ORANGE_GRADIENT = {
  colors: ["#FF5135", "#FFA958"] as const, // Bas gauche vers haut droite
  start: { x: 0, y: 1 } as const,
  end: { x: 1, y: 0 } as const,
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
  userSports?: string[]; // ✅ NOUVEAU: Sports de l'utilisateur connecté
}

// ✨ FONCTION POUR CALCULER LA POSITION DE SCROLL CIBLE POUR CHAQUE SECTION
const getScrollPositionForSection = (sectionIndex: number) => {
  if (sectionIndex === 0) {
    return HEADER_HEIGHT / 3;
  }
  const cardIndex = sectionIndex - 1;
  return HEADER_HEIGHT + cardIndex * CARD_HEIGHT - (height - CARD_HEIGHT) / 2;
};

// ✨ SYNCHRONISATION MILLIMÉTRIQUE - POINT ORANGE = CARD AU CENTRE EXACT
const getCurrentSection = (scrollValue: number) => {
  "worklet";
  if (scrollValue < HEADER_HEIGHT - (height - CARD_HEIGHT) / 2) {
    return 0;
  }
  const cardIndex = Math.round(
    (scrollValue - HEADER_HEIGHT + (height - CARD_HEIGHT) / 2) / CARD_HEIGHT
  );
  return Math.max(0, cardIndex + 1);
};

// ✨ GLASSMORPHISM ULTRA-RÉALISTE ET OPTIMISÉ
const GlassmorphismCard = React.memo(
  ({
    children,
    style = {},
    intensity = "medium",
    isPrimary = false,
  }: {
    children: React.ReactNode;
    style?: any;
    intensity?: "light" | "medium" | "strong";
    isPrimary?: boolean;
  }) => {
    const getGlassStyle = useMemo(() => {
      if (isPrimary) {
        return {
          backgroundColor: "rgba(255, 255, 255, 0.25)",
          borderColor: "rgba(255, 255, 255, 0.4)",
          shadowColor: "rgba(255, 255, 255, 0.8)",
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.6,
          shadowRadius: 25,
          elevation: 20,
        };
      }

      switch (intensity) {
        case "light":
          return {
            backgroundColor: "rgba(255, 255, 255, 0.03)",
            borderColor: "rgba(255, 255, 255, 0.08)",
            shadowColor: "rgba(255, 255, 255, 0.3)",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 4,
          };
        case "strong":
          return {
            backgroundColor: "rgba(255, 255, 255, 0.08)",
            borderColor: "rgba(255, 255, 255, 0.15)",
            shadowColor: "rgba(255, 255, 255, 0.5)",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.4,
            shadowRadius: 15,
            elevation: 10,
          };
        default:
          return {
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            borderColor: "rgba(255, 255, 255, 0.12)",
            shadowColor: "rgba(255, 255, 255, 0.4)",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 6,
          };
      }
    }, [intensity, isPrimary]);

    return (
      <View style={[styles.glassmorphismContainer, getGlassStyle, style]}>
        <LinearGradient
          colors={
            isPrimary
              ? [
                  "rgba(255, 255, 255, 0.15)",
                  "rgba(255, 255, 255, 0.05)",
                  "rgba(255, 255, 255, 0.1)",
                ]
              : [
                  "rgba(255, 255, 255, 0.06)",
                  "rgba(255, 255, 255, 0.02)",
                  "rgba(255, 255, 255, 0.04)",
                ]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.glassmorphismGradient}
        />

        <LinearGradient
          colors={
            isPrimary
              ? [
                  "rgba(255, 255, 255, 0.3)",
                  "rgba(255, 255, 255, 0.1)",
                  "transparent",
                ]
              : [
                  "rgba(255, 255, 255, 0.15)",
                  "rgba(255, 255, 255, 0.03)",
                  "transparent",
                ]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 0.3 }}
          style={styles.topReflection}
        />

        <View style={styles.glassContent}>{children}</View>
      </View>
    );
  }
);

// ✨ SPORT CHIP SIMPLIFIÉ - AFFICHAGE DIRECT SANS ANIMATION
const SportChip = React.memo(
  ({
    sport,
    index,
    isCommon = false,
  }: {
    sport: string;
    index: number;
    isCommon?: boolean;
  }) => {
    const bounceScale = useSharedValue(1);
    const glowIntensity = useSharedValue(0);

    // ✅ FONCTIONS UTILITAIRES POUR GÉRER LES SPORTS
    const getSportEmoji = (sport: string): string => {
      const parts = sport.split(" ");
      return parts[0] || "🏋️";
    };

    const getSportName = (sport: string): string => {
      const parts = sport.split(" ");
      return parts.slice(1).join(" ") || sport;
    };

    useEffect(() => {
      if (isCommon) {
        // Animation bounce TRÈS subtile uniquement pour les sports en commun
        const animateBounce = () => {
          bounceScale.value = withRepeat(
            withTiming(1.015, { duration: 2000 }, () => {
              bounceScale.value = withTiming(1, { duration: 2000 });
            }),
            -1,
            false
          );

          // Glow subtile synchronisée
          glowIntensity.value = withRepeat(
            withTiming(0.3, { duration: 2000 }, () => {
              glowIntensity.value = withTiming(0.1, { duration: 2000 });
            }),
            -1,
            false
          );
        };

        // Délai différent pour chaque sport pour créer un effet de vague
        setTimeout(animateBounce, index * 600);
      }
    }, [isCommon, index]);

    const bounceStyle = useAnimatedStyle(() => ({
      transform: [{ scale: bounceScale.value }],
    }));

    const glowStyle = useAnimatedStyle(() => ({
      shadowOpacity: isCommon ? glowIntensity.value : 0,
    }));

    if (isCommon) {
      return (
        <Animated.View style={[bounceStyle]}>
          <Animated.View style={[styles.sportChipCommon, glowStyle]}>
            <GlassmorphismCard
              intensity="medium"
              isPrimary={false}
              style={styles.sportChipCommonContainer}
            >
              <LinearGradient
                colors={ORANGE_GRADIENT.colors}
                start={ORANGE_GRADIENT.start}
                end={ORANGE_GRADIENT.end}
                style={styles.sportGradientOverlay}
              >
                <View style={styles.sportChipContent}>
                  <Text style={styles.sportEmoji}>{getSportEmoji(sport)}</Text>
                  <Text style={styles.sportNameCommon} numberOfLines={1}>
                    {getSportName(sport)}
                  </Text>
                </View>
              </LinearGradient>
            </GlassmorphismCard>
          </Animated.View>
        </Animated.View>
      );
    }

    return (
      <GlassmorphismCard
        intensity="light"
        isPrimary={false}
        style={styles.sportChip}
      >
        <View style={styles.sportChipContent}>
          <Text style={styles.sportEmoji}>{getSportEmoji(sport)}</Text>
          <Text style={styles.sportName} numberOfLines={1}>
            {getSportName(sport)}
          </Text>
        </View>
      </GlassmorphismCard>
    );
  }
);

// ✨ PARTICULES ULTRA-OPTIMISÉES
const OptimizedParticle = React.memo(({ delay = 0 }: { delay?: number }) => {
  const translateY = useSharedValue(height);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const animate = () => {
      translateY.value = height;
      opacity.value = 0;

      translateY.value = withTiming(-50, { duration: 20000 });
      opacity.value = withTiming(0.4, { duration: 3000 }, () => {
        setTimeout(() => {
          opacity.value = withTiming(0, { duration: 3000 });
        }, 14000);
      });

      setTimeout(animate, 25000);
    };

    setTimeout(animate, delay);
  }, []);

  const particleStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.optimizedParticle, particleStyle]}>
      <View style={styles.particleCore} />
    </Animated.View>
  );
});

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
        colors={ORANGE_GRADIENT.colors}
        start={ORANGE_GRADIENT.start}
        end={ORANGE_GRADIENT.end}
        style={styles.particleGradient}
      />
    </Animated.View>
  );
});

// ✨ PROGRESS DOT ULTRA MAGIQUE - AVEC GRADIENT UNIFORME
const MagicProgressDot = React.memo(
  ({
    index,
    scrollY,
    totalSections,
    sectionNames,
    onPress,
  }: {
    index: number;
    scrollY: Animated.SharedValue<number>;
    totalSections: number;
    sectionNames: string[];
    onPress: (sectionIndex: number) => void;
  }) => {
    const dotStyle = useAnimatedStyle(() => {
      const currentSection = getCurrentSection(scrollY.value);
      const isActive = currentSection === index;
      const isPassed = currentSection > index;
      const scale = isActive ? withSpring(1.4) : withSpring(isPassed ? 1.2 : 1);

      return {
        transform: [{ scale }],
      };
    });

    const fillStyle = useAnimatedStyle(() => {
      const currentSection = getCurrentSection(scrollY.value);
      const isActive = currentSection === index;
      const isPassed = currentSection > index;

      return {
        width: isPassed || isActive ? "100%" : "0%",
        opacity: withTiming(isActive || isPassed ? 1 : 0.3, { duration: 300 }),
      };
    });

    const glowStyle = useAnimatedStyle(() => {
      const currentSection = getCurrentSection(scrollY.value);
      const isActive = currentSection === index;

      return {
        opacity: withTiming(isActive ? 1 : 0, { duration: 300 }),
        transform: [{ scale: withSpring(isActive ? 1 : 0.5) }],
      };
    });

    const labelStyle = useAnimatedStyle(() => {
      const currentSection = getCurrentSection(scrollY.value);
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
      <TouchableOpacity
        style={styles.magicDotContainer}
        onPress={() => onPress(index)}
        activeOpacity={0.7}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Animated.View style={[styles.dotGlow, glowStyle]} />
        <Animated.View style={[styles.progressDot, dotStyle]}>
          <Animated.View style={[styles.dotFill, fillStyle]}>
            <LinearGradient
              colors={ORANGE_GRADIENT.colors}
              start={ORANGE_GRADIENT.start}
              end={ORANGE_GRADIENT.end}
              style={styles.dotFillGradient}
            />
          </Animated.View>
        </Animated.View>
        <Animated.View style={[styles.dotLabel, labelStyle]}>
          <GlassmorphismCard
            intensity="strong"
            isPrimary={false}
            style={styles.labelContainer}
          >
            <Text style={styles.labelText}>{sectionNames[index]}</Text>
          </GlassmorphismCard>
        </Animated.View>
      </TouchableOpacity>
    );
  }
);

// ✨ PROGRESS INDICATOR ULTRA MAGIQUE - AVEC GRADIENT UNIFORME
const ProgressIndicator = React.memo(
  ({
    scrollY,
    totalSections,
    sectionNames,
    onSectionPress,
  }: {
    scrollY: Animated.SharedValue<number>;
    totalSections: number;
    sectionNames: string[];
    onSectionPress: (sectionIndex: number) => void;
  }) => {
    const indicatorStyle = useAnimatedStyle(() => {
      const maxSection = totalSections - 1;
      const transitionPoint = HEADER_HEIGHT - (height - CARD_HEIGHT) / 2;

      let rawSection = 0;

      if (scrollY.value < transitionPoint) {
        rawSection = interpolate(
          scrollY.value,
          [0, transitionPoint],
          [0, 1],
          Extrapolate.CLAMP
        );
      } else {
        const cardIndex =
          (scrollY.value - HEADER_HEIGHT + (height - CARD_HEIGHT) / 2) /
          CARD_HEIGHT;
        rawSection = cardIndex + 1;
      }

      const progress = Math.max(0, Math.min(1, rawSection / maxSection));

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
              colors={ORANGE_GRADIENT.colors}
              start={ORANGE_GRADIENT.start}
              end={ORANGE_GRADIENT.end}
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
              onPress={onSectionPress}
            />
          ))}
        </View>
      </View>
    );
  }
);

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
    const cardIndex = index - 1;
    const cardOffset =
      HEADER_HEIGHT + cardIndex * CARD_HEIGHT - (height - CARD_HEIGHT) / 2;

    const cardStyle = useAnimatedStyle(() => {
      const perfectCenter = cardOffset;
      const beforeCenter = perfectCenter - CARD_HEIGHT * 0.8;
      const afterCenter = perfectCenter + CARD_HEIGHT * 0.8;

      const translateY = interpolate(
        scrollY.value,
        [beforeCenter, perfectCenter, afterCenter],
        [CARD_HEIGHT * 0.15, 0, -CARD_HEIGHT * 0.15],
        Extrapolate.CLAMP
      );

      const scale = interpolate(
        scrollY.value,
        [
          perfectCenter - CARD_HEIGHT * 0.5,
          perfectCenter,
          perfectCenter + CARD_HEIGHT * 0.5,
        ],
        [0.9, 1, 0.9],
        Extrapolate.CLAMP
      );

      const opacity = interpolate(
        scrollY.value,
        [
          beforeCenter,
          perfectCenter - CARD_HEIGHT * 0.2,
          perfectCenter + CARD_HEIGHT * 0.2,
          afterCenter,
        ],
        [0.3, 1, 1, 0.3],
        Extrapolate.CLAMP
      );

      return {
        transform: [{ translateY }, { scale }],
        opacity,
      };
    });

    const glowStyle = useAnimatedStyle(() => {
      const currentSection = getCurrentSection(scrollY.value);
      const isActive = currentSection === index;

      return {
        shadowOpacity: isActive ? 0.4 : 0.1,
        shadowRadius: isActive ? 25 : 10,
      };
    });

    return (
      <Animated.View style={[styles.immersiveCard, cardStyle]}>
        <View style={styles.particlesContainer}>
          <FloatingParticle delay={0} />
          <FloatingParticle delay={1000} />
        </View>

        <Animated.View style={[styles.cardBackground, glowStyle]}>
          <GlassmorphismCard isPrimary={true} style={styles.mainCardContainer}>
            <View style={styles.cardContentWrapper}>
              <View style={styles.cardMagicHeader}>
                <View style={styles.magicIconContainer}>
                  <LinearGradient
                    colors={ORANGE_GRADIENT.colors}
                    start={ORANGE_GRADIENT.start}
                    end={ORANGE_GRADIENT.end}
                    style={styles.iconGradient}
                  >
                    <Ionicons
                      name={icon as any}
                      size={width * 0.06} // Responsive icon size
                      color={COLORS.white}
                    />
                  </LinearGradient>
                </View>

                <View style={styles.titleContainer}>
                  <Text style={styles.cardMagicTitle}>{title}</Text>
                  <View style={styles.titleUnderline}>
                    <LinearGradient
                      colors={ORANGE_GRADIENT.colors}
                      start={ORANGE_GRADIENT.start}
                      end={ORANGE_GRADIENT.end}
                      style={styles.titleUnderlineGradient}
                    />
                  </View>
                </View>
              </View>

              <View style={styles.cardContent}>{children}</View>
            </View>
          </GlassmorphismCard>
        </Animated.View>
      </Animated.View>
    );
  }
);

// ✨ COMPOSANT PRINCIPAL PREVIEW TAB ULTRA IMMERSIF
const PreviewProfileTab = React.memo<PreviewProfileTabProps>(
  ({ user, sports, objectifs, niveau, userSports = [] }) => {
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
    const [currentSection, setCurrentSection] = useState(0);
    const [isPhotoNavigationActive, setIsPhotoNavigationActive] =
      useState(true);
    const scrollY = useSharedValue(0);
    const scrollViewRef = React.useRef<Animated.ScrollView>(null);

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
      const names = ["Photos", "Je recherche", "À propos", "Essentiels"];
      if (goalsArray.length > 0) names.push("Objectifs");
      if (sportsArray.length > 0) names.push("Sports");
      return names;
    }, [goalsArray.length, sportsArray.length]);

    const totalSections = useMemo(() => {
      let count = 4;
      if (goalsArray.length > 0) count += 1;
      if (sportsArray.length > 0) count += 1;
      return count;
    }, [goalsArray.length, sportsArray.length]);

    const userPhotos = useMemo(() => user?.photos || [], [user?.photos]);

    // ✅ FONCTION POUR DÉTECTER LES SPORTS EN COMMUN
    const isSharedSport = useCallback(
      (sport: string): boolean => {
        if (userSports.length === 0) return false;

        // Extrait le nom du sport (sans emoji)
        const sportName = sport
          .split(" ")
          .slice(1)
          .join(" ")
          .toLowerCase()
          .trim();

        return userSports.some((userSport) => {
          const userSportName = userSport
            .split(" ")
            .slice(1)
            .join(" ")
            .toLowerCase()
            .trim();
          return userSportName === sportName;
        });
      },
      [userSports]
    );

    useEffect(() => {
      setCurrentPhotoIndex(0);
    }, [user?.photos]);

    const navigateToSection = (sectionIndex: number) => {
      const targetScrollY = getScrollPositionForSection(sectionIndex);
      scrollViewRef.current?.scrollTo({
        y: targetScrollY,
        animated: true,
      });
    };

    const scrollHandler = useAnimatedScrollHandler({
      onScroll: (event) => {
        scrollY.value = event.contentOffset.y;

        const scrollPosition = event.contentOffset.y;
        const photoNavShouldBeActive = scrollPosition <= 50;

        runOnJS(setIsPhotoNavigationActive)(photoNavShouldBeActive);

        const newSection = getCurrentSection(event.contentOffset.y);
        const clampedSection = Math.max(
          0,
          Math.min(newSection, totalSections - 1)
        );

        runOnJS(setCurrentSection)(clampedSection);
      },
    });

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
        <View style={styles.floatingContainer}>
          <OptimizedParticle delay={5000} />
          <OptimizedParticle delay={15000} />
        </View>

        {userPhotos.length > 1 && isPhotoNavigationActive && (
          <>
            <TouchableOpacity
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "35%",
                height: HEADER_HEIGHT * 0.75,
                zIndex: 99998,
              }}
              onPress={() => {
                setCurrentPhotoIndex((prev) =>
                  prev > 0 ? prev - 1 : userPhotos.length - 1
                );
              }}
              activeOpacity={1}
            />

            <TouchableOpacity
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                width: "35%",
                height: HEADER_HEIGHT * 0.75,
                zIndex: 99998,
              }}
              onPress={() => {
                setCurrentPhotoIndex((prev) =>
                  prev < userPhotos.length - 1 ? prev + 1 : 0
                );
              }}
              activeOpacity={1}
            />
          </>
        )}

        <ProgressIndicator
          scrollY={scrollY}
          totalSections={totalSections}
          sectionNames={sectionNames}
          onSectionPress={navigateToSection}
        />

        <Animated.View style={[styles.header, headerStyle]}>
          {currentPhoto ? (
            <>
              <Image
                source={{ uri: currentPhoto }}
                style={styles.headerImage}
                resizeMode="cover"
              />

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
                          width:
                            index === currentPhotoIndex
                              ? width * 0.06
                              : width * 0.04, // Responsive
                          opacity: isPhotoNavigationActive ? 1 : 0.6,
                        },
                      ]}
                      entering={FadeInUp.delay(index * 100).springify()}
                    />
                  ))}
                </View>
              )}
            </>
          ) : (
            <View style={styles.placeholderImage}>
              <LinearGradient
                colors={[COLORS.softGray, COLORS.lightGray]}
                style={styles.placeholderGradient}
              >
                <Ionicons
                  name="person"
                  size={width * 0.2}
                  color={COLORS.gray}
                />
                <Text style={styles.noPhotosText}>Aucune photo</Text>
              </LinearGradient>
            </View>
          )}

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

        <Animated.ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          bounces={true}
          decelerationRate="normal"
        >
          <View style={styles.headerSpacer} />

          <ImmersiveCard
            index={1}
            scrollY={scrollY}
            title="Je recherche"
            icon="eye-outline"
            totalSections={totalSections}
          >
            <View style={styles.rechercheContainer}>
              <Text style={styles.rechercheText}>{mainRecherche}</Text>
              <View style={styles.rechercheDecoration}>
                <View style={styles.decorationDot}>
                  <LinearGradient
                    colors={ORANGE_GRADIENT.colors}
                    start={ORANGE_GRADIENT.start}
                    end={ORANGE_GRADIENT.end}
                    style={styles.decorationDotGradient}
                  />
                </View>
                <View style={styles.decorationLine}>
                  <LinearGradient
                    colors={ORANGE_GRADIENT.colors}
                    start={ORANGE_GRADIENT.start}
                    end={ORANGE_GRADIENT.end}
                    style={styles.decorationLineGradient}
                  />
                </View>
                <View style={styles.decorationDot}>
                  <LinearGradient
                    colors={ORANGE_GRADIENT.colors}
                    start={ORANGE_GRADIENT.start}
                    end={ORANGE_GRADIENT.end}
                    style={styles.decorationDotGradient}
                  />
                </View>
              </View>
            </View>
          </ImmersiveCard>

          <ImmersiveCard
            index={2}
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

          <ImmersiveCard
            index={3}
            scrollY={scrollY}
            title="Les essentiels"
            icon="flash-outline"
            totalSections={totalSections}
          >
            <View style={styles.essentielsGrid}>
              <GlassmorphismCard
                intensity="light"
                isPrimary={false}
                style={styles.essentialTag}
              >
                <View style={styles.essentialTagContent}>
                  <View style={styles.essentialIcon}>
                    <Ionicons
                      name="location-outline"
                      size={width * 0.045} // Responsive
                      color={COLORS.primary}
                    />
                  </View>
                  <Text style={styles.essentialText}>Proche de vous</Text>
                </View>
              </GlassmorphismCard>

              <GlassmorphismCard
                intensity="light"
                isPrimary={false}
                style={styles.essentialTag}
              >
                <View style={styles.essentialTagContent}>
                  <View style={styles.essentialIcon}>
                    <Ionicons
                      name="fitness-outline"
                      size={width * 0.045} // Responsive
                      color={COLORS.primary}
                    />
                  </View>
                  <Text style={styles.essentialText}>Gym</Text>
                </View>
              </GlassmorphismCard>

              {(niveau || user?.fitness_level) && (
                <GlassmorphismCard
                  intensity="light"
                  isPrimary={false}
                  style={styles.essentialTag}
                >
                  <View style={styles.essentialTagContent}>
                    <View style={styles.essentialIcon}>
                      <Ionicons
                        name="trending-up-outline"
                        size={width * 0.045} // Responsive
                        color={COLORS.primary}
                      />
                    </View>
                    <Text style={styles.essentialText}>
                      {niveau || user?.fitness_level}
                    </Text>
                  </View>
                </GlassmorphismCard>
              )}
            </View>
          </ImmersiveCard>

          {goalsArray.length > 0 && (
            <ImmersiveCard
              index={4}
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

          {sportsArray.length > 0 && (
            <ImmersiveCard
              index={goalsArray.length > 0 ? 5 : 4}
              scrollY={scrollY}
              title="Mes sports"
              icon="basketball-outline"
              totalSections={totalSections}
            >
              <View style={styles.sportsContainer}>
                <View style={styles.sportsGrid}>
                  {sportsArray.slice(0, 6).map((sport, index) => {
                    // ✅ UTILISE LA VRAIE LOGIQUE DE DÉTECTION DES SPORTS EN COMMUN
                    const isCommon = isSharedSport(sport);

                    return (
                      <SportChip
                        key={`${sport}-${index}`}
                        sport={sport}
                        index={index}
                        isCommon={isCommon}
                      />
                    );
                  })}
                </View>
                {sportsArray.length > 6 && (
                  <GlassmorphismCard
                    intensity="light"
                    isPrimary={false}
                    style={styles.moreSportsContainer}
                  >
                    <Text style={styles.moreSports}>
                      +{sportsArray.length - 6} autre(s) sport(s)
                    </Text>
                  </GlassmorphismCard>
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

// ✨ STYLES ULTRA IMMERSIFS AVEC RESPONSIVITÉ PARFAITE
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
    position: "relative",
    overflow: "hidden",
  },

  // ✨ GLASSMORPHISM ULTRA-RÉALISTE OPTIMISÉ
  glassmorphismContainer: {
    borderRadius: width * 0.06, // Responsive border radius
    borderWidth: 0.5,
    overflow: "hidden",
    position: "relative",
  },
  glassmorphismGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: width * 0.06,
  },
  topReflection: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "25%",
    borderTopLeftRadius: width * 0.06,
    borderTopRightRadius: width * 0.06,
    zIndex: 2,
  },
  glassContent: {
    flex: 1,
    zIndex: 5,
    position: "relative",
  },

  // ✨ PARTICULES ULTRA-OPTIMISÉES
  floatingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0.2,
    pointerEvents: "none",
  },
  optimizedParticle: {
    position: "absolute",
    width: width * 0.008,
    height: width * 0.008,
    borderRadius: width * 0.004,
    left: "60%",
  },
  particleCore: {
    width: "100%",
    height: "100%",
    borderRadius: width * 0.004,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    shadowColor: "rgba(255, 255, 255, 0.6)",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
  },

  // ✨ PROGRESS INDICATOR ULTRA MAGIQUE
  progressContainer: {
    position: "absolute",
    right: width * 0.05, // Responsive positioning
    top: height * 0.15,
    bottom: height * 0.15,
    zIndex: 100,
    width: width * 0.015, // Responsive width
    alignItems: "center",
  },
  progressTrack: {
    flex: 1,
    width: width * 0.008,
    backgroundColor: COLORS.progressBg,
    borderRadius: width * 0.008,
    overflow: "hidden",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  progressFill: {
    width: "100%",
    borderRadius: width * 0.008,
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
    right: -width * 0.005,
  },

  // Magic Progress Dots - Responsive
  magicDotContainer: {
    alignItems: "center",
    position: "relative",
  },
  progressDot: {
    width: width * 0.035,
    height: width * 0.035,
    borderRadius: width * 0.018,
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
    borderRadius: width * 0.013,
    overflow: "hidden",
  },
  dotFillGradient: {
    flex: 1,
  },
  dotGlow: {
    position: "absolute",
    width: width * 0.06,
    height: width * 0.06,
    borderRadius: width * 0.03,
    backgroundColor: COLORS.primary,
    opacity: 0.3,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  dotLabel: {
    position: "absolute",
    right: width * 0.065,
    minWidth: width * 0.3,
    alignItems: "flex-end",
  },
  labelContainer: {
    paddingHorizontal: width * 0.03,
    paddingVertical: height * 0.008,
    borderRadius: width * 0.03,
    alignItems: "center",
    justifyContent: "center",
  },
  labelText: {
    fontSize: width * 0.03,
    fontWeight: "800",
    color: COLORS.primary,
    textAlign: "center",
    textShadowColor: "rgba(255, 255, 255, 0.9)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    letterSpacing: 0.3,
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
    fontSize: width * 0.04,
    color: COLORS.gray,
    marginTop: height * 0.015,
    fontWeight: "500",
  },

  // ✨ INDICATEURS ULTRA MODERNES - Responsive
  photoIndicators: {
    position: "absolute",
    top: height * 0.075,
    left: width * 0.05,
    right: width * 0.05,
    flexDirection: "row",
    gap: width * 0.015,
    zIndex: 5,
    alignItems: "center",
    pointerEvents: "none",
  },
  indicator: {
    height: height * 0.005,
    borderRadius: height * 0.0025,
    backgroundColor: COLORS.white,
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

  // Nom flottant - Responsive
  nameContainer: {
    position: "absolute",
    bottom: height * 0.1,
    left: width * 0.06,
    right: width * 0.06,
    zIndex: 3,
    alignItems: "center",
    pointerEvents: "none",
  },
  userName: {
    fontSize: width * 0.105,
    fontWeight: "900",
    color: COLORS.white,
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 12,
    letterSpacing: -1,
    marginBottom: height * 0.01,
  },
  ageContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.008,
    borderRadius: width * 0.05,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  userAge: {
    fontSize: width * 0.04,
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
    paddingHorizontal: width * 0.04,
    paddingRight: width * 0.125,
    paddingBottom: height * 0.25,
  },
  headerSpacer: {
    height: HEADER_HEIGHT,
  },

  // ✨ CARTES IMMERSIVES
  immersiveCard: {
    height: CARD_HEIGHT,
    marginBottom: height * 0.025,
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
    width: width * 0.01,
    height: width * 0.01,
    borderRadius: width * 0.005,
    left: Math.random() * width,
    top: "80%",
  },
  particleGradient: {
    width: "100%",
    height: "100%",
    borderRadius: width * 0.005,
  },
  cardBackground: {
    flex: 1,
    borderRadius: width * 0.07,
    overflow: "hidden",
    position: "relative",
    zIndex: 2,
  },
  mainCardContainer: {
    flex: 1,
    borderRadius: width * 0.07,
  },
  cardContentWrapper: {
    flex: 1,
    padding: width * 0.06,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: width * 0.07,
  },

  // Header des cartes - Responsive
  cardMagicHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: height * 0.025,
    gap: width * 0.04,
    zIndex: 3,
    position: "relative",
  },
  magicIconContainer: {
    width: width * 0.12,
    height: width * 0.12,
    borderRadius: width * 0.04,
    overflow: "hidden",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
    position: "relative",
  },
  iconGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  titleContainer: {
    flex: 1,
    position: "relative",
  },
  cardMagicTitle: {
    fontSize: width * 0.06,
    fontWeight: "800",
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
    marginBottom: height * 0.008,
  },
  titleUnderline: {
    width: width * 0.125,
    height: height * 0.004,
    borderRadius: height * 0.0025,
    marginBottom: height * 0.008,
    overflow: "hidden",
  },
  titleUnderlineGradient: {
    flex: 1,
  },

  // Contenu des cartes
  cardContent: {
    flex: 1,
    justifyContent: "center",
    zIndex: 3,
    position: "relative",
  },

  // "Je recherche" - Responsive
  rechercheContainer: {
    alignItems: "center",
    paddingVertical: height * 0.02,
  },
  rechercheText: {
    fontSize: width * 0.055,
    fontWeight: "700",
    color: COLORS.textPrimary,
    textAlign: "center",
    lineHeight: width * 0.08,
    marginBottom: height * 0.03,
    letterSpacing: -0.3,
  },
  rechercheDecoration: {
    flexDirection: "row",
    alignItems: "center",
    gap: width * 0.03,
  },
  decorationDot: {
    width: width * 0.02,
    height: width * 0.02,
    borderRadius: width * 0.01,
    overflow: "hidden",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  decorationDotGradient: {
    flex: 1,
  },
  decorationLine: {
    width: width * 0.2,
    height: height * 0.0025,
    borderRadius: height * 0.00125,
    overflow: "hidden",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  decorationLineGradient: {
    flex: 1,
  },

  // "À propos" - Responsive
  aproposContainer: {
    justifyContent: "center",
    paddingVertical: height * 0.02,
  },
  aproposText: {
    fontSize: width * 0.045,
    lineHeight: width * 0.07,
    color: COLORS.textSecondary,
    textAlign: "center",
    letterSpacing: -0.2,
  },
  sportHighlight: {
    color: COLORS.primary,
    fontWeight: "800",
    backgroundColor: "rgba(255, 81, 53, 0.1)",
    paddingHorizontal: width * 0.01,
    paddingVertical: height * 0.0025,
    borderRadius: width * 0.01,
  },
  moreText: {
    color: COLORS.gray,
    fontStyle: "italic",
    fontSize: width * 0.04,
  },

  // "Essentiels" avec glassmorphism ultra - Responsive
  essentielsGrid: {
    gap: height * 0.02,
  },
  essentialTag: {
    borderRadius: width * 0.06,
    marginBottom: height * 0.005,
  },
  essentialTagContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: width * 0.05,
    paddingVertical: height * 0.02,
    gap: width * 0.04,
  },
  essentialIcon: {
    width: width * 0.1,
    height: width * 0.1,
    borderRadius: width * 0.035,
    backgroundColor: "rgba(255, 81, 53, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  essentialText: {
    fontSize: width * 0.04,
    fontWeight: "700",
    color: COLORS.textPrimary,
    flex: 1,
    letterSpacing: -0.2,
  },

  // Objectifs - Responsive
  objectifsContainer: {
    gap: height * 0.02,
  },
  objectifItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: width * 0.04,
    backgroundColor: "rgba(255, 247, 245, 0.8)",
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.015,
    borderRadius: width * 0.05,
    borderWidth: 1,
    borderColor: "rgba(255, 81, 53, 0.1)",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  objectifIcon: {
    width: width * 0.12,
    height: width * 0.12,
    borderRadius: width * 0.04,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 81, 53, 0.2)",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  objectifEmoji: {
    fontSize: width * 0.055,
  },
  objectifText: {
    flex: 1,
    fontSize: width * 0.04,
    fontWeight: "700",
    color: COLORS.textPrimary,
    letterSpacing: -0.2,
  },

  // Sports avec glassmorphism ultra-réaliste - Responsive et simplifié
  sportsContainer: {
    gap: height * 0.02,
  },
  sportsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: width * 0.025,
    justifyContent: "flex-start",
  },
  sportChip: {
    borderRadius: width * 0.05,
    minWidth: width * 0.28, // Largeur légèrement plus grande pour afficher les noms complets
    marginBottom: height * 0.0025,
  },
  sportChipCommon: {
    marginBottom: height * 0.0025,
    shadowColor: "#FF5135",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  sportChipCommonContainer: {
    borderRadius: width * 0.05,
    minWidth: width * 0.28, // Largeur identique pour la cohérence
  },
  sportGradientOverlay: {
    borderRadius: width * 0.05,
    overflow: "hidden",
  },
  sportChipContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: width * 0.03,
    paddingVertical: height * 0.015,
    gap: width * 0.02,
    minHeight: height * 0.045,
  },
  sportEmoji: {
    fontSize: width * 0.04,
    flexShrink: 0,
  },
  sportName: {
    fontSize: width * 0.032,
    fontWeight: "700",
    color: COLORS.textPrimary,
    flex: 1,
    letterSpacing: -0.1,
    textAlign: "left",
  },
  sportNameCommon: {
    fontSize: width * 0.032,
    fontWeight: "800",
    color: COLORS.white,
    flex: 1,
    letterSpacing: -0.1,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    textAlign: "left",
  },
  moreSportsContainer: {
    borderRadius: width * 0.045,
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.0125,
    alignItems: "center",
    justifyContent: "center",
    marginTop: height * 0.01,
  },
  moreSports: {
    fontSize: width * 0.0375,
    color: COLORS.primary,
    textAlign: "center",
    fontWeight: "600",
    letterSpacing: 0.3,
  },
});
