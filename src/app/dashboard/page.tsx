'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import AppCard from '@/components/AppCard';
import Background from '@/components/Background';
import { AppInfo } from '@/types/app';

// Danh sách các ứng dụng
const availableApps: AppInfo[] = [
  {
    id: 'vssfe',
    name: 'VSS Frontend',
    description: 'Ứng dụng chính của hệ thống VSS',
    longDescription: 'Ứng dụng chính của hệ thống VSS với đầy đủ các tính năng quản lý và vận hành.',
    url: process.env.NEXT_PUBLIC_VSSFE_URL || 'http://localhost:3000',
    logoUrl: '/images/vssfe-logo.png',
    roles: ['default-roles-vss-dev'],
    category: 'Chính',
    isFeatured: true,
    backgroundColor: '#e0f2fe',
  },
  {
    id: 'micro-app-demo',
    name: 'Micro App Demo',
    description: 'Ứng dụng demo micro frontend',
    longDescription: 'Ứng dụng demo cho kiến trúc micro frontend với các tính năng mẫu.',
    url: process.env.NEXT_PUBLIC_MICRO_APP_DEMO_URL || 'http://localhost:3001',
    logoUrl: '/images/micro-app-logo.png',
    roles: ['default-roles-vss-dev'],
    category: 'Demo',
    isNew: true,
    backgroundColor: '#ede9fe',
  },
];

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userApps, setUserApps] = useState<AppInfo[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session) {
      // Lọc các ứng dụng mà người dùng có quyền truy cập
      const userRoles = session.roles || [];
      console.log('User roles:', userRoles);
      
      const filteredApps = availableApps.filter(app => 
        app.roles.some(role => userRoles.includes(role))
      );
      setUserApps(filteredApps);
      
      // Lấy danh sách các danh mục
      const uniqueCategories = Array.from(
        new Set(filteredApps.map(app => app.category).filter(Boolean))
      ) as string[];
      setCategories(uniqueCategories);
    }
  }, [session, status, router]);

  // Xử lý chuyển hướng đến ứng dụng con
  const navigateToApp = (app: AppInfo) => {
    // Thêm token vào URL hoặc lưu vào cookie
    const token = session?.access_token;
    const url = `${app.url}?token=${token}`;
    window.open(url, '_blank');
  };

  // Lọc ứng dụng theo tìm kiếm và danh mục
  const filteredApps = userApps.filter(app => {
    const matchesSearch = app.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         app.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory ? app.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  // Ứng dụng nổi bật
  const featuredApps = filteredApps.filter(app => app.isFeatured);
  // Ứng dụng mới
  const newApps = filteredApps.filter(app => app.isNew && !app.isFeatured);
  // Các ứng dụng khác
  const otherApps = filteredApps.filter(app => !app.isFeatured && !app.isNew);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-t-4 border-b-4 border-primary-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Background />
      <Header />
      
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl font-bold gradient-text mb-2">
            Chào mừng đến với VSS Portal
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Trung tâm quản lý và truy cập các ứng dụng trong hệ thống VSS
          </p>
        </div>
        
        {/* Search and filter */}
        <div className="mb-8 max-w-2xl mx-auto animate-slide-down" style={{ animationDelay: '200ms' }}>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Tìm kiếm ứng dụng..."
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {categories.length > 0 && (
              <div>
                <select
                  className="w-full md:w-auto px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  value={selectedCategory || ''}
                  onChange={(e) => setSelectedCategory(e.target.value || null)}
                >
                  <option value="">Tất cả danh mục</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
        
        {/* Featured apps */}
        {featuredApps.length > 0 && (
          <section className="mb-12 animate-slide-up" style={{ animationDelay: '300ms' }}>
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Ứng dụng nổi bật</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredApps.map((app, index) => (
                <AppCard 
                  key={app.id} 
                  app={app} 
                  onSelect={navigateToApp} 
                  delay={index * 100}
                />
              ))}
            </div>
          </section>
        )}
        
        {/* New apps */}
        {newApps.length > 0 && (
          <section className="mb-12 animate-slide-up" style={{ animationDelay: '400ms' }}>
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Ứng dụng mới</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {newApps.map((app, index) => (
                <AppCard 
                  key={app.id} 
                  app={app} 
                  onSelect={navigateToApp} 
                  delay={index * 100}
                />
              ))}
            </div>
          </section>
        )}
        
        {/* Other apps */}
        {otherApps.length > 0 && (
          <section className="animate-slide-up" style={{ animationDelay: '500ms' }}>
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Tất cả ứng dụng</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {otherApps.map((app, index) => (
                <AppCard 
                  key={app.id} 
                  app={app} 
                  onSelect={navigateToApp} 
                  delay={index * 100}
                />
              ))}
            </div>
          </section>
        )}
        
        {/* No apps found */}
        {filteredApps.length === 0 && (
          <div className="text-center py-12 animate-fade-in">
            <p className="text-gray-500 text-lg">Không tìm thấy ứng dụng phù hợp</p>
          </div>
        )}
      </main>
      
      <footer className="bg-white/80 backdrop-blur-md py-6 border-t border-gray-200">
        <div className="container mx-auto px-4 text-center text-gray-600 text-sm">
          <p>&copy; {new Date().getFullYear()} VSS Portal. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
