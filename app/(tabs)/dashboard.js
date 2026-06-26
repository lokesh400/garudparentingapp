import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter, useFocusEffect } from "expo-router";
import { useState, useCallback } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Image,
} from "react-native";
import SafeScreen from "../../components/SafeScreen";
import { API } from "../../utils/api";

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
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </SafeScreen>
    );
  }

  if (!student) {
    return (
      <SafeScreen style={styles.center}>
        <Ionicons name="alert-circle" size={42} color="#cbd5e1" />
        <Text style={styles.emptyText}>No student data found</Text>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.heroIconWrap}>
              <Ionicons name="school-outline" size={26} color="#6366f1" />
            </View>
            <Pressable
              onPress={handleLogout}
              style={({ pressed }) => [
                styles.logoutButton,
                pressed && styles.logoutButtonPressed,
              ]}
            >
              <Text style={styles.logoutText}>Logout</Text>
            </Pressable>
          </View>
          <Text style={styles.heroTitle}>Welcome Parent</Text>
          <Text style={styles.heroSubtitle}>Student overview at a glance</Text>
        </View>

        <View style={styles.studentCard}>
          <View style={styles.studentRow}>
            <View style={styles.avatar}>
              {photoUrl ? (
                <Image source={{ uri: photoUrl }} style={styles.avatarImage} />
              ) : (
                <Ionicons name="person" size={28} color="#6366f1" />
              )}
            </View>
            <View style={styles.studentInfo}>
              <Text style={styles.name}>{student.name || "Student"}</Text>
              <Text style={styles.batchText}>
                Batch • {student.batch?.name || "N/A"}
              </Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Roll No</Text>
              <Text style={styles.statValue}>{student.rollNumber || "-"}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Phone</Text>
              <Text style={styles.statValue}>{student.number || "-"}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Batch</Text>
              <Text style={styles.statValue}>{student.batch.name || "-"}</Text>
            </View>
          </View>
        </View>

        <Pressable
          onPress={() => router.push("/document-center")}
          style={({ pressed }) => [
            styles.documentCard,
            pressed && styles.documentCardPressed,
          ]}
        >
          <View style={styles.documentCardContent}>
            <View style={styles.documentIconWrap}>
              <Ionicons name="document-text" size={24} color="#6366f1" />
            </View>
            <View style={styles.documentInfo}>
              <Text style={styles.documentTitle}>Document Center</Text>
              <Text style={styles.documentSubtitle}>
                Upload marksheets, Aadhaar card & profile photo
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6366f1" />
          </View>
        </Pressable>

        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Family Details</Text>
          <InfoRow icon="man-outline" label="Father" value={student.fatherName} />
          <InfoRow icon="woman-outline" label="Mother" value={student.motherName} />
          <InfoRow icon="location-outline" label="Address" value={student.address} />
        </View>
      </ScrollView>
    </SafeScreen>
  );
}

const InfoRow = ({ icon, label, value }) => (
  <View style={styles.infoRow}>
    <Ionicons name={icon} size={18} color="#6366f1" />
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value || "-"}</Text>
  </View>
);

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#ffffff",
  },
  container: {
    padding: 16,
    paddingBottom: 28,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  loadingText: {
    marginTop: 14,
    color: "#64748b",
    fontWeight: "500",
  },
  emptyText: {
    marginTop: 12,
    color: "#9ca3af",
    fontWeight: "600",
  },
  heroCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    marginBottom: 16,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  heroIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#eef2ff",
    alignItems: "center",
    justifyContent: "center",
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1f2937",
  },
  heroSubtitle: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 4,
    fontWeight: "600",
  },
  logoutButton: {
    backgroundColor: "#fee2e2",
    borderColor: "#fecaca",
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  logoutButtonPressed: {
    opacity: 0.8,
  },
  logoutText: {
    color: "#b91c1c",
    fontWeight: "700",
    fontSize: 12,
  },
  studentCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    marginBottom: 16,
  },
  studentRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#eef2ff",
    alignItems: "center",
    justifyContent: "center",
  },
  studentInfo: {
    marginLeft: 12,
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1f2937",
  },
  batchText: {
    fontSize: 12,
    color: "#6366f1",
    fontWeight: "700",
    marginTop: 4,
  },
  statsRow: {
    flexDirection: "column",
    gap: 5,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 6,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
  },
  statLabel: {
    fontSize: 11,
    color: "#6b7280",
    fontWeight: "600",
  },
  statValue: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: "800",
    color: "#1f2937",
  },
  detailsCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1f2937",
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  infoLabel: {
    marginLeft: 10,
    width: 70,
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "600",
  },
  infoValue: {
    flex: 1,
    fontSize: 13,
    color: "#1f2937",
    fontWeight: "600",
  },
  documentCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    marginBottom: 16,
  },
  documentCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  documentCardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  documentIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#eef2ff",
    alignItems: "center",
    justifyContent: "center",
  },
  documentInfo: {
    marginLeft: 12,
    flex: 1,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1f2937",
  },
  documentSubtitle: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 4,
    fontWeight: "500",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 14,
  },
});
