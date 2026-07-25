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
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color="#6D28D9" />
          <Text style={styles.loadingText}>Loading Timetable...</Text>
        </View>
      </SafeScreen>
    );
  }

  if (!timetable || !days.length) {
    return (
      <SafeScreen style={styles.center}>
        <View style={styles.emptyCard}>
          <MaterialCommunityIcons name="calendar-remove" size={48} color="#A855F7" />
          <Text style={styles.emptyText}>No Timetable Found</Text>
          <Text style={styles.emptySubtext}>Timetable schedule has not been uploaded yet.</Text>
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
        {/* Weekly Timetable Summary Card */}
        <FadeInCard delay={0}>
          <View style={styles.heroCard}>
            <View style={styles.heroHeader}>
              <View style={styles.heroIcon}>
                <MaterialCommunityIcons name="clock-time-four" size={24} color="#6D28D9" />
              </View>
              <View>
                <Text style={styles.heroTitle}>Weekly Timetable</Text>
                <Text style={styles.heroSubtitle}>Plan for the week ahead</Text>
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
        </FadeInCard>

        {/* Schedule List with staggered fade in */}
        {days.map((day, index) => (
          <FadeInCard key={`${day.day}-${index}`} delay={100 + index * 80}>
            <View style={styles.dayCard}>
              <View style={styles.dayHeader}>
                <Text style={styles.dayTitle}>{day.day}</Text>
                <View style={styles.periodCountBadge}>
                  <Text style={styles.periodCountText}>{day.periods?.length || 0} periods</Text>
                </View>
              </View>

              {(day.periods || []).map((p, i) => (
                <View key={`${p.subject}-${i}`} style={styles.periodCard}>
                  <View style={styles.periodMain}>
                    <View style={styles.periodInfo}>
                      <Text style={styles.periodSubject}>{p.subject}</Text>
                      <View style={styles.teacherRow}>
                        <MaterialCommunityIcons name="account-tie-outline" size={14} color="#64748B" />
                        <Text style={styles.periodTeacher}>{p.teacher || "Teacher"}</Text>
                      </View>
                    </View>
                    <View style={styles.timeBadge}>
                      <MaterialCommunityIcons name="clock-outline" size={14} color="#6D28D9" />
                      <Text style={styles.timeText}>{p.startTime} - {p.endTime}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </FadeInCard>
        ))}
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
    paddingBottom: 90, // bottom tab spacing
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
  dayCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E8E5EF",
    marginBottom: 16,
    shadowColor: "#6D28D9",
    shadowOpacity: 0.03,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  dayHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#171717",
  },
  periodCountBadge: {
    backgroundColor: "#F8F7FC",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#E8E5EF",
  },
  periodCountText: {
    fontSize: 11,
    color: "#6D28D9",
    fontWeight: "700",
  },
  periodCard: {
    backgroundColor: "#F8F7FC",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E8E5EF",
    marginBottom: 10,
  },
  periodMain: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  periodInfo: {
    flex: 1,
    marginRight: 8,
  },
  periodSubject: {
    fontSize: 15,
    fontWeight: "800",
    color: "#171717",
  },
  teacherRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 4,
  },
  periodTeacher: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },
  timeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#E8E5EF",
  },
  timeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6D28D9",
  },
});
