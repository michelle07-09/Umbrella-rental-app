import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert,
} from 'react-native';
import { supabase } from '../supabase';

const PAYMENT_METHODS = [
  {
    section: 'E-Wallet',
    items: [
      { id: 'gopay',     name: 'GoPay',     desc: 'Bayar instan via GoPay',           bgColor: '#00AED6', label: 'Go' },
      { id: 'ovo',       name: 'OVO',       desc: 'Bayar via OVO Cash',               bgColor: '#4B2D83', label: 'OVO' },
      { id: 'dana',      name: 'DANA',      desc: 'Dompet digital DANA',              bgColor: '#108EE9', label: 'DANA' },
      { id: 'shopeepay', name: 'ShopeePay', desc: 'Bayar via ShopeePay',              bgColor: '#EE4D2D', emoji: '🛍️' },
    ],
  },
  {
    section: 'QRIS',
    items: [
      { id: 'qris', name: 'QRIS', desc: 'Scan QR, semua e-wallet diterima', bgColor: '#e01f3d', emoji: '⬛' },
    ],
  },
  {
    section: 'Transfer Bank',
    items: [
      { id: 'bca',     name: 'BCA Virtual Account',     desc: 'Transfer ke VA BCA',     bgColor: '#003E8C', label: 'BCA' },
      { id: 'mandiri', name: 'Mandiri Virtual Account', desc: 'Transfer ke VA Mandiri', bgColor: '#003168', label: 'MDR', labelColor: '#FFD600' },
      { id: 'saldo',   name: 'Saldo Aplikasi',          desc: '',                        bgColor: '#1e3a5f', emoji: '💰', dynamic: true },
    ],
  },
];

export default function PaymentScreen({ route, navigation }) {
  const { spot, duration, userId, userPhone, userName, userBalance } = route.params;
  const [selected, setSelected] = useState('gopay');
  const [loading, setLoading] = useState(false);

  async function processPayment() {
    if (selected === 'saldo' && userBalance < duration.price) {
      return Alert.alert('Saldo Tidak Cukup', `Saldo Rp${userBalance.toLocaleString('id-ID')}, perlu Rp${duration.price.toLocaleString('id-ID')}.`);
    }

    setLoading(true);
    try {
      if (selected === 'saldo') {
        await supabase.from('users').update({ balance: userBalance - duration.price }).eq('id', userId);
      }

      // FIX: start_time harus diisi agar tidak null di PaymentSuccessScreen
      const startTime = new Date().toISOString();

      const { data: rental, error } = await supabase.from('rentals').insert({
        user_id: userId,
        spot_id: spot.id,
        start_time: startTime,
        allowed_duration: `${duration.hours} hours`,
        active: true,
        extra_charge: 0,
        payment_method: selected,
      }).select().single();

      if (error) throw error;

      navigation.replace('PaymentSuccess', { rental, spot, duration, method: selected, userName });
    } catch (err) {
      Alert.alert('Pembayaran Gagal', err.message);
    } finally {
      setLoading(false);
    }
  }

  function getBalance() {
    return `Saldo: Rp${(userBalance || 0).toLocaleString('id-ID')}`;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Pilih Pembayaran</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.summary}>
          <Text style={styles.summarySpot}>☂️ {spot.name} — {duration.hours} Jam</Text>
          <View style={styles.row}><Text style={styles.rowLabel}>Harga sewa</Text><Text style={styles.rowVal}>Rp{duration.price.toLocaleString('id-ID')}</Text></View>
          <View style={styles.row}><Text style={styles.rowLabel}>Saldo kamu</Text><Text style={[styles.rowVal, { color: '#22c55e' }]}>Rp{(userBalance || 0).toLocaleString('id-ID')}</Text></View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TOTAL BAYAR</Text>
            <Text style={styles.totalAmt}>Rp{duration.price.toLocaleString('id-ID')}</Text>
          </View>
        </View>

        {PAYMENT_METHODS.map(section => (
          <View key={section.section} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.section}</Text>
            {section.items.map(method => (
              <TouchableOpacity
                key={method.id}
                style={[styles.methodCard, selected === method.id && styles.methodCardActive]}
                onPress={() => setSelected(method.id)}
              >
                <View style={[styles.methodLogo, { backgroundColor: method.bgColor }]}>
                  {method.emoji
                    ? <Text style={styles.methodEmoji}>{method.emoji}</Text>
                    : <Text style={[styles.methodLabel, method.labelColor && { color: method.labelColor }]}>{method.label}</Text>}
                </View>
                <View style={styles.methodInfo}>
                  <Text style={styles.methodName}>{method.name}</Text>
                  <Text style={styles.methodDesc}>{method.dynamic ? getBalance() : method.desc}</Text>
                </View>
                <View style={[styles.radio, selected === method.id && styles.radioActive]}>
                  {selected === method.id && <View style={styles.radioDot} />}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        <View style={styles.waBox}>
          <Text style={styles.waIcon}>📱</Text>
          <Text style={styles.waText}>
            Setelah bayar, <Text style={{ color: '#25D366', fontWeight: '700' }}>konfirmasi sewa</Text> akan dikirim ke WhatsApp kamu.
          </Text>
        </View>

        <TouchableOpacity style={styles.payBtn} onPress={processPayment} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.payBtnText}>💳 Bayar Sekarang</Text>}
        </TouchableOpacity>
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05090f' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 20, paddingBottom: 0 },
  backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#0c1929', borderWidth: 1, borderColor: '#162840', alignItems: 'center', justifyContent: 'center' },
  backArrow: { fontSize: 18, color: '#dde8f5' },
  title: { fontSize: 20, fontWeight: '800', color: '#dde8f5' },
  summary: { margin: 20, backgroundColor: '#0c1929', borderRadius: 18, padding: 18, borderWidth: 1, borderColor: '#162840' },
  summarySpot: { fontSize: 16, fontWeight: '800', color: '#dde8f5', marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  rowLabel: { fontSize: 13, color: '#3d5a73' },
  rowVal: { fontSize: 13, fontWeight: '600', color: '#dde8f5' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#162840', paddingTop: 12, marginTop: 8 },
  totalLabel: { fontSize: 11, fontWeight: '700', color: '#7a9ab8', letterSpacing: 0.5 },
  totalAmt: { fontSize: 22, fontWeight: '700', color: '#3b9eff' },
  section: { paddingHorizontal: 20, marginBottom: 18 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: '#3d5a73', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  methodCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#0c1929', borderWidth: 1.5, borderColor: '#162840', borderRadius: 14, padding: 14, marginBottom: 8 },
  methodCardActive: { borderColor: '#1a7fe8', backgroundColor: 'rgba(26,127,232,0.08)' },
  methodLogo: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  methodEmoji: { fontSize: 22 },
  methodLabel: { fontSize: 11, fontWeight: '800', color: '#fff' },
  methodInfo: { flex: 1 },
  methodName: { fontSize: 14, fontWeight: '700', color: '#dde8f5' },
  methodDesc: { fontSize: 11, color: '#3d5a73', marginTop: 2 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#1e3a55', alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: '#1a7fe8', backgroundColor: '#1a7fe8' },
  radioDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#fff' },
  waBox: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', backgroundColor: 'rgba(37,211,102,0.07)', borderWidth: 1, borderColor: 'rgba(37,211,102,0.2)', borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 20 },
  waIcon: { fontSize: 22 },
  waText: { flex: 1, fontSize: 12, color: 'rgba(37,211,102,0.8)', lineHeight: 18 },
  payBtn: { marginHorizontal: 20, backgroundColor: '#1a7fe8', borderRadius: 16, padding: 17, alignItems: 'center', elevation: 6 },
  payBtnText: { color: '#fff', fontWeight: '800', fontSize: 17 },
});