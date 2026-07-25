import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useMemo, useState, useRef } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Animated,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
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
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color="#6D28D9" />
          <Text style={styles.loadingText}>Loading Fee Details...</Text>
        </View>
      </SafeScreen>
    );
  }

  if (!fee) {
    return (
      <SafeScreen style={styles.center}>
        <View style={styles.emptyCard}>
          <MaterialCommunityIcons name="wallet-giftcard" size={48} color="#A855F7" />
          <Text style={styles.emptyText}>No Fee Data Found</Text>
          <Text style={styles.emptySubtext}>Contact the school accounts department for assistance.</Text>
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
        {/* Fee Overview Card */}
        <FadeInCard delay={0}>
          <View style={styles.heroCard}>
            <View style={styles.heroHeader}>
              <View style={styles.heroIcon}>
                <MaterialCommunityIcons name="credit-card-outline" size={24} color="#6D28D9" />
              </View>
              <View>
                <Text style={styles.heroTitle}>Fee Ledger</Text>
                <Text style={styles.heroSubtitle}>Overview of payment status</Text>
              </View>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Total Fee</Text>
                <Text style={styles.statValue}>₹{totalFee}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Paid</Text>
                <Text style={[styles.statValue, { color: "#16A34A" }]}>₹{totalPaid}</Text>
              </View>
              <View style={[styles.statCard, balance > 0 ? styles.balanceDuesCard : styles.balanceClearCard]}>
                <Text style={styles.statLabel}>Dues</Text>
                <Text style={[styles.statValue, balance > 0 ? styles.balanceDuesText : styles.balanceClearText]}>₹{balance}</Text>
              </View>
            </View>
          </View>
        </FadeInCard>

        <FadeInCard delay={100}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Payment Log</Text>
            <Text style={styles.sectionSub}>Recent billing transactions</Text>
          </View>
        </FadeInCard>

        {/* Payments List */}
        {payments.length === 0 ? (
          <FadeInCard delay={150}>
            <View style={styles.emptyListCard}>
              <MaterialCommunityIcons name="file-document-edit-outline" size={40} color="#cbd5e1" />
              <Text style={styles.emptyListText}>No payment history found</Text>
              <Text style={styles.emptyListSub}>Once fees are paid, receipts will appear here.</Text>
            </View>
          </FadeInCard>
        ) : (
          payments.map((p, i) => (
            <FadeInCard key={`${p.date}-${i}`} delay={150 + i * 80}>
              <View style={styles.paymentCard}>
                <View style={styles.paymentLeft}>
                  <View style={styles.paymentIconBg}>
                    <MaterialCommunityIcons name="checkbox-marked-circle-outline" size={20} color="#16A34A" />
                  </View>
                  <View>
                    <Text style={styles.paymentAmount}>₹{p.amount}</Text>
                    <View style={styles.paymentMethodRow}>
                      <Text style={styles.paymentMode}>{p.mode || "Payment"}</Text>
                      <Text style={styles.modeDot}>•</Text>
                      <Text style={styles.paymentStatusBadge}>Success</Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.paymentDate}>
                  {new Date(p.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </Text>
              </View>
            </FadeInCard>
          ))
        )}
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#F8F7FC",
  },
  container: {
    padding: 16,
    paddingBottom: 90, // bottom tab bar space
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
    marginBottom: 24,
  },
  heroHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#F8F7FC",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#E8E5EF",
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#171717",
  },
  heroSubtitle: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
    marginTop: 2,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#F8F7FC",
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
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
    fontSize: 16,
    fontWeight: "800",
    color: "#171717",
  },
  balanceDuesCard: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FEE2E2",
  },
  balanceDuesText: {
    color: "#DC2626",
  },
  balanceClearCard: {
    backgroundColor: "#F0FDF4",
    borderColor: "#DCFCE7",
  },
  balanceClearText: {
    color: "#16A34A",
  },
  sectionHeader: {
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#171717",
  },
  sectionSub: {
    marginTop: 2,
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },
  paymentCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E8E5EF",
    marginBottom: 12,
    shadowColor: "#6D28D9",
    shadowOpacity: 0.02,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  paymentLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  paymentIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#DCFCE7",
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: "800",
    color: "#171717",
  },
  paymentMethodRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    gap: 6,
  },
  paymentMode: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },
  modeDot: {
    fontSize: 8,
    color: "#64748B",
  },
  paymentStatusBadge: {
    fontSize: 10,
    color: "#16A34A",
    fontWeight: "700",
  },
  paymentDate: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },
  emptyListCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E8E5EF",
    padding: 32,
    alignItems: "center",
    shadowColor: "#6D28D9",
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  emptyListText: {
    marginTop: 12,
    color: "#171717",
    fontWeight: "800",
    fontSize: 15,
  },
  emptyListSub: {
    marginTop: 6,
    color: "#64748B",
    fontSize: 12,
    textAlign: "center",
  },
});
