import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
  StyleSheet,
} from "react-native";
import SafeScreen from "../../components/SafeScreen";
import { API } from "../../utils/api";

export default function Dashboard() {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadStudent = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      const res = await API.post(`/me/${userId}`);
      setStudent(res.data);
    } catch (error) {
      console.log("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudent();
  }, []);

  const handleLogout = async () => {
    try {
      await API.post("/auth/logout");
    } catch (error) {
      // Continue logout even if backend endpoint is unavailable.
      console.log("Logout endpoint error:", error?.message || error);
    } finally {
      await AsyncStorage.removeItem("userId");
      router.replace("/login");
    }
  };

  if (loading) {
    return (
      <SafeScreen style={styles.center}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={{ marginTop: 10 }}>Loading dashboard...</Text>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Text style={styles.welcome}>Welcome Parent 👋</Text>
          <Pressable onPress={handleLogout} style={({ pressed }) => [styles.logoutButton, pressed && styles.logoutButtonPressed]}>
            <Text style={styles.logoutText}>Logout</Text>
          </Pressable>
        </View>
        <Text style={styles.subtitle}>Student Overview</Text>
      </View>

      {/* STUDENT CARD */}
      <View style={styles.card}>
        <View style={styles.nameRow}>
          <Ionicons name="person-circle-outline" size={48} color="#007bff" />
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.name}>{student.name}</Text>
            <Text style={styles.batch}>
              Batch: {student.batch?.name || "N/A"}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <InfoRow icon="id-card-outline" label="Roll No" value={student.rollNumber} />
        <InfoRow icon="call-outline" label="Phone" value={student.number} />
        <InfoRow icon="man-outline" label="Father" value={student.fatherName} />
        <InfoRow icon="woman-outline" label="Mother" value={student.motherName} />
        <InfoRow icon="location-outline" label="Address" value={student.address} />
      </View>
    </SafeScreen>
  );
}

/* REUSABLE INFO ROW */
const InfoRow = ({ icon, label, value }) => (
  <View style={styles.infoRow}>
    <Ionicons name={icon} size={20} color="#007bff" />
    <Text style={styles.infoLabel}>{label}:</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    padding: 22,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    marginBottom: 20,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  welcome: {
    fontSize: 24,
    fontWeight: "800",
    flexShrink: 1,
  },
  logoutButton: {
    backgroundColor: "#EEF4FF",
    borderColor: "#BFD4FF",
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  logoutButtonPressed: {
    opacity: 0.8,
  },
  logoutText: {
    color: "#0A4BB8",
    fontWeight: "700",
    fontSize: 13,
  },
  subtitle: {
    fontSize: 16,
    color: "gray",
    marginTop: 4,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  name: {
    fontSize: 22,
    fontWeight: "700",
  },
  batch: {
    fontSize: 14,
    color: "gray",
  },
  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 15,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  infoLabel: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: "600",
    width: 70,
  },
  infoValue: {
    fontSize: 15,
    color: "#333",
    flex: 1,
  },
});
