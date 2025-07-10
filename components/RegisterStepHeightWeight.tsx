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

// Génére 140 à 210 cm → pieds/pouces inclus
const HEIGHTS = Array.from({ length: 71 }, (_, i) => 140 + i); // 140 à 210 cm
const WEIGHTS = Array.from({ length: 221 }, (_, i) => 30 + i); // 30 à 250 kg

const ITEM_HEIGHT = 44;
const PICKER_HEIGHT = 200;

function formatHeight(cm: number) {
  const inchesTotal = cm / 2.54;
  const feet = Math.floor(inchesTotal / 12);
  const inches = Math.round(inchesTotal % 12);
  return `${cm} cm / ${feet}'${inches}"`;
}

function formatWeight(kg: number) {
  const lbs = Math.round(kg * 2.20462);
  return `${kg} kg / ${lbs} lbs`;
}

// Pré-calculer tous les textes formatés pour éviter les re-calculs
const FORMATTED_HEIGHTS = HEIGHTS.map(formatHeight);
const FORMATTED_WEIGHTS = WEIGHTS.map(formatWeight);

type PickerProps = {
  data: number[];
  formattedData: string[];
  selectedValue: string;
  onValueChange: (value: string) => void;
};

// Composant PickerItem optimisé avec React.memo
const PickerItem = React.memo(
  ({
    item,
    index,
    currentIndex,
    formattedText,
    style,
  }: {
    item: number;
    index: number;
    currentIndex: number;
    formattedText: string;
    style: any;
  }) => {
    const distance = Math.abs(index - currentIndex);
    const opacity = Math.max(0.3, 1 - distance * 0.2);
    const scale = Math.max(0.85, 1 - distance * 0.06);
    const isSelected = index === currentIndex;

    return (
      <Animated.View style={[styles.pickerItem, style]}>
        <Text
          style={[
            styles.pickerText,
            {
              opacity,
              transform: [{ scale }],
              fontWeight: isSelected ? "700" : "500",
              fontSize: isSelected ? 20 : 17,
              color: isSelected ? "#ffffff" : "rgba(255, 255, 255, 0.7)",
            },
          ]}
        >
          {formattedText}
        </Text>
      </Animated.View>
    );
  }
);

const IOSPicker = ({
  data,
  formattedData,
  selectedValue,
  onValueChange,
}: PickerProps) => {
  const flatListRef = useRef<FlatList>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const initialIndex = useMemo(
    () =>
      Math.max(
        0,
        data.findIndex((item) => `${item}` === selectedValue)
      ),
    [data, selectedValue]
  );
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const isInitialized = useRef(false);

  // Pré-calculer le layout pour tous les items
  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    []
  );

  // KeyExtractor optimisé
  const keyExtractor = useCallback((item: number) => item.toString(), []);

  // Centrage initial ultra-optimisé
  useEffect(() => {
    if (!isInitialized.current && flatListRef.current && initialIndex >= 0) {
      // Utiliser requestAnimationFrame pour synchroniser avec le rendu
      requestAnimationFrame(() => {
        flatListRef.current?.scrollToOffset({
          offset: initialIndex * ITEM_HEIGHT,
          animated: false,
        });
        setCurrentIndex(initialIndex);
        isInitialized.current = true;
      });
    }
  }, [initialIndex]);

  // Optimisation du scroll avec debouncing
  const onScrollHandler = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
        useNativeDriver: false, // Nécessaire pour contentOffset
        listener: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
          const offsetY = event.nativeEvent.contentOffset.y;
          const index = Math.round(offsetY / ITEM_HEIGHT);

          if (index !== currentIndex && index >= 0 && index < data.length) {
            setCurrentIndex(index);
            onValueChange(`${data[index]}`);
          }
        },
      }),
    [currentIndex, data, onValueChange, scrollY]
  );

  // Snap optimisé après scroll
  const onMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetY = event.nativeEvent.contentOffset.y;
      const index = Math.round(offsetY / ITEM_HEIGHT);
      const targetOffset = index * ITEM_HEIGHT;

      // Snap seulement si nécessaire
      if (Math.abs(offsetY - targetOffset) > 2) {
        flatListRef.current?.scrollToOffset({
          offset: targetOffset,
          animated: true,
        });
      }

      // Mise à jour finale
      if (index >= 0 && index < data.length && index !== currentIndex) {
        setCurrentIndex(index);
        onValueChange(`${data[index]}`);
      }
    },
    [data, onValueChange, currentIndex]
  );

  // Snap optimisé après drag
  const onScrollEndDrag = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetY = event.nativeEvent.contentOffset.y;
      const index = Math.round(offsetY / ITEM_HEIGHT);
      const targetOffset = index * ITEM_HEIGHT;

      // Snap précis avec animation fluide
      if (Math.abs(offsetY - targetOffset) > 1) {
        flatListRef.current?.scrollToOffset({
          offset: targetOffset,
          animated: true,
        });
      }
    },
    []
  );

  // RenderItem ultra-optimisé
  const renderItem = useCallback(
    ({ item, index }: { item: number; index: number }) => (
      <PickerItem
        item={item}
        index={index}
        currentIndex={currentIndex}
        formattedText={formattedData[index]}
        style={{ height: ITEM_HEIGHT }}
      />
    ),
    [currentIndex, formattedData]
  );

  return (
    <View style={styles.pickerContainer}>
      {/* Couche de fond glassmorphism */}
      <LinearGradient
        colors={[
          "rgba(255, 255, 255, 0.06)",
          "rgba(255, 255, 255, 0.04)",
          "rgba(255, 255, 255, 0.05)",
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.glassBackground}
      />

      {/* Reflet supérieur subtil */}
      <LinearGradient
        colors={[
          "rgba(255, 255, 255, 0.08)",
          "rgba(255, 255, 255, 0.01)",
          "rgba(255, 255, 255, 0.0)",
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.8 }}
        style={styles.glassReflection}
        pointerEvents="none"
      />

      {/* Bordure avec gradient */}
      <LinearGradient
        colors={[
          "rgba(255, 255, 255, 0.18)",
          "rgba(255, 255, 255, 0.08)",
          "rgba(255, 255, 255, 0.12)",
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.glassBorder}
      />
      <View style={styles.glassBorderInner} />

      {/* Selection Overlay premium */}
      <View style={styles.selectionOverlay}>
        <LinearGradient
          colors={[
            "rgba(255, 255, 255, 0.12)",
            "rgba(255, 255, 255, 0.07)",
            "rgba(255, 255, 255, 0.09)",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.selectionGradient}
        />
        {/* Reflet interne selection */}
        <LinearGradient
          colors={["rgba(255, 255, 255, 0.12)", "rgba(255, 255, 255, 0.0)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 0.7 }}
          style={styles.selectionReflection}
          pointerEvents="none"
        />
      </View>

      {/* Top Gradient Fade enhanced */}
      <LinearGradient
        colors={[
          "rgba(255, 255, 255, 0.10)",
          "rgba(255, 255, 255, 0.03)",
          "rgba(255, 255, 255, 0)",
        ]}
        style={styles.topFade}
        pointerEvents="none"
      />

      {/* Bottom Gradient Fade enhanced */}
      <LinearGradient
        colors={[
          "rgba(255, 255, 255, 0)",
          "rgba(255, 255, 255, 0.03)",
          "rgba(255, 255, 255, 0.10)",
        ]}
        style={styles.bottomFade}
        pointerEvents="none"
      />

      <FlatList
        ref={flatListRef}
        data={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        onScroll={onScrollHandler}
        onMomentumScrollEnd={onMomentumScrollEnd}
        onScrollEndDrag={onScrollEndDrag}
        scrollEventThrottle={8}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        snapToAlignment="start"
        decelerationRate={0.95}
        contentContainerStyle={styles.listContent}
        style={styles.pickerList}
        initialScrollIndex={initialIndex >= 0 ? initialIndex : 0}
        removeClippedSubviews={true}
        maxToRenderPerBatch={8}
        updateCellsBatchingPeriod={50}
        windowSize={7}
        initialNumToRender={5}
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
          autoscrollToTopThreshold: 10,
        }}
        disableVirtualization={false}
        legacyImplementation={false}
      />
    </View>
  );
};

type Props = {
  onNext: (data: { height: string; weight: string }) => void;
  height?: string;
  weight?: string;
};

const RegisterStepHeightWeight = ({ onNext, height, weight }: Props) => {
  const [selectedHeight, setSelectedHeight] = useState(height || "170");
  const [selectedWeight, setSelectedWeight] = useState(weight || "70");

  return (
    <LinearGradient
      colors={["#FFA958", "#FF5135"]}
      start={{ x: 1, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{ flex: 1 }}
    >
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.headline}>Maintenant, parlons de toi</Text>
          <Text style={styles.subtitle}>
            Occupons-nous d'abord des infos de base.
            {"\n"}Nous pourrons ensuite nous concentrer sur ce qui est vraiment
            important.
          </Text>

          <View style={styles.pickersContainer}>
            <View style={styles.pickerSection}>
              <View style={styles.labelContainer}>
                <LinearGradient
                  colors={[
                    "rgba(255, 255, 255, 0.09)",
                    "rgba(255, 255, 255, 0.05)",
                    "rgba(255, 255, 255, 0.07)",
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.labelGlass}
                />
                <LinearGradient
                  colors={[
                    "rgba(255, 255, 255, 0.10)",
                    "rgba(255, 255, 255, 0.0)",
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 0.8 }}
                  style={styles.labelReflection}
                  pointerEvents="none"
                />
                <Text style={styles.label}>Ta taille</Text>
              </View>
              <IOSPicker
                data={HEIGHTS}
                formattedData={FORMATTED_HEIGHTS}
                selectedValue={selectedHeight}
                onValueChange={setSelectedHeight}
              />
            </View>

            <View style={styles.pickerSection}>
              <View style={styles.labelContainer}>
                <LinearGradient
                  colors={[
                    "rgba(255, 255, 255, 0.09)",
                    "rgba(255, 255, 255, 0.05)",
                    "rgba(255, 255, 255, 0.07)",
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.labelGlass}
                />
                <LinearGradient
                  colors={[
                    "rgba(255, 255, 255, 0.10)",
                    "rgba(255, 255, 255, 0.0)",
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 0.8 }}
                  style={styles.labelReflection}
                  pointerEvents="none"
                />
                <Text style={styles.label}>Ton poids</Text>
              </View>
              <IOSPicker
                data={WEIGHTS}
                formattedData={FORMATTED_WEIGHTS}
                selectedValue={selectedWeight}
                onValueChange={setSelectedWeight}
              />
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            onPress={() =>
              onNext({ height: selectedHeight, weight: selectedWeight })
            }
            style={styles.nextButton}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[
                "rgba(255, 255, 255, 0.10)",
                "rgba(255, 255, 255, 0.06)",
                "rgba(255, 255, 255, 0.08)",
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.buttonGlass}
            />
            <LinearGradient
              colors={["rgba(255, 255, 255, 0.12)", "rgba(255, 255, 255, 0.0)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 0.7 }}
              style={styles.buttonReflection}
              pointerEvents="none"
            />
            <Text style={styles.nextButtonText}>Suivant</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    maxWidth: 400,
    alignSelf: "center",
    width: "100%",
  },
  footer: {
    paddingTop: 20,
    maxWidth: 400,
    alignSelf: "center",
    width: "100%",
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
    marginBottom: 32,
    textAlign: "center",
    lineHeight: 22,
  },
  pickersContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 20,
  },
  pickerSection: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    zIndex: 3,
  },
  labelContainer: {
    marginBottom: 16,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    position: "relative",
    overflow: "hidden",
    alignSelf: "center",
    borderWidth: 0.5,
    borderColor: "rgba(255, 255, 255, 0.20)",
    shadowColor: "rgba(0, 0, 0, 0.06)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 3,
  },
  labelGlass: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
    zIndex: 0,
  },
  labelReflection: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "70%",
    borderRadius: 12,
    zIndex: 1,
  },
  // 🔥 GLASSMORPHISM NATIF PREMIUM 🔥
  pickerContainer: {
    height: PICKER_HEIGHT,
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
    shadowColor: "rgba(0, 0, 0, 0.1)",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 15,
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
  glassReflection: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "50%",
    borderRadius: 20,
    zIndex: 1,
  },
  glassBorder: {
    position: "absolute",
    top: -0.5,
    left: -0.5,
    right: -0.5,
    bottom: -0.5,
    borderRadius: 20.5,
    padding: 0.5,
    zIndex: 2,
  },
  glassBorderInner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: "rgba(255, 255, 255, 0.12)",
    zIndex: 2,
  },
  pickerList: {
    flex: 1,
    zIndex: 4,
  },
  listContent: {
    paddingVertical: PICKER_HEIGHT / 2 - ITEM_HEIGHT / 2,
  },
  pickerItem: {
    justifyContent: "center",
    alignItems: "center",
  },
  pickerText: {
    fontSize: 18,
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
    borderColor: "rgba(255, 255, 255, 0.18)",
    shadowColor: "rgba(255, 255, 255, 0.10)",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 4,
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
  // Bouton glassmorphism premium
  nextButton: {
    borderRadius: 22,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: "rgba(255, 255, 255, 0.4)",
    shadowColor: "rgba(0, 0, 0, 0.1)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 8,
    position: "relative",
  },
  buttonGlass: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 22,
    zIndex: 0,
  },
  buttonReflection: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "60%",
    borderRadius: 22,
    zIndex: 1,
  },
  nextButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    zIndex: 2,
  },
  skipButton: {
    marginTop: 16,
    alignItems: "center",
    paddingVertical: 8,
  },
  skipButtonText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 16,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
});

export default RegisterStepHeightWeight;
