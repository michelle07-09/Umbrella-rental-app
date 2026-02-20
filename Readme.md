# ☂️ Umbrella Rental ITB

Aplikasi sewa payung di kampus ITB berbasis React Native + Expo + Supabase.

## Tech Stack
- React Native (Expo ~51)
- Supabase (Auth + Database)
- react-native-maps
- expo-location
- React Navigation (Bottom Tabs)

---

## Cara Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Supabase
1. Buka https://supabase.com/dashboard
2. Masuk ke project kamu (`ffiedmylbfsrngslqyar`)
3. Buka **SQL Editor** dan jalankan isi `supabase_setup.sql`
4. Pastikan email confirmation dimatikan untuk development:
   - Authentication → Settings → **Disable email confirmations**

### 3. Jalankan di Expo Go (Development)
```bash
npx expo start
```
Scan QR dengan Expo Go app.

### 4. Build untuk Android (Gradle Native)
```bash
# Generate android folder dengan Gradle
npx expo prebuild --platform android

# Build dan jalankan di device/emulator
npx expo run:android
```

> **Catatan:** `expo prebuild` akan generate folder `android/` dengan semua file Gradle.
> Pastikan sudah install Android Studio dan set `ANDROID_HOME` environment variable.

### 5. EAS Build (Recommended untuk Production)
```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```

---

## Struktur Project
```
umbrella-rental-app/
├── app.json              
├── App.js                
├── package.json
├── babel.config.js
├── metro.config.js
└── src/
    ├── supabase.js       
    ├── constants/
    │   └── MapData.js    
    ├── screens/
    │   ├── AuthScreen.js
    │   ├── MapScreen.js
    │   ├── ActiveRentalScreen.js
    │   ├── ProfileScreen.js
    │   ├── PaymentScreen.js       
    │   ├── PaymentSuccessScreen.js 
    │   └── SplashScreen.js        
    └── services/
        └── Whatsapp.js            
```

---

## Fitur

| Fitur | Deskripsi |
|---|---|
| 🔐 Auth | Register/Login dengan Supabase Auth |
| 🗺️ Peta ITB | react-native-maps dengan dark mode |
| 🔵 Area Hujan | Polygon biru = area tidak terlindungi |
| 🟣 Pos Satpam | Circle ungu = lokasi satpam |
| ☂️ Titik Sewa | 8 lokasi sewa di kampus ITB |
| ⏱️ Timer Live | Countdown + hitung overtime real-time |
| 💸 Auto Charge | Overtime = Rp3.000/jam otomatis |
| 💰 Saldo | Top up + deduct otomatis |
| 📋 Riwayat | History semua sewa + denda |

---

## Pricing
- Sewa 1 jam: **Rp 2.000**
- Sewa 2 jam: **Rp 4.000**
- Sewa 3 jam: **Rp 6.000**
- Denda overtime: **Rp 3.000/jam**
- Saldo awal: **Rp 10.000**