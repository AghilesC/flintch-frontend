// context/AppContext.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import CacheManager from "../../utils/CacheManager";

interface User {
  id: number;
  name: string;
  email: string;
  profile_photo?: string;
  photos?: string[]; // ✅ AJOUT: Array de photos
  gender?: string;
  fitness_level?: string;
  goals?: string[]; // ✅ Optional array
  sports?: string[]; // ✅ Optional array
  availability?: any;
  birthdate?: string;
  bio?: string; // ✅ AJOUT: Bio pour l'aperçu
  // autres propriétés...
}

interface Match {
  id: number;
  user: {
    id: number;
    name: string;
    email: string;
    photos: string[];
  };
  matched_at: string;
  last_message?: any;
  unread_count?: number;
}

interface AppState {
  user: User | null;
  matches: Match[];
  notifications: {
    chat: number;
    matches: number;
    total: number;
  };
  loading: {
    user: boolean;
    matches: boolean;
    initial: boolean;
  };
  lastFetch: {
    user: number;
    matches: number;
  };
  initialized: boolean;
}

type AppAction =
  | { type: "SET_USER"; payload: User | null }
  | { type: "SET_MATCHES"; payload: Match[] }
  | { type: "SET_NOTIFICATIONS"; payload: AppState["notifications"] }
  | {
      type: "SET_LOADING";
      payload: { key: keyof AppState["loading"]; value: boolean };
    }
  | { type: "UPDATE_LAST_FETCH"; payload: { key: keyof AppState["lastFetch"] } }
  | { type: "MARK_CONVERSATION_READ"; payload: number }
  | { type: "ADD_MESSAGE"; payload: { matchId: number; message: any } }
  | { type: "SET_INITIALIZED"; payload: boolean };

const initialState: AppState = {
  user: null,
  matches: [],
  notifications: { chat: 0, matches: 0, total: 0 },
  loading: { user: false, matches: false, initial: true },
  lastFetch: { user: 0, matches: 0 },
  initialized: false,
};

// 🔧 Fonction pour normaliser les données utilisateur
const normalizeUserData = (rawUserData: any): User => {
  const normalizeStringArray = (data: any): string[] => {
    if (!data) return [];

    if (Array.isArray(data)) {
      return data.filter(
        (item: any) => item && typeof item === "string" && item.trim() !== ""
      );
    }

    if (typeof data === "string") {
      try {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (item: any) =>
              item && typeof item === "string" && item.trim() !== ""
          );
        }
      } catch {
        return data
          .split(",")
          .map((s: string) => s.trim())
          .filter((s: string) => s !== "");
      }
    }

    return [];
  };

  // ✅ NORMALISATION DES PHOTOS
  const normalizePhotos = (
    photosData: any,
    profilePhoto?: string
  ): string[] => {
    let photos: string[] = [];

    // Si on a un array de photos
    if (Array.isArray(photosData)) {
      photos = photosData.filter(
        (photo: any) =>
          photo && typeof photo === "string" && photo.trim() !== ""
      );
    }
    // Si c'est une string JSON
    else if (typeof photosData === "string" && photosData.trim() !== "") {
      try {
        const parsed = JSON.parse(photosData);
        if (Array.isArray(parsed)) {
          photos = parsed.filter(
            (photo: any) =>
              photo && typeof photo === "string" && photo.trim() !== ""
          );
        }
      } catch {
        // Si c'est pas du JSON, traiter comme une seule photo
        photos = [photosData.trim()];
      }
    }

    // Ajouter profile_photo en première position si elle existe et n'est pas déjà dans photos
    if (profilePhoto && profilePhoto.trim() !== "") {
      if (!photos.includes(profilePhoto)) {
        photos.unshift(profilePhoto);
      }
    }

    return photos;
  };

  const normalized = {
    ...rawUserData,
    sports: normalizeStringArray(rawUserData.sports),
    goals: normalizeStringArray(rawUserData.goals),
    photos: normalizePhotos(rawUserData.photos, rawUserData.profile_photo), // ✅ NORMALISATION PHOTOS
  };

  console.log("🔧 User data normalized:", {
    originalSports: rawUserData.sports,
    normalizedSports: normalized.sports,
    originalGoals: rawUserData.goals,
    normalizedGoals: normalized.goals,
    originalPhotos: rawUserData.photos,
    profilePhoto: rawUserData.profile_photo,
    normalizedPhotos: normalized.photos, // ✅ LOG PHOTOS
  });

  return normalized;
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_USER":
      return { ...state, user: action.payload };

    case "SET_MATCHES":
      // Calculer automatiquement les notifications
      let totalUnread = 0;
      let newMatches = 0;

      action.payload.forEach((match) => {
        if (match.unread_count) totalUnread += match.unread_count;
        if (!match.last_message) newMatches += 1;
      });

      return {
        ...state,
        matches: action.payload,
        notifications: {
          chat: totalUnread,
          matches: newMatches,
          total: totalUnread + newMatches,
        },
      };

    case "SET_NOTIFICATIONS":
      return { ...state, notifications: action.payload };

    case "SET_LOADING":
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.payload.key]: action.payload.value,
        },
      };

    case "UPDATE_LAST_FETCH":
      return {
        ...state,
        lastFetch: { ...state.lastFetch, [action.payload.key]: Date.now() },
      };

    case "MARK_CONVERSATION_READ":
      return {
        ...state,
        matches: state.matches.map((match) =>
          match.id === action.payload ? { ...match, unread_count: 0 } : match
        ),
      };

    case "ADD_MESSAGE":
      return {
        ...state,
        matches: state.matches.map((match) =>
          match.id === action.payload.matchId
            ? { ...match, last_message: action.payload.message }
            : match
        ),
      };

    case "SET_INITIALIZED":
      return { ...state, initialized: action.payload };

    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  fetchUser: (force?: boolean) => Promise<void>;
  fetchMatches: (force?: boolean) => Promise<void>;
  markConversationAsRead: (matchId: number) => Promise<void>;
  refreshData: () => Promise<void>;
  forceRefreshAll: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const initializationRef = useRef(false);
  // ✅ Fix TypeScript : en React Native, setInterval retourne un number
  const backgroundRefreshRef = useRef<number | null>(null);

  // 🚀 FETCH USER ULTRA OPTIMISÉ - Cache mémoire priority + PHOTOS
  const fetchUser = useCallback(
    async (force = false) => {
      const now = Date.now();
      const MEMORY_CACHE_DURATION = 2 * 60 * 1000; // 2 minutes en mémoire
      const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes total

      // ⚡ CACHE MÉMOIRE EN PREMIER (ultra rapide)
      if (!force) {
        const memoryUser = CacheManager.getMemoryCache("current_user");
        if (memoryUser) {
          console.log("⚡ User: MEMORY cache hit (instant)");
          dispatch({ type: "SET_USER", payload: memoryUser });
          dispatch({ type: "UPDATE_LAST_FETCH", payload: { key: "user" } });
          return;
        }
      }

      // Si pas forcé et récent, on skip complètement
      if (!force && now - state.lastFetch.user < CACHE_DURATION) {
        console.log("🚀 User: Recent data, skipping fetch");
        return;
      }

      // ✅ Cache persistant en second
      if (!force) {
        const cachedUser = await CacheManager.getPersistentCache(
          "current_user"
        );
        if (cachedUser) {
          console.log("📦 User: Persistent cache hit");
          dispatch({ type: "SET_USER", payload: cachedUser });
          dispatch({ type: "UPDATE_LAST_FETCH", payload: { key: "user" } });

          // ⚡ Remettre en cache mémoire
          CacheManager.setMemoryCache(
            "current_user",
            cachedUser,
            MEMORY_CACHE_DURATION
          );
          return;
        }
      }

      try {
        console.log("🌐 User: Fetching from API");
        dispatch({
          type: "SET_LOADING",
          payload: { key: "user", value: true },
        });

        const token = await AsyncStorage.getItem("token");
        if (!token) {
          console.log("❌ No token found");
          return;
        }

        // ✅ FETCH USER DATA ET PHOTOS EN PARALLÈLE
        const [userResponse, photosResponse] = await Promise.all([
          axios.get("http://localhost:8000/api/me", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          // ✅ UTILISER L'ENDPOINT EXISTANT /photos
          axios
            .get("http://localhost:8000/api/photos", {
              headers: { Authorization: `Bearer ${token}` },
            })
            .catch(async (error) => {
              console.warn("⚠️ Photos endpoint error:", error.message);
              return { data: [] }; // Fallback en cas d'erreur
            }),
        ]);

        const rawUserData = userResponse.data;
        const photosData = photosResponse.data;

        console.log("🌐 Raw user data from API:", rawUserData);
        console.log("📸 Photos data from API:", photosData);

        // ✅ TRAITER LES PHOTOS SELON LA STRUCTURE DE VOTRE UserPhotoController
        let photoUrls = [];

        // Votre contrôleur retourne { status: true, photos: [...] }
        if (
          photosData &&
          photosData.status &&
          Array.isArray(photosData.photos)
        ) {
          photoUrls = photosData.photos
            .map((photo) => {
              // Votre structure : { id, is_main, url }
              return photo.url;
            })
            .filter(Boolean);
        }

        console.log("🔄 Processed photo URLs:", photoUrls);

        // ✅ COMBINER USER DATA AVEC PHOTOS
        const userDataWithPhotos = {
          ...rawUserData,
          photos: photoUrls,
        };

        // ✅ NORMALISER LES DONNÉES (inclut maintenant les photos)
        const normalizedUserData = normalizeUserData(userDataWithPhotos);

        dispatch({ type: "SET_USER", payload: normalizedUserData });
        dispatch({ type: "UPDATE_LAST_FETCH", payload: { key: "user" } });

        // ⚡ DOUBLE CACHE: mémoire + persistant avec données normalisées
        CacheManager.setMemoryCache(
          "current_user",
          normalizedUserData,
          MEMORY_CACHE_DURATION
        );
        await CacheManager.setPersistentCache(
          "current_user",
          normalizedUserData,
          30 * 60 * 1000 // 30min persistant
        );

        console.log(
          "✅ User data loaded with photos, normalized and double cached"
        );
      } catch (error) {
        console.error("❌ Error fetching user:", error);
      } finally {
        dispatch({
          type: "SET_LOADING",
          payload: { key: "user", value: false },
        });
      }
    },
    [state.lastFetch.user]
  );

  // 🚀 FETCH MATCHES ULTRA OPTIMISÉ - Cache mémoire priority
  const fetchMatches = useCallback(
    async (force = false) => {
      const now = Date.now();
      const MEMORY_CACHE_DURATION = 90 * 1000; // 90 secondes en mémoire
      const CACHE_DURATION = 3 * 60 * 1000; // 3 minutes total

      // ⚡ CACHE MÉMOIRE EN PREMIER (ultra rapide)
      if (!force) {
        const memoryMatches = CacheManager.getMemoryCache("user_matches");
        if (memoryMatches) {
          console.log("⚡ Matches: MEMORY cache hit (instant)");
          dispatch({ type: "SET_MATCHES", payload: memoryMatches });
          dispatch({ type: "UPDATE_LAST_FETCH", payload: { key: "matches" } });
          return;
        }
      }

      // Si pas forcé et récent, on skip
      if (!force && now - state.lastFetch.matches < CACHE_DURATION) {
        console.log("🚀 Matches: Recent data, skipping fetch");
        return;
      }

      // ✅ Cache persistant en second
      if (!force) {
        const cachedMatches = await CacheManager.getPersistentCache(
          "user_matches"
        );
        if (cachedMatches) {
          console.log("📦 Matches: Persistent cache hit");
          dispatch({ type: "SET_MATCHES", payload: cachedMatches });
          dispatch({ type: "UPDATE_LAST_FETCH", payload: { key: "matches" } });

          // ⚡ Remettre en cache mémoire
          CacheManager.setMemoryCache(
            "user_matches",
            cachedMatches,
            MEMORY_CACHE_DURATION
          );
          return;
        }
      }

      try {
        console.log("🌐 Matches: Fetching from API");
        dispatch({
          type: "SET_LOADING",
          payload: { key: "matches", value: true },
        });

        const token = await AsyncStorage.getItem("token");
        if (!token) {
          console.log("❌ No token found for matches");
          return;
        }

        const response = await axios.get(
          "http://localhost:8000/api/matches?include_messages=true",
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const matchesData = response.data;
        dispatch({ type: "SET_MATCHES", payload: matchesData });
        dispatch({ type: "UPDATE_LAST_FETCH", payload: { key: "matches" } });

        // ⚡ DOUBLE CACHE: mémoire + persistant
        CacheManager.setMemoryCache(
          "user_matches",
          matchesData,
          MEMORY_CACHE_DURATION
        );
        await CacheManager.setPersistentCache(
          "user_matches",
          matchesData,
          5 * 60 * 1000 // 5min persistant
        );

        console.log("✅ Matches data loaded and double cached");
      } catch (error) {
        console.error("❌ Error fetching matches:", error);
      } finally {
        dispatch({
          type: "SET_LOADING",
          payload: { key: "matches", value: false },
        });
      }
    },
    [state.lastFetch.matches]
  );

  // 🚀 MARQUER CONVERSATION COMME LUE
  const markConversationAsRead = useCallback(
    async (matchId: number) => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) return;

        // Optimistic update
        dispatch({ type: "MARK_CONVERSATION_READ", payload: matchId });

        // API call
        await axios.post(
          `http://localhost:8000/api/matches/${matchId}/mark-read`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );

        // ⚡ Invalider les caches mémoire ET persistant
        CacheManager.setMemoryCache("user_matches", null, 0); // Expire immédiatement
        await CacheManager.invalidateCache("user_matches");
      } catch (error) {
        console.error("❌ Error marking as read:", error);
        // Re-fetch en cas d'erreur
        fetchMatches(true);
      }
    },
    [fetchMatches]
  );

  // 🚀 REFRESH MANUEL (pour pull-to-refresh)
  const refreshData = useCallback(async () => {
    console.log("🔄 Manual refresh triggered");

    // ⚡ Invalider cache mémoire d'abord
    CacheManager.setMemoryCache("current_user", null, 0);
    CacheManager.setMemoryCache("user_matches", null, 0);

    await Promise.all([fetchUser(true), fetchMatches(true)]);
  }, [fetchUser, fetchMatches]);

  // 🚀 FORCE REFRESH ALL (pour actions spéciales)
  const forceRefreshAll = useCallback(async () => {
    console.log("🔥 Force refresh ALL data");

    // ⚡ Clear TOUT
    await CacheManager.clearAllCache();
    await Promise.all([fetchUser(true), fetchMatches(true)]);
  }, [fetchUser, fetchMatches]);

  // 🚀 INITIALISATION OPTIMISÉE - UNE SEULE FOIS
  useEffect(() => {
    if (initializationRef.current) return;
    initializationRef.current = true;

    const initializeApp = async () => {
      console.log("🚀 App initialization started (cache priority)");
      dispatch({
        type: "SET_LOADING",
        payload: { key: "initial", value: true },
      });

      try {
        // ⚡ Charge en parallèle avec priorité cache mémoire
        await Promise.all([
          fetchUser(), // Cache mémoire -> persistant -> API
          fetchMatches(), // Cache mémoire -> persistant -> API
        ]);

        console.log("✅ App initialization completed (ultra-fast)");
        dispatch({ type: "SET_INITIALIZED", payload: true });
      } catch (error) {
        console.error("❌ App initialization failed:", error);
      } finally {
        dispatch({
          type: "SET_LOADING",
          payload: { key: "initial", value: false },
        });
      }
    };

    initializeApp();
  }, []);

  // 🚀 BACKGROUND REFRESH PLUS INTELLIGENT
  useEffect(() => {
    if (!state.initialized) return;

    console.log("⏰ Setting up smart background refresh (20 min interval)");

    // ✅ Fix TypeScript : cast explicite
    backgroundRefreshRef.current = setInterval(async () => {
      console.log("🔄 Background refresh (cache-first)");

      // ⚡ Utilise le cache si encore valide, sinon API
      await Promise.all([
        fetchUser(), // Cache-first
        fetchMatches(), // Cache-first
      ]);
    }, 20 * 60 * 1000) as unknown as number; // ✅ Cast pour React Native

    return () => {
      if (backgroundRefreshRef.current) {
        clearInterval(backgroundRefreshRef.current);
        backgroundRefreshRef.current = null;
        console.log("⏹️ Background refresh stopped");
      }
    };
  }, [state.initialized, fetchUser, fetchMatches]);

  // 🚀 CLEANUP AU DÉMONTAGE
  useEffect(() => {
    return () => {
      if (backgroundRefreshRef.current) {
        clearInterval(backgroundRefreshRef.current);
        backgroundRefreshRef.current = null;
      }
    };
  }, []);

  return (
    <AppContext.Provider
      value={{
        state,
        fetchUser,
        fetchMatches,
        markConversationAsRead,
        refreshData,
        forceRefreshAll,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
}

// 🚀 HOOK UTILITAIRE POUR REFRESH CONTROL
export function useRefreshControl() {
  const [refreshing, setRefreshing] = useState<boolean>(false); // ✅ Fix avec useState direct
  const { refreshData } = useApp();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshData();
    } finally {
      setRefreshing(false);
    }
  }, [refreshData]);

  return { refreshing, onRefresh };
}
