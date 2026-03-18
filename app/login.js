import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
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
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 28, fontWeight: "700", marginBottom: 20 }}>
        Login
      </Text>

      <TextInput
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
      />

      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={{ borderWidth: 1, padding: 10, marginBottom: 20 }}
      />

      <TouchableOpacity
        onPress={handleLogin}
        style={{ backgroundColor: "#007bff", padding: 15 }}
      >
        <Text style={{ color: "white", textAlign: "center" }}>
          Login
        </Text>
      </TouchableOpacity>
    </View>
  );
}
