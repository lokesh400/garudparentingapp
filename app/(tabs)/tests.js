import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState, useRef } from "react";
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

export default function TestsScreen() {
  const [userId, setUserId] = useState(null);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadId = async () => {
      const id = await AsyncStorage.getItem("userId");
      setUserId(id);
    };
    loadId();
  }, []);

  useEffect(() => {
    if (!userId) return;

    const loadTests = async () => {
      try {
        const res = await API.post(`/api/marks/all/${userId}`);
        setTests(res.data.marks || []);
      } catch (err) {
        console.log("Marks Load Error:", err);
      }
      setLoading(false);
    };

    loadTests();
  }, [userId]);

  if (loading) {
    return (
      <SafeScreen style={styles.center}>
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color="#6D28D9" />
          <Text style={styles.loadingText}>Loading Results...</Text>
        </View>
      </SafeScreen>
    );
  }

  if (!tests.length) {
    return (
      <SafeScreen style={styles.center}>
        <View style={styles.emptyCard}>
          <MaterialCommunityIcons name="file-document-outline" size={48} color="#A855F7" />
          <Text style={styles.emptyText}>No Results Found</Text>
          <Text style={styles.emptySubtext}>Test performance marks have not been entered yet.</Text>
        </View>
      </SafeScreen>
    );
  }

  // Calculate average percentage
  const avgPercent = Math.round(
    tests.reduce((sum, t) => {
      const total =
        (t.physicsTotal || 0) +
        (t.chemistryTotal || 0) +
        (t.mathTotal || 0) +
        (t.botanyTotal || 0) +
        (t.zoologyTotal || 0);
      const obtained =
        (t.physics || 0) +
        (t.chemistry || 0) +
        (t.math || 0) +
        (t.botany || 0) +
        (t.zoology || 0);
      const percent = total ? (obtained / total) * 100 : 0;
      return sum + percent;
    }, 0) / tests.length
  );

  return (
    <SafeScreen style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Results Overview Hero */}
        <FadeInCard delay={0}>
          <View style={styles.heroCard}>
            <View style={styles.heroHeader}>
              <View style={styles.heroIcon}>
                <MaterialCommunityIcons name="book-open-page-variant" size={24} color="#6D28D9" />
              </View>
              <View>
                <Text style={styles.heroTitle}>Results Sheet</Text>
                <Text style={styles.heroSubtitle}>Detailed test performance</Text>
              </View>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{tests.length}</Text>
                <Text style={styles.statLabel}>Tests</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statValue, { color: avgPercent >= 75 ? "#16A34A" : avgPercent >= 40 ? "#F59E0B" : "#DC2626" }]}>
                  {avgPercent}%
                </Text>
                <Text style={styles.statLabel}>Average</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>NEET</Text>
                <Text style={styles.statLabel}>Stream</Text>
              </View>
            </View>
          </View>
        </FadeInCard>

        {/* Individual Test Cards with staggered slide-in */}
        {tests.map((t, index) => {
          const subjects = [
            ["Physics", t.physics, t.physicsTotal, "atom"],
            ["Chemistry", t.chemistry, t.chemistryTotal, "flask-outline"],
            ["Math", t.math, t.mathTotal, "calculator-variant-outline"],
            ["Botany", t.botany, t.botanyTotal, "flower-outline"],
            ["Zoology", t.zoology, t.zoologyTotal, "cat"],
          ];

          const obtained = subjects.reduce(
            (sum, [, score]) => sum + (score || 0),
            0
          );

          const total = subjects.reduce(
            (sum, [, , totalValue]) => sum + (totalValue || 0),
            0
          );

          const percentage = total
            ? parseFloat(((obtained / total) * 100).toFixed(1))
            : 0;

          // Colors based on score percentage
          const isHigh = percentage >= 75;
          const isLow = percentage < 40;
          const badgeBg = isHigh ? "#F0FDF4" : isLow ? "#FEF2F2" : "#FEF3C7";
          const badgeBorder = isHigh ? "#DCFCE7" : isLow ? "#FEE2E2" : "#FEF3C7";
          const badgeText = isHigh ? "#16A34A" : isLow ? "#DC2626" : "#D97706";

          return (
            <FadeInCard key={`${t.testTitle}-${index}`} delay={100 + index * 100}>
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.testTitle}>{t.testTitle || "Test"}</Text>
                    <Text style={styles.testMeta}>{t.examType || "Exam"}</Text>
                  </View>
                  <View style={[styles.scoreBadge, { backgroundColor: badgeBg, borderColor: badgeBorder }]}>
                    <Text style={[styles.scoreBadgeText, { color: badgeText }]}>{percentage}%</Text>
                  </View>
                </View>

                <View style={styles.dateRow}>
                  <MaterialCommunityIcons name="calendar" size={14} color="#64748B" />
                  <Text style={styles.dateText}>
                    {new Date(t.uploadedAt).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </Text>
                </View>

                {/* Total Marks Metrics Card */}
                <View style={styles.totalBox}>
                  <View style={styles.totalItem}>
                    <Text style={styles.totalLabel}>Marks Obtained</Text>
                    <Text style={styles.totalValue}>{obtained}</Text>
                  </View>
                  <View style={styles.totalDivider} />
                  <View style={styles.totalItem}>
                    <Text style={styles.totalLabel}>Total Marks</Text>
                    <Text style={styles.totalValue}>{total}</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                {/* Subjects Details */}
                <Text style={styles.subjectHeader}>Subject Performance</Text>
                <View style={styles.subjectGrid}>
                  {subjects.map(([name, score, totalValue, icon], i) =>
                    totalValue ? (
                      <View key={`${name}-${i}`} style={styles.subjectRow}>
                        <View style={styles.subjectLeft}>
                          <View style={styles.subjectIconBg}>
                            <MaterialCommunityIcons name={icon} size={16} color="#6D28D9" />
                          </View>
                          <Text style={styles.subjectName}>{name}</Text>
                        </View>
                        <View style={styles.subjectScoreBg}>
                          <Text style={styles.scoreText}>
                            {score} <Text style={{ color: "#64748B", fontWeight: "500" }}>/ {totalValue}</Text>
                          </Text>
                        </View>
                      </View>
                    ) : null
                  )}
                </View>
              </View>
            </FadeInCard>
          );
        })}
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
    paddingBottom: 90, // bottom tab space
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
    marginBottom: 20,
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
  statValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#171717",
  },
  statLabel: {
    marginTop: 4,
    fontSize: 11,
    color: "#64748B",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E8E5EF",
    marginBottom: 16,
    shadowColor: "#6D28D9",
    shadowOpacity: 0.03,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  testTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#171717",
  },
  testMeta: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
    marginTop: 2,
  },
  scoreBadge: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scoreBadgeText: {
    fontSize: 14,
    fontWeight: "800",
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 6,
  },
  dateText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },
  totalBox: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    padding: 14,
    backgroundColor: "#F8F7FC",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E8E5EF",
  },
  totalItem: {
    alignItems: "center",
    flex: 1,
  },
  totalDivider: {
    width: 1,
    height: 32,
    backgroundColor: "#E8E5EF",
  },
  totalLabel: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#171717",
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: "#E8E5EF",
    marginVertical: 16,
  },
  subjectHeader: {
    fontSize: 14,
    fontWeight: "800",
    color: "#171717",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  subjectGrid: {
    gap: 8,
  },
  subjectRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F8F7FC",
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E8E5EF",
  },
  subjectLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  subjectIconBg: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E8E5EF",
  },
  subjectName: {
    fontSize: 13,
    color: "#171717",
    fontWeight: "700",
  },
  subjectScoreBg: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E8E5EF",
  },
  scoreText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#6D28D9",
  },
});
