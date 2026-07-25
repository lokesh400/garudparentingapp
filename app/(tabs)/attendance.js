import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
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
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      const localDateStr = `${y}-${m}-${d}`;
      
      days.push({
        date: localDateStr,
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

          <View style={[styles.statusBadge, isPresent ? styles.statusBadgePresent : styles.statusBadgeAbsentWrap]}>
            {isPresent ? (
              <>
                <MaterialCommunityIcons name="check-circle" size={16} color="#16A34A" />
                <Text style={styles.statusBadgeText}>Present</Text>
              </>
            ) : (
              <>
                <MaterialCommunityIcons name="close-circle" size={16} color="#DC2626" />
                <Text style={styles.statusBadgeAbsent}>Absent</Text>
              </>
            )}
          </View>
        </View>

        {isPresent && (
          <View style={styles.timeSection}>
            <View style={styles.timeItem}>
              <View style={[styles.timeIcon, styles.punchInIcon]}>
                <MaterialCommunityIcons name="login" size={18} color="#16A34A" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.timeLabel}>Punch In</Text>
                <Text style={styles.timeValue}>{punchIn}</Text>
              </View>
            </View>

            <View style={styles.cardDivider} />

            <View style={styles.timeItem}>
              <View style={[styles.timeIcon, styles.punchOutIcon]}>
                <MaterialCommunityIcons name="logout" size={18} color="#6D28D9" />
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
        <FadeInCard delay={0}>
          <View style={styles.statsSection}>
            <View style={styles.statCard}>
              <View style={[styles.statIconBg, { backgroundColor: "#F0FDF4" }]}>
                <MaterialCommunityIcons name="calendar-check" size={20} color="#16A34A" />
              </View>
              <Text style={styles.statValue}>{presentDays}</Text>
              <Text style={styles.statLabel}>Present</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIconBg, { backgroundColor: "#F5F3FF" }]}>
                <MaterialCommunityIcons name="percent" size={20} color="#6D28D9" />
              </View>
              <Text style={styles.statValue}>{percentage}%</Text>
              <Text style={styles.statLabel}>Rate</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIconBg, { backgroundColor: "#FFFBEB" }]}>
                <MaterialCommunityIcons name="calendar-range" size={20} color="#F59E0B" />
              </View>
              <Text style={styles.statValue}>{totalDays}</Text>
              <Text style={styles.statLabel}>Total Days</Text>
            </View>
          </View>
        </FadeInCard>

        {/* Filter Section */}
        <FadeInCard delay={80}>
          <View style={styles.filterSection}>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={month}
                style={styles.picker}
                dropdownIconColor="#6D28D9"
                onValueChange={(value) => setFilter((f) => ({ ...f, month: value }))}
              >
                {months.map((m, idx) => (
                  <Picker.Item key={m} label={m} value={idx} style={styles.pickerItem} />
                ))}
              </Picker>
            </View>

            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={year}
                style={styles.picker}
                dropdownIconColor="#6D28D9"
                onValueChange={(value) => setFilter((f) => ({ ...f, year: value }))}
              >
                {Array.from({ length: 5 }, (_, i) => year - i).map((y) => (
                  <Picker.Item key={y} label={y.toString()} value={y} style={styles.pickerItem} />
                ))}
              </Picker>
            </View>
          </View>
        </FadeInCard>

        {/* Attendance List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6D28D9" />
            <Text style={styles.loadingText}>Loading attendance records...</Text>
          </View>
        ) : daysInMonth.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="calendar-blank" size={48} color="#cbd5e1" />
            <Text style={styles.emptyText}>No data available</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.listContainer}
            showsVerticalScrollIndicator={false}
          >
            {daysInMonth.map((item, index) => (
              <FadeInCard key={item.date} delay={160 + index * 60}>
                <AttendanceCard
                  item={item}
                  att={attendanceMap[item.date]}
                />
              </FadeInCard>
            ))}
            <View style={{ height: 90 }} />
          </ScrollView>
        )}
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: "#F8F7FC" },
  container: { flex: 1, padding: 16 },
  statsSection: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E8E5EF",
    shadowColor: "#6D28D9",
    shadowOpacity: 0.03,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  statIconBg: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#171717",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginTop: 2,
  },
  filterSection: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  pickerWrapper: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E8E5EF",
    overflow: "hidden",
    elevation: 1,
    shadowColor: "#6D28D9",
    shadowOpacity: 0.02,
    shadowRadius: 8,
    height: 52,
    justifyContent: "center",
  },
  picker: {
    width: "100%",
  },
  pickerItem: {
    fontSize: 14,
    color: "#171717",
    fontWeight: "600",
  },
  listContainer: { flex: 1 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1.5,
    borderLeftWidth: 5,
    overflow: "hidden",
    shadowColor: "#6D28D9",
    shadowOpacity: 0.02,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardPresent: {
    borderColor: "#DCFCE7",
    borderLeftColor: "#16A34A",
  },
  cardAbsent: {
    borderColor: "#FEE2E2",
    borderLeftColor: "#DC2626",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E8E5EF",
  },
  dateSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dayNum: {
    fontSize: 22,
    fontWeight: "800",
    color: "#171717",
  },
  dayName: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "700",
    textTransform: "uppercase",
    backgroundColor: "#F8F7FC",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E8E5EF",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusBadgePresent: {
    backgroundColor: "#F0FDF4",
    borderColor: "#DCFCE7",
  },
  statusBadgeAbsentWrap: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FEE2E2",
  },
  statusBadgeAbsent: {
    color: "#DC2626",
    fontWeight: "800",
    fontSize: 11,
    textTransform: "uppercase",
  },
  statusBadgeText: {
    color: "#16A34A",
    fontWeight: "800",
    fontSize: 11,
    textTransform: "uppercase",
  },
  timeSection: {
    padding: 14,
    backgroundColor: "#F8F7FC",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  timeItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  timeIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  punchInIcon: {
    backgroundColor: "#FFFFFF",
    borderColor: "#DCFCE7",
  },
  punchOutIcon: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E8E5EF",
  },
  timeLabel: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  timeValue: {
    fontSize: 13,
    fontWeight: "800",
    color: "#171717",
    marginTop: 2,
  },
  cardDivider: {
    width: 1,
    height: 28,
    backgroundColor: "#E8E5EF",
    marginHorizontal: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#64748B",
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    marginTop: 12,
    color: "#cbd5e1",
    fontWeight: "700",
  },
});
