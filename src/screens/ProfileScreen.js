import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { supabase } from 'src/supabase';
import { RENTAL_SPOTS } from 'src/constants/mapData';

const TOP_UP_OPTIONS = [5000, 10000, 20000, 50000];

export default function ProfileScreen({ userId }) {
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const [userRes, historyRes] = await Promise.all([
      supabase.from('users').select('*').eq('id', userId).single(),
      supabase.from('rentals').select('*').eq('user_id', userId).order('start_time', { ascending: false }).limit(20),
    ]);
    if (userRes.data) setUser(userRes.data);
    if (historyRes.data) setHistory(historyRes.data);
    setLoading(false);
    setRefreshing(false);
  }

  async function topUp(amount) {
    const { data, error } = await supabase
      .from('users')
      .update({ balance: (user.balance || 0) + amount })
      .eq('id', userId)
      .select()
      .single();
    if (error) Alert.alert('Error', error.message);
    else {
      setUser(data);
      Alert.alert('Top Up Berhasil', `Rp${amount.toLocaleString()} telah ditambahkan.`);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  function getSpotName(spotId) {
    return RENTAL_SPOTS.find(s => s.id === spotId)?.name || spotId;
  }

  function formatDate(iso) {
    return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  function getDuration(rental) {
    if (!rental.end_time) return 'Aktif';
    const ms = new Date(rental.end_time) - new Date(rental.start_time);
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return `${h}j ${m}m`;
  }

  if (loading) return <View style={styles.center}><ActivityIndicator color="#3b82f6" size="large" /></View>;

  return (
    <FlatList
      style={styles.container}
      data={history}
      keyExtractor={item => item.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#3b82f6" />}
      ListHeaderComponent={() => (
        <View>
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() || '?'}</Text>
            </View>
            <Text style={styles.userName}>{user?.name}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <View style={styles.balanceBox}>
              <Text style={styles.balanceLabel}>Saldo</Text>
              <Text style={styles.balanceValue}>Rp{(user?.balance || 0).toLocaleString()}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Up Saldo</Text>
            <View style={styles.topUpGrid}>
              {TOP_UP_OPTIONS.map(amt => (
                <TouchableOpacity key={amt} style={styles.topUpBtn} onPress={() => topUp(amt)}>
                  <Text style={styles.topUpText}>+Rp{amt.toLocaleString()}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Text style={styles.sectionTitle}>Riwayat Sewa</Text>
        </View>
      )}
      renderItem={({ item }) => (
        <View style={[styles.historyItem, !item.active && item.extra_charge > 0 && styles.historyItemOvertime]}>
          <View style={styles.historyLeft}>
            <Text style={styles.historySpot}>☂️ {getSpotName(item.spot_id)}</Text>
            <Text style={styles.historyDate}>{formatDate(item.start_time)}</Text>
            <Text style={styles.historyDuration}>Durasi: {getDuration(item)}</Text>
          </View>
          <View style={styles.historyRight}>
            {item.active ? (
              <View style={styles.activePill}><Text style={styles.activePillText}>Aktif</Text></View>
            ) : (
              <>
                <Text style={styles.historyAllowed}>{item.allowed_duration}</Text>
                {item.extra_charge > 0 && (
                  <Text style={styles.historyOverage}>+Rp{item.extra_charge.toLocaleString()}</Text>
                )}
              </>
            )}
          </View>
        </View>
      )}
      ListEmptyComponent={() => (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>☂️</Text>
          <Text style={styles.emptyText}>Belum ada riwayat sewa</Text>
        </View>
      )}
      ListFooterComponent={() => (
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Keluar</Text>
        </TouchableOpacity>
      )}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  profileCard: {
    backgroundColor: '#1e293b', borderRadius: 20, padding: 24,
    alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: '#334155',
  },
  avatar: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: '#1d4ed8',
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  avatarText: { fontSize: 30, fontWeight: '800', color: '#fff' },
  userName: { fontSize: 20, fontWeight: '800', color: '#f1f5f9', marginBottom: 4 },
  userEmail: { fontSize: 13, color: '#64748b', marginBottom: 16 },
  balanceBox: {
    backgroundColor: '#0f172a', borderRadius: 14, paddingHorizontal: 28,
    paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: '#1d4ed8',
  },
  balanceLabel: { fontSize: 12, color: '#94a3b8', marginBottom: 2 },
  balanceValue: { fontSize: 26, fontWeight: '900', color: '#60a5fa' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#f1f5f9', marginBottom: 12 },
  topUpGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  topUpBtn: {
    flex: 1, minWidth: '45%', backgroundColor: '#1e293b', borderRadius: 12, padding: 14,
    alignItems: 'center', borderWidth: 1, borderColor: '#1d4ed8',
  },
  topUpText: { color: '#60a5fa', fontWeight: '700', fontSize: 14 },
  historyItem: {
    backgroundColor: '#1e293b', borderRadius: 14, padding: 16, marginBottom: 10,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: '#334155',
  },
  historyItemOvertime: { borderColor: '#7f1d1d' },
  historyLeft: { flex: 1 },
  historySpot: { color: '#f1f5f9', fontWeight: '600', fontSize: 14, marginBottom: 3 },
  historyDate: { color: '#64748b', fontSize: 12, marginBottom: 2 },
  historyDuration: { color: '#475569', fontSize: 11 },
  historyRight: { alignItems: 'flex-end' },
  historyAllowed: { color: '#94a3b8', fontSize: 12 },
  historyOverage: { color: '#f87171', fontWeight: '700', fontSize: 13, marginTop: 2 },
  activePill: { backgroundColor: '#166534', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  activePillText: { color: '#86efac', fontSize: 11, fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyText: { color: '#475569', fontSize: 15 },
  logoutBtn: {
    marginTop: 24, backgroundColor: '#1e293b', borderRadius: 14, padding: 16,
    alignItems: 'center', borderWidth: 1, borderColor: '#334155',
  },
  logoutText: { color: '#f87171', fontWeight: '700', fontSize: 15 },
});