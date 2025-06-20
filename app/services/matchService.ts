import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const API_BASE_URL = "http://localhost:8000/api"; // ou ton IP locale/externe en prod

const getAuthHeaders = async () => {
  const token = await AsyncStorage.getItem("userToken");
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
  };
};

// 🔍 Obtenir les profils potentiels à swiper
export const fetchPotentialMatches = async () => {
  const headers = await getAuthHeaders();
  const res = await axios.get(`${API_BASE_URL}/discover`, { headers });
  return res.data;
};

// ❤️ Liker un utilisateur
export const likeUser = async (userId: number) => {
  const headers = await getAuthHeaders();
  const res = await axios.post(
    `${API_BASE_URL}/matches`,
    { user_id: userId },
    { headers }
  );
  return res.data;
};

// ❌ Rejeter un utilisateur
export const rejectUser = async (userId: number) => {
  const headers = await getAuthHeaders();
  const res = await axios.post(
    `${API_BASE_URL}/reject`,
    { user_id: userId },
    { headers }
  );
  return res.data;
};

// 💘 Récupérer les matchs mutuels
export const fetchMutualMatches = async () => {
  const headers = await getAuthHeaders();
  const res = await axios.get(`${API_BASE_URL}/matches`, { headers });
  return res.data;
};

// 🔓 Unmatch un utilisateur
export const unmatchUser = async (matchId: number) => {
  const headers = await getAuthHeaders();
  const res = await axios.delete(`${API_BASE_URL}/unmatch/${matchId}`, {
    headers,
  });
  return res.data;
};
