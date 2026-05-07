import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import SafeScreen from "../components/SafeScreen";
import { API } from "../utils/api";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetUsername, setResetUsername] = useState("");
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [resetSentTo, setResetSentTo] = useState("");
  const router = useRouter();

  const resolveSentEmail = (responseData, fallbackValue) => {
    return (
      responseData?.email ||
      responseData?.sentTo ||
      responseData?.sentEmail ||
      fallbackValue
    );
  };

  const requestResetToken = async (username) => {
    const payloads = [
      { username },
      { identifier: username },
      { usernameOrEmail: username },
      { email: username },
    ];

    const endpoints = [
      "/auth/forgot-password",
      "/auth/forgotPassword",
      "/auth/reset-password-request",
      "/auth/reset-password",
      "/auth/request-reset-token",
    ];

    for (const endpoint of endpoints) {
      for (const payload of payloads) {
        try {
          const res = await API.post(endpoint, payload);
          return res;
        } catch (error) {
          const status = error?.response?.status;
          if (status && status < 500) {
            continue;
          }
        }
      }
    }

    throw new Error("Unable to send reset token email with available endpoints.");
  };

  const handleLogin = async () => {
    if (isLoggingIn) return;

    setIsLoggingIn(true);

    try {
      const res = await API.post("/auth/login", {
        username,
        password,
      });

      if (res.data?.userId) {
        // Save active userId
        await AsyncStorage.setItem("userId", String(res.data.userId));

        // Manage local profiles list
        const raw = await AsyncStorage.getItem("profiles");
        const profiles = raw ? JSON.parse(raw) : [];

        // If a profile for this username exists, update it; otherwise create new
        let profile = profiles.find((p) => p.username === username);
        const profileId = profile ? profile.id : Date.now();

        const newProfile = {
          id: profileId,
          displayName: username,
          username: username,
          userId: res.data.userId,
          role: res.data.role || null,
          savedAt: new Date().toISOString(),
        };

        if (profile) {
          const idx = profiles.findIndex((p) => p.id === profile.id);
          profiles[idx] = newProfile;
        } else {
          profiles.push(newProfile);
        }

        await AsyncStorage.setItem("profiles", JSON.stringify(profiles));

        // Store credentials securely
        try {
          await SecureStore.setItemAsync(
            `profile_${profileId}_credentials`,
            JSON.stringify({ username, password })
          );
        } catch (e) {
          console.warn("SecureStore failed to save credentials:", e?.message || e);
        }

        // Set active profile
        await AsyncStorage.setItem("activeProfileId", String(profileId));

        router.replace("/(tabs)/dashboard");
      } else {
        alert("Login failed");
        setIsLoggingIn(false);
      }
    } catch (err) {
      console.log("LOGIN ERROR:", err);
      alert("Invalid credentials");
      setIsLoggingIn(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!resetUsername.trim() || isSendingReset || isLoggingIn) return;

    setIsSendingReset(true);

    try {
      const res = await requestResetToken(resetUsername.trim());
      const sentEmail = resolveSentEmail(res?.data, resetUsername.trim());
      setResetSentTo(sentEmail);
      alert(`Reset password mail sent to ${sentEmail}`);
    } catch (error) {
      console.log("RESET PASSWORD ERROR:", error);
      alert("Could not send reset mail. Please check email and try again.");
    } finally {
      setIsSendingReset(false);
    }
  };

  const openResetModal = () => {
    setResetSentTo("");
    setResetUsername("");
    setShowResetModal(true);
  };

  const closeResetModal = () => {
    if (isSendingReset) return;
    setShowResetModal(false);
  };

  return (
    <SafeScreen style={styles.screen} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardArea}
      >
        <View style={styles.container}>
          <View style={styles.headerWrap}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Login to continue to your parent dashboard.</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                placeholder="Enter username"
                placeholderTextColor="#8A94A6"
                autoCapitalize="none"
                value={username}
                onChangeText={setUsername}
                style={styles.input}
                editable={!isLoggingIn}
              />
            </View>

            <View style={styles.fieldWrap}>
              <View style={styles.passwordLabelRow}>
                <Text style={styles.label}>Password</Text>
                <Pressable
                  disabled={isLoggingIn}
                  onPress={() => setShowPassword((prev) => !prev)}
                  style={({ pressed }) => [styles.togglePasswordButton, pressed && styles.togglePasswordButtonPressed]}
                >
                  <Text style={styles.togglePasswordText}>{showPassword ? "Hide" : "Show"}</Text>
                </Pressable>
              </View>
              <TextInput
                placeholder="Enter password"
                placeholderTextColor="#8A94A6"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                style={styles.input}
                editable={!isLoggingIn}
              />
            </View>

            <Pressable
              onPress={handleLogin}
              style={({ pressed }) => [
                styles.button,
                (!username || !password || isLoggingIn) && styles.buttonDisabled,
                pressed && styles.buttonPressed,
              ]}
              disabled={!username || !password || isLoggingIn}
            >
              <Text style={styles.buttonText}>Login</Text>
            </Pressable>

            <View style={styles.resetSection}>
              <Pressable
                onPress={openResetModal}
                disabled={isLoggingIn}
                style={({ pressed }) => [styles.resetToggleButton, pressed && styles.togglePasswordButtonPressed]}
              >
                <Text style={styles.resetToggleText}>Forgot password?</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>

      <Modal
        animationType="fade"
        transparent
        visible={showResetModal}
        onRequestClose={closeResetModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Reset Password</Text>
            <Text style={styles.resetSubtitle}>Enter your username to receive a reset token mail.</Text>

            <TextInput
              placeholder="Enter username"
              placeholderTextColor="#8A94A6"
              autoCapitalize="none"
              value={resetUsername}
              onChangeText={setResetUsername}
              editable={!isSendingReset && !isLoggingIn}
              style={styles.input}
            />

            <Pressable
              onPress={handleForgotPassword}
              style={({ pressed }) => [
                styles.secondaryButton,
                (!resetUsername.trim() || isSendingReset || isLoggingIn) && styles.buttonDisabled,
                pressed && styles.buttonPressed,
              ]}
              disabled={!resetUsername.trim() || isSendingReset || isLoggingIn}
            >
              <Text style={styles.secondaryButtonText}>
                {isSendingReset ? "Sending reset mail..." : "Send Reset Password Mail"}
              </Text>
            </Pressable>

            {!!resetSentTo && (
              <Text style={styles.resetSentInfo}>Reset password mail sent to: {resetSentTo}</Text>
            )}

            <Pressable
              onPress={closeResetModal}
              disabled={isSendingReset}
              style={({ pressed }) => [styles.modalCloseButton, pressed && styles.togglePasswordButtonPressed]}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {isLoggingIn && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#1F6FEB" />
            <Text style={styles.loadingText}>Logging in, please wait...</Text>
          </View>
        </View>
      )}
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#F4F7FC",
  },
  keyboardArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 22,
    paddingVertical: 20,
  },
  headerWrap: {
    marginBottom: 22,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#16213E",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#5E6A82",
    lineHeight: 20,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E4EAF5",
    shadowColor: "#13213D",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  fieldWrap: {
    marginBottom: 14,
  },
  label: {
    marginBottom: 7,
    fontSize: 13,
    fontWeight: "700",
    color: "#2B3A55",
  },
  passwordLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  togglePasswordButton: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 6,
  },
  togglePasswordButtonPressed: {
    opacity: 0.7,
  },
  togglePasswordText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1F6FEB",
  },
  input: {
    borderWidth: 1,
    borderColor: "#D5DDEC",
    borderRadius: 12,
    backgroundColor: "#F9FBFF",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#1A2233",
  },
  button: {
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: "#1F6FEB",
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    marginTop: 10,
    borderRadius: 12,
    backgroundColor: "#EAF2FF",
    borderWidth: 1,
    borderColor: "#C7D9FF",
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#1347A8",
    fontSize: 14,
    fontWeight: "700",
  },
  resetSection: {
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#E8EEF9",
  },
  resetToggleButton: {
    alignSelf: "flex-start",
    paddingVertical: 2,
  },
  resetToggleText: {
    fontSize: 14,
    color: "#1F6FEB",
    fontWeight: "700",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 22,
  },
  modalCard: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E4EAF5",
    padding: 18,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#16213E",
    marginBottom: 2,
  },
  resetSubtitle: {
    fontSize: 12,
    color: "#5E6A82",
    marginBottom: 10,
  },
  resetSentInfo: {
    marginTop: 10,
    fontSize: 12,
    color: "#0C8F3F",
    fontWeight: "600",
  },
  modalCloseButton: {
    marginTop: 14,
    alignSelf: "flex-end",
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  modalCloseText: {
    fontSize: 13,
    color: "#334155",
    fontWeight: "700",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.35)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingHorizontal: 22,
    paddingVertical: 18,
    alignItems: "center",
    minWidth: 220,
    borderWidth: 1,
    borderColor: "#E4EAF5",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#2B3A55",
    fontWeight: "600",
  },
});
