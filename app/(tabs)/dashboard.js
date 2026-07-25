import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter, useFocusEffect } from "expo-router";
import { useState, useCallback, useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Image,
  Animated,
} from "react-native";
import SafeScreen from "../../components/SafeScreen";
import { API } from "../../utils/api";

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

export default function Dashboard() {
  const [student, setStudent] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  const loadStudent = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      const res = await API.post(`/me/${userId}`);
      setStudent(res.data);

      try {
        const docRes = await API.get(`/api/mobile/documents/${userId}`);
        if (docRes.data?.success) {
          setPhotoUrl(docRes.data.studentPhoto);
        }
      } catch (err) {
        console.log("Error fetching profile photo status on dashboard:", err);
      }
    } catch (error) {
      console.log("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadStudent();
    }, [])
  );

  const handleLogout = async () => {
    try {
      await API.post("/auth/logout");
    } catch (error) {
      console.log("Logout endpoint error:", error?.message || error);
    } finally {
      await AsyncStorage.removeItem("userId");
      router.replace("/login");
    }
  };

  if (loading) {
    return (
      <SafeScreen style={styles.center}>
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color="#6D28D9" />
          <Text style={styles.loadingText}>Loading Dashboard...</Text>
        </View>
      </SafeScreen>
    );
  }

  if (!student) {
    return (
      <SafeScreen style={styles.center}>
        <View style={styles.emptyCard}>
          <Ionicons name="alert-circle-outline" size={48} color="#A855F7" />
          <Text style={styles.emptyText}>No Student Data Found</Text>
          <Text style={styles.emptySubtext}>Please contact administration if this persists.</Text>
        </View>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Header Banner */}
        <FadeInCard delay={0}>
          <View style={styles.heroCard}>
            <View style={styles.heroTop}>
              <View style={styles.heroLeft}>
                <Text style={styles.heroSubtitle}>Welcome Parent</Text>
                <Text style={styles.heroTitle}>{student.name ? `Hello, ${student.name.split(" ")[0]}!` : "Hello!"}</Text>
              </View>
              <Pressable
                onPress={handleLogout}
                style={({ pressed }) => [
                  styles.logoutButton,
                  pressed && styles.logoutButtonPressed,
                ]}
              >
                <Ionicons name="log-out-outline" size={18} color="#DC2626" />
                <Text style={styles.logoutText}>Logout</Text>
              </Pressable>
            </View>
          </View>
        </FadeInCard>

        {/* Student Profile Card */}
        <FadeInCard delay={100}>
          <View style={styles.studentCard}>
            <View style={styles.studentRow}>
              <View style={styles.avatar}>
                {photoUrl ? (
                  <Image source={{ uri: photoUrl }} style={styles.avatarImage} />
                ) : (
                  <Ionicons name="person" size={24} color="#6D28D9" />
                )}
              </View>
              <View style={styles.studentInfo}>
                <Text style={styles.name}>{student.name || "Student"}</Text>
                <View style={styles.chipRow}>
                  <View style={styles.classChip}>
                    <Text style={styles.classChipText}>Active Student</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.statsDivider} />

            {/* Premium Grid Statistics */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Roll No</Text>
                <Text style={styles.statValue}>{student.rollNumber || "N/A"}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Batch</Text>
                <Text style={styles.statValue} numberOfLines={1}>{student.batch?.name || "N/A"}</Text>
              </View>
            </View>
            <View style={[styles.statsRow, { marginTop: 10 }]}>
              <View style={[styles.statCard, { flex: 1 }]}>
                <Text style={styles.statLabel}>Registered Mobile</Text>
                <Text style={styles.statValue}>{student.number || "N/A"}</Text>
              </View>
            </View>
          </View>
        </FadeInCard>

        {/* Document Center Banner Callout */}
        <FadeInCard delay={200}>
          <Pressable
            onPress={() => router.push("/document-center")}
            style={({ pressed }) => [
              styles.documentCard,
              pressed && styles.documentCardPressed,
            ]}
          >
            <View style={styles.documentCardContent}>
              <View style={styles.documentIconWrap}>
                <Ionicons name="document-text" size={24} color="#6D28D9" />
              </View>
              <View style={styles.documentInfo}>
                <Text style={styles.documentTitle}>Document Center</Text>
                <Text style={styles.documentSubtitle}>
                  Manage marksheets, Aadhaar & photos
                </Text>
              </View>
              <View style={styles.chevronIconWrap}>
                <Ionicons name="chevron-forward" size={18} color="#6D28D9" />
              </View>
            </View>
          </Pressable>
        </FadeInCard>

        {/* Family Details Card */}
        <FadeInCard delay={300}>
          <View style={styles.detailsCard}>
            <Text style={styles.sectionTitle}>Family Information</Text>
            <InfoRow icon="man-outline" label="Father Name" value={student.fatherName} />
            <InfoRow icon="woman-outline" label="Mother Name" value={student.motherName} />
            <InfoRow icon="location-outline" label="Home Address" value={student.address} />
          </View>
        </FadeInCard>
      </ScrollView>
    </SafeScreen>
  );
}

const InfoRow = ({ icon, label, value }) => (
  <View style={styles.infoRow}>
    <View style={styles.infoIconBg}>
      <Ionicons name={icon} size={18} color="#6D28D9" />
    </View>
    <View style={styles.infoTextWrap}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || "Not Provided"}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#F8F7FC",
  },
  container: {
    padding: 16,
    paddingBottom: 90, // bottom tab bar clearance
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F7FC",
  },
  loadingCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E8E5EF",
    shadowColor: "#6D28D9",
    shadowOpacity: 0.05,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  loadingText: {
    marginTop: 16,
    color: "#64748B",
    fontSize: 15,
    fontWeight: "600",
  },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E8E5EF",
    shadowColor: "#6D28D9",
    shadowOpacity: 0.05,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
    width: "80%",
  },
  emptyText: {
    marginTop: 16,
    color: "#171717",
    fontSize: 18,
    fontWeight: "700",
  },
  emptySubtext: {
    marginTop: 8,
    color: "#64748B",
    fontSize: 13,
    textAlign: "center",
  },
  heroCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E8E5EF",
    shadowColor: "#6D28D9",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    marginBottom: 16,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroLeft: {
    flex: 1,
  },
  heroSubtitle: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#171717",
    marginTop: 4,
  },
  logoutButton: {
    backgroundColor: "#fee2e2",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  logoutButtonPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.85,
  },
  logoutText: {
    color: "#DC2626",
    fontWeight: "700",
    fontSize: 12,
  },
  studentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E8E5EF",
    shadowColor: "#6D28D9",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    marginBottom: 16,
  },
  studentRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: "#F8F7FC",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#E8E5EF",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 18,
  },
  studentInfo: {
    marginLeft: 16,
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: "800",
    color: "#171717",
  },
  chipRow: {
    flexDirection: "row",
    marginTop: 6,
  },
  classChip: {
    backgroundColor: "#F0FDF4",
    borderColor: "#DCFCE7",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  classChipText: {
    fontSize: 11,
    color: "#16A34A",
    fontWeight: "700",
  },
  statsDivider: {
    height: 1,
    backgroundColor: "#E8E5EF",
    marginVertical: 16,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#F8F7FC",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E8E5EF",
  },
  statLabel: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  statValue: {
    marginTop: 6,
    fontSize: 15,
    fontWeight: "800",
    color: "#171717",
  },
  documentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E8E5EF",
    shadowColor: "#6D28D9",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    marginBottom: 16,
  },
  documentCardPressed: {
    opacity: 0.95,
    transform: [{ scale: 0.98 }],
  },
  documentCardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  documentIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#F8F7FC",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E8E5EF",
  },
  documentInfo: {
    marginLeft: 16,
    flex: 1,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#171717",
  },
  documentSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
    fontWeight: "500",
  },
  chevronIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#F8F7FC",
    alignItems: "center",
    justifyContent: "center",
  },
  detailsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E8E5EF",
    shadowColor: "#6D28D9",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#171717",
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  infoIconBg: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#F8F7FC",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E8E5EF",
  },
  infoTextWrap: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  infoValue: {
    marginTop: 2,
    fontSize: 14,
    color: "#171717",
    fontWeight: "600",
  },
});
