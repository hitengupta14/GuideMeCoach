import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useRoute } from '@react-navigation/native';
import { apiClient } from '../../services/api';

export default function ChatScreen() {
  const route: any = useRoute();
  const { conversationId, title } = route.params || {};
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['messages', conversationId],
    enabled: !!conversationId,
    queryFn: () => apiClient.listMessages(conversationId),
  });

  const sendMutation = useMutation({
    mutationFn: async () => apiClient.addMessage(conversationId, message),
    onSuccess: async () => {
      setMessage('');
      setIsTyping(false);
      await refetch();
    },
    onMutate: () => {
      setIsTyping(true);
    },
  });

  const messages: any[] = Array.isArray(data) ? data : [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{title || 'Chat'}</Text>
        <TouchableOpacity onPress={() => refetch()}>
          <MaterialCommunityIcons name="refresh" size={22} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}><ActivityIndicator color="#007AFF" /></View>
      ) : (
        <ScrollView style={{ flex: 1, padding: 16 }}>
          {messages.map((m) => (
            <View key={m.id} style={[styles.msgBubble, m.role === 'user' ? styles.msgUser : styles.msgAI]}>
              <Text style={styles.msgText}>{m.content}</Text>
            </View>
          ))}
          {isTyping && (
            <View style={[styles.msgBubble, styles.msgAI]}>
              <View style={styles.typingIndicator}>
                <View style={styles.typingDot} />
                <View style={styles.typingDot} />
                <View style={styles.typingDot} />
              </View>
            </View>
          )}
        </ScrollView>
      )}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Type a message"
          value={message}
          onChangeText={setMessage}
        />
        <TouchableOpacity style={styles.sendBtn} onPress={() => sendMutation.mutate()} disabled={!message}>
          {sendMutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <MaterialCommunityIcons name="send" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#000' },
  loadingContainer: { padding: 24, alignItems: 'center' },
  msgBubble: { padding: 12, borderRadius: 10, marginBottom: 8 },
  msgUser: { backgroundColor: '#007AFF20', alignSelf: 'flex-end', maxWidth: '80%' },
  msgAI: { backgroundColor: '#fff', alignSelf: 'flex-start', maxWidth: '80%' },
  msgText: { fontSize: 14, color: '#000' },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderTopWidth: 1, borderTopColor: '#e0e0e0' },
  input: { flex: 1, fontSize: 14, color: '#000', marginRight: 10 },
  sendBtn: { backgroundColor: '#007AFF', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8 },
  typingIndicator: { flexDirection: 'row', gap: 4 },
  typingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#999' },
});
