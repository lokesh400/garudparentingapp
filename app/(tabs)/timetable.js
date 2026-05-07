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

export default function TimetableScreen() {
  const [userId, setUserId] = useState(null);
  const [timetable, setTimetable] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const id = await AsyncStorage.getItem("userId");
      setUserId(id);
    };
    load();
  }, []);

  useEffect(() => {
    if (!userId) return;

    const loadTimetable = async () => {
      try {
        const res = await API.post(`/api/timetable/${userId}`);
        setTimetable(res.data.timetable);
      } catch (err) {
        console.log("Timetable Error:", err);
      }
      setLoading(false);
    };

    loadTimetable();
  }, [userId]);

  const { days, totalPeriods, subjectCount } = useMemo(() => {
    const list = timetable?.timetable || [];
    let periods = 0;
    const subjects = new Set();
    list.forEach((day) => {
      (day.periods || []).forEach((p) => {
        periods += 1;
        if (p.subject) subjects.add(p.subject);
      });
    });
    return { days: list, totalPeriods: periods, subjectCount: subjects.size };
  }, [timetable]);

  if (loading) {
    return (
      <SafeScreen style={styles.center}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading timetable...</Text>
      </SafeScreen>
    );
  }

  if (!timetable || !days.length) {
    return (
      <SafeScreen style={styles.center}>
        <MaterialCommunityIcons name="calendar-blank" size={48} color="#cbd5e1" />
        <Text style={styles.emptyText}>No timetable found</Text>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={styles.heroIcon}>
              <MaterialCommunityIcons name="calendar-clock" size={24} color="#6366f1" />
            </View>
            <View>
              <Text style={styles.heroTitle}>Weekly Timetable</Text>
              <Text style={styles.heroSubtitle}>Plan for the week</Text>
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{days.length}</Text>
              <Text style={styles.statLabel}>Days</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{totalPeriods}</Text>
              <Text style={styles.statLabel}>Periods</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{subjectCount}</Text>
              <Text style={styles.statLabel}>Subjects</Text>
            </View>
          </View>
        </View>

        {days.map((day, index) => (
          <View key={`${day.day}-${index}`} style={styles.dayCard}>
            <View style={styles.dayHeader}>
              <Text style={styles.dayTitle}>{day.day}</Text>
              <Text style={styles.dayCount}>{day.periods?.length || 0} periods</Text>
            </View>

            {(day.periods || []).map((p, i) => (
              <View key={`${p.subject}-${i}`} style={styles.periodCard}>
                <View style={styles.periodLeft}>
                  <Text style={styles.periodSubject}>{p.subject}</Text>
                  <Text style={styles.periodTeacher}>{p.teacher || "Teacher"}</Text>
                </View>
                <View style={styles.timeBadge}>
                  <MaterialCommunityIcons name="clock-outline" size={14} color="#6366f1" />
                  <Text style={styles.timeText}>{p.startTime} - {p.endTime}</Text>
                </View>
              </View>
            ))}
          </View>
        ))}
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
    fontSize: 16,
    fontWeight: "800",
    color: "#1f2937",
  },
  statLabel: {
    marginTop: 4,
    fontSize: 11,
    color: "#6b7280",
    fontWeight: "600",
  },
  dayCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 14,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  dayHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1f2937",
  },
  dayCount: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "600",
  },
  periodCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 10,
  },
  periodLeft: {
    marginBottom: 8,
  },
  periodSubject: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1f2937",
  },
  periodTeacher: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "600",
    marginTop: 2,
  },
  timeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: "#eef2ff",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  timeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#4338ca",
  },
});
