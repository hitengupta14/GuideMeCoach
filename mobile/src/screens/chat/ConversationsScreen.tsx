import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { apiClient } from '../../services/api';

export default function ConversationsScreen() {
  const nav: any = useNavigation();
  const [topic, setTopic] = useState('general');
  const [title, setTitle] = useState('New Chat');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => apiClient.listConversations(),
  });

  const createMutation = useMutation({
    mutationFn: async () => apiClient.createConversation({ topic, title }),
    onSuccess: async (conv: any) => {
      await refetch();
      nav.navigate('Chat', { conversationId: conv.id, title: conv.title });
    },
  });

  const conversations: any[] = Array.isArray(data) ? data : [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Conversations</Text>
        <TouchableOpacity onPress={() => refetch()}>
          <MaterialCommunityIcons name="refresh" size={22} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.newRow}>
        <TextInput
          style={styles.input}
          placeholder="Title"
          value={title}
          onChangeText={setTitle}
        />
        <TouchableOpacity style={styles.createBtn} onPress={() => createMutation.mutate()}>
          <MaterialCommunityIcons name="plus" size={20} color="#fff" />
          <Text style={styles.createText}>New</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}><ActivityIndicator color="#007AFF" /></View>
      ) : (
        <ScrollView style={{ flex: 1 }}>
          {conversations.map((c) => (
            <TouchableOpacity key={c.id} style={styles.convRow} onPress={() => nav.navigate('Chat', { conversationId: c.id, title: c.title })}>
              <MaterialCommunityIcons name="message" size={20} color="#007AFF" />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.convTitle}>{c.title}</Text>
                <Text style={styles.convSub}>{new Date(c.updatedAt).toLocaleString()}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#999" />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#000' },
  loadingContainer: { padding: 24, alignItems: 'center' },
  convRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 16, marginTop: 12, padding: 12, borderRadius: 8 },
  convTitle: { fontSize: 16, fontWeight: '600', color: '#000' },
  convSub: { fontSize: 12, color: '#666' },
  newRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', margin: 16, padding: 12, borderRadius: 8 },
  input: { flex: 1, fontSize: 14, color: '#000', marginRight: 10 },
  createBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#007AFF', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  createText: { marginLeft: 6, color: '#fff', fontWeight: '600' },
});
