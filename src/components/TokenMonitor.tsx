/**
 * Component giám sát token và chuyển hướng khi token hết hạn
 * Được sử dụng trong các layout để áp dụng cho toàn bộ ứng dụng
 */

'use client';

import { ReactNode } from 'react';
import { useTokenMonitor } from '@/hooks/useTokenMonitor';

interface TokenMonitorProps {
  children: ReactNode;
  // Thời gian giữa các lần kiểm tra token (ms)
  checkInterval?: number;
}

/**
 * Component bọc bên ngoài để giám sát token
 * @param children - Các component con bên trong
 * @param checkInterval - Thời gian giữa các lần kiểm tra token (ms), mặc định 30 giây
 * @returns Component React với tính năng giám sát token
 */
export default function TokenMonitor({
  children,
  checkInterval = 30000
}: TokenMonitorProps) {
  // Sử dụng hook để kiểm tra token định kỳ
  useTokenMonitor(checkInterval);

  // Component này không render gì thêm, chỉ return children
  return <>{children}</>;
}
