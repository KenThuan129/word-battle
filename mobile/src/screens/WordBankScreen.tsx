import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function WordBankScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📚 Word Bank</Text>
        <Text style={styles.subtitle}>
          Your collected vocabulary
        </Text>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.placeholder}>
          Word Bank implementation coming soon...
        </Text>
        <Text style={styles.note}>
          This will use the shared word bank logic and dictionary API from the web app.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  content: {
    padding: 20,
  },
  placeholder: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 40,
  },
  note: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 16,
  },
});

