import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import AppButton from '../components/AppButton';
import InputGroup from '../components/InputGroup';
import { Colors, Fonts, Shadows, Radius } from '../theme';
export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState('email');

  const handleLogin = async () => {
    if (loginMethod === 'email' && !email.trim()) { Alert.alert('Error', 'Enter email'); return; }
    if (loginMethod === 'phone' && !phone.trim()) { Alert.alert('Error', 'Enter phone'); return; }
    if (!password.trim()) { Alert.alert('Error', 'Enter password'); return; }
    setLoading(true);
    const result = await login(loginMethod === 'email' ? email.trim() : '', loginMethod === 'phone' ? phone.trim() : '', password);
    setLoading(false);
    if (!result.success) Alert.alert('Login Failed', result.message);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.emoji}>🛵</Text>
          <Text style={styles.appName}>GrocerEase</Text>
          <Text style={styles.subtitle}>Rider Partner App</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.welcome}>Welcome Back</Text>
          <View style={styles.toggleRow}>
            <AppButton title="Email" type={loginMethod === 'email' ? 'primary' : 'ghost'} size="xs" onPress={() => setLoginMethod('email')} style={{ flex: 1 }} />
            <AppButton title="Phone" type={loginMethod === 'phone' ? 'primary' : 'ghost'} size="xs" onPress={() => setLoginMethod('phone')} style={{ flex: 1 }} />
          </View>
          {loginMethod === 'email' ? <InputGroup icon="📧" placeholder="Email address" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" /> : null}
          {loginMethod === 'phone' ? <InputGroup icon="📱" placeholder="Phone number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" /> : null}
          <InputGroup icon="🔒" placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
          <AppButton title="Sign In" loading={loading} onPress={handleLogin} style={{ marginTop: 8 }} />
          <Text style={styles.footerText}>Don't have an account? <Text style={styles.link} onPress={() => navigation.navigate('Signup')}>Register</Text></Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray200 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  header: { alignItems: 'center', marginBottom: 30 },
  emoji: { fontSize: 68, marginBottom: 12 },
  appName: { fontSize: Fonts.sizes.xxl, ...Fonts.extrabold, color: Colors.gray900, letterSpacing: -0.6 },
  subtitle: { fontSize: Fonts.sizes.md, color: Colors.gray400 },
  card: { backgroundColor: Colors.white, borderRadius: Radius.xl, padding: 24, ...Shadows.md },
  welcome: { fontSize: Fonts.sizes.lg, ...Fonts.bold, textAlign: 'center', marginBottom: 16 },
  toggleRow: { flexDirection: 'row', marginBottom: 16, gap: 8 },
  footerText: { textAlign: 'center', marginTop: 16, fontSize: Fonts.sizes.sm, color: Colors.gray400 },
  link: { color: Colors.primary600, fontWeight: '600' },
});