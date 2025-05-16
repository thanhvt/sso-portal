import { useState } from 'react';
import Image from 'next/image';
import { AppInfo } from '@/types/app';

interface AppCardProps {
  app: AppInfo;
  onSelect: (app: AppInfo) => void;
  delay: number;
}

export default function AppCard({ app, onSelect, delay }: AppCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Tạo màu nền ngẫu nhiên nếu không có màu được chỉ định
  const cardColors = [
    'from-primary-100 to-primary-200',
    'from-secondary-100 to-secondary-200',
    'from-lime-100 to-lime-200',
    'from-moss-100 to-moss-200',
    'from-primary-100 to-lime-200',
    'from-secondary-100 to-primary-200',
    'from-lime-100 to-moss-200'
  ];

  const randomColorIndex = Math.floor(app.id.charCodeAt(0) % cardColors.length);
  const cardBgColor = app.backgroundColor || cardColors[randomColorIndex];

  return (
    <div
      className={`relative overflow-hidden rounded-xl shadow-card card-hover transition-all duration-500 ease-in-out animate-slide-up bg-gradient-to-br ${typeof cardBgColor === 'string' && cardBgColor.includes('from-') ? cardBgColor : cardColors[randomColorIndex]}`}
      style={{
        animationDelay: `${delay}ms`,
        backgroundColor: typeof cardBgColor === 'string' && !cardBgColor.includes('from-') ? cardBgColor : undefined
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 bg-dots opacity-10"></div>

      {/* Gradient border effect */}
      <div className={`absolute inset-0 bg-gradient-to-r from-primary-400 via-lime-400 to-secondary-400 opacity-0 transition-opacity duration-300 ${isHovered ? 'opacity-100' : ''}`} style={{ height: '4px', bottom: 'auto' }}></div>

      <div className="p-6 relative z-10">
        <div className="flex items-center mb-4">
          <div className="relative w-16 h-16 mr-4 rounded-lg overflow-hidden bg-white/80 flex items-center justify-center shadow-md transform transition-transform duration-300 hover:scale-105">
            {app.logoUrl ? (
              <Image
                src={app.logoUrl}
                alt={app.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="text-2xl font-bold text-primary-600">{app.name.charAt(0)}</div>
            )}

            {/* Shimmer effect on hover */}
            <div className={`absolute inset-0 animate-shimmer ${isHovered ? 'opacity-50' : 'opacity-0'} transition-opacity duration-300`}></div>
          </div>

          <div>
            <h3 className="text-xl font-bold text-gray-900">{app.name}</h3>
            <p className="text-sm text-gray-700 line-clamp-1">{app.description}</p>
          </div>
        </div>

        <div className={`mt-2 text-sm text-gray-700 line-clamp-2 transition-all duration-300 ${isHovered ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'}`}>
          {app.longDescription || app.description}
        </div>

        <div className="mt-4 flex justify-between items-center">
          <button
            onClick={() => onSelect(app)}
            className="btn-primary w-full relative overflow-hidden group"
          >
            <span className="relative z-10">Truy cập</span>
            <span className="absolute inset-0 bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></span>
          </button>
        </div>
      </div>

      {/* Hover effect overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br from-primary-500/10 via-lime-500/10 to-secondary-500/10 opacity-0 transition-opacity duration-300 ${isHovered ? 'opacity-100' : ''}`}></div>

      {/* Decorative elements */}
      <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-white/10 blur-xl"></div>
      <div className="absolute -top-6 -left-6 w-20 h-20 rounded-full bg-white/10 blur-xl"></div>
    </div>
  );
}
