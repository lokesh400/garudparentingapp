import { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Alert,
  Animated,
  Linking,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import SafeScreen from "../components/SafeScreen";
import { API } from "../utils/api";

// Reusable card animation wrapper for staggered waterfall entrance
function FadeInCard({ children, delay = 0, style }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 400,
      delay,
      useNativeDriver: true,
    }).start();
  }, []);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0],
  });

  return (
    <Animated.View style={[{ opacity: anim, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
}

export default function ProfileSelector() {
  const [profiles, setProfiles] = useState([]);
  const [loadingId, setLoadingId] = useState(null);
  const [activeId, setActiveId] = useState(null);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const router = useRouter();

  useEffect(() => {
    loadProfiles();
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
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
        `profile_${profile.id}_credentials`
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
        "Saved credentials may be invalid. You can delete the profile and login again."
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
              `profile_${profile.id}_credentials`
            );

            const active = await AsyncStorage.getItem("activeProfileId");
            if (String(active) === String(profile.id)) {
              if (remaining.length) {
                await AsyncStorage.setItem(
                  "activeProfileId",
                  String(remaining[0].id)
                );
                await AsyncStorage.setItem(
                  "userId",
                  String(remaining[0].userId || "")
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

  const renderItem = ({ item, index }) => {
    const isActive = activeId === item.id;
    return (
      <FadeInCard delay={index * 80}>
        <Pressable
          onPress={() => switchProfile(item)}
          disabled={loadingId === item.id}
          style={({ pressed }) => [
            styles.card,
            isActive && styles.cardActive,
            pressed && styles.cardPressed,
          ]}
        >
          <View style={styles.cardContent}>
            <View style={styles.avatarSection}>
              <View style={[styles.avatar, isActive && styles.avatarActive]}>
                <MaterialCommunityIcons
                  name="account-circle"
                  size={32}
                  color={isActive ? "#fff" : "#6D28D9"}
                />
              </View>
              <View style={styles.profileInfo}>
                <Text style={[styles.name, isActive && styles.nameActive]}>
                  {item.displayName || item.username}
                </Text>
                <Text style={styles.sub}>{item.username}</Text>
                {isActive && <Text style={styles.activeBadgeText}>● Active Account</Text>}
              </View>
            </View>

            <View style={styles.actions}>
              {loadingId === item.id && (
                <View style={styles.loadingBadge}>
                  <ActivityIndicator size="small" color="#16A34A" />
                </View>
              )}
              {isActive && !loadingId && (
                <MaterialCommunityIcons name="check-circle" size={24} color="#16A34A" />
              )}
              <Pressable
                onPress={() => deleteProfile(item)}
                style={({ pressed }) => [styles.deleteButton, pressed && styles.deleteButtonPressed]}
              >
                <MaterialCommunityIcons name="trash-can-outline" size={18} color="#DC2626" />
              </Pressable>
            </View>
          </View>
        </Pressable>
      </FadeInCard>
    );
  };

  return (
    <SafeScreen style={styles.screen} edges={["top", "bottom"]}>
      <Animated.View
        style={[
          styles.container,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* Modern Header Row */}
        <View style={styles.header}>
          <View style={styles.headerIconBg}>
            <MaterialCommunityIcons name="account-multiple" size={28} color="#6D28D9" />
          </View>
          <View style={{ marginLeft: 16 }}>
            <Text style={styles.title}>Switch Profile</Text>
            <Text style={styles.subtitle}>Manage your student accounts</Text>
          </View>
        </View>

        {/* Profiles List */}
        <View style={styles.listWrapper}>
          <FlatList
            data={profiles}
            keyExtractor={(i) => String(i.id)}
            renderItem={renderItem}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            scrollEnabled={profiles.length > 4}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={() => (
              <View style={styles.empty}>
                <MaterialCommunityIcons name="account-off-outline" size={48} color="#cbd5e1" />
                <Text style={styles.emptyText}>No Profiles Saved</Text>
                <Text style={styles.emptySubtext}>Login to register your first profile</Text>
              </View>
            )}
          />
        </View>

        {/* Floating buttons at bottom */}
        <View style={styles.buttonRow}>
          <Pressable
            onPress={() => router.push("/login")}
            style={({ pressed }) => [styles.addButton, pressed && styles.buttonPressed]}
          >
            <MaterialCommunityIcons name="plus" size={20} color="#fff" />
            <Text style={styles.addText}>Add Profile</Text>
          </Pressable>
          <Pressable
            onPress={() => Linking.openURL("https://p.garudclasses.com/edit/user/details")}
            style={({ pressed }) => [styles.editButton, pressed && styles.buttonPressed]}
          >
            <MaterialCommunityIcons name="pencil-outline" size={18} color="#6D28D9" />
            <Text style={styles.editText}>Edit Profile</Text>
          </Pressable>
        </View>
      </Animated.View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: "#F8F7FC" },
  container: { flex: 1, padding: 18 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    paddingTop: 8,
  },
  headerIconBg: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E8E5EF",
    shadowColor: "#6D28D9",
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#171717",
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
    fontWeight: "500",
  },
  listWrapper: {
    flex: 1,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E8E5EF",
    elevation: 2,
    shadowColor: "#6D28D9",
    shadowOpacity: 0.03,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  cardActive: {
    borderColor: "#6D28D9",
    borderWidth: 1.5,
    backgroundColor: "#F5F3FF",
  },
  cardPressed: {
    opacity: 0.95,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  avatarSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#F8F7FC",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#E8E5EF",
  },
  avatarActive: {
    backgroundColor: "#6D28D9",
    borderColor: "#6D28D9",
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "800",
    color: "#171717",
  },
  nameActive: {
    color: "#6D28D9",
  },
  sub: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
    fontWeight: "500",
  },
  activeBadgeText: {
    fontSize: 11,
    color: "#16A34A",
    marginTop: 4,
    fontWeight: "700",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  loadingBadge: {
    backgroundColor: "#F0FDF4",
    padding: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DCFCE7",
  },
  deleteButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#FEF2F2",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  deleteButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
  },
  empty: {
    paddingVertical: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#171717",
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 4,
    textAlign: "center",
  },
  buttonRow: {
    marginTop: 20,
    flexDirection: "row",
    gap: 12,
  },
  addButton: {
    flex: 1,
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#6D28D9",
    borderRadius: 16,
    elevation: 4,
    shadowColor: "#6D28D9",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  addText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 15,
  },
  editButton: {
    flex: 1,
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#F5F3FF",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#E8E5EF",
  },
  editText: {
    color: "#6D28D9",
    fontWeight: "800",
    fontSize: 15,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
