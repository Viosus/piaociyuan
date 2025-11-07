// components/VerificationBadge.tsx
/**
 * 用户认证徽章组件
 * 显示用户的认证状态和认证类型
 */

type VerificationBadgeProps = {
  isVerified: boolean;
  verifiedType?: string | null;
  verificationBadge?: string | null;
  size?: 'sm' | 'md' | 'lg';
};

export default function VerificationBadge({
  isVerified,
  verifiedType,
  verificationBadge,
  size = 'md',
}: VerificationBadgeProps) {
  if (!isVerified) {
    return null;
  }

  // 徽章尺寸
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  // 默认徽章样式（如果没有自定义徽章URL）
  const getDefaultBadge = () => {
    const colors: Record<string, string> = {
      celebrity: 'text-yellow-500',
      artist: 'text-purple-500',
      organizer: 'text-blue-500',
      official: 'text-green-500',
    };

    const tooltips: Record<string, string> = {
      celebrity: '认证明星/名人',
      artist: '认证艺术家',
      organizer: '认证主办方',
      official: '官方机构认证',
    };

    const color = verifiedType && colors[verifiedType] ? colors[verifiedType] : 'text-blue-500';
    const tooltip = verifiedType && tooltips[verifiedType] ? tooltips[verifiedType] : '已认证用户';

    return (
      <svg
        className={`${sizeClasses[size]} ${color}`}
        fill="currentColor"
        viewBox="0 0 20 20"
        title={tooltip}
      >
        <path
          fillRule="evenodd"
          d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
    );
  };

  // 如果有自定义徽章URL，使用图片
  if (verificationBadge) {
    return (
      <img
        src={verificationBadge}
        alt="认证徽章"
        className={sizeClasses[size]}
        title={`${verifiedType ? `认证${verifiedType}` : '已认证用户'}`}
      />
    );
  }

  return getDefaultBadge();
}
