import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { GRADIENTS } from '../constants/config';

export default function GradientHeader() {
  return (
    <LinearGradient
      colors={GRADIENTS.header as [string, string]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    />
  );
}
