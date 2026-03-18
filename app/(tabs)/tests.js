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

export default function TestsScreen() {
  const [userId, setUserId] = useState(null);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load userId
  useEffect(() => {
    const loadId = async () => {
      const id = await AsyncStorage.getItem("userId");
      setUserId(id);
    };
    loadId();
  }, []);

  // Load tests
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
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={{ marginTop: 10 }}>Loading tests...</Text>
      </View>
    );
  }

  if (!tests.length) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>No Tests Found 📭</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>All Test Results</Text>

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
            (sum, [, , total]) => sum + (total || 0),
            0
          );

          const percentage = total
            ? ((obtained / total) * 100).toFixed(1)
            : 0;

          return (
            <View key={index} style={styles.card}>
              <Text style={styles.testTitle}>
                {t.testTitle} • {t.examType}
              </Text>

              <Text style={styles.date}>
                {new Date(t.uploadedAt).toDateString()}
              </Text>

              {/* TOTAL MARKS */}
              <View style={styles.totalBox}>
                <View>
                  <Text style={styles.totalLabel}>Obtained</Text>
                  <Text style={styles.totalValue}>{obtained}</Text>
                </View>

                <View>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>{total}</Text>
                </View>

                <View>
                  <Text style={styles.totalLabel}>%</Text>
                  <Text style={styles.totalValue}>{percentage}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* SUBJECT MARKS */}
              {subjects.map(([name, score, total], i) =>
                total ? (
                  <View key={i} style={styles.subjectRow}>
                    <Text style={styles.subject}>{name}</Text>
                    <Text style={styles.score}>
                      {score}/{total}
                    </Text>
                  </View>
                ) : null
              )}
            </View>
          );
        })}
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
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 15,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  testTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  date: {
    color: "gray",
    marginTop: 4,
  },
  totalBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    padding: 12,
    backgroundColor: "#f0f6ff",
    borderRadius: 12,
  },
  totalLabel: {
    fontSize: 14,
    color: "gray",
    textAlign: "center",
  },
  totalValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#007bff",
    textAlign: "center",
  },
  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 12,
  },
  subjectRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  subject: {
    fontSize: 16,
  },
  score: {
    fontSize: 16,
    fontWeight: "600",
    color: "#007bff",
  },
  emptyText: {
    fontSize: 18,
    color: "gray",
  },
});
