// attendance.js
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, ScrollView } from 'react-native';
import { MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { API } from '../../utils/api';

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const getCurrentMonthYear = () => {
  const now = new Date();
  return {
    month: now.getMonth(),
    year: now.getFullYear(),
  };
};

const AttendancePage = () => {
  const [{ month, year }, setFilter] = useState(getCurrentMonthYear());
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAttendance = async () => {
      setLoading(true);
      try {
        // Replace with your actual API endpoint
        const res = await API.get(`/api/attendance?month=${month + 1}&year=${year}`);
        setAttendance(res.data);
      } catch (err) {
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
        day: date.toLocaleDateString('en-US', { weekday: 'long' }),
        dayNum: date.getDate(),
      });
      date.setDate(date.getDate() + 1);
    }
    return days;
  };

  // Map attendance by date for quick lookup
  const attendanceMap = {};
  attendance.forEach(att => {
    attendanceMap[att.date] = att;
  });

  const daysInMonth = getDaysInMonth(month, year);

  return (
    <SafeAreaView style={styles.fullContainer}>
      <View style={styles.headerRow}>
        <MaterialCommunityIcons name="account-check" size={32} color="#1976d2" style={{ marginRight: 8 }} />
        <Text style={styles.heading}>Attendance Records</Text>
        <FontAwesome5 name="file-alt" size={28} color="#43a047" style={{ marginLeft: 8 }} />
      </View>
      <View style={styles.filterRow}>
        <Picker
          selectedValue={month}
          style={styles.picker}
          onValueChange={value => setFilter(f => ({ ...f, month: value }))}
        >
          {months.map((m, idx) => (
            <Picker.Item key={m} label={m} value={idx} />
          ))}
        </Picker>
        <Picker
          selectedValue={year}
          style={styles.picker}
          onValueChange={value => setFilter(f => ({ ...f, year: value }))}
        >
          {Array.from({ length: 5 }, (_, i) => year - i).map(y => (
            <Picker.Item key={y} label={y.toString()} value={y} />
          ))}
        </Picker>
      </View>
      <View style={styles.tableWrapper}>
        {loading ? (
          <ActivityIndicator size="large" color="#1976d2" style={{ marginTop: 20 }} />
        ) : (
          <View style={[styles.tableContainer, { width: '100%', flex: 1 }]}> 
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderCell}>Date</Text>
              <Text style={styles.tableHeaderCell}>Day</Text>
              <Text style={styles.tableHeaderCell}>Status</Text>
              <Text style={styles.tableHeaderCell}>Marked Time</Text>
            </View>
            <ScrollView style={styles.verticalScroll} contentContainerStyle={{ paddingBottom: 60 }}>
              {daysInMonth.map(item => {
                const att = attendanceMap[item.date];
                const status = att ? 'Present' : 'Not Marked';
                const markedTime = att ? att.check_in_time : '-';
                return (
                  <View style={[styles.tableRow, att ? styles.presentRow : styles.absentRow]} key={item.date}>
                    <Text style={styles.tableCell}>{item.dayNum}</Text>
                    <Text style={styles.tableCell}>{item.day}</Text>
                    <View style={styles.iconCell}>
                      {att ? (
                        <MaterialCommunityIcons name="check-circle" size={22} color="#43a047" />
                      ) : (
                        <MaterialCommunityIcons name="close-circle" size={22} color="#e53935" />
                      )}
                      <Text style={[styles.statusText, { color: att ? '#43a047' : '#e53935' }]}>{status}</Text>
                    </View>
                    <Text style={styles.tableCell}>{markedTime}</Text>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  fullContainer: {
    flex: 1,
    padding: 0,
    backgroundColor: '#fff',
  },
  tableWrapper: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 0,
    paddingTop: 0,
    justifyContent: 'center',
    height: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    marginTop: 10,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1976d2',
    textAlign: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  picker: {
    flex: 1,
    height: 50,
    marginHorizontal: 5,
  },
  tableContainer: {
    borderWidth: 1,
    borderColor: '#1976d2',
    borderRadius: 12,
    height: '100%',
    overflow: 'hidden',
    backgroundColor: '#f5faff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    flex: 1,
  },
  horizontalScroll: {
    display: 'none',
  },
  verticalScroll: {
    height: '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1976d2',
    paddingVertical: 10,
  },
  tableHeaderCell: {
    flex: 1,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#fff',
    fontSize: 16,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e3e3e3',
    paddingVertical: 10,
    alignItems: 'center',
  },
  presentRow: {
    backgroundColor: '#e8f5e9',
  },
  absentRow: {
    backgroundColor: '#ffebee',
  },
  tableCell: {
    flex: 1,
    textAlign: 'center',
    fontSize: 15,
    color: '#333',
  },
  iconCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  statusText: {
    marginLeft: 6,
    fontWeight: 'bold',
    fontSize: 15,
  },
  noRecords: {
    textAlign: 'center',
    marginTop: 30,
    color: '#888',
  },
});

export default AttendancePage;
