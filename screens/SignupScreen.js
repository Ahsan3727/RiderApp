import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import AppButton from '../components/AppButton';
import InputGroup from '../components/InputGroup';
import { Colors, Fonts, Shadows, Radius } from '../theme';
export default function SignupScreen({ navigation }) {
  const { signup } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [vehicleColor, setVehicleColor] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const handleSignup = async () => {
    if (step === 1) {
      if (!name.trim() || !email.trim() || !phone.trim()) { Alert.alert('Error', 'Fill all personal details'); return; }
      if (password.length < 6) { Alert.alert('Error', 'Password must be at least 6 characters'); return; }
      if (password !== confirmPassword) { Alert.alert('Error', 'Passwords do not match'); return; }
      setStep(2);
      return;
    }
    if (!vehicleType.trim() || !plateNumber.trim()) { Alert.alert('Error', 'Fill vehicle details'); return; }
    setLoading(true);
    const result = await signup(name.trim(), email.trim(), phone.trim(), password, { type: vehicleType.trim(), plateNumber: plateNumber.trim(), color: vehicleColor.trim() || 'N/A' });
    setLoading(false);
    if (!result.success) Alert.alert('Signup Failed', result.message);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.emoji}>🛵</Text>
        <Text style={styles.title}>Join GrocerEase</Text>
        <Text style={styles.subtitle}>Create your rider account</Text>
        <View style={styles.card}>
          <View style={styles.stepRow}>
            {[1,2].map(i => <View key={i} style={[styles.stepDot, step === i && styles.activeDot]} />)}
          </View>
          {step === 1 ? (
            <>
              <InputGroup icon="👤" placeholder="Full Name" value={name} onChangeText={setName} />
              <InputGroup icon="📧" placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
              <InputGroup icon="📱" placeholder="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
              <InputGroup icon="🔒" placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
              <InputGroup icon="🔒" placeholder="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
              <AppButton title="Next → Vehicle Details" onPress={handleSignup} />
            </>
          ) : (
            <>
              <InputGroup icon="🏍️" placeholder="Vehicle Type (e.g. Motorcycle)" value={vehicleType} onChangeText={setVehicleType} />
              <InputGroup icon="🚦" placeholder="Plate Number (e.g. ABC-1234)" value={plateNumber} onChangeText={setPlateNumber} />
              <InputGroup icon="🎨" placeholder="Vehicle Color" value={vehicleColor} onChangeText={setVehicleColor} />
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <AppButton title="← Back" type="outline" style={{ flex: 1 }} onPress={() => setStep(1)} />
                <AppButton title="Create Account" loading={loading} onPress={handleSignup} style={{ flex: 2 }} />
              </View>
            </>
          )}
          <Text style={styles.footerText}>Already have an account? <Text style={styles.link} onPress={() => navigation.navigate('Login')}>Login</Text></Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray200 },
  scrollContent: { padding: 20, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 60, marginBottom: 12 },
  title: { fontSize: Fonts.sizes.xxl, ...Fonts.extrabold, color: Colors.gray900 },
  subtitle: { fontSize: Fonts.sizes.md, color: Colors.gray400, marginBottom: 20 },
  card: { backgroundColor: Colors.white, borderRadius: Radius.xl, padding: 24, width: '100%', ...Shadows.md },
  stepRow: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginBottom: 16 },
  stepDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.gray200 },
  activeDot: { backgroundColor: Colors.primary600 },
  footerText: { textAlign: 'center', marginTop: 16, fontSize: Fonts.sizes.sm, color: Colors.gray400 },
  link: { color: Colors.primary600, fontWeight: '600' },
});