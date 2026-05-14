import { View, Swiper, SwiperItem, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import './ImageSwiper.scss';

interface PostImage {
  id: string;
  imageUrl: string;
  width?: number | null;
  height?: number | null;
}

interface ImageSwiperProps {
  images: PostImage[];
}

export default function ImageSwiper({ images }: ImageSwiperProps) {
  if (!images || images.length === 0) return null;

  const handlePreview = (current: string) => {
    Taro.previewImage({
      urls: images.map((i) => i.imageUrl),
      current,
    });
  };

  if (images.length === 1) {
    return (
      <View className="image-swiper-single">
        <Image
          className="image-single"
          src={images[0].imageUrl}
          mode="widthFix"
          onClick={() => handlePreview(images[0].imageUrl)}
        />
      </View>
    );
  }

  return (
    <View className="image-swiper-wrap">
      <Swiper
        className="image-swiper"
        indicatorDots
        indicatorColor="rgba(255,255,255,0.4)"
        indicatorActiveColor="#ffffff"
        autoplay={false}
        circular={false}
      >
        {images.map((img) => (
          <SwiperItem key={img.id}>
            <Image
              className="image-swiper-item"
              src={img.imageUrl}
              mode="aspectFit"
              onClick={() => handlePreview(img.imageUrl)}
            />
          </SwiperItem>
        ))}
      </Swiper>
    </View>
  );
}
