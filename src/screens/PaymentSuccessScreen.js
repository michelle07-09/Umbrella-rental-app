import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Linking } from 'react-native';

const METHOD_LABELS = {
  gopay:'GoPay', ovo:'OVO', dana:'DANA', shopeepay:'ShopeePay',
  qris:'QRIS', bca:'BCA VA', mandiri:'Mandiri VA', saldo:'Saldo Aplikasi',
};
const WA_BUSINESS = '628123456789';

export default function PaymentSuccessScreen({ route, navigation }) {
  const { rental, spot, duration, method, userName } = route.params;
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const start = new Date(rental.start_time);
  const end = new Date(start.getTime() + duration.hours * 3600000);
  const fmt = d => `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  const firstName = name => name?.split(' ')[0] || 'Pengguna';

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const waMessage = [
    `Halo ${firstName(userName)}! ☂️`,
    '',
    `Sewa payungmu sudah aktif!`,
    `📍 Lokasi: ${spot.name}`,
    `⏱️ Durasi: ${duration.hours} Jam`,
    `💳 Via: ${METHOD_LABELS[method] || method}`,
    `🕐 Mulai: ${fmt(start)}`,
    '',
    `Kembalikan sebelum *${fmt(end)}* agar tidak kena denda Rp3.000/jam.`,
    '',
    `Umbrella Rental ITB 🙏`,
  ].join('\n');

  function openWA() {
    Linking.openURL(`https://wa.me/${WA_BUSINESS}?text=${encodeURIComponent(waMessage)}`);
  }

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.checkCircle, { transform: [{ scale }] }]}>
        <Text style={styles.checkEmoji}>✅</Text>
      </Animated.View>

      <Text style={styles.title}>Pembayaran Berhasil!</Text>
      <Text style={styles.sub}>
        Sewa payung di{'\n'}
        <Text style={styles.highlight}>{spot.name}</Text> telah aktif.
      </Text>

      <Animated.View style={[styles.waCard, { opacity }]}>
        <View style={styles.waHeader}>
          <View style={styles.waDot} />
          <Text style={styles.waHeaderText}>WhatsApp Business — Terkirim</Text>
        </View>
        <View style={styles.waBubble}>
          <Text style={styles.waText}>
            Halo {firstName(userName)}! ☂️{'\n\n'}
            Sewa payungmu sudah aktif!{'\n'}
            📍 Lokasi: {spot.name}{'\n'}
            ⏱️ Durasi: {duration.hours} Jam{'\n'}
            💳 Via: {METHOD_LABELS[method] || method}{'\n'}
            🕐 Mulai: {fmt(start)}{'\n\n'}
            Kembalikan sebelum{' '}
            <Text style={styles.waTextBold}>{fmt(end)}</Text>
            {' '}agar tidak kena denda.{'\n\n'}
            Terima kasih sudah menggunakan Umbrella Rental ITB 🙏
          </Text>
          <Text style={styles.waTime}>{fmt(start)} ✓✓</Text>
        </View>
        <TouchableOpacity style={styles.openWaBtn} onPress={openWA}>
          <Text style={styles.openWaText}>📱 Buka di WhatsApp</Text>
        </TouchableOpacity>
      </Animated.View>

      <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.replace('Main')}>
        <Text style={styles.doneBtnText}>Mulai Pantau Timer →</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05090f', alignItems: 'center', justifyContent: 'center', padding: 24 },
  checkCircle: { width: 96, height: 96, borderRadius: 48, backgroundColor: 'rgba(34,197,94,0.12)', borderWidth: 2, borderColor: 'rgba(34,197,94,0.3)', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  checkEmoji: { fontSize: 46 },
  title: { fontSize: 22, fontWeight: '800', color: '#dde8f5', marginBottom: 8 },
  sub: { fontSize: 14, color: '#7a9ab8', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  highlight: { color: '#3b9eff', fontWeight: '700' },
  waCard: { width: '100%', backgroundColor: 'rgba(37,211,102,0.07)', borderWidth: 1, borderColor: 'rgba(37,211,102,0.22)', borderRadius: 16, padding: 16, marginBottom: 20 },
  waHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  waDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#25D366' },
  waHeaderText: { fontSize: 12, fontWeight: '700', color: '#25D366' },
  waBubble: { backgroundColor: 'rgba(37,211,102,0.1)', borderRadius: '10px 10px 10px 2px', borderRadius: 12, padding: 12 },
  waText: { fontSize: 12, color: 'rgba(220,255,230,0.85)', lineHeight: 18 },
  waTextBold: { fontWeight: '700', color: '#4ade80' },
  waTime: { fontSize: 10, color: 'rgba(37,211,102,0.5)', textAlign: 'right', marginTop: 4 },
  openWaBtn: { marginTop: 10, backgroundColor: 'rgba(37,211,102,0.15)', borderRadius: 10, padding: 10, alignItems: 'center' },
  openWaText: { fontSize: 13, fontWeight: '700', color: '#25D366' },
  doneBtn: { width: '100%', backgroundColor: '#1a7fe8', borderRadius: 16, padding: 16, alignItems: 'center', shadowColor: '#1a7fe8', shadowOpacity: 0.35, shadowRadius: 20, elevation: 6 },
  doneBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});