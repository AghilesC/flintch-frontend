// Créez ce nouveau fichier : contexts/NotificationContext.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

interface NotificationContextType {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
  setUnreadCount: (count: number) => void;
  decrementUnreadCount: (amount: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [unreadCount, setUnreadCount] = useState(0);

  // Fonction pour recharger le compte depuis l'API
  const refreshUnreadCount = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      console.log("🔄 Rafraîchissement du badge global...");

      const response = await axios.get(
        "http://localhost:8000/api/matches?include_messages=true",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Calculer le total des messages non lus
      const totalUnread = response.data.reduce((sum: number, match: any) => {
        return sum + (match.unread_count || 0);
      }, 0);

      console.log("📊 Nouveau total de messages non lus:", totalUnread);
      setUnreadCount(totalUnread);

      // Sauvegarder dans AsyncStorage
      await AsyncStorage.setItem("totalUnreadCount", totalUnread.toString());
    } catch (error) {
      console.error("❌ Erreur rafraîchissement badge:", error);
    }
  }, []);

  // Décrémenter le compteur
  const decrementUnreadCount = useCallback((amount: number) => {
    setUnreadCount((prev) => {
      const newCount = Math.max(0, prev - amount);
      console.log(`📉 Badge: ${prev} -> ${newCount} (-${amount})`);
      AsyncStorage.setItem("totalUnreadCount", newCount.toString());
      return newCount;
    });
  }, []);

  // Charger le compteur initial
  useEffect(() => {
    refreshUnreadCount();
  }, [refreshUnreadCount]);

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        refreshUnreadCount,
        setUnreadCount,
        decrementUnreadCount,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
};
