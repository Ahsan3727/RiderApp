import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../theme/theme';

export default function ChatScreen({ route }) {
  const { role } = route.params || {};
  const [messages, setMessages] = useState([
    { text: `${role === 'wholesaler' ? 'Wholesaler' : 'Customer'}: Hello!`, from: 'other' }
  ]);
  const [input, setInput] = useState('');

  const send = () => {
    if (!input) return;
    setMessages(prev => [...prev, { text: input, from: 'me' }]);
    setInput('');
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.from === 'me' ? styles.me : styles.other]}>
            <Text>{item.text}</Text>
          </View>
        )}
      />
      <View style={styles.inputRow}>
        <TextInput style={styles.input} value={input} onChangeText={setInput} placeholder="Message..." />
        <TouchableOpacity onPress={send} style={styles.sendBtn}>
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:Colors.background, padding:8 },
  bubble: { padding:10, borderRadius:10, marginVertical:4, maxWidth:'80%' },
  me: { alignSelf:'flex-end', backgroundColor:'#DCF8C6' },
  other: { alignSelf:'flex-start', backgroundColor:Colors.white },
  inputRow: { flexDirection:'row', alignItems:'center', marginTop:8 },
  input: { flex:1, backgroundColor:Colors.white, borderRadius:20, paddingHorizontal:12, paddingVertical:8, borderWidth:1, borderColor:Colors.lightGray },
  sendBtn: { backgroundColor:Colors.primary, borderRadius:20, paddingHorizontal:16, paddingVertical:8, marginLeft:8 },
  sendText: { color:Colors.white, fontWeight:'bold' }
});
