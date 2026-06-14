import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../theme/theme';

export default function ReportIssueScreen({ navigation }) {
  const [reason, setReason] = useState('');

  const submit = () => {
    // Later: API call
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Report Issue</Text>
      <TextInput style={styles.input} placeholder="Describe the issue" value={reason} onChangeText={setReason} multiline />
      <TouchableOpacity style={styles.btn} onPress={submit}>
        <Text style={styles.btnText}>Submit</Text>
      </TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex:1, padding:16, backgroundColor:Colors.background },
  title: { fontSize:22, fontWeight:'bold', marginBottom:16 },
  input: { backgroundColor:Colors.white, padding:12, borderRadius:8, height:100, marginBottom:16, borderWidth:1, borderColor:Colors.lightGray },
  btn: { backgroundColor:Colors.primary, padding:14, borderRadius:8, alignItems:'center' },
  btnText: { color:Colors.white, fontWeight:'bold' }
});
