import { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput as RNTextInput,
  StatusBar,
  Alert,
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../../src/services/api';
import type { Booking } from '../../../src/types';
import { brandColors } from '../../../src/theme';

// ── Componente de estrellas ────────────────────────────────
function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <View style={star.row}>
      {[1, 2, 3, 4, 5].map((n) => (
        <TouchableOpacity key={n} onPress={() => onChange(n)} activeOpacity={0.7}>
          <MaterialCommunityIcons
            name={n <= value ? 'star' : 'star'}
            size={36}
            color={n <= value ? '#FFD700' : '#333'}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const star = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },
});

// ── helper color avatar ───────────────────────────────────
function getAvatarColor(id: string): string {
  const colors = ['#c8956c', '#4caf50', '#c2185b', '#1976d2', '#ff9800', '#00bcd4', '#5d4037'];
  const n = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return colors[n % colors.length];
}

// ── Pantalla ──────────────────────────────────────────────
export default function ResenaScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const router = useRouter();

  const [calidad, setCalidad]       = useState(5);
  const [puntualidad, setPuntualidad] = useState(5);
  const [precio, setPrecio]         = useState(5);
  const [comment, setComment]       = useState('');
  const [loading, setLoading]       = useState(false);

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: async () => {
      const { data } = await api.get<Booking>(`/bookings/${bookingId}`);
      return data;
    },
  });

  const partner   = booking?.service?.partner;
  const partnerId = partner?.id ?? '';
  const initial   = (partner?.name ?? '?').charAt(0).toUpperCase();
  const avatarColor = getAvatarColor(partnerId);

  const handleEnviar = async () => {
    if (!partnerId) return;
    setLoading(true);
    try {
      const ratingAvg = Math.round((calidad + puntualidad + precio) / 3);
      await api.post('/reviews', {
        bookingId,
        partnerId,
        rating: ratingAvg,
        comment: comment.trim() || undefined,
      });
      Alert.alert('¡Gracias!', 'Tu reseña fue enviada con éxito.', [
        { text: 'OK', onPress: () => router.replace('/(user)/turnos') },
      ]);
    } catch {
      Alert.alert('Error', 'No se pudo enviar la reseña. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={brandColors.secondary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Avatar del negocio ── */}
        <View style={styles.avatarWrapper}>
          <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          {partner?.name ? (
            <Text style={styles.partnerName}>{partner.name}</Text>
          ) : null}
        </View>

        {/* ── Calidad ── */}
        <View style={styles.ratingBlock}>
          <Text style={styles.ratingLabel}>Calidad</Text>
          <StarRating value={calidad} onChange={setCalidad} />
        </View>

        {/* ── Puntualidad ── */}
        <View style={styles.ratingBlock}>
          <Text style={styles.ratingLabel}>Puntualidad</Text>
          <StarRating value={puntualidad} onChange={setPuntualidad} />
        </View>

        {/* ── Precio ── */}
        <View style={styles.ratingBlock}>
          <Text style={styles.ratingLabel}>Precio</Text>
          <StarRating value={precio} onChange={setPrecio} />
        </View>

        {/* ── Comentario ── */}
        <View style={styles.commentBlock}>
          <Text style={styles.commentTitle}>Dejá tu opinión!</Text>
          <RNTextInput
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={4}
            placeholder="Escribí tu opinión (opcional)"
            placeholderTextColor="#bbb"
            style={styles.textarea}
            textAlignVertical="top"
          />
        </View>

        {/* ── Botón enviar ── */}
        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleEnviar}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={styles.btnText}>Enviar</Text>
          }
        </TouchableOpacity>

      </ScrollView>
    </>
  );
}

// ── Estilos ───────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scroll: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 28,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Avatar */
  avatarWrapper: {
    alignItems: 'center',
    marginBottom: 28,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  avatarText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '800',
  },
  partnerName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  /* Bloques de rating */
  ratingBlock: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },

  /* Comentario */
  commentBlock: {
    width: '100%',
    marginTop: 8,
    marginBottom: 28,
  },
  commentTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
    textAlign: 'center',
  },
  textarea: {
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 14,
    fontSize: 14,
    color: '#333',
    minHeight: 110,
    backgroundColor: '#fff',
  },

  /* Botón */
  btn: {
    width: '100%',
    backgroundColor: brandColors.primary,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnDisabled: {
    backgroundColor: '#aaa',
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
