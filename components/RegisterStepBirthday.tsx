import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Defs, Ellipse, RadialGradient, Stop } from "react-native-svg";

// --- Constantes ---
const MONTHS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];
const YEARS: number[] = Array.from(
  { length: new Date().getFullYear() - 18 - 1945 + 1 },
  (_, i) => new Date().getFullYear() - 18 - i
);
const ITEM_HEIGHT = 44;
const PICKER_HEIGHT = 220;
const PARTICLE_COUNT = 10;

// --- Type Definitions ---
type PickerProps = {
  data: number[];
  formattedData: string[];
  selectedValue: number | "";
  onValueChange: (value: number) => void;
};

type ParticleBurstProps = {
  burstKey: number;
};

type PickerItemProps = {
  index: number;
  currentIndex: number;
  formattedText: string;
  style: any;
  scrollVelocity: Animated.Value;
};

// --- ParticleBurst Component ---
const ParticleBurst = React.memo(({ burstKey }: ParticleBurstProps) => {
  const particles = useMemo(
    () =>
      Array.from({ length: PARTICLE_COUNT }).map(() => ({
        anim: new Animated.Value(0),
        endX: Math.random() * 80 - 40,
        endY: Math.random() * 80 - 40,
        scale: Math.random() * 0.8 + 0.5,
        duration: Math.random() * 400 + 300,
      })),
    []
  );

  useEffect(() => {
    if (burstKey > 0) {
      const animations = particles.map((p) =>
        Animated.timing(p.anim, {
          toValue: 1,
          duration: p.duration,
          useNativeDriver: true,
        })
      );
      Animated.stagger(20, animations).start(() => {
        particles.forEach((p) => p.anim.setValue(0));
      });
    }
  }, [burstKey, particles]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p, i) => {
        const style = {
          transform: [
            {
              translateX: p.anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, p.endX],
              }),
            },
            {
              translateY: p.anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, p.endY],
              }),
            },
            {
              scale: p.anim.interpolate({
                inputRange: [0, 1],
                outputRange: [p.scale, 0],
              }),
            },
          ],
          opacity: p.anim.interpolate({
            inputRange: [0, 0.1, 1],
            outputRange: [0, 1, 0],
          }),
        };
        return <Animated.View key={i} style={[styles.particle, style]} />;
      })}
    </View>
  );
});

// --- PickerItem Component ---
const PickerItem = React.memo(
  ({ currentIndex, formattedText, style, scrollVelocity }: PickerItemProps) => {
    const isSelected = style.index === currentIndex;
    const perspectiveAnim = scrollVelocity.interpolate({
      inputRange: [-1500, 0, 1500],
      outputRange: ["-10deg", "0deg", "10deg"],
      extrapolate: "clamp",
    });

    return (
      <Animated.View
        style={[
          styles.pickerItem,
          style,
          { transform: [{ perspective: 1000 }, { rotateX: perspectiveAnim }] },
        ]}
      >
        <Text
          style={[
            styles.pickerText,
            {
              transform: [{ scale: isSelected ? 1 : 0.9 }],
              fontWeight: isSelected ? "700" : "500",
              fontSize: isSelected ? 17 : 15,
              color: isSelected ? "#FF5135" : "rgba(0, 0, 0, 0.7)",
            },
          ]}
        >
          {formattedText}
        </Text>
      </Animated.View>
    );
  }
);

// --- Enhanced IOSPicker Component ---
const IOSPicker = ({
  data,
  formattedData,
  selectedValue,
  onValueChange,
}: PickerProps) => {
  const flatListRef = useRef<FlatList<number>>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollVelocity = useRef(new Animated.Value(0)).current;
  const initialIndex = useMemo(
    () =>
      Math.max(
        0,
        data.findIndex((item) => item === selectedValue)
      ),
    [data, selectedValue]
  );

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [burstKey, setBurstKey] = useState(0);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const selectionPopAnim = useRef(new Animated.Value(0)).current;
  const lastHapticTime = useRef(0);

  const triggerSportAnimations = useCallback(() => {
    try {
      Haptics.selectionAsync();
    } catch (e) {
      console.log(e);
    }

    setTimeout(() => {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (e) {
        console.log(e);
      }
    }, 100);

    pulseAnim.setValue(1.15);
    Animated.spring(pulseAnim, {
      toValue: 1,
      tension: 300,
      friction: 5,
      useNativeDriver: true,
    }).start();

    Animated.sequence([
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(glowAnim, {
        toValue: 0,
        duration: 400,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.sequence([
      Animated.timing(selectionPopAnim, {
        toValue: -5,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.spring(selectionPopAnim, {
        toValue: 0,
        tension: 200,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();

    const particleAnimation = Animated.timing(new Animated.Value(0), {
      toValue: 1,
      duration: 50,
      useNativeDriver: true,
    });
    particleAnimation.start(() => setBurstKey((key) => key + 1));
  }, [pulseAnim, glowAnim, selectionPopAnim]);

  const getItemLayout = useCallback(
    (_data: ArrayLike<number> | null | undefined, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    []
  );

  const onMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(event.nativeEvent.contentOffset.y / ITEM_HEIGHT);
      if (index >= 0 && index < data.length) {
        setCurrentIndex(index);
        onValueChange(data[index]);
        triggerSportAnimations();
      }
    },
    [data, onValueChange, triggerSportAnimations]
  );

  const onScrollHandler = useMemo(
    () =>
      Animated.event(
        [
          {
            nativeEvent: {
              contentOffset: { y: scrollY },
              velocity: { y: scrollVelocity },
            },
          },
        ],
        {
          useNativeDriver: false,
          listener: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
            const scrollVelY = event.nativeEvent.velocity?.y ?? 0;
            const now = Date.now();

            if (Math.abs(scrollVelY) > 2 && now - lastHapticTime.current > 70) {
              try {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                lastHapticTime.current = now;
              } catch (e) {
                console.log(e);
              }
            }

            const index = Math.round((scrollY as any)._value / ITEM_HEIGHT);
            if (index !== currentIndex) setCurrentIndex(index);
          },
        }
      ),
    [currentIndex, scrollY, scrollVelocity]
  );

  const renderItem = useCallback(
    ({ item, index }: { item: number; index: number }) => (
      <PickerItem
        index={index}
        currentIndex={currentIndex}
        formattedText={formattedData[index]}
        style={{ height: ITEM_HEIGHT, index }}
        scrollVelocity={scrollVelocity}
      />
    ),
    [currentIndex, formattedData, scrollVelocity]
  );

  return (
    <View style={styles.pickerContainer}>
      <LinearGradient
        colors={["rgba(255, 255, 255, 0.95)", "rgba(255, 255, 255, 0.9)"]}
        style={styles.glassBackground}
      />

      <Animated.View
        style={[
          styles.selectionOverlay,
          {
            transform: [{ scale: pulseAnim }, { translateY: selectionPopAnim }],
          },
        ]}
        pointerEvents="none"
      >
        <ParticleBurst burstKey={burstKey} />
        <LinearGradient
          colors={["rgba(255, 81, 53, 0.15)", "rgba(255, 81, 53, 0.1)"]}
          style={styles.selectionGradient}
        />
        <Animated.View
          style={[
            styles.sportGlow,
            {
              opacity: glowAnim,
              transform: [
                {
                  scale: glowAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.2],
                  }),
                },
              ],
            },
          ]}
        />
        <LinearGradient
          colors={["rgba(255, 255, 255, 0.6)", "rgba(255, 255, 255, 0.0)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 0.8 }}
          style={styles.selectionReflection}
          pointerEvents="none"
        />
      </Animated.View>

      <LinearGradient
        colors={["rgba(255, 255, 255, 0.9)", "transparent"]}
        style={styles.topFade}
        pointerEvents="none"
      />
      <LinearGradient
        colors={["transparent", "rgba(255, 255, 255, 0.9)"]}
        style={styles.bottomFade}
        pointerEvents="none"
      />
      <FlatList
        ref={flatListRef}
        data={data}
        renderItem={renderItem}
        keyExtractor={(item: number) => item.toString()}
        onScroll={onScrollHandler}
        onMomentumScrollEnd={onMomentumScrollEnd}
        getItemLayout={getItemLayout}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        contentContainerStyle={styles.listContent}
        initialScrollIndex={initialIndex}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={11}
      />
    </View>
  );
};

// --- Composant Principal ---
const RegisterStepBirthday = ({
  onNext,
  currentStep = 1,
  totalSteps = 8,
  onBack,
}: any) => {
  const [day, setDay] = useState<number | "">(1);
  const [month, setMonth] = useState<number | "">(1);
  const [year, setYear] = useState<number | "">(YEARS[0]);
  const [errorMsg, setErrorMsg] = useState("");

  // Animations pour chaque picker
  const dayPickerBounce = useRef(new Animated.Value(1)).current;
  const monthPickerBounce = useRef(new Animated.Value(1)).current;
  const yearPickerBounce = useRef(new Animated.Value(1)).current;

  const triggerJiggle = (animValue: Animated.Value) => {
    Animated.sequence([
      Animated.timing(animValue, {
        toValue: 1.05,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(animValue, {
        toValue: 1,
        friction: 1,
        tension: 120,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const daysInMonth = useMemo(() => {
    const y = Number(year) || new Date().getFullYear();
    const m = Number(month) || new Date().getMonth() + 1;
    return new Date(y, m, 0).getDate();
  }, [month, year]);
  const daysList = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const isDateValid = useMemo(() => {
    const d = Number(day),
      m = Number(month),
      y = Number(year);
    if (!d || !m || !y) return false;
    const date = new Date(y, m - 1, d);
    if (
      date.getFullYear() !== y ||
      date.getMonth() !== m - 1 ||
      date.getDate() !== d
    )
      return false;
    let age = new Date().getFullYear() - date.getFullYear();
    const mDiff = new Date().getMonth() - date.getMonth();
    if (mDiff < 0 || (mDiff === 0 && new Date().getDate() < date.getDate()))
      age--;
    return age >= 18;
  }, [day, month, year]);

  useEffect(() => {
    if (Number(day) > daysInMonth) {
      setDay(daysInMonth);
    }
    const d = Number(day),
      m = Number(month),
      y = Number(year);
    if (d && m && y && !isDateValid) {
      setErrorMsg("Tu dois avoir au moins 18 ans pour t'inscrire.");
    } else {
      setErrorMsg("");
    }
  }, [day, month, year, isDateValid, daysInMonth]);

  const birthdate = isDateValid
    ? `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(
        2,
        "0"
      )}`
    : "";

  const handleDayChange = useCallback(
    (value: number) => {
      setDay(value);
      triggerJiggle(dayPickerBounce);
    },
    [dayPickerBounce]
  );

  const handleMonthChange = useCallback(
    (value: number) => {
      setMonth(value);
      triggerJiggle(monthPickerBounce);
    },
    [monthPickerBounce]
  );

  const handleYearChange = useCallback(
    (value: number) => {
      setYear(value);
      triggerJiggle(yearPickerBounce);
    },
    [yearPickerBounce]
  );

  return (
    <View style={styles.container}>
      {/* Effet fumée organique en haut à droite */}
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

          {/* Plusieurs ellipses pour créer l'effet fumée étendu */}
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
        <View style={styles.content}>
          <Text style={styles.subtitle}>Ari, un bien joli prénom.</Text>
          <Text style={styles.headline}>C'est quand ton anniversaire?</Text>
          <View style={styles.dateContainer}>
            <View style={styles.pickerSection}>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>Jour</Text>
              </View>
              <Animated.View
                style={[{ transform: [{ scale: dayPickerBounce }] }]}
              >
                <IOSPicker
                  data={daysList}
                  formattedData={daysList.map(String)}
                  selectedValue={day}
                  onValueChange={handleDayChange}
                />
              </Animated.View>
            </View>
            <View style={styles.pickerSection}>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>Mois</Text>
              </View>
              <Animated.View
                style={[{ transform: [{ scale: monthPickerBounce }] }]}
              >
                <IOSPicker
                  data={MONTHS.map((_, i) => i + 1)}
                  formattedData={MONTHS}
                  selectedValue={month}
                  onValueChange={handleMonthChange}
                />
              </Animated.View>
            </View>
            <View style={styles.pickerSection}>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>Année</Text>
              </View>
              <Animated.View
                style={[{ transform: [{ scale: yearPickerBounce }] }]}
              >
                <IOSPicker
                  data={YEARS}
                  formattedData={YEARS.map(String)}
                  selectedValue={year}
                  onValueChange={handleYearChange}
                />
              </Animated.View>
            </View>
          </View>
          {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.nextButton, { opacity: isDateValid ? 1 : 0.5 }]}
            onPress={() => onNext({ birthdate })}
            disabled={!isDateValid}
          >
            <Ionicons name="arrow-forward" size={24} color="#FF5135" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// --- Styles ---
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
    borderColor: "rgba(255, 81, 53, 0.4)",
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
    paddingHorizontal: 24,
  },
  content: {
    maxWidth: 380,
    alignSelf: "center",
    width: "100%",
    paddingTop: "5%",
  },
  headline: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 18,
    color: "#FFFFFF",
    textAlign: "center",
    fontFamily: "Satoshi",
  },
  subtitle: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 15,
    marginBottom: 8,
    textAlign: "center",
    lineHeight: 22,
    fontFamily: "Satoshi",
  },
  dateContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 10,
  },
  pickerSection: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
    fontFamily: "Satoshi",
  },
  labelContainer: {
    marginBottom: 16,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.4)",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  pickerContainer: {
    height: PICKER_HEIGHT,
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  glassBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    zIndex: 0,
  },
  listContent: {
    paddingVertical: PICKER_HEIGHT / 2 - ITEM_HEIGHT / 2,
  },
  pickerItem: {
    justifyContent: "center",
    alignItems: "center",
    height: ITEM_HEIGHT,
  },
  pickerText: {
    fontSize: 14,
    textAlign: "center",
    fontWeight: "500",
    fontFamily: "Satoshi",
  },
  selectionOverlay: {
    position: "absolute",
    top: "50%",
    left: 6,
    right: 6,
    height: ITEM_HEIGHT,
    marginTop: -ITEM_HEIGHT / 2,
    borderRadius: 12,
    zIndex: 5,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: "rgba(255, 81, 53, 0.4)",
    pointerEvents: "none",
  },
  selectionGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
    zIndex: 0,
  },
  selectionReflection: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "60%",
    borderRadius: 12,
    zIndex: 1,
  },
  sportGlow: {
    position: "absolute",
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 14,
    backgroundColor: "rgba(255, 81, 53, 0.2)",
    zIndex: -1,
  },
  topFade: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 70,
    zIndex: 6,
    pointerEvents: "none",
  },
  bottomFade: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    zIndex: 6,
    pointerEvents: "none",
  },
  errorText: {
    color: "#FFFFFF",
    fontSize: 14,
    marginTop: 15,
    textAlign: "center",
    fontFamily: "Satoshi",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  footer: {
    justifyContent: "flex-end",
    alignItems: "flex-end",
    paddingBottom: 40,
    paddingTop: 20,
    paddingHorizontal: 24,
  },
  nextButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  particle: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255, 81, 53, 0.9)",
  },
});

export default RegisterStepBirthday;
