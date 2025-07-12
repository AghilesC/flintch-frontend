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
  KeyboardAvoidingView,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// --- Constants ---
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
const PICKER_HEIGHT = 180;
const PARTICLE_COUNT = 10;

// --- Composants réutilisables ---

// ParticleBurst Component
const ParticleBurst = React.memo(({ burstKey }: { burstKey: number }) => {
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
      Animated.stagger(20, animations).start(() =>
        particles.forEach((p) => p.anim.setValue(0))
      );
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

// PickerItem Component
const PickerItem = React.memo(
  ({ currentIndex, formattedText, style, scrollVelocity }: any) => {
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
              color: isSelected ? "#ffffff" : "rgba(255, 255, 255, 0.6)",
            },
          ]}
        >
          {formattedText}
        </Text>
      </Animated.View>
    );
  }
);

// --- IOSPicker Component ---
const IOSPicker = ({
  data,
  formattedData,
  selectedValue,
  onValueChange,
}: {
  data: (string | number)[];
  formattedData: string[];
  selectedValue: string | number;
  onValueChange: (value: any) => void;
}) => {
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
  const hapticTriggerIndex = useRef(initialIndex);

  const [burstKey, setBurstKey] = useState(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const selectionPopAnim = useRef(new Animated.Value(0)).current;

  const triggerSelectionAnimations = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setBurstKey((key) => key + 1);
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
  }, [pulseAnim, glowAnim, selectionPopAnim]);

  const getItemLayout = useCallback(
    (_data: any, index: number) => ({
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
        onValueChange(data[index]);
        setCurrentIndex(index);
        hapticTriggerIndex.current = index;
        triggerSelectionAnimations();
      }
    },
    [data, onValueChange, triggerSelectionAnimations]
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
            const newIndex = Math.round(
              event.nativeEvent.contentOffset.y / ITEM_HEIGHT
            );

            if (
              newIndex !== hapticTriggerIndex.current &&
              newIndex >= 0 &&
              newIndex < data.length
            ) {
              Haptics.selectionAsync();
              hapticTriggerIndex.current = newIndex;
              setCurrentIndex(newIndex);
            }
          },
        }
      ),
    [scrollY, scrollVelocity, data.length]
  );

  const renderItem = useCallback(
    ({ item, index }: { item: string | number; index: number }) => (
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
        colors={["rgba(255, 255, 255, 0.03)", "rgba(255, 255, 255, 0.02)"]}
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
          colors={["rgba(255, 255, 255, 0.08)", "rgba(255, 255, 255, 0.04)"]}
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
      </Animated.View>
      <LinearGradient
        colors={["rgba(255, 255, 255, 0.06)", "transparent"]}
        style={styles.topFade}
        pointerEvents="none"
      />
      <LinearGradient
        colors={["transparent", "rgba(255, 255, 255, 0.06)"]}
        style={styles.bottomFade}
        pointerEvents="none"
      />
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.toString()}
        onScroll={onScrollHandler}
        onMomentumScrollEnd={onMomentumScrollEnd}
        getItemLayout={getItemLayout}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        contentContainerStyle={styles.listContent}
        initialScrollIndex={initialIndex}
      />
    </View>
  );
};

// --- Composant Principal ---
const RegisterStepNameBirthday = ({ onNext, name = "" }: any) => {
  const [localName, setLocalName] = useState(name);
  const [day, setDay] = useState<number | "">(1);
  const [month, setMonth] = useState<number | "">(1);
  const [year, setYear] = useState<number | "">(YEARS[0]);
  const [errorMsg, setErrorMsg] = useState("");

  const nameAnim = useRef(new Animated.Value(1)).current;
  const dayAnim = useRef(new Animated.Value(1)).current;
  const monthAnim = useRef(new Animated.Value(1)).current;
  const yearAnim = useRef(new Animated.Value(1)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

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

  const onPressInNext = () => {
    Animated.spring(buttonScale, {
      toValue: 0.95,
      tension: 200,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };
  const onPressOutNext = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      tension: 150,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  const isNameValid = useMemo(() => {
    const trimmedName = localName.trim();
    if (trimmedName.length < 1) return false;
    const lettersOnlyRegex = /^[a-zA-ZÀ-ÿ]+$/;
    return lettersOnlyRegex.test(trimmedName);
  }, [localName]);

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
    const d = Number(day),
      m = Number(month),
      y = Number(year);
    if (d && m && y && !isDateValid) {
      setErrorMsg("Tu dois avoir au moins 18 ans pour t’inscrire.");
    } else {
      setErrorMsg("");
    }
  }, [day, month, year, isDateValid]);

  const canNext = isNameValid && isDateValid;
  const birthdate = isDateValid
    ? `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(
        2,
        "0"
      )}`
    : "";

  const daysInMonth = useMemo(() => {
    const y = Number(year) || new Date().getFullYear();
    const m = Number(month) || new Date().getMonth() + 1;
    return new Date(y, m, 0).getDate();
  }, [month, year]);
  const daysList = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <LinearGradient
      // --- 👇 MODIFICATION ICI ---
      colors={["#FF5135", "#FFA958"]}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      // --- 👆 FIN DE LA MODIFICATION ---
      style={styles.fullScreenGradient}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.headline}>Fais ton entrée.</Text>
            <Text style={styles.subtitle}>Dis nous qui débarque.</Text>

            <Text style={styles.label}>Tu t'appelles ?</Text>
            <Animated.View
              style={[
                styles.inputContainer,
                { transform: [{ scale: nameAnim }] },
              ]}
            >
              <TextInput
                style={styles.input}
                value={localName}
                placeholder="Prénom"
                placeholderTextColor="rgba(255,255,255,0.5)"
                onChangeText={setLocalName}
              />
            </Animated.View>

            <Text style={styles.label}>Ton âge ?</Text>
            <View style={styles.pickersContainer}>
              <Animated.View
                style={[
                  styles.pickerSection,
                  { transform: [{ scale: dayAnim }] },
                ]}
              >
                <IOSPicker
                  data={daysList}
                  formattedData={daysList.map(String)}
                  selectedValue={day}
                  onValueChange={(v) => {
                    setDay(v);
                    triggerJiggle(dayAnim);
                  }}
                />
              </Animated.View>
              <Animated.View
                style={[
                  styles.pickerSection,
                  { transform: [{ scale: monthAnim }] },
                ]}
              >
                <IOSPicker
                  data={MONTHS.map((_, i) => i + 1)}
                  formattedData={MONTHS}
                  selectedValue={month}
                  onValueChange={(v) => {
                    setMonth(v);
                    triggerJiggle(monthAnim);
                  }}
                />
              </Animated.View>
              <Animated.View
                style={[
                  styles.pickerSection,
                  { transform: [{ scale: yearAnim }] },
                ]}
              >
                <IOSPicker
                  data={YEARS}
                  formattedData={YEARS.map(String)}
                  selectedValue={year}
                  onValueChange={(v) => {
                    setYear(v);
                    triggerJiggle(yearAnim);
                  }}
                />
              </Animated.View>
            </View>

            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              onPress={() => onNext({ name: localName, birthdate })}
              disabled={!canNext}
              activeOpacity={1}
              onPressIn={onPressInNext}
              onPressOut={onPressOutNext}
            >
              <Animated.View
                style={[
                  styles.nextButton,
                  {
                    transform: [{ scale: buttonScale }],
                    opacity: canNext ? 1 : 0.6,
                  },
                ]}
              >
                <LinearGradient
                  colors={[
                    "rgba(255, 220, 100, 0.18)",
                    "rgba(255, 180, 50, 0.10)",
                    "rgba(255, 200, 75, 0.15)",
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.buttonGlass}
                />
                <LinearGradient
                  colors={[
                    "rgba(255, 220, 100, 0.22)",
                    "rgba(255, 255, 255, 0.0)",
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 0.8 }}
                  style={styles.buttonReflection}
                  pointerEvents="none"
                />
                <Text style={styles.nextButtonText}>Suivant</Text>
              </Animated.View>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  fullScreenGradient: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 20,
    justifyContent: "flex-end",
  },
  content: {
    maxWidth: 400,
    alignSelf: "center",
    width: "100%",
    marginBottom: 20,
  },
  footer: {
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 40,
    paddingTop: 8,
  },
  headline: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
    color: "#fff",
    textAlign: "center",
  },
  subtitle: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 15,
    marginBottom: 28,
    textAlign: "center",
  },
  label: {
    color: "rgba(255,255,255,0.8)",
    fontWeight: "600",
    fontSize: 16,
    marginBottom: 10,
    marginLeft: 8,
  },
  inputContainer: {
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(255,255,255,0.1)",
    marginBottom: 24,
    overflow: "hidden",
  },
  input: {
    padding: 16,
    fontSize: 18,
    color: "#fff",
    fontWeight: "600",
  },
  pickersContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  pickerSection: { flex: 1 },
  pickerContainer: {
    height: PICKER_HEIGHT,
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
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
  listContent: { paddingVertical: PICKER_HEIGHT / 2 - ITEM_HEIGHT / 2 },
  pickerItem: {
    justifyContent: "center",
    alignItems: "center",
    height: ITEM_HEIGHT,
  },
  pickerText: {
    fontSize: 16,
    textAlign: "center",
    fontWeight: "500",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
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
    borderColor: "rgba(255, 255, 255, 0.12)",
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
  sportGlow: {
    position: "absolute",
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    zIndex: -1,
  },
  topFade: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: PICKER_HEIGHT * 0.4,
    zIndex: 6,
    pointerEvents: "none",
  },
  bottomFade: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: PICKER_HEIGHT * 0.4,
    zIndex: 6,
    pointerEvents: "none",
  },
  nextButton: {
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 40,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: "rgba(255, 255, 255, 0.15)",
    position: "relative",
    width: "100%",
    maxWidth: 300,
  },
  buttonGlass: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  buttonReflection: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "60%",
    zIndex: 1,
  },
  nextButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    zIndex: 2,
  },
  particle: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
  },
  errorContainer: {
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    marginBottom: -12,
  },
  errorText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 14,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default RegisterStepNameBirthday;
