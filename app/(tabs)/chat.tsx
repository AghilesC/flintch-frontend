import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native"; // ✅ AJOUT IMPORTANT
import axios from "axios";
import { useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  AppState,
  Dimensions,
  FlatList,
  Image,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useNotifications } from "../contexts/NotificationContext";

const { width } = Dimensions.get("window");

// Flintch Colors
const COLORS = {
  primary: "#0E4A7B",
  accent: "#FF5135",
  skyBlue: "#4CCAF1",
  midnight: "#092C44",
  white: "#FFFFFF",
  lightGray: "#F8F9FA",
  textGray: "#8E9BAE",
  softGray: "#F5F5F5",
  divider: "#F0F0F0",
};

// Interfaces
interface Message {
  id: number;
  content: string;
  sender_id: number;
  created_at: string;
}

interface ApiPartner {
  id: number;
  user: {
    id: number;
    name: string;
    email: string;
    photos: string[];
  };
  matched_at: string;
  last_message?: Message;
  unread_count?: number;
}

interface ChatPreview {
  id: string;
  matchId: number;
  name: string;
  lastMessage: string;
  timestamp: string;
  avatar: string;
  unreadCount?: number;
  isOnline?: boolean;
  userId: number;
  isNewPartner: boolean;
  isLastMessageFromMe: boolean;
}

interface EmptySlot {
  id: string;
  isEmpty: true;
}

type PartnerListItem = ChatPreview | EmptySlot;

// Composant simple pour les nouveaux partenaires
function AnimatedPartnerItem({
  item,
  index,
  viewedPartners,
  onPress,
}: {
  item: ChatPreview;
  index: number;
  viewedPartners: Set<number>;
  onPress: (item: ChatPreview) => void;
}) {
  const translateX = useSharedValue(100);
  const opacity = useSharedValue(0);

  const isNewPartner = !viewedPartners.has(item.userId);

  React.useEffect(() => {
    const delay = index * 200;

    setTimeout(() => {
      translateX.value = withSpring(0, {
        damping: 20,
        stiffness: 100,
        mass: 0.8,
      });

      opacity.value = withTiming(1, {
        duration: 600,
      });
    }, delay);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        style={styles.newPartnerItem}
        activeOpacity={0.8}
        onPress={() => onPress(item)}
      >
        <View style={styles.newPartnerImageContainer}>
          <Image source={{ uri: item.avatar }} style={styles.newPartnerImage} />
          <View style={styles.newPartnerGlow} />

          {isNewPartner && (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>NEW</Text>
            </View>
          )}
        </View>
        <Text style={styles.newPartnerName} numberOfLines={1}>
          {item.name}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// Composant chat item simple
function ChatItem({
  item,
  onPress,
}: {
  item: ChatPreview;
  onPress: (item: ChatPreview) => void;
}) {
  return (
    <TouchableOpacity
      style={styles.chatItem}
      activeOpacity={0.95}
      onPress={() => onPress(item)}
    >
      <View style={styles.avatarContainer}>
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
        {item.isOnline && <View style={styles.onlineIndicator} />}
      </View>

      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <Text style={styles.chatName}>{item.name}</Text>
          <Text style={styles.timestamp}>{item.timestamp}</Text>
        </View>

        <Text
          style={[
            styles.lastMessage,
            !item.isLastMessageFromMe && item.unreadCount
              ? styles.unreadMessage
              : {},
          ]}
          numberOfLines={1}
        >
          {item.lastMessage}
        </Text>
      </View>

      {item.unreadCount ? (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadCount}>{item.unreadCount}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

// Composant principal
export default function ChatScreen() {
  const router = useRouter();
  const { refreshUnreadCount, decrementUnreadCount } = useNotifications();
  const [searchQuery, setSearchQuery] = useState("");
  const [partners, setPartners] = useState<ChatPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewedPartners, setViewedPartners] = useState<Set<number>>(new Set());
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const appStateRef = useRef(AppState.currentState);

  // Helper function pour formater le temps
  const getTimeAgo = useCallback((dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "À l'instant";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}j`;

    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
    });
  }, []);

  // Load current user
  const loadCurrentUser = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        const response = await axios.get("http://localhost:8000/api/user", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCurrentUserId(response.data.id);
        console.log("👤 Utilisateur actuel chargé:", response.data.id);
      }
    } catch (error) {
      console.error("Erreur chargement utilisateur:", error);
    }
  }, []);

  // Load viewed partners
  const loadViewedPartners = useCallback(async () => {
    try {
      const viewed = await AsyncStorage.getItem("viewedPartners");
      if (viewed) {
        setViewedPartners(new Set(JSON.parse(viewed)));
      }
    } catch (error) {
      console.error("Erreur chargement partenaires vus:", error);
    }
  }, []);

  // Load partners - VERSION ULTRA FLUIDE
  const loadPartners = useCallback(
    async (showLoadingSpinner = false) => {
      try {
        // ✅ LOADING SEULEMENT SI DEMANDÉ (premier chargement)
        if (showLoadingSpinner) {
          setLoading(true);
        }

        const token = await AsyncStorage.getItem("token");
        if (!token) {
          if (showLoadingSpinner) setLoading(false);
          return;
        }

        console.log(
          "🔄 Chargement des partenaires...",
          showLoadingSpinner ? "(avec loading)" : "(silencieux)"
        );

        const response = await axios.get(
          "http://localhost:8000/api/matches?include_messages=true",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const apiPartners: ApiPartner[] = response.data;
        console.log(`✅ ${apiPartners.length} partenaires chargés`);

        const chatPreviews: ChatPreview[] = apiPartners.map((partner) => {
          const timeAgo = getTimeAgo(partner.matched_at);

          let lastMessage = "Vous vous êtes connectés ! Dites bonjour 👋";
          let timestamp = timeAgo;
          let isLastMessageFromMe = false;
          let unreadCount = 0;
          let isNewPartner = false;

          if (partner.last_message) {
            lastMessage = partner.last_message.content;
            timestamp = getTimeAgo(partner.last_message.created_at);
            isLastMessageFromMe =
              partner.last_message.sender_id === currentUserId;

            // Les messages non lus sont ceux reçus (pas envoyés par moi)
            if (!isLastMessageFromMe) {
              unreadCount = partner.unread_count || 0;
            }
            isNewPartner = false;
          } else {
            isNewPartner = true;
            unreadCount = 1; // Nouveau partenaire = 1 message non lu virtuel
          }

          return {
            id: partner.id.toString(),
            matchId: partner.id,
            userId: partner.user.id,
            name: partner.user.name,
            lastMessage,
            timestamp,
            avatar:
              (partner.user.photos && partner.user.photos[0]) ||
              "https://placekitten.com/100/100",
            unreadCount: unreadCount > 0 ? unreadCount : undefined,
            isOnline: Math.random() > 0.5,
            isNewPartner,
            isLastMessageFromMe,
          };
        });

        setPartners(chatPreviews);

        // IMPORTANT: Rafraîchir le badge global après chargement
        await refreshUnreadCount();
      } catch (error) {
        console.error("Erreur chargement partenaires:", error);
      } finally {
        if (showLoadingSpinner) {
          setLoading(false);
        }
      }
    },
    [currentUserId, getTimeAgo, refreshUnreadCount]
  );

  // ✅ AUTO-REFRESH ULTRA FLUIDE QUAND LA PAGE DEVIENT VISIBLE
  useFocusEffect(
    useCallback(() => {
      console.log(
        "🎯 Chat screen focused - déclenchement auto-refresh silencieux"
      );

      // Refresh automatique SILENCIEUX quand on arrive sur la page
      if (currentUserId) {
        loadPartners(false); // ✅ false = pas de loading spinner
      }

      return () => {
        console.log("😴 Chat screen blurred");
      };
    }, [currentUserId, loadPartners])
  );

  // Mark partner as viewed
  const markPartnerAsViewed = useCallback(
    async (userId: number) => {
      try {
        const newViewedPartners = new Set(viewedPartners);
        newViewedPartners.add(userId);
        setViewedPartners(newViewedPartners);

        await AsyncStorage.setItem(
          "viewedPartners",
          JSON.stringify(Array.from(newViewedPartners))
        );
      } catch (error) {
        console.error("Erreur sauvegarde partenaire vu:", error);
      }
    },
    [viewedPartners]
  );

  // Mark conversation as read - VERSION AVEC CONTEXTE
  const markConversationAsRead = useCallback(
    async (matchId: number) => {
      try {
        console.log("🔄 Début markConversationAsRead", { matchId });

        const token = await AsyncStorage.getItem("token");
        if (!token) {
          console.error("❌ Pas de token trouvé");
          return;
        }

        // Trouver le partenaire concerné et son nombre de messages non lus
        const partnerToUpdate = partners.find((p) => p.matchId === matchId);
        const unreadCountToRemove = partnerToUpdate?.unreadCount || 0;

        console.log("📊 Messages non lus à supprimer:", {
          partner: partnerToUpdate?.name,
          unreadCount: unreadCountToRemove,
        });

        // Mise à jour optimiste immédiate de l'UI locale
        if (unreadCountToRemove > 0) {
          setPartners((prevPartners) =>
            prevPartners.map((partner) =>
              partner.matchId === matchId
                ? { ...partner, unreadCount: 0 }
                : partner
            )
          );
        }

        // Appel API pour marquer comme lu
        const response = await axios.post(
          `http://localhost:8000/api/matches/${matchId}/mark-read`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        console.log("✅ Réponse API markAsRead:", response.data);

        // IMPORTANT: Rafraîchir le badge global depuis l'API
        // Ceci va recharger le total depuis le serveur et mettre à jour le badge
        await refreshUnreadCount();
      } catch (error) {
        if (error instanceof Error) {
          console.error("❌ Erreur markConversationAsRead:", {
            error: error.message,
            matchId,
          });
        } else {
          console.error("❌ Erreur markConversationAsRead:", {
            error,
            matchId,
          });
        }

        // En cas d'erreur, recharger les données pour resynchroniser
        await loadPartners(false);
      }
    },
    [partners, refreshUnreadCount, loadPartners]
  );

  // Refresh manuel avec pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPartners(false); // ✅ Refresh silencieux, on utilise déjà l'indicateur refreshing
    setRefreshing(false);
  }, [loadPartners]);

  // Navigation handlers
  const handlePartnerPress = useCallback(
    async (item: ChatPreview) => {
      // Marquer comme vu
      await markPartnerAsViewed(item.userId);

      // Marquer les messages comme lus
      await markConversationAsRead(item.matchId);

      // Naviguer
      router.push({
        pathname: "/chat/[id]",
        params: {
          id: item.userId.toString(),
          name: item.name,
          avatar: item.avatar,
          isOnline: item.isOnline ? "true" : "false",
        },
      });
    },
    [router, markPartnerAsViewed, markConversationAsRead]
  );

  const handleChatPress = useCallback(
    async (item: ChatPreview) => {
      // Marquer d'abord comme lu
      await markConversationAsRead(item.matchId);

      // Puis naviguer
      router.push({
        pathname: "/chat/[id]",
        params: {
          id: item.userId.toString(),
          name: item.name,
          avatar: item.avatar,
          isOnline: item.isOnline ? "true" : "false",
        },
      });
    },
    [router, markConversationAsRead]
  );

  // Initial load
  useEffect(() => {
    const init = async () => {
      await loadCurrentUser();
      await loadViewedPartners();
      await loadPartners(true); // ✅ true = avec loading spinner pour le premier chargement
    };
    init();
  }, []);

  // Gérer le retour au premier plan de l'app
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        console.log("App revenue au premier plan, rechargement silencieux...");
        loadPartners(false); // ✅ Refresh silencieux
      }
      appStateRef.current = nextAppState;
    });

    return () => {
      subscription?.remove();
    };
  }, [loadPartners]);

  // Computed values
  const { newPartners, conversations, filteredConversations, displayPartners } =
    useMemo(() => {
      const newPartners = partners.filter((partner) => partner.isNewPartner);
      const conversations = partners.filter((partner) => !partner.isNewPartner);
      const filteredConversations = conversations.filter((chat) =>
        chat.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

      const emptySlots: EmptySlot[] = Array.from(
        { length: Math.max(0, 4 - newPartners.length) },
        (_, index) => ({
          id: `empty-${index}`,
          isEmpty: true,
        })
      );

      const displayPartners: PartnerListItem[] = [
        ...newPartners,
        ...emptySlots,
      ];

      return {
        newPartners,
        conversations,
        filteredConversations,
        displayPartners,
      };
    }, [partners, searchQuery]);

  // Calculer le total local pour debug
  const getTotalUnreadCount = useCallback(() => {
    return partners.reduce(
      (sum, partner) => sum + (partner.unreadCount || 0),
      0
    );
  }, [partners]);

  // Render functions
  const renderNewPartnerItem = ({
    item,
    index,
  }: {
    item: PartnerListItem;
    index: number;
  }) => {
    if ("isEmpty" in item) {
      return (
        <View style={styles.emptyPartnerItem}>
          <View style={styles.emptyPartnerImageContainer}>
            <View style={styles.emptyPartnerImage} />
          </View>
          <Text style={styles.newPartnerName}></Text>
        </View>
      );
    }

    return (
      <AnimatedPartnerItem
        item={item}
        index={index}
        viewedPartners={viewedPartners}
        onPress={handlePartnerPress}
      />
    );
  };

  const renderChatItem = ({ item }: { item: ChatPreview }) => (
    <ChatItem item={item} onPress={handleChatPress} />
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.loadingText}>
            Chargement de vos partenaires...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>Takt</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.debugButton}
            onPress={async () => {
              console.log("🔄 Refresh manuel des matches déclenché");

              try {
                // Déclencher le refresh complet avec loading
                setRefreshing(true);
                await loadPartners(false); // ✅ On utilise refreshing au lieu du loading global
                setRefreshing(false);

                console.log("✅ Refresh des matches terminé");
              } catch (error) {
                console.error("❌ Erreur lors du refresh:", error);
                setRefreshing(false);
              }
            }}
          >
            <Ionicons name="refresh" size={20} color={COLORS.textGray} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.shieldButton}>
            <Ionicons
              name="shield-checkmark"
              size={24}
              color={COLORS.textGray}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={COLORS.textGray} />
          <TextInput
            style={styles.searchInput}
            placeholder={`Rechercher ${partners.length} partenaires`}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={COLORS.textGray}
          />
        </View>
      </View>

      <FlatList
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.accent}
            colors={[COLORS.accent]}
          />
        }
        ListHeaderComponent={
          <>
            {newPartners.length > 0 && (
              <View style={styles.newPartnersSection}>
                <Text style={styles.sectionTitle}>
                  Nouveaux partenaires d'entraînement
                </Text>
                <FlatList
                  data={displayPartners}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item) =>
                    "isEmpty" in item ? item.id : `new-${item.id}`
                  }
                  renderItem={renderNewPartnerItem}
                  contentContainerStyle={styles.newPartnersList}
                />
              </View>
            )}

            {conversations.length > 0 && (
              <Text style={styles.sectionTitle}>Messages</Text>
            )}

            {newPartners.length === 0 && partners.length > 0 && (
              <View style={styles.emptySection}>
                <Text style={styles.emptySectionTitle}>
                  🔥 Trouve de nouveaux partenaires
                </Text>
                <Text style={styles.emptySectionSubtitle}>
                  Élargis ton cercle d'entraînement !
                </Text>
                <TouchableOpacity
                  style={styles.exploreButton}
                  onPress={() => router.push("/explore")}
                >
                  <Ionicons name="compass" size={20} color={COLORS.white} />
                  <Text style={styles.exploreButtonText}>EXPLORER</Text>
                </TouchableOpacity>
              </View>
            )}

            {conversations.length === 0 && newPartners.length > 0 && (
              <View style={styles.emptySection}>
                <Text style={styles.emptySectionTitle}>
                  💬 Commence à discuter
                </Text>
                <Text style={styles.emptySectionSubtitle}>
                  Brise la glace avec tes nouveaux partenaires !
                </Text>
              </View>
            )}
          </>
        }
        data={filteredConversations}
        keyExtractor={(item) => item.id}
        renderItem={renderChatItem}
        contentContainerStyle={styles.chatList}
        ListEmptyComponent={
          partners.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="barbell" size={48} color={COLORS.accent} />
              </View>
              <Text style={styles.emptyTitle}>Prêt pour l'action ?</Text>
              <Text style={styles.emptySubtitle}>
                Trouve ton binôme d'entraînement parfait !{"\n"}
                Des milliers de sportifs motivés t'attendent.
              </Text>
              <TouchableOpacity
                style={[styles.exploreButton, { marginTop: 24 }]}
                onPress={() => router.push("/explore")}
              >
                <Ionicons name="compass" size={20} color={COLORS.white} />
                <Text style={styles.exploreButtonText}>
                  COMMENCER L'EXPLORATION
                </Text>
              </TouchableOpacity>
            </View>
          ) : searchQuery && filteredConversations.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Aucun résultat</Text>
              <Text style={styles.emptySubtitle}>
                Essayez avec un autre terme
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textGray,
    fontWeight: "500",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  headerLeft: {
    flex: 1,
  },
  logoContainer: {
    alignSelf: "flex-start",
  },
  logoText: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.accent,
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  debugButton: {
    padding: 8,
  },
  shieldButton: {
    padding: 8,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.softGray,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: COLORS.midnight,
    fontWeight: "400",
  },
  chatList: {
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.midnight,
    paddingHorizontal: 16,
    marginBottom: 20,
    marginTop: 8,
  },
  newPartnersSection: {
    marginBottom: 24,
    overflow: "visible",
  },
  newPartnersList: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  newPartnerItem: {
    alignItems: "center",
    marginHorizontal: 16,
    width: 120,
    overflow: "visible",
  },
  newPartnerImageContainer: {
    position: "relative",
    marginBottom: 12,
    overflow: "visible",
  },
  newPartnerImage: {
    width: 120,
    height: 160,
    borderRadius: 12,
    zIndex: 2,
  },
  newPartnerGlow: {
    position: "absolute",
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: 20,
    backgroundColor: "transparent",
    shadowColor: COLORS.accent,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 1,
    zIndex: 1,
  },
  newPartnerName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.midnight,
    textAlign: "center",
  },
  newBadge: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    zIndex: 10,
    shadowColor: COLORS.accent,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  newBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  emptyPartnerItem: {
    alignItems: "center",
    marginHorizontal: 16,
    width: 120,
    overflow: "hidden",
  },
  emptyPartnerImageContainer: {
    marginBottom: 12,
    overflow: "hidden",
  },
  emptyPartnerImage: {
    width: 120,
    height: 160,
    borderRadius: 12,
    backgroundColor: "#eaebef",
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  emptySection: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  emptySectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.midnight,
    marginBottom: 8,
    textAlign: "center",
  },
  emptySectionSubtitle: {
    fontSize: 16,
    color: COLORS.textGray,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 22,
  },
  exploreButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.accent,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
    gap: 8,
    shadowColor: COLORS.accent,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  exploreButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  chatItem: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
  },
  avatarContainer: {
    position: "relative",
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.softGray,
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#10B981",
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  chatContent: {
    flex: 1,
    justifyContent: "center",
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.midnight,
  },
  timestamp: {
    fontSize: 14,
    color: COLORS.textGray,
    fontWeight: "400",
  },
  lastMessage: {
    fontSize: 14,
    color: COLORS.textGray,
    fontWeight: "400",
    lineHeight: 18,
  },
  unreadMessage: {
    color: COLORS.midnight,
    fontWeight: "500",
  },
  unreadBadge: {
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  unreadCount: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "600",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 48,
    paddingVertical: 60,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 81, 53, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: COLORS.midnight,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontSize: 16,
    color: COLORS.textGray,
    textAlign: "center",
    lineHeight: 22,
    fontWeight: "400",
  },
});
