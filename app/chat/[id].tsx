import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import CacheManager from "../../utils/CacheManager";
import { useNotifications } from "../contexts/NotificationContext";

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

interface Message {
  id: string;
  text: string;
  timestamp: string;
  isMe: boolean;
  isOptimistic?: boolean;
}

// ✅ COMPOSANT MESSAGE ULTRA-OPTIMISÉ
const MessageItem = React.memo(
  ({
    item,
    selectedMessageId,
    onPress,
    scaleAnimation,
  }: {
    item: Message;
    selectedMessageId: string | null;
    onPress: (id: string) => void;
    scaleAnimation: Animated.Value;
  }) => {
    const handlePress = useCallback(() => {
      onPress(item.id);
    }, [item.id, onPress]);

    return (
      <Pressable onPress={handlePress}>
        <Animated.View style={{ transform: [{ scale: scaleAnimation }] }}>
          <View
            style={[
              styles.messageContainer,
              { alignItems: item.isMe ? "flex-end" : "flex-start" },
            ]}
          >
            <View
              style={[
                styles.messageBubble,
                item.isMe ? styles.myMessage : styles.theirMessage,
                item.isOptimistic && styles.optimisticMessage,
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  item.isMe ? styles.myMessageText : styles.theirMessageText,
                  item.isOptimistic && styles.optimisticText,
                ]}
              >
                {item.text}
              </Text>
            </View>
            {selectedMessageId === item.id && (
              <Text style={styles.messageTimestamp}>{item.timestamp}</Text>
            )}
          </View>
        </Animated.View>
      </Pressable>
    );
  },
  (prevProps, nextProps) => {
    // ✅ Comparaison personnalisée pour éviter les re-renders inutiles
    return (
      prevProps.item.id === nextProps.item.id &&
      prevProps.item.text === nextProps.item.text &&
      prevProps.item.isOptimistic === nextProps.item.isOptimistic &&
      prevProps.selectedMessageId === nextProps.selectedMessageId
    );
  }
);

const IndividualChatScreen = React.memo(() => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { id: userId, name, avatar } = params;
  const { refreshUnreadCount } = useNotifications();

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(
    null
  );
  const [isFocused, setIsFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ✅ REFS POUR OPTIMISATION
  const flatListRef = useRef<FlatList>(null);
  const scaleAnimations = useRef<Record<string, Animated.Value>>({}).current;
  const lastFetchRef = useRef(0);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const messagesRef = useRef<Message[]>([]);
  const isLoadingRef = useRef(false);
  const lastMessageIdRef = useRef<string | null>(null);

  // ✅ CONSTANTS OPTIMISÉES
  const CACHE_DURATION = 15 * 1000; // 15 secondes
  const POLL_INTERVAL = 8000; // 8 secondes
  const BATCH_SIZE = 20;

  console.log("🧭 Paramètres route:", { userId, name });

  // ✅ FOCUS EFFECT ULTRA-OPTIMISÉ
  useFocusEffect(
    useCallback(() => {
      console.log("🎯 Chat focused");
      setIsFocused(true);

      // Charge les messages seulement si premier load ou cache expiré
      const now = Date.now();
      if (isFirstLoad || now - lastFetchRef.current > CACHE_DURATION) {
        fetchMessages(true);
      }

      return () => {
        console.log("😴 Chat blurred");
        setIsFocused(false);
        setSelectedMessageId(null);

        // Cleanup polling
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      };
    }, [isFirstLoad])
  );

  // ✅ FETCH MESSAGES INTELLIGENT AVEC CACHE STRATIFIÉ
  const fetchMessages = useCallback(
    async (force = false, loadMore = false) => {
      if (isLoadingRef.current) return;

      const now = Date.now();
      const cacheKey = `messages_${userId}`;

      // ✅ Skip si pas nécessaire
      if (!force && !loadMore && now - lastFetchRef.current < CACHE_DURATION) {
        console.log("⏭️ Skip fetch - cache recent");
        return;
      }

      isLoadingRef.current = true;
      if (!loadMore) setLoading(true);

      try {
        // ✅ 1. Cache mémoire ultra-rapide
        if (!force && !loadMore && isFirstLoad) {
          const memoryCache = CacheManager.getMemoryCache(cacheKey);
          if (memoryCache?.length > 0) {
            console.log("⚡ Chargement depuis cache mémoire");
            setMessages(memoryCache);
            messagesRef.current = memoryCache;
            setLoading(false);
            setIsFirstLoad(false);
            lastFetchRef.current = now;
            return;
          }
        }

        // ✅ 2. Cache persistant
        if (!force && !loadMore && isFirstLoad) {
          const persistentCache = await CacheManager.getPersistentCache(
            cacheKey
          );
          if (persistentCache?.length > 0) {
            console.log("📦 Chargement depuis cache persistant");
            setMessages(persistentCache);
            messagesRef.current = persistentCache;
            setLoading(false);
            setIsFirstLoad(false);
            lastFetchRef.current = now;

            // Remettre en cache mémoire
            CacheManager.setMemoryCache(
              cacheKey,
              persistentCache,
              3 * 60 * 1000
            );
            return;
          }
        }

        // ✅ 3. API Call optimisé
        console.log("🌐 Fetch depuis API");

        const token = await AsyncStorage.getItem("token");
        const url = loadMore
          ? `http://localhost:8000/api/messages/${userId}?before=${lastMessageIdRef.current}&limit=${BATCH_SIZE}`
          : `http://localhost:8000/api/messages/${userId}?limit=${BATCH_SIZE}`;

        const res = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const newMessages = res.data.messages.map((msg: any) => ({
          id: msg.id.toString(),
          text: msg.message,
          timestamp: msg.sent_at ?? msg.created_at,
          isMe: msg.sender_id === res.data.current_user_id,
        }));

        if (loadMore) {
          // ✅ Pagination - ajout des anciens messages
          const updatedMessages = [...newMessages, ...messagesRef.current];
          setMessages(updatedMessages);
          messagesRef.current = updatedMessages;
          setHasMoreMessages(newMessages.length === BATCH_SIZE);
        } else {
          // ✅ Nouveau chargement
          setMessages(newMessages);
          messagesRef.current = newMessages;
          setHasMoreMessages(newMessages.length === BATCH_SIZE);

          // Mise en cache double
          CacheManager.setMemoryCache(cacheKey, newMessages, 3 * 60 * 1000);
          await CacheManager.setPersistentCache(
            cacheKey,
            newMessages,
            10 * 60 * 1000
          );
        }

        // ✅ Mise à jour références
        if (newMessages.length > 0) {
          lastMessageIdRef.current = newMessages[newMessages.length - 1].id;
        }

        lastFetchRef.current = now;
        setIsFirstLoad(false);
      } catch (error) {
        console.error("❌ Erreur fetch:", error);
      } finally {
        isLoadingRef.current = false;
        setLoading(false);
        setRefreshing(false);
      }
    },
    [userId, isFirstLoad]
  );

  // ✅ POLLING INTELLIGENT
  useEffect(() => {
    if (!isFocused || isFirstLoad) return;

    const startPolling = () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }

      pollIntervalRef.current = setInterval(async () => {
        if (!isFocused || isLoadingRef.current) return;

        console.log("🔄 Polling...");
        await fetchMessages(true);
      }, POLL_INTERVAL);
    };

    startPolling();

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [isFocused, isFirstLoad, fetchMessages]);

  // ✅ SEND MESSAGE ULTRA-OPTIMISÉ
  const sendMessage = useCallback(async () => {
    if (!message.trim()) return;

    const messageText = message.trim();
    const tempId = `temp_${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempId,
      text: messageText,
      timestamp: new Date().toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      isMe: true,
      isOptimistic: true,
    };

    // ✅ Optimistic update instantané
    const newMessages = [...messagesRef.current, optimisticMessage];
    setMessages(newMessages);
    messagesRef.current = newMessages;
    setMessage("");

    // ✅ Scroll immédiat
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 50);

    try {
      const token = await AsyncStorage.getItem("token");
      const res = await axios.post(
        "http://localhost:8000/api/messages/send",
        { receiver_id: userId, message: messageText },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // ✅ Remplace le message optimistic par le vrai
      const realMessage: Message = {
        id: res.data.message.id.toString(),
        text: messageText,
        timestamp: res.data.message.created_at,
        isMe: true,
      };

      const updatedMessages = messagesRef.current.map((msg) =>
        msg.id === tempId ? realMessage : msg
      );

      setMessages(updatedMessages);
      messagesRef.current = updatedMessages;

      // ✅ Invalide cache pour synchronisation
      const cacheKey = `messages_${userId}`;
      CacheManager.setMemoryCache(cacheKey, null, 0);
      await CacheManager.invalidateCache(cacheKey);

      // ✅ Refresh badge sans bloquer l'UI
      setTimeout(() => {
        refreshUnreadCount();
      }, 100);
    } catch (error) {
      console.error("❌ Erreur envoi:", error);

      // ✅ Rollback optimistic
      const rolledBackMessages = messagesRef.current.filter(
        (msg) => msg.id !== tempId
      );
      setMessages(rolledBackMessages);
      messagesRef.current = rolledBackMessages;
      setMessage(messageText); // Restore le message
    }
  }, [message, userId, refreshUnreadCount]);

  // ✅ HANDLE MESSAGE PRESS OPTIMISÉ
  const handleMessagePress = useCallback(
    (id: string) => {
      setSelectedMessageId((prev) => (prev === id ? null : id));

      if (!scaleAnimations[id]) {
        scaleAnimations[id] = new Animated.Value(1);
      }

      Animated.sequence([
        Animated.timing(scaleAnimations[id], {
          toValue: 1.02,
          duration: 60,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnimations[id], {
          toValue: 1,
          friction: 8,
          tension: 120,
          useNativeDriver: true,
        }),
      ]).start();
    },
    [scaleAnimations]
  );

  // ✅ LOAD MORE MESSAGES
  const loadMoreMessages = useCallback(() => {
    if (hasMoreMessages && !isLoadingRef.current) {
      fetchMessages(false, true);
    }
  }, [hasMoreMessages, fetchMessages]);

  // ✅ REFRESH HANDLER
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMessages(true);
  }, [fetchMessages]);

  // ✅ RENDERS OPTIMISÉS
  const renderMessage = useCallback(
    ({ item }: { item: Message }) => {
      const scale = scaleAnimations[item.id] || new Animated.Value(1);
      return (
        <MessageItem
          item={item}
          selectedMessageId={selectedMessageId}
          onPress={handleMessagePress}
          scaleAnimation={scale}
        />
      );
    },
    [selectedMessageId, handleMessagePress, scaleAnimations]
  );

  const keyExtractor = useCallback((item: Message) => item.id, []);

  const handleBack = useCallback(() => {
    refreshUnreadCount();
    router.push("/chat");
  }, [router, refreshUnreadCount]);

  // ✅ RENDU OPTIMISÉ
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={COLORS.accent} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: avatar as string }}
              style={styles.headerAvatar}
            />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{name}</Text>
          </View>
        </View>
      </View>

      {messages.length === 0 && !loading && (
        <View style={styles.introMessageContainer}>
          <Text style={styles.introMessageText}>
            🔥 Le match est fait. Maintenant, place à l'échange sportif !
          </Text>
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={keyExtractor}
        renderItem={renderMessage}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        onEndReached={loadMoreMessages}
        onEndReachedThreshold={0.1}
        inverted={false}
        // ✅ OPTIMISATIONS PERFORMANCE MAX
        removeClippedSubviews={true}
        maxToRenderPerBatch={8}
        updateCellsBatchingPeriod={30}
        windowSize={15}
        initialNumToRender={15}
        getItemLayout={(data, index) => ({
          length: 60,
          offset: 60 * index,
          index,
        })}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder="Écrire un message..."
              placeholderTextColor={COLORS.textGray}
              value={message}
              onChangeText={setMessage}
              multiline
              maxLength={1000}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.sendButton,
              message.trim() && styles.sendButtonActive,
            ]}
            onPress={sendMessage}
            disabled={!message.trim()}
          >
            <Ionicons
              name="send"
              size={20}
              color={message.trim() ? COLORS.accent : COLORS.textGray}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
});

IndividualChatScreen.displayName = "IndividualChatScreen";

export default IndividualChatScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    backgroundColor: COLORS.white,
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    marginRight: 12,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.softGray,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.midnight,
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 20,
  },
  messageContainer: {
    marginBottom: 12,
  },
  messageTimestamp: {
    fontSize: 12,
    color: COLORS.textGray,
    textAlign: "center",
    marginTop: 4,
  },
  messageBubble: {
    maxWidth: "80%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 4,
  },
  myMessage: {
    backgroundColor: COLORS.accent,
    alignSelf: "flex-end",
  },
  theirMessage: {
    backgroundColor: "#F5F6FA",
    alignSelf: "flex-start",
  },
  optimisticMessage: {
    opacity: 0.7,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  myMessageText: {
    color: COLORS.white,
  },
  theirMessageText: {
    color: COLORS.midnight,
  },
  optimisticText: {
    fontStyle: "italic",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    gap: 12,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: COLORS.softGray,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxHeight: 100,
  },
  textInput: {
    fontSize: 16,
    color: COLORS.midnight,
    textAlignVertical: "center",
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.softGray,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonActive: {
    backgroundColor: "#ff513519",
  },
  introMessageContainer: {
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  introMessageText: {
    backgroundColor: COLORS.softGray,
    color: COLORS.textGray,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    fontSize: 14,
    textAlign: "center",
  },
});
