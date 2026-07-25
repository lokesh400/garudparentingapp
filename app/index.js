import { Redirect } from "expo-router";
import { useEffect, useState, useRef } from "react";
import { View, ActivityIndicator, StyleSheet, Text, Animated, Image } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API } from "../utils/api";

export default function Index() {
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in animation for splash screen
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    const checkAuth = async () => {
      try {
        const res = await API.get("/auth/check", {
          timeout: 10000,
        });

        if (res.data?.loggedIn && res.data?.userId) {
          await AsyncStorage.setItem("userId", String(res.data.userId));
          setLoggedIn(true);
        } else {
          await AsyncStorage.removeItem("userId");
          setLoggedIn(false);
        }
      } catch (err) {
        console.log("AUTH CHECK FAILED:", err);

        // Fallback to local storage (offline-safe)
        const userId = await AsyncStorage.getItem("userId");
        setLoggedIn(!!userId);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <View style={styles.logoBg}>
            <Image
              source={require("../assets/images/logo.png")}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.brandTitle}>GARUD</Text>
          <Text style={styles.brandSubtitle}>CLASSES</Text>
          <ActivityIndicator size="large" color="#6D28D9" style={styles.loader} />
        </Animated.View>
      </View>
    );
  }

  return loggedIn ? (
    <Redirect href="/(tabs)/dashboard" />
  ) : (
    <Redirect href="/login" />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F7FC",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
  },
  logoBg: {
    width: 80,
    height: 80,
    borderRadius: 28,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E8E5EF",
    shadowColor: "#6D28D9",
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    marginBottom: 20,
  },
  logoImage: {
    width: 60,
    height: 60,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#171717",
    letterSpacing: 1.5,
  },
  brandSubtitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6D28D9",
    letterSpacing: 4,
    marginTop: 2,
    textTransform: "uppercase",
  },
  loader: {
    marginTop: 36,
  },
});
