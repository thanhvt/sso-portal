import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

// Thêm các thành phần xác thực và giám sát token
import { SessionProvider } from '@/components/SessionProvider';
import TokenMonitor from '@/components/TokenMonitor';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'VSS Portal - Single Sign-On',
  description: 'Cổng thông tin tập trung cho hệ thống VSS',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={inter.className}>
        {/* Cung cấp session cho toàn bộ ứng dụng */}
        <SessionProvider>
          {/* Giám sát token hết hạn và tự động redirect khi cần */}
          <TokenMonitor checkInterval={20000}> {/* Kiểm tra mỗi 20 giây */}
            {children}
          </TokenMonitor>
        </SessionProvider>
      </body>
    </html>
  );
}
