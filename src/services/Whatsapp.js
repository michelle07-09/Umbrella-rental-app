import { Linking } from 'react-native';
import { supabase } from '../supabase';

const WA_BUSINESS_NUMBER = '628123456789'; // Ganti dengan nomor WA Business kamu

const METHOD_LABELS = {
  gopay: 'GoPay', ovo: 'OVO', dana: 'DANA', shopeepay: 'ShopeePay',
  qris: 'QRIS', bca: 'BCA Virtual Account', mandiri: 'Mandiri VA', saldo: 'Saldo Aplikasi',
};

function fmt(d) {
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

function pad(n) { return String(n).padStart(2, '0'); }

function fmtDuration(ms) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `${h} jam ${m} menit` : `${m} menit`;
}

function firstName(name) { return name?.split(' ')[0] || 'Pengguna'; }

// ─── Kiriman awal saat sewa dimulai ─────────────────────────────────────────
export function buildRentalStartMessage({ userName, spotName, hours, method, startTime }) {
  const start = new Date(startTime);
  const end = new Date(start.getTime() + hours * 3600000);
  return [
    `Halo ${firstName(userName)}! ☂️`,
    '',
    `*Sewa payungmu sudah aktif!*`,
    `📍 Lokasi: ${spotName}`,
    `⏱️ Durasi: ${hours} Jam`,
    `💳 Via: ${METHOD_LABELS[method] || method}`,
    `🕐 Mulai: ${fmt(start)}`,
    '',
    `Kembalikan payung sebelum *${fmt(end)}* agar tidak kena denda Rp3.000/jam.`,
    `Pantau timer real-time di aplikasi ya! 📱`,
    '',
    `Terima kasih sudah menggunakan Umbrella Rental ITB 🙏`,
  ].join('\n');
}

// ─── Pengingat 15 menit sebelum habis ───────────────────────────────────────
export function buildReminderMessage({ userName, spotName, endTime }) {
  const end = new Date(endTime);
  return [
    `⏰ *Pengingat Sewa Payung*`,
    '',
    `Halo ${firstName(userName)}!`,
    `Sewa payungmu di *${spotName}* akan berakhir dalam *15 menit* (pukul ${fmt(end)}).`,
    '',
    `Segera kembalikan payung untuk menghindari denda Rp3.000/jam!`,
    '',
    `Umbrella Rental ITB ☂️`,
  ].join('\n');
}

// ─── Struk setelah pengembalian ──────────────────────────────────────────────
export function buildReceiptMessage({ userName, spotName, startTime, endTime, hours, method, fine }) {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const duration = fmtDuration(end - start);
  return [
    `🧾 *Struk Pengembalian Payung*`,
    '',
    `Halo ${firstName(userName)}, terima kasih telah menggunakan layanan kami!`,
    '',
    `📍 Titik Sewa: ${spotName}`,
    `🕐 Waktu Mulai: ${fmt(start)}`,
    `🕔 Waktu Selesai: ${fmt(end)}`,
    `⏱️ Total Durasi: ${duration}`,
    `💳 Metode Bayar: ${METHOD_LABELS[method] || method}`,
    fine > 0 ? `⚠️ Denda Overtime: Rp${fine.toLocaleString('id-ID')}` : `✅ Tidak Ada Denda`,
    '',
    `Sampai jumpa lagi! ☂️ Tetap kering di kampus.`,
    '',
    `Umbrella Rental ITB`,
  ].join('\n');
}

// ─── Kirim ke WA (Deep link — buka WA di device user) ───────────────────────
export async function sendWhatsApp(phone, message, type = 'info') {
  const cleanPhone = phone?.replace(/\D/g,'').replace(/^0/,'62') || WA_BUSINESS_NUMBER;
  const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

  try {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
      return { success: true };
    }
    return { success: false, reason: 'WhatsApp not installed' };
  } catch (err) {
    return { success: false, reason: err.message };
  }
}

// ─── Log notifikasi ke Supabase ──────────────────────────────────────────────
export async function logNotification({ userId, rentalId, phone, message, type }) {
  try {
    await supabase.from('wa_notifications').insert({
      user_id: userId,
      rental_id: rentalId,
      phone,
      message,
      type,
      sent_at: new Date().toISOString(),
    });
  } catch (_) {}
}

// ─── Kirim konfirmasi sewa ───────────────────────────────────────────────────
export async function sendRentalConfirmation({ userId, rentalId, userName, userPhone, spotName, hours, method, startTime }) {
  const message = buildRentalStartMessage({ userName, spotName, hours, method, startTime });
  await logNotification({ userId, rentalId, phone: userPhone, message, type: 'rental_start' });
  return sendWhatsApp(userPhone, message, 'rental_start');
}

// ─── Kirim struk pengembalian ────────────────────────────────────────────────
export async function sendReturnReceipt({ userId, rentalId, userName, userPhone, spotName, startTime, endTime, hours, method, fine }) {
  const message = buildReceiptMessage({ userName, spotName, startTime, endTime, hours, method, fine });
  await logNotification({ userId, rentalId, phone: userPhone, message, type: 'receipt' });
  return sendWhatsApp(userPhone, message, 'receipt');
}