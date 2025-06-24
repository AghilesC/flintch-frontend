import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
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

const { width } = Dimensions.get("window");

// Flintch Colors - Version épurée
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

// Interface pour les partenaires depuis l'API
interface ApiPartner {
  id: number;
  user: {
    id: number;
    name: string;
    email: string;
    photos: string[];
  };
  matched_at: string;
}

// Interface pour l'affichage
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
}

// Interface pour les slots vides
interface EmptySlot {
  id: string;
  isEmpty: true;
}

// Type union pour les éléments de la liste
type PartnerListItem = ChatPreview | EmptySlot;

const ChatScreen = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [partners, setPartners] = useState<ChatPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewedPartners, setViewedPartners] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadPartners();
    loadViewedPartners();
  }, []);

  const loadViewedPartners = async () => {
    try {
      const viewed = await AsyncStorage.getItem("viewedPartners");
      if (viewed) {
        setViewedPartners(new Set(JSON.parse(viewed)));
      }
    } catch (error) {
      console.error("Erreur chargement partenaires vus:", error);
    }
  };

  const markPartnerAsViewed = async (userId: number) => {
    try {
      const newViewedPartners = new Set(viewedPartners);
      newViewedPartners.add(userId);
      setViewedPartners(newViewedPartners);

      // Sauvegarder dans AsyncStorage
      await AsyncStorage.setItem(
        "viewedPartners",
        JSON.stringify(Array.from(newViewedPartners))
      );
    } catch (error) {
      console.error("Erreur sauvegarde partenaire vu:", error);
    }
  };

  const loadPartners = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await axios.get("http://localhost:8000/api/matches", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const apiPartners: ApiPartner[] = response.data;

      // Transformer les données API en format d'affichage
      const chatPreviews: ChatPreview[] = apiPartners.map((partner) => {
        const timeAgo = getTimeAgo(partner.matched_at);
        const hoursSincePartner = getHoursSincePartner(partner.matched_at);

        return {
          id: partner.id.toString(),
          matchId: partner.id,
          userId: partner.user.id,
          name: partner.user.name,
          lastMessage: "Vous vous êtes connectés ! Dites bonjour 👋",
          timestamp: timeAgo,
          avatar: partner.user.photos[0] || "https://placekitten.com/100/100",
          unreadCount: 1,
          isOnline: Math.random() > 0.5,
          isNewPartner: hoursSincePartner < 24, // Nouveau partenaire si < 24h
        };
      });

      setPartners(chatPreviews);
    } catch (error) {
      console.error("Erreur chargement partenaires:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPartners();
    setRefreshing(false);
  };

  // Fonction pour calculer les heures écoulées
  const getHoursSincePartner = (dateString: string): number => {
    const now = new Date();
    const date = new Date(dateString);
    return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  };

  // Fonction pour calculer le temps écoulé
  const getTimeAgo = (dateString: string): string => {
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
  };

  // Séparer nouveaux partenaires et conversations
  const newPartners = partners.filter((partner) => partner.isNewPartner);
  const conversations = partners.filter((partner) => !partner.isNewPartner);
  const filteredConversations = conversations.filter((chat) =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Créer des profils vides pour l'effet Tinder (toujours 4 au total)
  const emptySlots: EmptySlot[] = Array.from(
    { length: Math.max(0, 4 - newPartners.length) },
    (_, index) => ({
      id: `empty-${index}`,
      isEmpty: true,
    })
  );

  // Combiner vrais profils + profils vides
  const displayPartners: PartnerListItem[] = [...newPartners, ...emptySlots];

  // Composant animé pour les nouveaux partenaires
  const AnimatedPartnerItem = ({
    item,
    index,
  }: {
    item: ChatPreview;
    index: number;
  }) => {
    const translateX = useSharedValue(100);
    const opacity = useSharedValue(0);

    // Vérifier si ce partenaire a été vu
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
          onPress={() => {
            // Marquer comme vu AVANT la navigation
            markPartnerAsViewed(item.userId);

            router.push({
              pathname: "/chat/[id]",
              params: {
                id: item.userId.toString(),
                name: item.name,
                avatar: item.avatar,
                isOnline: item.isOnline ? "true" : "false",
              },
            });
          }}
        >
          <View style={styles.newPartnerImageContainer}>
            <Image
              source={{ uri: item.avatar }}
              style={styles.newPartnerImage}
            />
            <View style={styles.newPartnerGlow} />

            {/* Badge NEW */}
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
  };

  // Render item pour le carousel des nouveaux partenaires
  const renderNewPartnerItem = ({
    item,
    index,
  }: {
    item: PartnerListItem;
    index: number;
  }) => {
    // Vérifier si c'est un slot vide
    if ("isEmpty" in item) {
      // Rendu pour les slots vides
      return (
        <View style={styles.emptyPartnerItem}>
          <View style={styles.emptyPartnerImageContainer}>
            <View style={styles.emptyPartnerImage} />
          </View>
          <Text style={styles.newPartnerName}></Text>
        </View>
      );
    }

    // Rendu pour les vrais partenaires
    return <AnimatedPartnerItem item={item} index={index} />;
  };

  // Render item pour les conversations
  const renderChatItem = ({ item }: { item: ChatPreview }) => (
    <TouchableOpacity
      style={styles.chatItem}
      activeOpacity={0.95}
      onPress={() => {
        router.push({
          pathname: "/chat/[id]",
          params: {
            id: item.userId.toString(),
            name: item.name,
            avatar: item.avatar,
            isOnline: item.isOnline ? "true" : "false",
          },
        });
      }}
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
            item.unreadCount ? styles.unreadMessage : {},
          ]}
          numberOfLines={1}
        >
          {item.lastMessage}
        </Text>
      </View>

      {item.unreadCount && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadCount}>{item.unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
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

      {/* Header Tinder style */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>flintch</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.headerRight}>
          <Ionicons name="shield-checkmark" size={24} color={COLORS.textGray} />
        </TouchableOpacity>
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
            {/* Section Nouveaux Partenaires */}
            {newPartners.length > 0 && (
              <View style={styles.newPartnersSection}>
                <Text style={styles.sectionTitle}>
                  Nouveaux partenaires d'entraînement
                </Text>
                <FlatList<PartnerListItem>
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

            {/* Section Messages */}
            {conversations.length > 0 && (
              <Text style={styles.sectionTitle}>Messages</Text>
            )}

            {/* Bouton de redirection seulement si aucun partenaire */}
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

            {/* Message sans bouton si aucun message mais il y a des partenaires */}
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
};

export default ChatScreen;

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
    paddingTop: 16, // Espace en haut pour le glow
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
