import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');
const N_DROPS = 40;

function RainDrop({ style }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const delay = Math.random() * 2000;
    const duration = 1200 + Math.random() * 1000;

    const run = () => {
      anim.setValue(0);
      Animated.timing(anim, {
        toValue: 1,
        duration,
        useNativeDriver: true,
        delay,
      }).start(({ finished }) => { if (finished) run(); });
    };
    run();
  }, []);

  return (
    <Animated.View
      style={[
        styles.drop,
        style,
        {
          opacity: anim.interpolate({ inputRange: [0, 0.1, 0.9, 1], outputRange: [0, 0.6, 0.4, 0] }),
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-20, height] }) }],
        },
      ]}
    />
  );
}

export default function SplashScreen({ onDone }) {
  const umbAnim = useRef(new Animated.Value(0)).current;
  const titleAnim = useRef(new Animated.Value(0)).current;
  const subAnim = useRef(new Animated.Value(0)).current;
  const dotsAnim = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(0.8)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;

  const drops = useRef(
    Array.from({ length: N_DROPS }, () => ({
      x: Math.random() * width,
      len: 8 + Math.random() * 14,
      opacity: 0.1 + Math.random() * 0.4,
      delay: Math.random() * 2000,
    }))
  ).current;

  useEffect(() => {
    // Entrance sequence
    Animated.sequence([
      Animated.parallel([
        Animated.spring(umbAnim, { toValue: 1, friction: 6, useNativeDriver: true }),
        Animated.timing(ringOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(titleAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(subAnim, { toValue: 1, duration: 600, delay: 100, useNativeDriver: true }),
        Animated.timing(dotsAnim, { toValue: 1, duration: 600, delay: 200, useNativeDriver: true }),
      ]),
    ]).start();

    // Ring pulse loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(ringScale, { toValue: 1.1, duration: 1200, useNativeDriver: true }),
        Animated.timing(ringScale, { toValue: 0.95, duration: 1200, useNativeDriver: true }),
      ])
    ).start();

    // Navigate after splash
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, []);

  return (
    <View style={styles.container}>
      {/* Rain drops */}
      {drops.map((d, i) => (
        <RainDrop key={i} style={{ left: d.x, height: d.len, opacity: d.opacity }} />
      ))}

      {/* Rings */}
      <Animated.View style={[styles.outerRing, { opacity: ringOpacity, transform: [{ scale: ringScale }] }]} />
      <Animated.View style={[styles.innerRing, { opacity: ringOpacity }]} />

      {/* Umbrella */}
      <Animated.Text
        style={[
          styles.umbrella,
          {
            transform: [
              { translateY: umbAnim.interpolate({ inputRange: [0, 1], outputRange: [-80, 0] }) },
              { rotate: umbAnim.interpolate({ inputRange: [0, 1], outputRange: ['-20deg', '0deg'] }) },
            ],
            opacity: umbAnim,
          },
        ]}
      >
        ☂️
      </Animated.Text>

      {/* Title */}
      <Animated.Text
        style={[
          styles.title,
          {
            transform: [{ translateY: titleAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
            opacity: titleAnim,
          },
        ]}
      >
        Umbrella Rental{'\n'}ITB Campus
      </Animated.Text>

      <Animated.Text
        style={[
          styles.sub,
          {
            transform: [{ translateY: subAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
            opacity: subAnim,
          },
        ]}
      >
        Tidak perlu kehujanan lagi di kampus
      </Animated.Text>

      {/* Dots loader */}
      <Animated.View style={[styles.dotsRow, { opacity: dotsAnim }]}>
        {[0, 1, 2].map(i => <BounceDot key={i} delay={i * 150} />)}
      </Animated.View>

      <Text style={styles.version}>v2.0.0 • ITB 2025</Text>
    </View>
  );
}

function BounceDot({ delay }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const run = () => {
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.delay(300),
      ]).start(({ finished }) => { if (finished) run(); });
    };
    run();
  }, []);
  return (
    <Animated.View
      style={[
        styles.dot,
        { transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }], opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05090f',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  drop: {
    position: 'absolute',
    width: 1.2,
    backgroundColor: 'rgba(80,160,255,0.5)',
    borderRadius: 1,
  },
  outerRing: {
    width: 180, height: 180, borderRadius: 90,
    borderWidth: 2, borderColor: 'rgba(26,127,232,0.2)',
    position: 'absolute', alignSelf: 'center',
  },
  innerRing: {
    width: 150, height: 150, borderRadius: 75,
    borderWidth: 1.5, borderColor: 'rgba(26,127,232,0.12)',
    position: 'absolute', alignSelf: 'center',
  },
  umbrella: { fontSize: 80, marginBottom: 28, textShadowColor: 'rgba(26,127,232,0.5)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 30 },
  title: { fontSize: 26, fontWeight: '900', color: '#dde8f5', textAlign: 'center', lineHeight: 30, marginBottom: 10, letterSpacing: -0.5 },
  sub: { fontSize: 13, color: '#3d5a73', marginBottom: 40, textAlign: 'center' },
  dotsRow: { flexDirection: 'row', gap: 8, marginBottom: 0 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#1a7fe8' },
  version: { position: 'absolute', bottom: 48, fontSize: 11, color: '#1e3a55' },
});