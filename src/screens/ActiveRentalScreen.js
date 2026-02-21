import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  ActivityIndicator, Animated,
} from 'react-native';
import { supabase } from 'src/supabase';
import { OVERAGE_PRICE_PER_HOUR, RENTAL_SPOTS } from 'src/constants/mapData';

function parseAllowedHours(allowedDuration) {
  const match = String(allowedDuration).match(/(\d+)/);
  return match ? parseInt(match[1]) : 1;
}

export default function ActiveRentalScreen({ rental, userId, onRentalEnded }) {
  const [elapsed, setElapsed] = useState(0);
  const [overage, setOverage] = useState(0);
  const [loading, setLoading] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const allowedHours = parseAllowedHours(rental.allowed_duration);
  const allowedMs = allowedHours * 60 * 60 * 1000;
  const spot = RENTAL_SPOTS.find(s => s.id === rental.spot_id) || { name: 'Titik Sewa' };

  useEffect(() => {
    const interval = setInterval(() => {
      const start = new Date(rental.start_time).getTime();
      const now = Date.now();
      const diff = now - start;
      setElapsed(diff);

      if (diff > allowedMs) {
        const overMs = diff - allowedMs;
        const overHours = overMs / (1000 * 60 * 60);
        const charge = Math.ceil(overHours * OVERAGE_PRICE_PER_HOUR);
        setOverage(charge);
      }
    }, 1000);

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();

    return () => clearInterval(interval);
  }, [rental]);

  function formatTime(ms) {
    const total = Math.floor(ms / 1000);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function formatTimeLeft() {
    const remaining = allowedMs - elapsed;
    if (remaining <= 0) return 'OVERTIME';
    return formatTime(remaining);
  }

  const isOvertime = elapsed > allowedMs;
  const progress = Math.min(elapsed / allowedMs, 1);

  async function endRental() {
    Alert.alert(
      'Kembalikan Payung',
      `${overage > 0 ? `Kamu overtime, akan dikenakan denda Rp${overage.toLocaleString()}.` : 'Kamu masih dalam waktu sewa.'}\n\nKembalikan payung ke ${spot.name}?`,
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Kembalikan', style: isOvertime ? 'destructive' : 'default', onPress: confirmEndRental },
      ]
    );
  }

  async function confirmEndRental() {
    setLoading(true);
    const endTime = new Date().toISOString();

    if (overage > 0) {
      const { data: userData } = await supabase.from('users').select('balance').eq('id', userId).single();
      const newBalance = Math.max(0, (userData?.balance || 0) - overage);
      await supabase.from('users').update({ balance: newBalance }).eq('id', userId);
    }

    const { error } = await supabase.from('rentals').update({
      end_time: endTime,
      active: false,
      extra_charge: overage,
    }).eq('id', rental.id);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      onRentalEnded();
    }
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Sewa Aktif</Text>
        <View style={[styles.badge, isOvertime && styles.badgeOvertime]}>
          <Text style={styles.badgeText}>{isOvertime ? '⚠️ OVERTIME' : '✅ ON TIME'}</Text>
        </View>
      </View>

      <View style={styles.timerCard}>
        <Animated.Text style={[styles.umbrellaIcon, { transform: [{ scale: pulseAnim }] }]}>☂️</Animated.Text>
        <Text style={styles.spotName}>{spot.name}</Text>
        <Text style={styles.timerLabel}>{isOvertime ? 'Durasi Sewa' : 'Sisa Waktu'}</Text>
        <Text style={[styles.timer, isOvertime && styles.timerOvertime]}>
          {isOvertime ? formatTime(elapsed) : formatTimeLeft()}
        </Text>

        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }, isOvertime && styles.progressOvertime]} />
        </View>
        <Text style={styles.progressLabel}>
          {formatTime(Math.min(elapsed, allowedMs))} / {String(allowedHours).padStart(2, '0')}:00:00
        </Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Durasi Disewa</Text>
          <Text style={styles.statValue}>{allowedHours} Jam</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Waktu Mulai</Text>
          <Text style={styles.statValue}>
            {new Date(rental.start_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>

      {isOvertime && (
        <View style={styles.overageCard}>
          <Text style={styles.overageTitle}>⚠️ Biaya Overtime</Text>
          <Text style={styles.overageAmount}>Rp{overage.toLocaleString()}</Text>
          <Text style={styles.overageSub}>Rp3.000/jam × {((elapsed - allowedMs) / (1000 * 60 * 60)).toFixed(2)} jam</Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.returnBtn, isOvertime && styles.returnBtnOvertime]}
        onPress={endRental}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.returnBtnText}>
            {isOvertime ? `🚨 Kembalikan (+Rp${overage.toLocaleString()})` : '↩️ Kembalikan Payung'}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingTop: 8 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#f1f5f9' },
  badge: { backgroundColor: '#166534', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  badgeOvertime: { backgroundColor: '#7f1d1d' },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  timerCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  umbrellaIcon: { fontSize: 52, marginBottom: 8 },
  spotName: { fontSize: 16, color: '#94a3b8', marginBottom: 16 },
  timerLabel: { fontSize: 13, color: '#64748b', marginBottom: 6 },
  timer: { fontSize: 52, fontWeight: '900', color: '#3b82f6', letterSpacing: 2, fontVariant: ['tabular-nums'] },
  timerOvertime: { color: '#ef4444' },
  progressBar: {
    width: '100%', height: 8, backgroundColor: '#0f172a', borderRadius: 4,
    marginTop: 20, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#3b82f6', borderRadius: 4 },
  progressOvertime: { backgroundColor: '#ef4444' },
  progressLabel: { color: '#475569', fontSize: 11, marginTop: 6 },
  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statCard: {
    flex: 1, backgroundColor: '#1e293b', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: '#334155',
  },
  statLabel: { color: '#64748b', fontSize: 12, marginBottom: 6 },
  statValue: { color: '#f1f5f9', fontWeight: '700', fontSize: 16 },
  overageCard: {
    backgroundColor: '#2d1515', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: '#7f1d1d', marginBottom: 16, alignItems: 'center',
  },
  overageTitle: { color: '#fca5a5', fontSize: 13, fontWeight: '600', marginBottom: 4 },
  overageAmount: { color: '#ef4444', fontSize: 28, fontWeight: '900' },
  overageSub: { color: '#7f1d1d', fontSize: 12, marginTop: 4 },
  returnBtn: {
    backgroundColor: '#1d4ed8', borderRadius: 14, padding: 17,
    alignItems: 'center', marginTop: 'auto',
  },
  returnBtnOvertime: { backgroundColor: '#b91c1c' },
  returnBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});