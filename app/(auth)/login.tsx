import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as AuthSession from "expo-auth-session";
import * as Google from "expo-auth-session/providers/google";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const bgImage = require("../../assets/splash.png");

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID_ANDROID =
  "341029156576-uhfpjhjmer0999qu5hvprbraakl470pb.apps.googleusercontent.com";
const GOOGLE_CLIENT_ID_WEB =
  "341029156576-ojcacj9tfrcnqj5hc7me4gtpesq0ktd2.apps.googleusercontent.com";

const LoginScreen = () => {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkToken = async () => {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        router.replace("/(tabs)/home" as const);
      } else {
        setChecking(false);
      }
    };
    checkToken();
  }, []);

  // ✅ IMPORTANT : utilise useProxy true et le redirectUri standard Expo
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: GOOGLE_CLIENT_ID_WEB,
    useProxy: true,
    redirectUri: AuthSession.makeRedirectUri({
      scheme: "matchfrontend",
    }),
  });

  useEffect(() => {
    if (response?.type === "success" && !loading) {
      const { authentication } = response;
      if (authentication?.accessToken) {
        handleSocialLogin("google", authentication.accessToken);
      }
    }
  }, [response, loading]);

  const handleSocialLogin = async (provider: "google", socialToken: string) => {
    setLoading(true);
    try {
      const res = await axios.post("http://127.0.0.1:8000/api/social-login", {
        provider,
        token: socialToken,
      });

      const { token, user, needRegister, name, email } = res.data;

      if (needRegister) {
        router.replace({
          pathname: "/(auth)/register",
          params: {
            name: name || "",
            email: email || "",
            provider: provider,
            provider_token: socialToken,
          },
        });
        return;
      }

      await AsyncStorage.setItem("token", token);

      if (!user.birthdate) {
        router.replace({
          pathname: "/(auth)/register",
          params: {
            name: user.name || "",
            email: user.email || "",
            provider: provider,
            provider_token: socialToken,
          },
        });
      } else {
        router.replace("/(tabs)/home" as const);
      }
    } catch (error: any) {
      Alert.alert(
        "Erreur",
        error.response?.data?.message || "Erreur de connexion avec Google"
      );
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#0E4A7B" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <ImageBackground source={bgImage} style={styles.background}>
        <View style={styles.overlay} />

        <View style={styles.content}>
          <Text style={styles.logo}>Flintch</Text>
          <Text style={styles.slogan}>Sweat & Connect</Text>

          <TouchableOpacity
            style={styles.btnGoogle}
            disabled={!request || loading}
            onPress={() => promptAsync()}
            activeOpacity={0.8}
          >
            <Text style={styles.btnGoogleText}>Continuer avec Google</Text>
          </TouchableOpacity>

          <Text
            style={{
              color: "#fff",
              textAlign: "center",
              fontSize: 16,
              marginTop: 40,
              opacity: 0.5,
              fontWeight: "600",
            }}
          >
            En continuant, tu acceptes nos CGU & Politique de confidentialité.
          </Text>
        </View>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    resizeMode: "cover",
    justifyContent: "center",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(14,74,123,0.75)",
  },
  content: {
    paddingHorizontal: 30,
    paddingVertical: 50,
    flex: 1,
    justifyContent: "center",
  },
  logo: {
    color: "#FF5135",
    fontSize: 48,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: 2,
  },
  slogan: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 40,
    letterSpacing: 1,
  },
  btnGoogle: {
    backgroundColor: "#fff",
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: "center",
    marginBottom: 18,
    borderWidth: 1.5,
    borderColor: "#4285F4",
    flexDirection: "row",
    justifyContent: "center",
  },
  btnGoogleText: {
    color: "#4285F4",
    fontWeight: "700",
    fontSize: 18,
  },
});
