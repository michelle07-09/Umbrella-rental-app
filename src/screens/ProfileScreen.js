import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  ActivityIndicator, Alert, RefreshControl, Switch,
} from 'react-native';
import { supabase } from '../supabase';
import { useTheme } from '../context/ThemeContext';

const TOP_UP_OPTIONS = [5000, 10000, 20000, 50000];

export default function ProfileScreen({ userId }) {
  const { theme, isDark, toggleTheme } = useTheme();
  const [user, setUser] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [history, setHistory] = useState([]);
  const [spotMap, setSpotMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    const [userRes, historyRes, spotsRes, authRes] = await Promise.all([
      supabase.from('users').select('*').eq('id', userId).single(),
      supabase.from('rentals').select('*').eq('user_id', userId).order('start_time', { ascending: false }).limit(20),
      supabase.from('rental_spots').select('id, name'),
      supabase.auth.getUser(),
    ]);
    if (userRes.data) setUser(userRes.data);
    if (historyRes.data) setHistory(historyRes.data);
    if (authRes.data?.user?.email) setUserEmail(authRes.data.user.email);
    if (spotsRes.data) {
      const map = {};
      spotsRes.data.forEach(s => { map[s.id] = s.name; });
      setSpotMap(map);
    }
    setLoading(false);
    setRefreshing(false);
  }

  async function topUp(amount) {
    const { data, error } = await supabase
      .from('users').update({ balance: (user.balance || 0) + amount })
      .eq('id', userId).select().single();
    if (error) Alert.alert('Error', error.message);
    else { setUser(data); Alert.alert('Top Up Berhasil', `Rp${amount.toLocaleString('id-ID')} ditambahkan.`); }
  }

  function handleLogout() {
    Alert.alert('Keluar', 'Yakin ingin keluar?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Keluar', style: 'destructive', onPress: () => supabase.auth.signOut() },
    ]);
  }

  function getSpotName(spotId) { return spotMap[spotId] || 'Titik Sewa'; }

  function formatDate(iso) {
    return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  function getDuration(rental) {
    if (!rental.end_time) return 'Aktif';
    const ms = new Date(rental.end_time) - new Date(rental.start_time);
    return `${Math.floor(ms / 3600000)}j ${Math.floor((ms % 3600000) / 60000)}m`;
  }

  const s = makeStyles(theme);

  if (loading) return <View style={s.center}><ActivityIndicator color={theme.accent} size="large" /></View>;

  return (
    <FlatList
      style={s.container}
      data={history}
      keyExtractor={item => item.id}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={theme.accent} />
      }
      ListHeaderComponent={() => (
        <View>
          {/* Profile Card */}
          <View style={s.profileCard}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{user?.name?.[0]?.toUpperCase() || '?'}</Text>
            </View>
            <Text style={s.userName}>{user?.name}</Text>
            <Text style={s.userEmail}>{userEmail}</Text>
            <View style={s.balanceBox}>
              <Text style={s.balanceLabel}>Saldo</Text>
              <Text style={s.balanceValue}>Rp{(user?.balance || 0).toLocaleString('id-ID')}</Text>
            </View>
          </View>

          {/* Top Up */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Top Up Saldo</Text>
            <View style={s.topUpGrid}>
              {TOP_UP_OPTIONS.map(amt => (
                <TouchableOpacity key={amt} style={s.topUpBtn} onPress={() => topUp(amt)}>
                  <Text style={s.topUpText}>+Rp{amt.toLocaleString('id-ID')}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Pengaturan */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Pengaturan</Text>
            <View style={s.settingCard}>
              <View style={s.settingRow}>
                <Text style={s.settingIcon}>{isDark ? '🌙' : '☀️'}</Text>
                <View style={s.settingInfo}>
                  <Text style={s.settingLabel}>Mode Tampilan</Text>
                  <Text style={s.settingDesc}>{isDark ? 'Mode Gelap' : 'Mode Terang'}</Text>
                </View>
                <Switch
                  value={isDark}
                  onValueChange={toggleTheme}
                  trackColor={{ false: '#cbd5e1', true: '#1d4ed8' }}
                  thumbColor={isDark ? '#3b9eff' : '#f8fafc'}
                />
              </View>
            </View>
          </View>

          <Text style={s.sectionTitle}>Riwayat Sewa</Text>
        </View>
      )}
      renderItem={({ item }) => (
        <View style={[s.historyItem, !item.active && item.extra_charge > 0 && s.historyItemOvertime]}>
          <View style={s.historyLeft}>
            <Text style={s.historySpot}>☂️ {getSpotName(item.spot_id)}</Text>
            <Text style={s.historyDate}>{formatDate(item.start_time)}</Text>
            <Text style={s.historyDuration}>Durasi: {getDuration(item)}</Text>
          </View>
          <View style={s.historyRight}>
            {item.active ? (
              <View style={s.activePill}><Text style={s.activePillText}>Aktif</Text></View>
            ) : (
              <>
                <Text style={s.historyAllowed}>{item.allowed_duration}</Text>
                {item.extra_charge > 0 && <Text style={s.historyOverage}>+Rp{item.extra_charge.toLocaleString('id-ID')}</Text>}
              </>
            )}
          </View>
        </View>
      )}
      ListEmptyComponent={() => (
        <View style={s.emptyState}>
          <Text style={s.emptyEmoji}>☂️</Text>
          <Text style={s.emptyText}>Belum ada riwayat sewa</Text>
        </View>
      )}
      ListFooterComponent={() => (
        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
          <Text style={s.logoutText}>Keluar</Text>
        </TouchableOpacity>
      )}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
    />
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.bg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.bg },
    profileCard: { backgroundColor: theme.card2, borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: theme.border2 },
    avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: theme.accentDark, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    avatarText: { fontSize: 30, fontWeight: '800', color: '#fff' },
    userName: { fontSize: 20, fontWeight: '800', color: theme.text, marginBottom: 4 },
    userEmail: { fontSize: 13, color: theme.textMuted, marginBottom: 16 },
    balanceBox: { backgroundColor: theme.card, borderRadius: 14, paddingHorizontal: 28, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: theme.accentDark },
    balanceLabel: { fontSize: 12, color: theme.textSub, marginBottom: 2 },
    balanceValue: { fontSize: 26, fontWeight: '900', color: theme.accent },
    section: { marginBottom: 20 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: theme.text, marginBottom: 12 },
    topUpGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    topUpBtn: { flex: 1, minWidth: '45%', backgroundColor: theme.card2, borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: theme.accentDark },
    topUpText: { color: theme.accent, fontWeight: '700', fontSize: 14 },
    settingCard: { backgroundColor: theme.card2, borderRadius: 14, borderWidth: 1, borderColor: theme.border2 },
    settingRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
    settingIcon: { fontSize: 22 },
    settingInfo: { flex: 1 },
    settingLabel: { fontSize: 15, fontWeight: '600', color: theme.text },
    settingDesc: { fontSize: 12, color: theme.textMuted, marginTop: 2 },
    historyItem: { backgroundColor: theme.card2, borderRadius: 14, padding: 16, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: theme.border2 },
    historyItemOvertime: { borderColor: '#7f1d1d' },
    historyLeft: { flex: 1 },
    historySpot: { color: theme.text, fontWeight: '600', fontSize: 14, marginBottom: 3 },
    historyDate: { color: theme.textMuted, fontSize: 12, marginBottom: 2 },
    historyDuration: { color: theme.textMuted, fontSize: 11 },
    historyRight: { alignItems: 'flex-end' },
    historyAllowed: { color: theme.textSub, fontSize: 12 },
    historyOverage: { color: theme.danger, fontWeight: '700', fontSize: 13, marginTop: 2 },
    activePill: { backgroundColor: '#166534', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    activePillText: { color: '#86efac', fontSize: 11, fontWeight: '700' },
    emptyState: { alignItems: 'center', paddingVertical: 40 },
    emptyEmoji: { fontSize: 40, marginBottom: 12 },
    emptyText: { color: theme.textMuted, fontSize: 15 },
    logoutBtn: { marginTop: 24, backgroundColor: theme.card2, borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: theme.border2 },
    logoutText: { color: theme.danger, fontWeight: '700', fontSize: 15 },
  });
}