import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
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
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading results...</Text>
      </SafeScreen>
    );
  }

  if (!tests.length) {
    return (
      <SafeScreen style={styles.center}>
        <MaterialCommunityIcons name="clipboard-text" size={48} color="#cbd5e1" />
        <Text style={styles.emptyText}>No results found</Text>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={styles.heroIcon}>
              <MaterialCommunityIcons name="book-open-page-variant" size={22} color="#6366f1" />
            </View>
            <View>
              <Text style={styles.heroTitle}>Results</Text>
              <Text style={styles.heroSubtitle}>Detailed test performance</Text>
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{tests.length}</Text>
              <Text style={styles.statLabel}>Tests</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {Math.round(
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
                )}
                %
              </Text>
              <Text style={styles.statLabel}>Average</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>NEET</Text>
              <Text style={styles.statLabel}>Stream</Text>
            </View>
          </View>
        </View>

        {tests.map((t, index) => {
          const subjects = [
            ["Physics", t.physics, t.physicsTotal],
            ["Chemistry", t.chemistry, t.chemistryTotal],
            ["Math", t.math, t.mathTotal],
            ["Botany", t.botany, t.botanyTotal],
            ["Zoology", t.zoology, t.zoologyTotal],
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
            ? ((obtained / total) * 100).toFixed(1)
            : 0;

          return (
            <View key={`${t.testTitle}-${index}`} style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.testTitle}>{t.testTitle || "Test"}</Text>
                  <Text style={styles.testMeta}>{t.examType || "Exam"}</Text>
                </View>
                <View style={styles.scoreBadge}>
                  <Text style={styles.scoreBadgeText}>{percentage}%</Text>
                </View>
              </View>

              <Text style={styles.dateText}>
                {new Date(t.uploadedAt).toDateString()}
              </Text>

              <View style={styles.totalBox}>
                <View style={styles.totalItem}>
                  <Text style={styles.totalLabel}>Obtained</Text>
                  <Text style={styles.totalValue}>{obtained}</Text>
                </View>
                <View style={styles.totalItem}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>{total}</Text>
                </View>
                <View style={styles.totalItem}>
                  <Text style={styles.totalLabel}>%</Text>
                  <Text style={styles.totalValue}>{percentage}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              {subjects.map(([name, score, totalValue], i) =>
                totalValue ? (
                  <View key={`${name}-${i}`} style={styles.subjectRow}>
                    <Text style={styles.subject}>{name}</Text>
                    <Text style={styles.score}>
                      {score}/{totalValue}
                    </Text>
                  </View>
                ) : null
              )}
            </View>
          );
        })}
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
  statValue: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1f2937",
  },
  statLabel: {
    marginTop: 4,
    fontSize: 11,
    color: "#6b7280",
    fontWeight: "600",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 14,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  testTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1f2937",
  },
  testMeta: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "600",
    marginTop: 2,
  },
  scoreBadge: {
    backgroundColor: "#eef2ff",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  scoreBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#4338ca",
  },
  dateText: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 8,
    fontWeight: "600",
  },
  totalBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    padding: 12,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  totalItem: {
    alignItems: "center",
    flex: 1,
  },
  totalLabel: {
    fontSize: 11,
    color: "#6b7280",
    fontWeight: "600",
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1f2937",
    marginTop: 6,
  },
  divider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 12,
  },
  subjectRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  subject: {
    fontSize: 13,
    color: "#1f2937",
    fontWeight: "600",
  },
  score: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6366f1",
  },
});
