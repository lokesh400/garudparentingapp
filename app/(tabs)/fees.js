import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  View,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API } from "../../utils/api";

export default function FeeScreen() {
  const [studentId, setStudentId] = useState(null);
  const [fee, setFee] = useState(null);
  const [loading, setLoading] = useState(true);

  // LOAD STUDENT ID
  useEffect(() => {
    const loadStudent = async () => {
      const id = await AsyncStorage.getItem("userId");
      setStudentId(id);
    };
    loadStudent();
  }, []);

  // LOAD FEE
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

  // LOADING STATE
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={{ marginTop: 10 }}>Loading fee details...</Text>
      </View>
    );
  }

  // EMPTY STATE
  if (!fee) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>No Fee Data Found 💸</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Fee Summary</Text>

        {/* SUMMARY CARDS */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.label}>Total Fee</Text>
            <Text style={styles.value}>₹{fee.totalFee}</Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.label}>Paid</Text>
            <Text style={styles.value}>₹{fee.totalPaid}</Text>
          </View>

          <View style={[styles.summaryCard, styles.balanceCard]}>
            <Text style={styles.label}>Balance</Text>
            <Text style={[styles.value, styles.balanceText]}>
              ₹{fee.balance}
            </Text>
          </View>
        </View>

        {/* PAYMENTS */}
        <Text style={styles.subTitle}>Payment History</Text>

        {fee.payments.map((p, i) => (
          <View key={i} style={styles.paymentCard}>
            <View>
              <Text style={styles.amount}>₹{p.amount}</Text>
              <Text style={styles.mode}>{p.mode}</Text>
            </View>

            <Text style={styles.date}>
              {new Date(p.date).toDateString()}
            </Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 25,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    padding: 10,
    borderRadius: 14,
    marginHorizontal: 4,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  balanceCard: {
    backgroundColor: "#fff5f5",
  },
  label: {
    fontSize: 14,
    color: "gray",
  },
  value: {
    fontSize: 15,
    fontWeight: "800",
    marginTop: 5,
    marginBottom: 5,
  },
  balanceText: {
    color: "#d9534f",
  },
  subTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
  },
  paymentCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 15,
    borderRadius: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  amount: {
    fontSize: 18,
    fontWeight: "700",
  },
  mode: {
    fontSize: 14,
    color: "gray",
  },
  date: {
    fontSize: 14,
    color: "#555",
  },
  emptyText: {
    fontSize: 18,
    color: "gray",
  },
});
