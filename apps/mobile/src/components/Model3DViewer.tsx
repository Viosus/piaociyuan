import React, { useRef, useState, useCallback, useMemo } from 'react';
import {
  View,
  PanResponder,
  StyleSheet,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Image,
  GestureResponderEvent,
  PanResponderGestureState,
} from 'react-native';
import { GLView, ExpoWebGLRenderingContext } from 'expo-gl';
import { Renderer } from 'expo-three';
import * as THREE from 'three';
import { COLORS } from '../constants/config';

interface Model3DViewerProps {
  modelUrl: string;
  fallbackImageUrl: string;
  style?: any;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

export default function Model3DViewer({
  modelUrl,
  fallbackImageUrl,
  style,
  onLoad,
  onError,
}: Model3DViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const rotationRef = useRef({ x: 0, y: 0 });
  const scaleRef = useRef(1);
  const lastTouchDistance = useRef<number | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);

  // 计算两点之间的距离
  const getDistance = (touches: any[]) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].pageX - touches[1].pageX;
    const dy = touches[0].pageY - touches[1].pageY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          lastTouchDistance.current = null;
        },
        onPanResponderMove: (
          evt: GestureResponderEvent,
          gestureState: PanResponderGestureState
        ) => {
          const touches = evt.nativeEvent.touches;

          if (touches.length === 2) {
            // 双指缩放
            const distance = getDistance(touches as any[]);

            if (lastTouchDistance.current !== null) {
              const delta = distance - lastTouchDistance.current;
              scaleRef.current = Math.max(
                0.5,
                Math.min(3, scaleRef.current + delta * 0.005)
              );
            }
            lastTouchDistance.current = distance;
          } else if (touches.length === 1) {
            // 单指旋转
            rotationRef.current.y += gestureState.dx * 0.01;
            rotationRef.current.x += gestureState.dy * 0.01;
            // 限制 X 轴旋转角度
            rotationRef.current.x = Math.max(
              -Math.PI / 2,
              Math.min(Math.PI / 2, rotationRef.current.x)
            );
          }
        },
        onPanResponderRelease: () => {
          lastTouchDistance.current = null;
        },
      }),
    []
  );

  const onContextCreate = useCallback(
    async (gl: ExpoWebGLRenderingContext) => {
      // 创建渲染器
      const renderer = new Renderer({ gl });
      renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
      renderer.setClearColor(0xf5f5f5, 1);

      // 创建场景
      const scene = new THREE.Scene();

      // 创建相机
      const camera = new THREE.PerspectiveCamera(
        50,
        gl.drawingBufferWidth / gl.drawingBufferHeight,
        0.1,
        1000
      );
      camera.position.z = 3;

      // 添加环境光
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);

      // 添加主方向光
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(1, 1, 1);
      scene.add(directionalLight);

      // 添加补充方向光
      const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
      directionalLight2.position.set(-1, -1, -1);
      scene.add(directionalLight2);

      // 添加顶部点光源
      const pointLight = new THREE.PointLight(0xffffff, 0.3);
      pointLight.position.set(0, 3, 0);
      scene.add(pointLight);

      try {
        // 动态导入 GLTFLoader
        const { GLTFLoader } = await import(
          'three/examples/jsm/loaders/GLTFLoader.js'
        );
        const loader = new GLTFLoader();

        // 加载模型
        const gltf = await new Promise<any>((resolve, reject) => {
          loader.load(
            modelUrl,
            (result) => resolve(result),
            (progress) => {
              // 可以在这里处理加载进度
              console.log(
                'Loading progress:',
                (progress.loaded / progress.total) * 100 + '%'
              );
            },
            (err) => reject(err)
          );
        });

        // 计算模型边界并居中缩放
        const box = new THREE.Box3().setFromObject(gltf.scene);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const baseScale = 2 / maxDim;

        // 应用基础缩放
        gltf.scene.scale.setScalar(baseScale);

        // 居中模型
        gltf.scene.position.x = -center.x * baseScale;
        gltf.scene.position.y = -center.y * baseScale;
        gltf.scene.position.z = -center.z * baseScale;

        // 将模型添加到场景
        scene.add(gltf.scene);
        modelRef.current = gltf.scene;

        setLoading(false);
        onLoad?.();

        // 渲染循环
        let animationId: number;
        const render = () => {
          animationId = requestAnimationFrame(render);

          if (modelRef.current) {
            // 应用旋转
            modelRef.current.rotation.x = rotationRef.current.x;
            modelRef.current.rotation.y = rotationRef.current.y;

            // 应用缩放
            const finalScale = baseScale * scaleRef.current;
            modelRef.current.scale.setScalar(finalScale);
          }

          renderer.render(scene, camera);
          gl.endFrameEXP();
        };
        render();

        // 清理函数
        return () => {
          cancelAnimationFrame(animationId);
        };
      } catch (err) {
        console.error('Error loading 3D model:', err);
        const error = err instanceof Error ? err : new Error('加载模型失败');
        setError(error);
        onError?.(error);
      }
    },
    [modelUrl, onLoad, onError]
  );

  // 错误状态：显示回退图片
  if (error) {
    return (
      <View style={[styles.container, style]}>
        <Image
          source={{ uri: fallbackImageUrl }}
          style={styles.fallbackImage}
          resizeMode="contain"
        />
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            setError(null);
            setLoading(true);
          }}
        >
          <Text style={styles.retryText}>重试 3D</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]} {...panResponder.panHandlers}>
      <GLView style={styles.glView} onContextCreate={onContextCreate} />

      {/* 加载状态 */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>加载 3D 模型...</Text>
        </View>
      )}

      {/* 操作提示 */}
      {!loading && (
        <View style={styles.hintContainer}>
          <Text style={styles.hintText}>单指旋转 · 双指缩放</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  glView: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 14,
  },
  fallbackImage: {
    width: '100%',
    height: '100%',
  },
  retryButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  hintContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 6,
  },
  hintText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
});
