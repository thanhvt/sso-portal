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

  return (
    <div 
      className={`relative overflow-hidden bg-white rounded-xl shadow-card card-hover transition-all duration-500 ease-in-out animate-slide-up`}
      style={{ animationDelay: `${delay}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 bg-dots opacity-10"></div>
      
      {/* Gradient border effect */}
      <div className={`absolute inset-0 bg-gradient-to-r from-primary-400 to-secondary-400 opacity-0 transition-opacity duration-300 ${isHovered ? 'opacity-100' : ''}`} style={{ height: '4px', bottom: 'auto' }}></div>
      
      <div className="p-6">
        <div className="flex items-center mb-4">
          <div className="relative w-16 h-16 mr-4 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
            {app.logoUrl ? (
              <Image 
                src={app.logoUrl} 
                alt={app.name} 
                fill
                className="object-cover"
              />
            ) : (
              <div className="text-2xl font-bold text-primary-500">{app.name.charAt(0)}</div>
            )}
            
            {/* Shimmer effect on hover */}
            <div className={`absolute inset-0 animate-shimmer ${isHovered ? 'opacity-30' : 'opacity-0'} transition-opacity duration-300`}></div>
          </div>
          
          <div>
            <h3 className="text-xl font-bold text-gray-900">{app.name}</h3>
            <p className="text-sm text-gray-600 line-clamp-1">{app.description}</p>
          </div>
        </div>
        
        <div className={`mt-2 text-sm text-gray-500 line-clamp-2 transition-all duration-300 ${isHovered ? 'max-h-20' : 'max-h-0 opacity-0'}`}>
          {app.longDescription || app.description}
        </div>
        
        <div className="mt-4 flex justify-between items-center">
          <button 
            onClick={() => onSelect(app)}
            className="btn-primary w-full"
          >
            Truy cập
          </button>
        </div>
      </div>
      
      {/* Hover effect overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br from-primary-500/5 to-secondary-500/5 opacity-0 transition-opacity duration-300 ${isHovered ? 'opacity-100' : ''}`}></div>
    </div>
  );
}
