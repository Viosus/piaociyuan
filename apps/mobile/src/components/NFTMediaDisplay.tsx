import React, { useState } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Model3DViewer from './Model3DViewer';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES } from '../constants/config';

interface NFTMediaDisplayProps {
  has3DModel: boolean;
  model3DUrl?: string | null;
  imageUrl: string;
  name: string;
  style?: ViewStyle;
}

export default function NFTMediaDisplay({
  has3DModel,
  model3DUrl,
  imageUrl,
  name,
  style,
}: NFTMediaDisplayProps) {
  const [show3D, setShow3D] = useState(has3DModel && !!model3DUrl);

  // 3D 模式
  if (show3D && model3DUrl) {
    return (
      <View style={[styles.container, style]}>
        <Model3DViewer
          modelUrl={model3DUrl}
          fallbackImageUrl={imageUrl}
          style={styles.viewer}
          onError={() => setShow3D(false)}
        />

        {/* 切换到图片按钮 */}
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setShow3D(false)}
          activeOpacity={0.8}
        >
          <Ionicons name="image-outline" size={18} color="#fff" />
          <Text style={styles.toggleText}>图片</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 图片模式
  return (
    <View style={[styles.container, style]}>
      <Image
        source={{ uri: imageUrl }}
        style={styles.image}
        resizeMode="contain"
      />

      {/* 3D 查看按钮（仅当有 3D 模型时显示） */}
      {has3DModel && model3DUrl && (
        <TouchableOpacity
          style={styles.view3DButton}
          onPress={() => setShow3D(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="cube-outline" size={20} color="#fff" />
          <Text style={styles.toggleText}>3D 查看</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  viewer: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  toggleButton: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.xs,
  },
  view3DButton: {
    position: 'absolute',
    bottom: SPACING.md,
    right: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.xs,
  },
  toggleText: {
    color: '#fff',
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
});
