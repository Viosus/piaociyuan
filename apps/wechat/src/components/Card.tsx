import { View } from '@tarojs/components';
import { PropsWithChildren } from 'react';
import './Card.scss';

interface CardProps {
  className?: string;
  onClick?: () => void;
}

export default function Card({ children, className, onClick }: PropsWithChildren<CardProps>) {
  return (
    <View
      className={`card ${className || ''} ${onClick ? 'card-clickable' : ''}`}
      onClick={onClick}
    >
      {children}
    </View>
  );
}
