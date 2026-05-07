import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  Pressable,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import SafeScreen from "../../components/SafeScreen";
import { Picker } from "@react-native-picker/picker";
import { API } from "../../utils/api";

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const getCurrentMonthYear = () => {
  const now = new Date();
  return {
    month: now.getMonth(),
    year: now.getFullYear(),
  };
};

export default function AttendancePage() {
  const [{ month, year }, setFilter] = useState(getCurrentMonthYear());
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAttendance = async () => {
      setLoading(true);
      try {
        const res = await API.get(`/api/attendance?month=${month + 1}&year=${year}`);
        setAttendance(res.data || []);
      } catch (err) {
        console.log("Attendance fetch error:", err);
        setAttendance([]);
      }
      setLoading(false);
    };
    fetchAttendance();
  }, [month, year]);

  // Helper to get all days in month
  const getDaysInMonth = (month, year) => {
    const days = [];
    const date = new Date(year, month, 1);
    while (date.getMonth() === month) {
      days.push({
        date: date.toISOString().slice(0, 10),
        day: date.toLocaleDateString("en-US", { weekday: "short" }),
        dayNum: date.getDate(),
      });
      date.setDate(date.getDate() + 1);
    }
    return days;
  };

  // Map attendance by date
  const attendanceMap = {};
  attendance.forEach((att) => {
    attendanceMap[att.date] = att;
  });

  const daysInMonth = getDaysInMonth(month, year);

  // Statistics
  const presentDays = attendance.length;
  const totalDays = daysInMonth.length;
  const percentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

  const AttendanceCard = ({ item, att }) => {
    const isPresent = !!att;
    const punchIn = att?.check_in_time || att?.punchIn || "-";
    const punchOut = att?.check_out_time || att?.punchOut || "-";

    return (
      <View style={[styles.card, isPresent ? styles.cardPresent : styles.cardAbsent]}>
        <View style={styles.cardHeader}>
          <View style={styles.dateSection}>
            <Text style={styles.dayNum}>{item.dayNum}</Text>
            <Text style={styles.dayName}>{item.day}</Text>
          </View>

          <View style={styles.statusBadge}>
            {isPresent ? (
              <>
                <MaterialCommunityIcons name="check-circle" size={24} color="#10b981" />
                <Text style={styles.statusBadgeText}>Present</Text>
              </>
            ) : (
              <>
                <MaterialCommunityIcons name="close-circle" size={24} color="#ef4444" />
                <Text style={styles.statusBadgeAbsent}>Absent</Text>
              </>
            )}
          </View>
        </View>

        {isPresent && (
          <View style={styles.timeSection}>
            <View style={styles.timeItem}>
              <View style={[styles.timeIcon, styles.punchInIcon]}>
                <MaterialCommunityIcons name="login" size={18} color="#10b981" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.timeLabel}>Punch In</Text>
                <Text style={styles.timeValue}>{punchIn}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.timeItem}>
              <View style={[styles.timeIcon, styles.punchOutIcon]}>
                <MaterialCommunityIcons name="logout" size={18} color="#6366f1" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.timeLabel}>Punch Out</Text>
                <Text style={styles.timeValue}>{punchOut}</Text>
              </View>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeScreen style={styles.screen}>
      <View style={styles.container}>
        {/* Stats Section */}
        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="calendar-check" size={28} color="#10b981" />
            <Text style={styles.statValue}>{presentDays}</Text>
            <Text style={styles.statLabel}>Present</Text>
          </View>

          <View style={styles.statCard}>
            <MaterialCommunityIcons name="percent" size={28} color="#6366f1" />
            <Text style={styles.statValue}>{percentage}%</Text>
            <Text style={styles.statLabel}>Attendance</Text>
          </View>

          <View style={styles.statCard}>
            <MaterialCommunityIcons name="calendar-range" size={28} color="#f59e0b" />
            <Text style={styles.statValue}>{totalDays}</Text>
            <Text style={styles.statLabel}>Total Days</Text>
          </View>
        </View>

        {/* Filter Section */}
        <View style={styles.filterSection}>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={month}
              style={styles.picker}
              onValueChange={(value) => setFilter((f) => ({ ...f, month: value }))}
            >
              {months.map((m, idx) => (
                <Picker.Item key={m} label={m} value={idx} />
              ))}
            </Picker>
          </View>

          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={year}
              style={styles.picker}
              onValueChange={(value) => setFilter((f) => ({ ...f, year: value }))}
            >
              {Array.from({ length: 5 }, (_, i) => year - i).map((y) => (
                <Picker.Item key={y} label={y.toString()} value={y} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Attendance List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.loadingText}>Loading attendance records...</Text>
          </View>
        ) : daysInMonth.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="calendar-blank" size={48} color="#cbd5e1" />
            <Text style={styles.emptyText}>No data available</Text>
          </View>
        ) : (
          <ScrollView style={styles.listContainer}>
            {daysInMonth.map((item) => (
              <AttendanceCard
                key={item.date}
                item={item}
                att={attendanceMap[item.date]}
              />
            ))}
            <View style={{ height: 20 }} />
          </ScrollView>
        )}
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: "#ffffff" },
  container: { flex: 1, padding: 16 },
  statsSection: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1f2937",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "600",
    marginTop: 4,
  },
  filterSection: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 18,
  },
  pickerWrapper: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  picker: {
    height: 48,
  },
  listContainer: { flex: 1 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1.5,
    borderLeftWidth: 4,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  cardPresent: {
    borderColor: "#d1fae5",
    borderLeftColor: "#10b981",
  },
  cardAbsent: {
    borderColor: "#fee2e2",
    borderLeftColor: "#ef4444",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  dateSection: {
    alignItems: "center",
  },
  dayNum: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1f2937",
  },
  dayName: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
    fontWeight: "600",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#f0fdf4",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  statusBadgeAbsent: {
    color: "#ef4444",
    fontWeight: "700",
    fontSize: 12,
  },
  statusBadgeText: {
    color: "#10b981",
    fontWeight: "700",
    fontSize: 12,
  },
  timeSection: { padding: 14 },
  timeItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  timeIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  punchInIcon: { backgroundColor: "#ecfdf5" },
  punchOutIcon: { backgroundColor: "#eef2ff" },
  timeLabel: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "600",
  },
  timeValue: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1f2937",
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#64748b",
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    marginTop: 12,
    color: "#9ca3af",
    fontWeight: "600",
  },
});
