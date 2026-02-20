import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { supabase } from '../supabase';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!email || !password) return Alert.alert('Error', 'Email dan password wajib diisi.');
    setLoading(true);

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) Alert.alert('Login Gagal', error.message);
    } else {
      if (!name) return Alert.alert('Error', 'Nama wajib diisi.');
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        Alert.alert('Register Gagal', error.message);
      } else if (data.user) {
        const { error: insertError } = await supabase.from('users').insert({
          id: data.user.id,
          name,
          balance: 10000,
        });
        if (insertError) Alert.alert('Error', insertError.message);
      }
    }
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.logo}>☂️</Text>
        <Text style={styles.title}>Umbrella Rental ITB</Text>
        <Text style={styles.subtitle}>{isLogin ? 'Masuk ke akun kamu' : 'Buat akun baru'}</Text>

        {!isLogin && (
          <TextInput
            style={styles.input}
            placeholder="Nama Lengkap"
            placeholderTextColor="#64748b"
            value={name}
            onChangeText={setName}
          />
        )}
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#64748b"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#64748b"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.btn} onPress={handleSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>{isLogin ? 'Masuk' : 'Daftar'}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
          <Text style={styles.switchText}>
            {isLogin ? 'Belum punya akun? Daftar' : 'Sudah punya akun? Masuk'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  logo: { fontSize: 52, marginBottom: 8 },
  title: { fontSize: 22, fontWeight: '800', color: '#f1f5f9', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#94a3b8', marginBottom: 24 },
  input: {
    width: '100%',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    color: '#f1f5f9',
    padding: 14,
    marginBottom: 12,
    fontSize: 15,
  },
  btn: {
    width: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  switchText: { color: '#60a5fa', fontSize: 14 },
});