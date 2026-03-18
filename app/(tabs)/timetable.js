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

export default function TimetableScreen() {
  const [userId, setUserId] = useState(null);
  const [timetable, setTimetable] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load userId
  useEffect(() => {
    const load = async () => {
      const id = await AsyncStorage.getItem("userId");
      setUserId(id);
    };
    load();
  }, []);

  // Load timetable
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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={{ marginTop: 10 }}>Loading timetable...</Text>
      </View>
    );
  }

  if (!timetable) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>No timetable found 📅</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Weekly Timetable</Text>

        {timetable.timetable.map((day, index) => (
          <View key={index} style={styles.dayCard}>
            <Text style={styles.dayTitle}>{day.day}</Text>

            {day.periods.map((p, i) => (
              <View key={i} style={styles.periodCard}>
                <View style={styles.periodHeader}>
                  <Text style={styles.subject}>{p.subject}</Text>
                  <Text style={styles.time}>
                    {p.startTime} – {p.endTime}
                  </Text>
                </View>

                <Text style={styles.teacher}>👩‍🏫 {p.teacher}</Text>
              </View>
            ))}
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
  dayCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  dayTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 12,
    color: "#007bff",
  },
  periodCard: {
    backgroundColor: "#f8f9fc",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e6e6e6",
  },
  periodHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  subject: {
    fontSize: 16,
    fontWeight: "700",
  },
  time: {
    fontSize: 14,
    color: "gray",
  },
  teacher: {
    fontSize: 14,
    color: "#555",
  },
  emptyText: {
    fontSize: 18,
    color: "gray",
  },
});
