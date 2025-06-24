import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
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
}

const IndividualChatScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { id: userId, name, avatar } = params;

  console.log("🧭 Paramètres route:", params);

  if (!userId) {
    console.warn("⚠️ Aucun userId trouvé dans les paramètres de route.");
  }

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(
    null
  );
  const flatListRef = useRef<FlatList>(null);
  const scaleAnimations = useRef<Record<string, Animated.Value>>({}).current;

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await axios.get(
        `http://localhost:8000/api/messages/${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("📨 Fetched messages:", res.data);

      const formatted = res.data.messages.map((msg: any) => ({
        id: msg.id.toString(),
        text: msg.message,
        timestamp: msg.sent_at ?? msg.created_at,
        isMe: msg.sender_id === res.data.current_user_id,
      }));

      console.log("✅ Formatted messages:", formatted);
      setMessages(formatted);
    } catch (error) {
      console.error("❌ Erreur fetch messages:", error);
    }
  };

  const sendMessage = async () => {
    if (!message.trim()) return;
    try {
      const token = await AsyncStorage.getItem("token");
      const payload = {
        receiver_id: userId,
        message,
      };
      console.log("✉️ Envoi message:", payload);
      await axios.post("http://localhost:8000/api/messages/send", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const newMessage: Message = {
        id: Date.now().toString(),
        text: message,
        timestamp: new Date().toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        isMe: true,
      };

      setMessages((prev) => [...prev, newMessage]);
      setMessage("");
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error("❌ Erreur envoi message:", error);
    }
  };

  const handleMessagePress = (id: string) => {
    setSelectedMessageId((prev) => (prev === id ? null : id));
    if (!scaleAnimations[id]) {
      scaleAnimations[id] = new Animated.Value(1);
    }

    Animated.sequence([
      Animated.timing(scaleAnimations[id], {
        toValue: 1.03,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnimations[id], {
        toValue: 1,
        friction: 6,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const scale = scaleAnimations[item.id] || new Animated.Value(1);
    return (
      <Pressable onPress={() => handleMessagePress(item.id)}>
        <Animated.View style={{ transform: [{ scale }] }}>
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
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  item.isMe ? styles.myMessageText : styles.theirMessageText,
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
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push("/chat")}
        >
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

      {messages.length === 0 && (
        <View style={styles.introMessageContainer}>
          <Text style={styles.introMessageText}>
            🔥 Le match est fait. Maintenant, place à l’échange sportif !
          </Text>
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
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
            />
          </View>

          <TouchableOpacity
            style={styles.sendButton}
            onPress={sendMessage}
            disabled={!message.trim()}
          >
            <Text
              style={[
                styles.sendButtonText,
                message.trim() && { color: COLORS.accent, fontWeight: "600" },
              ]}
            >
              Envoyer
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

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
    backgroundColor: "rgba(255, 81, 53, 0.2)",
    alignSelf: "flex-start",
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
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
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
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sendButtonText: {
    fontSize: 16,
    color: COLORS.textGray,
    fontWeight: "500",
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
