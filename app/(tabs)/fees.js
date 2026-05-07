import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import SafeScreen from "../../components/SafeScreen";
import { API } from "../../utils/api";

export default function FeeScreen() {
  const [studentId, setStudentId] = useState(null);
  const [fee, setFee] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStudent = async () => {
      const id = await AsyncStorage.getItem("userId");
      setStudentId(id);
    };
    loadStudent();
  }, []);

  useEffect(() => {
    if (!studentId) return;

    const loadFee = async () => {
      try {
        const res = await API.get(`/api/fees/${studentId}`);
        setFee(res.data.fee);
      } catch (err) {
        console.log("Fee Load Error:", err);
      }
      setLoading(false);
    };

    loadFee();
  }, [studentId]);

  const { totalFee, totalPaid, balance, payments } = useMemo(() => {
    return {
      totalFee: fee?.totalFee ?? 0,
      totalPaid: fee?.totalPaid ?? 0,
      balance: fee?.balance ?? 0,
      payments: fee?.payments || [],
    };
  }, [fee]);

  if (loading) {
    return (
      <SafeScreen style={styles.center}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading fee details...</Text>
      </SafeScreen>
    );
  }

  if (!fee) {
    return (
      <SafeScreen style={styles.center}>
        <MaterialCommunityIcons name="cash-remove" size={48} color="#cbd5e1" />
        <Text style={styles.emptyText}>No fee data found</Text>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={styles.heroIcon}>
              <MaterialCommunityIcons name="wallet" size={24} color="#6366f1" />
            </View>
            <View>
              <Text style={styles.heroTitle}>Fee Summary</Text>
              <Text style={styles.heroSubtitle}>Track dues and payments</Text>
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Total Fee</Text>
              <Text style={styles.statValue}>₹{totalFee}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Paid</Text>
              <Text style={styles.statValue}>₹{totalPaid}</Text>
            </View>
            <View style={[styles.statCard, styles.balanceCard]}>
              <Text style={styles.statLabel}>Balance</Text>
              <Text style={[styles.statValue, styles.balanceText]}>₹{balance}</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Payment History</Text>
          <Text style={styles.sectionSub}>Recent transactions</Text>
        </View>

        {payments.length === 0 ? (
          <View style={styles.emptyListCard}>
            <MaterialCommunityIcons name="receipt-text" size={32} color="#cbd5e1" />
            <Text style={styles.emptyListText}>No payments recorded</Text>
          </View>
        ) : (
          payments.map((p, i) => (
            <View key={`${p.date}-${i}`} style={styles.paymentCard}>
              <View style={styles.paymentLeft}>
                <View style={styles.paymentIcon}>
                  <MaterialCommunityIcons name="cash" size={18} color="#10b981" />
                </View>
                <View>
                  <Text style={styles.paymentAmount}>₹{p.amount}</Text>
                  <Text style={styles.paymentMode}>{p.mode || "Payment"}</Text>
                </View>
              </View>
              <Text style={styles.paymentDate}>
                {new Date(p.date).toDateString()}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeScreen>
  );
}

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
    marginTop: 12,
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
  heroHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  heroIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#eef2ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1f2937",
  },
  heroSubtitle: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "600",
    marginTop: 2,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
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
  balanceCard: {
    backgroundColor: "#fff5f5",
    borderColor: "#fecaca",
  },
  balanceText: {
    color: "#ef4444",
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1f2937",
  },
  sectionSub: {
    marginTop: 2,
    fontSize: 12,
    color: "#64748b",
    fontWeight: "600",
  },
  paymentCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  paymentLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  paymentIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#ecfdf5",
    alignItems: "center",
    justifyContent: "center",
  },
  paymentAmount: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1f2937",
  },
  paymentMode: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "600",
    marginTop: 2,
  },
  paymentDate: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "600",
  },
  emptyListCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 20,
    alignItems: "center",
  },
  emptyListText: {
    marginTop: 10,
    color: "#9ca3af",
    fontWeight: "600",
  },
});
