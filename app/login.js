import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";
import { useState, useEffect, useRef } from "react";
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
  Animated,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
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

  const [isUserFocused, setIsUserFocused] = useState(false);
  const [isPassFocused, setIsPassFocused] = useState(false);
  const [isResetUserFocused, setIsResetUserFocused] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const router = useRouter();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

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
      {/* Decorative background shapes for modern glassmorphism aesthetic */}
      <View style={styles.bgShape1} />
      <View style={styles.bgShape2} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardArea}
      >
        <View style={styles.container}>
          <Animated.View
            style={[
              styles.animatedWrapper,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.headerWrap}>
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>Login to continue to your parent dashboard.</Text>
            </View>

            <View style={styles.card}>
              {/* Username Field */}
              <View style={styles.fieldWrap}>
                <Text style={styles.label}>Username</Text>
                <View
                  style={[
                    styles.inputContainer,
                    isUserFocused && styles.inputContainerFocused,
                  ]}
                >
                  <MaterialCommunityIcons
                    name="account-outline"
                    size={22}
                    color={isUserFocused ? "#6D28D9" : "#64748B"}
                    style={styles.leadingIcon}
                  />
                  <TextInput
                    placeholder="Enter username"
                    placeholderTextColor="#94A3B8"
                    autoCapitalize="none"
                    value={username}
                    onChangeText={setUsername}
                    style={styles.input}
                    editable={!isLoggingIn}
                    onFocus={() => setIsUserFocused(true)}
                    onBlur={() => setIsUserFocused(false)}
                  />
                </View>
              </View>

              {/* Password Field */}
              <View style={styles.fieldWrap}>
                <Text style={styles.label}>Password</Text>
                <View
                  style={[
                    styles.inputContainer,
                    isPassFocused && styles.inputContainerFocused,
                  ]}
                >
                  <MaterialCommunityIcons
                    name="lock-outline"
                    size={22}
                    color={isPassFocused ? "#6D28D9" : "#64748B"}
                    style={styles.leadingIcon}
                  />
                  <TextInput
                    placeholder="Enter password"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    style={styles.input}
                    editable={!isLoggingIn}
                    onFocus={() => setIsPassFocused(true)}
                    onBlur={() => setIsPassFocused(false)}
                  />
                  <Pressable
                    disabled={isLoggingIn}
                    onPress={() => setShowPassword((prev) => !prev)}
                    style={({ pressed }) => [
                      styles.togglePasswordButton,
                      pressed && styles.togglePasswordButtonPressed,
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color="#64748B"
                    />
                  </Pressable>
                </View>
              </View>

              {/* Login Button */}
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

              {/* Forgot Password Trigger */}
              <View style={styles.resetSection}>
                <Pressable
                  onPress={openResetModal}
                  disabled={isLoggingIn}
                  style={({ pressed }) => [
                    styles.resetToggleButton,
                    pressed && styles.togglePasswordButtonPressed,
                  ]}
                >
                  <Text style={styles.resetToggleText}>Forgot password?</Text>
                </Pressable>
              </View>
            </View>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>

      {/* Forgot Password Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={showResetModal}
        onRequestClose={closeResetModal}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={styles.modalDismiss} onPress={closeResetModal} />
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderIndicator} />
            <Text style={styles.modalTitle}>Reset Password</Text>
            <Text style={styles.resetSubtitle}>Enter your username to receive a reset token mail.</Text>

            <View
              style={[
                styles.inputContainer,
                isResetUserFocused && styles.inputContainerFocused,
                { marginBottom: 16 },
              ]}
            >
              <MaterialCommunityIcons
                name="account-outline"
                size={22}
                color={isResetUserFocused ? "#6D28D9" : "#64748B"}
                style={styles.leadingIcon}
              />
              <TextInput
                placeholder="Enter username"
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
                value={resetUsername}
                onChangeText={setResetUsername}
                editable={!isSendingReset && !isLoggingIn}
                style={styles.input}
                onFocus={() => setIsResetUserFocused(true)}
                onBlur={() => setIsResetUserFocused(false)}
              />
            </View>

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
                {isSendingReset ? "Sending reset mail..." : "Send Reset Mail"}
              </Text>
            </Pressable>

            {!!resetSentTo && (
              <View style={styles.successMessageCard}>
                <MaterialCommunityIcons name="check-circle" size={16} color="#16A34A" />
                <Text style={styles.resetSentInfo}>Mail sent to: {resetSentTo}</Text>
              </View>
            )}

            <Pressable
              onPress={closeResetModal}
              disabled={isSendingReset}
              style={({ pressed }) => [
                styles.modalCloseButton,
                pressed && styles.togglePasswordButtonPressed,
              ]}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Loading Overlay */}
      {isLoggingIn && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#6D28D9" />
            <Text style={styles.loadingText}>Logging in, please wait...</Text>
          </View>
        </View>
      )}
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#F8F7FC",
    position: "relative",
  },
  bgShape1: {
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: "#8B5CF6",
    opacity: 0.08,
    position: "absolute",
    top: -120,
    left: -100,
  },
  bgShape2: {
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: "#A855F7",
    opacity: 0.06,
    position: "absolute",
    bottom: -150,
    right: -100,
  },
  keyboardArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  animatedWrapper: {
    width: "100%",
  },
  headerWrap: {
    marginBottom: 32,
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#171717",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#64748B",
    lineHeight: 20,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "#E8E5EF",
    shadowColor: "#6D28D9",
    shadowOpacity: 0.05,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  fieldWrap: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 8,
    fontSize: 13,
    fontWeight: "700",
    color: "#171717",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E8E5EF",
    borderRadius: 16,
    backgroundColor: "#F8F7FC",
    height: 56,
    paddingHorizontal: 16,
  },
  inputContainerFocused: {
    borderColor: "#6D28D9",
    borderWidth: 1.5,
    backgroundColor: "#FFFFFF",
  },
  leadingIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#171717",
    height: "100%",
  },
  togglePasswordButton: {
    padding: 4,
  },
  togglePasswordButtonPressed: {
    opacity: 0.6,
  },
  button: {
    marginTop: 12,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#6D28D9",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#6D28D9",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.95,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    height: 56,
    borderRadius: 16,
    backgroundColor: "#F8F7FC",
    borderWidth: 1,
    borderColor: "#E8E5EF",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: "#6D28D9",
    fontSize: 15,
    fontWeight: "700",
  },
  resetSection: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E8E5EF",
    alignItems: "center",
  },
  resetToggleButton: {
    paddingVertical: 4,
  },
  resetToggleText: {
    fontSize: 14,
    color: "#6D28D9",
    fontWeight: "700",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(23, 23, 23, 0.4)",
    justifyContent: "flex-end",
  },
  modalDismiss: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 10,
  },
  modalHeaderIndicator: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E8E5EF",
    alignSelf: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#171717",
    marginBottom: 4,
  },
  resetSubtitle: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 20,
  },
  successMessageCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  resetSentInfo: {
    marginLeft: 8,
    fontSize: 13,
    color: "#16A34A",
    fontWeight: "600",
  },
  modalCloseButton: {
    marginTop: 16,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8F7FC",
    borderWidth: 1,
    borderColor: "#E8E5EF",
  },
  modalCloseText: {
    fontSize: 15,
    color: "#64748B",
    fontWeight: "700",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(248, 247, 252, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  loadingCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingHorizontal: 28,
    paddingVertical: 24,
    alignItems: "center",
    minWidth: 240,
    borderWidth: 1,
    borderColor: "#E8E5EF",
    shadowColor: "#6D28D9",
    shadowOpacity: 0.05,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: "#171717",
    fontWeight: "600",
  },
});
