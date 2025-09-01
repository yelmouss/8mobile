import "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import * as Linking from "expo-linking";
import Constants from "expo-constants";
import { useCallback, useEffect } from "react";
import { StyleSheet, Alert, View, Text, Button } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import MainTabsSimple from "./src/navigation/MainTabsSimple";
import HomeScreen from "./src/screens/HomeScreen";

const NEXT_EXTRA = Constants?.expoConfig?.extra?.NEXT_BASE_URL;
let NEXT_BASE_URL =
  (typeof NEXT_EXTRA === "string"
    ? NEXT_EXTRA
    : NEXT_EXTRA?.production || NEXT_EXTRA?.development) ||
  "https://8cartes.com";
// ngrok http --url=resolved-marten-smashing.ngrok-free.app 3000
function Root() {
  const { setToken, token } = useAuth();

  const handleDeepLink = useCallback(
    (event) => {
      try {
        const url = event.url;
        const { queryParams } = Linking.parse(url);
        if (queryParams?.token) {
          setToken(queryParams.token);
          // Alert.alert('Connecté', 'Jeton reçu.');
        } else if (queryParams?.error) {
          Alert.alert("Erreur OAuth", String(queryParams.error));
        }
      } catch (e) {
        console.warn("Deep link parse error", e);
      }
    },
    [setToken]
  );

  useEffect(() => {
    const sub = Linking.addEventListener("url", handleDeepLink);
    Linking.getInitialURL().then((initialUrl) => {
      if (initialUrl) handleDeepLink({ url: initialUrl });
    });
    return () => sub.remove();
  }, [handleDeepLink]);

  const startOAuth = useCallback(async () => {
    const expoReturnUrl = Linking.createURL("oauth");
    const signinUrl = `${NEXT_BASE_URL}/mobile/signin?returnUrl=${encodeURIComponent(
      expoReturnUrl
    )}`;
    Linking.openURL(signinUrl);
  }, []);

  if (!token) {
    return (
      <>
        <HomeScreen onStartOAuth={startOAuth} />
        <StatusBar style="auto" />
      </>
    );
  }
  return (
    <>
      <MainTabsSimple />
      <StatusBar style="auto" />
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <SafeAreaProvider>
          <Root />
        </SafeAreaProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({});
