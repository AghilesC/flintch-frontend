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
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// --- Constants ---
const MIN_HEIGHT_CM = 140;
const MAX_HEIGHT_CM = 210;
const MIN_WEIGHT_KG = 30;
const MAX_WEIGHT_KG = 250;
const PARTICLE_COUNT = 10;

const HEIGHTS = Array.from(
  { length: MAX_HEIGHT_CM - MIN_HEIGHT_CM + 1 },
  (_, i) => MIN_HEIGHT_CM + i
);
const WEIGHTS = Array.from(
  { length: MAX_WEIGHT_KG - MIN_WEIGHT_KG + 1 },
  (_, i) => MIN_WEIGHT_KG + i
);

const ITEM_HEIGHT = 44;
const PICKER_HEIGHT = 220;

// --- Helper Functions ---
function formatHeight(cm: number): string {
  const inchesTotal = cm / 2.54;
  const feet = Math.floor(inchesTotal / 12);
  const inches = Math.round(inchesTotal % 12);
  return `${cm} cm / ${feet}'${inches}"`;
}

function formatWeight(kg: number): string {
  const lbs = Math.round(kg * 2.20462);
  return `${kg} kg / ${lbs} lbs`;
}

const FORMATTED_HEIGHTS = HEIGHTS.map(formatHeight);
const FORMATTED_WEIGHTS = WEIGHTS.map(formatWeight);

// --- Type Definitions ---
type PickerProps = {
  data: number[];
  formattedData: string[];
  selectedValue: string;
  onValueChange: (value: string) => void;
};

type RegisterStepHeightWeightProps = {
  onNext: (data: { height: string; weight: string }) => void;
  height?: string;
  weight?: string;
};

type PickerItemProps = {
  index: number;
  currentIndex: number;
  formattedText: string;
  style: any;
  scrollVelocity: Animated.Value;
};

type ParticleBurstProps = {
  burstKey: number;
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
}: PickerProps) => {
  const flatListRef = useRef<FlatList<number>>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollVelocity = useRef(new Animated.Value(0)).current;
  const initialIndex = useMemo(
    () =>
      Math.max(
        0,
        data.findIndex((item) => `${item}` === selectedValue)
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
        onValueChange(`${data[index]}`);
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
        colors={["rgba(255, 255, 255, 0.03)", "rgba(255, 255, 255, 0.02)"]}
        style={styles.glassBackground}
      />

      {/* CORRECTION: La propriété `opacity` est retirée pour que le cadre soit toujours visible. */}
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
        {/* L'opacité de la lueur est gérée ici, à l'intérieur du conteneur */}
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
          colors={["rgba(255, 255, 255, 0.06)", "rgba(255, 255, 255, 0.0)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 0.8 }}
          style={styles.selectionReflection}
          pointerEvents="none"
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

// --- RegisterStepHeightWeight Component ---
const RegisterStepHeightWeight = ({
  onNext,
  height,
  weight,
}: RegisterStepHeightWeightProps) => {
  const [selectedHeight, setSelectedHeight] = useState(height || "170");
  const [selectedWeight, setSelectedWeight] = useState(weight || "70");

  const heightPickerBounce = useRef(new Animated.Value(1)).current;
  const weightPickerBounce = useRef(new Animated.Value(1)).current;
  const nextButtonScale = useRef(new Animated.Value(1)).current;

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

  const handleHeightChange = useCallback(
    (value: string) => {
      setSelectedHeight(value);
      triggerJiggle(heightPickerBounce);
    },
    [heightPickerBounce]
  );

  const handleWeightChange = useCallback(
    (value: string) => {
      setSelectedWeight(value);
      triggerJiggle(weightPickerBounce);
    },
    [weightPickerBounce]
  );

  const onPressInNext = () => {
    Animated.spring(nextButtonScale, {
      toValue: 0.95,
      tension: 200,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };
  const onPressOutNext = () => {
    Animated.spring(nextButtonScale, {
      toValue: 1,
      tension: 150,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  return (
    <LinearGradient
      colors={["#FFA958", "#FF5135"]}
      start={{ x: 1, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.fullScreenGradient}
    >
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.headline}>On passe aux stats !</Text>
          <Text style={styles.subtitle}>
            Taille, poids… les chiffres qui parlent.
          </Text>
          <View style={styles.pickersContainer}>
            <View style={styles.pickerSection}>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>Ta taille</Text>
              </View>
              <Animated.View
                style={[{ transform: [{ scale: heightPickerBounce }] }]}
              >
                <IOSPicker
                  data={HEIGHTS}
                  formattedData={FORMATTED_HEIGHTS}
                  selectedValue={selectedHeight}
                  onValueChange={handleHeightChange}
                />
              </Animated.View>
            </View>
            <View style={styles.pickerSection}>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>Ton poids</Text>
              </View>
              <Animated.View
                style={[{ transform: [{ scale: weightPickerBounce }] }]}
              >
                <IOSPicker
                  data={WEIGHTS}
                  formattedData={FORMATTED_WEIGHTS}
                  selectedValue={selectedWeight}
                  onValueChange={handleWeightChange}
                />
              </Animated.View>
            </View>
          </View>
        </View>
        <View style={styles.footer}>
          <TouchableOpacity
            onPress={() =>
              onNext({ height: selectedHeight, weight: selectedWeight })
            }
            activeOpacity={1}
            onPressIn={onPressInNext}
            onPressOut={onPressOutNext}
          >
            <Animated.View
              style={[
                styles.nextButton,
                { transform: [{ scale: nextButtonScale }] },
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
          <TouchableOpacity
            onPress={() => onNext({ height: "", weight: "" })}
            style={styles.skipButton}
          >
            <Text style={styles.skipButtonText}>Passer</Text>
          </TouchableOpacity>
        </View>
      </View>
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
    marginBottom: 40,
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
    letterSpacing: -0.5,
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    textAlign: "center",
  },
  subtitle: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 15,
    marginBottom: 28,
    textAlign: "center",
    lineHeight: 22,
  },
  pickersContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 20,
  },
  pickerSection: { flex: 1 },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
  },
  labelContainer: {
    marginBottom: 16,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: "center",
    borderWidth: 0.5,
    borderColor: "rgba(255, 255, 255, 0.12)",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
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
  pickerList: { flex: 1, zIndex: 4 },
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
    backgroundColor: "rgba(255, 255, 255, 0.15)",
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
  nextButtonText: { color: "#fff", fontSize: 18, fontWeight: "700", zIndex: 2 },
  skipButton: { marginTop: 14, alignItems: "center", paddingVertical: 12 },
  skipButtonText: { color: "rgba(255, 255, 255, 0.8)", fontSize: 16 },
  particle: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
  },
});

export default RegisterStepHeightWeight;
