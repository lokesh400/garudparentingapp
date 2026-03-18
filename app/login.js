import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
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
  const router = useRouter();

  const handleLogin = async () => {
    try {
      const res = await API.post("/auth/login", {
        username,
        password,
      });

      if (res.data?.userId) {
        await AsyncStorage.setItem(
          "userId",
          String(res.data.userId)
        );
        router.replace("/(tabs)/dashboard");
      } else {
        alert("Login failed");
      }
    } catch (err) {
      console.log("LOGIN ERROR:", err);
      alert("Invalid credentials");
    }
  };

  return (
    <SafeScreen style={styles.screen}>
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
              />
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                placeholder="Enter password"
                placeholderTextColor="#8A94A6"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                style={styles.input}
              />
            </View>

            <Pressable
              onPress={handleLogin}
              style={({ pressed }) => [
                styles.button,
                (!username || !password) && styles.buttonDisabled,
                pressed && styles.buttonPressed,
              ]}
              disabled={!username || !password}
            >
              <Text style={styles.buttonText}>Login</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
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
});
