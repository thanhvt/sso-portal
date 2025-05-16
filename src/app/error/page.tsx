'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Footer from '@/components/Footer';

export default function ErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-grow flex items-center justify-center bg-gradient-to-br from-primary-100 to-secondary-100">
        <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-xl animate-fade-in">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-red-600">
              Lỗi xác thực
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Đã xảy ra lỗi trong quá trình xác thực
            </p>
          </div>

          <div className="mt-8 space-y-6">
            {error && (
              <div className="bg-red-50 p-4 rounded-md">
                <h3 className="text-lg font-medium text-red-800">Mã lỗi: {error}</h3>
                {errorDescription && (
                  <p className="mt-2 text-sm text-red-700">{errorDescription}</p>
                )}
              </div>
            )}

            <div className="flex items-center justify-center">
              <Link
                href="/"
                className="btn-primary"
              >
                Quay lại trang chủ
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
