import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
  ActivityIndicator, Alert,
} from 'react-native';
import MapView, { Marker, Polygon, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { supabase } from 'src/supabase';
import {
  ITB_CENTER, RAIN_RISK_ZONES, SECURITY_POSTS, DURATION_OPTIONS,
} from 'src/constants/mapData';

export default function MapScreen({ userId, onRentalStarted, activeRental }) {
  const [location, setLocation] = useState(null);
  const [spots, setSpots] = useState([]);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [selectedDuration, setSelectedDuration] = useState(DURATION_OPTIONS[0]);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userBalance, setUserBalance] = useState(0);
  const mapRef = useRef(null);

  useEffect(() => {
    getUserLocation();
    fetchBalance();
    fetchSpots();
  }, []);

  async function getUserLocation() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    setLocation(loc.coords);
  }

  async function fetchBalance() {
    const { data } = await supabase.from('users').select('balance').eq('id', userId).single();
    if (data) setUserBalance(data.balance);
  }

  async function fetchSpots() {
    const { data, error } = await supabase.from('rental_spots').select('*');
    if (error) Alert.alert('Error', error.message);
    else setSpots(data || []);
  }

  function handleSpotPress(spot) {
    if (activeRental) {
      Alert.alert('Rental Aktif', 'Kembalikan payung dulu sebelum sewa lagi.');
      return;
    }
    setSelectedSpot(spot);
    setSelectedDuration(DURATION_OPTIONS[0]);
    setModalVisible(true);
  }

  async function startRental() {
    if (userBalance < selectedDuration.price) {
      Alert.alert('Saldo Tidak Cukup', `Saldo Rp${userBalance.toLocaleString('id-ID')}, butuh Rp${selectedDuration.price.toLocaleString('id-ID')}.`);
      return;
    }
    setLoading(true);

    const { error: balError } = await supabase
      .from('users')
      .update({ balance: userBalance - selectedDuration.price })
      .eq('id', userId);

    if (balError) { Alert.alert('Error', balError.message); setLoading(false); return; }

    const { data, error } = await supabase.from('rentals').insert({
      user_id: userId,
      spot_id: selectedSpot.id,
      allowed_duration: `${selectedDuration.hours} hours`,
      active: true,
      extra_charge: 0,
      payment_method: 'saldo',
    }).select().single();

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setModalVisible(false);
      setUserBalance(prev => prev - selectedDuration.price);
      onRentalStarted(data);
    }
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={ITB_CENTER}
        showsUserLocation={!!location}
        showsMyLocationButton={false}
        customMapStyle={darkMapStyle}
      >
        {RAIN_RISK_ZONES.map(zone => (
          <Polygon
            key={zone.id}
            coordinates={zone.coordinates}
            fillColor="rgba(59,130,246,0.2)"
            strokeColor="rgba(59,130,246,0.8)"
            strokeWidth={2}
          />
        ))}

        {SECURITY_POSTS.map(post => (
          <Circle
            key={post.id}
            center={{ latitude: post.latitude, longitude: post.longitude }}
            radius={40}
            fillColor="rgba(168,85,247,0.25)"
            strokeColor="rgba(168,85,247,0.9)"
            strokeWidth={2}
          />
        ))}

        {SECURITY_POSTS.map(post => (
          <Marker
            key={`sec-${post.id}`}
            coordinate={{ latitude: post.latitude, longitude: post.longitude }}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.securityMarker}>
              <Text style={styles.securityEmoji}>🛡️</Text>
            </View>
          </Marker>
        ))}

        {spots.map(spot => (
          <Marker
            key={spot.id}
            coordinate={{ latitude: spot.latitude, longitude: spot.longitude }}
            onPress={() => handleSpotPress(spot)}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={[styles.spotMarker, activeRental && styles.spotMarkerDisabled]}>
              <Text style={styles.spotEmoji}>☂️</Text>
              <Text style={styles.spotCount}>{spot.umbrellas}</Text>
            </View>
          </Marker>
        ))}
      </MapView>

      <View style={styles.legend}>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: 'rgba(59,130,246,0.7)' }]} />
          <Text style={styles.legendText}>Area Rawan Hujan</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: 'rgba(168,85,247,0.7)' }]} />
          <Text style={styles.legendText}>Pos Satpam</Text>
        </View>
        <View style={styles.legendRow}>
          <Text style={styles.legendEmoji}>☂️</Text>
          <Text style={styles.legendText}>Titik Sewa</Text>
        </View>
      </View>

      {activeRental && (
        <View style={styles.activeBanner}>
          <Text style={styles.activeBannerText}>🕐 Sewa Aktif — Lihat di tab Sewa</Text>
        </View>
      )}

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>☂️ {selectedSpot?.name}</Text>
            <Text style={styles.modalSub}>Tersedia: {selectedSpot?.umbrellas} payung</Text>

            <Text style={styles.sectionLabel}>Pilih Durasi</Text>
            <View style={styles.durationRow}>
              {DURATION_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.hours}
                  style={[styles.durationBtn, selectedDuration.hours === opt.hours && styles.durationBtnActive]}
                  onPress={() => setSelectedDuration(opt)}
                >
                  <Text style={[styles.durationLabel, selectedDuration.hours === opt.hours && styles.durationLabelActive]}>
                    {opt.label}
                  </Text>
                  <Text style={[styles.durationPrice, selectedDuration.hours === opt.hours && styles.durationLabelActive]}>
                    Rp{opt.price.toLocaleString('id-ID')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Saldo kamu</Text>
              <Text style={styles.infoValue}>Rp{userBalance.toLocaleString('id-ID')}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Biaya sewa</Text>
              <Text style={styles.infoValue}>Rp{selectedDuration.price.toLocaleString('id-ID')}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Denda overtime</Text>
              <Text style={[styles.infoValue, { color: '#f87171' }]}>Rp3.000/jam</Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={startRental} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmBtnText}>Pilih Pembayaran →</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  spotMarker: { backgroundColor: '#1e3a5f', borderRadius: 10, padding: 6, alignItems: 'center', borderWidth: 2, borderColor: '#3b82f6', minWidth: 44 },
  spotMarkerDisabled: { borderColor: '#475569', opacity: 0.6 },
  spotEmoji: { fontSize: 16 },
  spotCount: { fontSize: 10, color: '#93c5fd', fontWeight: '700', marginTop: 1 },
  securityMarker: { backgroundColor: 'rgba(88,28,135,0.8)', borderRadius: 8, padding: 4, borderWidth: 1.5, borderColor: '#a855f7' },
  securityEmoji: { fontSize: 14 },
  legend: { position: 'absolute', top: 50, left: 12, backgroundColor: 'rgba(15,23,42,0.88)', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#334155' },
  legendRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  legendDot: { width: 12, height: 12, borderRadius: 6, marginRight: 6 },
  legendEmoji: { fontSize: 12, marginRight: 6 },
  legendText: { color: '#cbd5e1', fontSize: 11 },
  activeBanner: { position: 'absolute', bottom: 10, left: 16, right: 16, backgroundColor: '#1d4ed8', borderRadius: 12, padding: 12, alignItems: 'center' },
  activeBannerText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#1e293b', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, borderTopWidth: 1, borderColor: '#334155' },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#f1f5f9', marginBottom: 4 },
  modalSub: { fontSize: 13, color: '#64748b', marginBottom: 20 },
  sectionLabel: { fontSize: 13, color: '#94a3b8', fontWeight: '600', marginBottom: 10 },
  durationRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  durationBtn: { flex: 1, backgroundColor: '#0f172a', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1.5, borderColor: '#334155' },
  durationBtnActive: { borderColor: '#3b82f6', backgroundColor: '#1e3a5f' },
  durationLabel: { color: '#94a3b8', fontWeight: '700', fontSize: 13 },
  durationPrice: { color: '#64748b', fontSize: 11, marginTop: 2 },
  durationLabelActive: { color: '#93c5fd' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  infoLabel: { color: '#64748b', fontSize: 14 },
  infoValue: { color: '#f1f5f9', fontWeight: '600', fontSize: 14 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelBtn: { flex: 1, backgroundColor: '#0f172a', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  cancelBtnText: { color: '#94a3b8', fontWeight: '600' },
  confirmBtn: { flex: 2, backgroundColor: '#3b82f6', borderRadius: 12, padding: 14, alignItems: 'center' },
  confirmBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#1a2035' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8892b0' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a2035' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#243555' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#2d4a7a' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0a1628' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#1e2d4a' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#1a3328' }] },
];