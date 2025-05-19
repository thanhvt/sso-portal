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

  // Màu nền cho ứng dụng Coming Soon
  const comingSoonColors = [
    'from-gray-100 to-gray-200',
    'from-slate-100 to-slate-200',
    'from-zinc-100 to-zinc-200'
  ];

  const randomColorIndex = Math.floor(app.id.charCodeAt(0) % cardColors.length);
  const randomComingSoonIndex = Math.floor(app.id.charCodeAt(0) % comingSoonColors.length);

  // Sử dụng màu nền Coming Soon nếu ứng dụng đang trong trạng thái Coming Soon
  const cardBgColor = app.isComingSoon
    ? app.backgroundColor || comingSoonColors[randomComingSoonIndex]
    : app.backgroundColor || cardColors[randomColorIndex];

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
          <div className="relative w-24 h-24 mr-4 rounded-lg overflow-hidden bg-white/80 flex items-center justify-center shadow-md transform transition-transform duration-300 hover:scale-105">
            {app.logoUrl ? (
              <Image
                src={app.logoUrl}
                alt={app.name}
                fill
                className={`object-cover ${app.isComingSoon ? 'opacity-60 grayscale' : ''}`}
              />
            ) : (
              <div className={`text-2xl font-bold ${app.isComingSoon ? 'text-gray-500' : 'text-primary-600'}`}>{app.name.charAt(0)}</div>
            )}

            {/* Shimmer effect on hover */}
            <div className={`absolute inset-0 animate-shimmer ${isHovered ? 'opacity-50' : 'opacity-0'} transition-opacity duration-300`}></div>
          </div>

          <div>
            <div className="flex items-center">
              <h3 className={`text-xl font-bold ${app.isComingSoon ? 'text-gray-700' : 'text-gray-900'}`}>{app.name}</h3>

              {app.isComingSoon && (
                <span className="ml-2 px-2 py-1 text-xs font-medium bg-gray-200 text-gray-700 rounded-full">
                  Coming Soon
                </span>
              )}

              {app.isNew && !app.isComingSoon && (
                <span className="ml-2 px-2 py-1 text-xs font-medium bg-primary-100 text-primary-700 rounded-full">
                  Mới
                </span>
              )}
            </div>
            <p className="text-sm text-gray-700 line-clamp-1">{app.description}</p>
            {app.releaseDate && app.isComingSoon && (
              <p className="text-xs text-gray-500 mt-1">Dự kiến: {app.releaseDate}</p>
            )}
          </div>
        </div>

        <div className={`mt-2 text-sm text-gray-700 line-clamp-2 transition-all duration-300 ${isHovered ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'}`}>
          {app.longDescription || app.description}
        </div>

        <div className="mt-4 flex justify-between items-center">
          {app.isComingSoon ? (
            <div className="w-full">
              <button
                className="bg-gray-300 text-gray-600 w-full py-2 px-4 rounded-lg shadow-sm cursor-default relative overflow-hidden group"
                style={{ height: '40px' }}
                disabled
              >
                <span className="relative z-10 flex items-center justify-center">
                  <span className="inline-block">Sắp ra mắt</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                <span className="absolute inset-0 bg-white/10 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></span>
              </button>

              {app.releaseDate && (
                <div className="flex justify-center mt-2">
                  <button className="text-xs text-gray-500 hover:text-gray-700 transition-colors duration-300 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    Nhận thông báo khi ra mắt
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => onSelect(app)}
              className="btn-primary w-full relative overflow-hidden group"
              style={{ height: '40px' }}
            >
              <span className="relative z-10 flex items-center justify-center">
                <span className="group-hover:-translate-y-10 transition-transform duration-300 inline-block">Truy cập</span>
                <span className="absolute translate-y-10 group-hover:translate-y-0 transition-transform duration-300 inline-block">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </span>
              </span>
              <span className="absolute inset-0 bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></span>
            </button>
          )}
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
