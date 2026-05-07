import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Alert,
  Animated,
  Linking,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import SafeScreen from "../components/SafeScreen";
import { API } from "../utils/api";

export default function ProfileSelector() {
  const [profiles, setProfiles] = useState([]);
  const [loadingId, setLoadingId] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const router = useRouter();

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    const raw = await AsyncStorage.getItem("profiles");
    const list = raw ? JSON.parse(raw) : [];
    const active = await AsyncStorage.getItem("activeProfileId");
    setActiveId(active ? parseInt(active) : null);
    setProfiles(list);
  };

  const switchProfile = async (profile) => {
    setLoadingId(profile.id);

    try {
      const credsRaw = await SecureStore.getItemAsync(
        `profile_${profile.id}_credentials`,
      );
      if (!credsRaw) throw new Error("Credentials not found");

      const creds = JSON.parse(credsRaw);
      const res = await API.post("/auth/login", {
        username: creds.username,
        password: creds.password,
      });

      if (res.data?.userId) {
        await AsyncStorage.setItem("userId", String(res.data.userId));
        await AsyncStorage.setItem("activeProfileId", String(profile.id));
        setActiveId(profile.id);
        router.replace("/(tabs)/dashboard");
      } else {
        Alert.alert("Login failed", "Unable to login with saved credentials.");
      }
    } catch (e) {
      console.log("Switch profile error:", e);
      Alert.alert(
        "Could not switch profile",
        "Saved credentials may be invalid. You can delete the profile and login again.",
      );
    } finally {
      setLoadingId(null);
    }
  };

  const deleteProfile = async (profile) => {
    Alert.alert("Delete profile", `Delete profile ${profile.displayName}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const raw = await AsyncStorage.getItem("profiles");
            const list = raw ? JSON.parse(raw) : [];
            const remaining = list.filter((p) => p.id !== profile.id);
            await AsyncStorage.setItem("profiles", JSON.stringify(remaining));
            await SecureStore.deleteItemAsync(
              `profile_${profile.id}_credentials`,
            );

            const active = await AsyncStorage.getItem("activeProfileId");
            if (String(active) === String(profile.id)) {
              if (remaining.length) {
                await AsyncStorage.setItem(
                  "activeProfileId",
                  String(remaining[0].id),
                );
                await AsyncStorage.setItem(
                  "userId",
                  String(remaining[0].userId || ""),
                );
              } else {
                await AsyncStorage.removeItem("activeProfileId");
                await AsyncStorage.removeItem("userId");
              }
            }

            setProfiles(remaining);
          } catch (e) {
            console.log("Delete profile failed:", e);
            Alert.alert("Error", "Could not delete profile");
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }) => {
    const isActive = activeId === item.id;
    return (
      <Pressable
        onPress={() => switchProfile(item)}
        disabled={loadingId === item.id}
        style={({ pressed }) => [styles.card, isActive && styles.cardActive, pressed && styles.cardPressed]}
      >
        <View style={styles.cardContent}>
          <View style={styles.avatarSection}>
            <View style={[styles.avatar, isActive && styles.avatarActive]}>
              <MaterialCommunityIcons name="account-circle" size={32} color={isActive ? "#fff" : "#6366f1"} />
            </View>
            <View style={styles.profileInfo}>
              <Text style={[styles.name, isActive && styles.nameActive]}>{item.displayName || item.username}</Text>
              <Text style={styles.sub}>{item.username}</Text>
              {isActive && <Text style={styles.activeBadgeText}>● Currently Active</Text>}
            </View>
          </View>

          <View style={styles.actions}>
            {loadingId === item.id && (
              <View style={styles.loadingBadge}>
                <Text style={styles.loadingText}>Loading...</Text>
              </View>
            )}
            {isActive && !loadingId && (
              <MaterialCommunityIcons name="check-circle" size={22} color="#10b981" />
            )}
            <Pressable
              onPress={() => deleteProfile(item)}
              style={({ pressed }) => [styles.deleteButton, pressed && styles.deleteButtonPressed]}
            >
              <MaterialCommunityIcons name="trash-can-outline" size={18} color="#ef4444" />
            </Pressable>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeScreen style={styles.screen} edges={["top", "bottom"]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <MaterialCommunityIcons name="account-multiple" size={32} color="#6366f1" />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.title}>Switch Profile</Text>
            <Text style={styles.subtitle}>Manage your saved accounts</Text>
          </View>
        </View>

        <FlatList
          data={profiles}
          keyExtractor={(i) => String(i.id)}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          scrollEnabled={profiles.length > 3}
          ListEmptyComponent={() => (
            <View style={styles.empty}>
              <MaterialCommunityIcons name="inbox" size={48} color="#cbd5e1" />
              <Text style={styles.emptyText}>No profiles saved</Text>
              <Text style={styles.emptySubtext}>Login to add your first profile</Text>
            </View>
          )}
        />

        <View style={styles.buttonRow}>
          <Pressable
            onPress={() => router.push("/login")}
            style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}
          >
            <MaterialCommunityIcons name="plus" size={22} color="#fff" />
            <Text style={styles.addText}>Add Profile</Text>
          </Pressable>
          <Pressable
            onPress={() => Linking.openURL("https://p.garudclasses.com/edit/user/details")}
            style={({ pressed }) => [styles.editButton, pressed && styles.editButtonPressed]}
          >
            <MaterialCommunityIcons name="pencil" size={20} color="#4338ca" />
            <Text style={styles.editText}>Edit Profile</Text>
          </Pressable>
        </View>
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: "#ffffff" },
  container: { flex: 1, padding: 18 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    paddingTop: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1f2937",
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 2,
    fontWeight: "500",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    elevation: 2,
    shadowColor: "#6366f1",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  cardActive: {
    borderColor: "#6366f1",
    borderWidth: 2,
    backgroundColor: "#f8f7ff",
  },
  cardPressed: {
    opacity: 0.95,
    transform: [{ scale: 0.98 }],
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
  },
  avatarSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#eef2ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarActive: {
    backgroundColor: "#6366f1",
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1f2937",
  },
  nameActive: {
    color: "#6366f1",
  },
  sub: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  activeBadgeText: {
    fontSize: 11,
    color: "#10b981",
    marginTop: 4,
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  loadingBadge: {
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 4,
  },
  loadingText: {
    color: "#10b981",
    fontWeight: "600",
    fontSize: 11,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#fee2e2",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteButtonPressed: {
    opacity: 0.7,
  },
  empty: {
    paddingVertical: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6b7280",
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: "#9ca3af",
    marginTop: 4,
  },
  buttonRow: {
    marginTop: 20,
    flexDirection: "row",
    gap: 12,
  },
  addButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#6366f1",
    paddingVertical: 14,
    borderRadius: 12,
    elevation: 4,
    shadowColor: "#6366f1",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  addButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  addText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  editButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#eef2ff",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#c7d2fe",
  },
  editButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  editText: {
    color: "#4338ca",
    fontWeight: "700",
    fontSize: 14,
  },
});
