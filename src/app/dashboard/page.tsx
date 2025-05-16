'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import AppCard from '@/components/AppCard';
import Background from '@/components/Background';
import Footer from '@/components/Footer';
import { AppInfo } from '@/types/app';

// Danh sách các ứng dụng
const availableApps: AppInfo[] = [
  {
    id: 'vssfe',
    name: 'VSS Frontend',
    description: 'Ứng dụng chính của hệ thống VSS',
    longDescription: 'Ứng dụng chính của hệ thống VSS với đầy đủ các tính năng quản lý và vận hành.',
    url: process.env.NEXT_PUBLIC_VSSFE_URL || 'http://localhost:3000',
    logoUrl: '/images/logos/vssfe-logo.svg',
    roles: ['default-roles-vss-dev'],
    category: 'Chính',
    isFeatured: true,
    backgroundColor: 'from-primary-100 to-lime-200',
  },
  {
    id: 'micro-app-demo',
    name: 'Micro App Demo',
    description: 'Ứng dụng demo micro frontend',
    longDescription: 'Ứng dụng demo cho kiến trúc micro frontend với các tính năng mẫu.',
    url: process.env.NEXT_PUBLIC_MICRO_APP_DEMO_URL || 'http://localhost:3001',
    logoUrl: '/images/logos/micro-app-logo.svg',
    roles: ['default-roles-vss-dev'],
    category: 'Demo',
    isNew: true,
    backgroundColor: 'from-secondary-100 to-primary-200',
  },
  {
    id: 'giay-to-co-gia',
    name: 'Giấy tờ có giá',
    description: 'Quản lý giấy tờ có giá',
    longDescription: 'Hệ thống quản lý giấy tờ có giá với đầy đủ các tính năng theo dõi, quản lý và báo cáo.',
    url: process.env.NEXT_PUBLIC_GTCG_URL || 'http://localhost:3004',
    logoUrl: '/images/logos/gtcg-logo.svg',
    roles: ['default-roles-vss-dev'],
    category: 'Quản lý',
    backgroundColor: 'from-lime-100 to-moss-200', // Màu xanh lá nhạt
  },
  {
    id: 'ngan-hang-giam-sat',
    name: 'Ngân hàng giám sát',
    description: 'Hệ thống ngân hàng giám sát',
    longDescription: 'Hệ thống ngân hàng giám sát với các tính năng giám sát, kiểm soát và báo cáo.',
    url: process.env.NEXT_PUBLIC_NHGS_URL || 'http://localhost:3005',
    logoUrl: '/images/logos/nhgs-logo.svg',
    roles: ['default-roles-vss-dev'],
    category: 'Giám sát',
    backgroundColor: 'from-moss-100 to-lime-200', // Màu xanh rêu nhạt
  },
];

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userApps, setUserApps] = useState<AppInfo[]>([]);

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
    }
  }, [session, status, router]);

  // Xử lý chuyển hướng đến ứng dụng con
  const navigateToApp = (app: AppInfo) => {
    // Thêm token vào URL hoặc lưu vào cookie
    const token = session?.access_token;
    const url = `${app.url}?token=${token}`;
    window.open(url, '_blank');
  };

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

      <main className="container mx-auto px-4 pt-24 pb-24">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl font-bold gradient-text mb-2">
            Chào mừng đến với VSS Portal
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Trung tâm quản lý và truy cập các ứng dụng trong hệ thống VSS
          </p>
        </div>

        {/* All apps */}
        <section className="animate-slide-up" style={{ animationDelay: '300ms' }}>
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Danh sách ứng dụng</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userApps.map((app, index) => (
              <AppCard
                key={app.id}
                app={app}
                onSelect={navigateToApp}
                delay={index * 100}
              />
            ))}
          </div>
        </section>

        {/* No apps found */}
        {userApps.length === 0 && (
          <div className="text-center py-12 animate-fade-in">
            <p className="text-gray-500 text-lg">Không tìm thấy ứng dụng phù hợp</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
