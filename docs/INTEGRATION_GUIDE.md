# Hướng dẫn tích hợp Micro App với SSO Portal

Tài liệu này hướng dẫn cách tích hợp một micro app với SSO Portal để sử dụng xác thực Single Sign-On (SSO) thông qua Keycloak.

## Tổng quan

SSO Portal là điểm truy cập chính cho hệ thống micro frontend. Người dùng đăng nhập vào SSO Portal thông qua Keycloak, sau đó có thể truy cập các micro app mà không cần đăng nhập lại.

Luồng xác thực:

1. Người dùng đăng nhập vào SSO Portal
2. SSO Portal nhận token từ Keycloak
3. Khi người dùng chọn một micro app, SSO Portal chuyển hướng đến micro app với token
4. Micro app xác thực token và cho phép truy cập

## Cách tích hợp

### 1. Đăng ký Micro App trong SSO Portal

Thêm thông tin micro app vào danh sách `availableApps` trong file `src/app/dashboard/page.tsx` của SSO Portal:

```typescript
const availableApps: AppInfo[] = [
  // Các ứng dụng hiện có
  {
    id: 'your-app-id',
    name: 'Your App Name',
    description: 'Mô tả ngắn về ứng dụng',
    longDescription: 'Mô tả chi tiết về ứng dụng và các tính năng của nó',
    url: process.env.NEXT_PUBLIC_YOUR_APP_URL || 'http://localhost:3004',
    logoUrl: '/images/your-app-logo.png',
    roles: ['required-role-to-access'], // Các role cần thiết để truy cập ứng dụng
    category: 'Your Category',
    isNew: true, // Tùy chọn
    isFeatured: false, // Tùy chọn
  },
];
```

Thêm biến môi trường cho URL của micro app trong file `.env.local` của SSO Portal:

```
NEXT_PUBLIC_YOUR_APP_URL=http://localhost:3004
```

### 2. Cấu hình Micro App để nhận và xác thực token

#### 2.1. Tạo utility function để xác thực token

```typescript
// src/utils/auth.ts
import { jwtDecode } from 'jwt-decode';

interface TokenPayload {
  exp?: number;
  sub?: string;
  name?: string;
  email?: string;
  realm_access?: {
    roles: string[];
  };
}

export function getTokenFromUrl() {
  if (typeof window === 'undefined') return null;
  
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('token');
}

export function validateToken(token: string) {
  try {
    const decoded = jwtDecode<TokenPayload>(token);
    const currentTime = Math.floor(Date.now() / 1000);
    
    if (decoded.exp && decoded.exp > currentTime) {
      // Token còn hạn
      return {
        valid: true,
        user: {
          id: decoded.sub,
          name: decoded.name,
          email: decoded.email,
          roles: decoded.realm_access?.roles || [],
        },
      };
    }
    
    // Token hết hạn
    return { valid: false };
  } catch (error) {
    console.error('Token validation error:', error);
    return { valid: false };
  }
}

export function redirectToSSO() {
  window.location.href = process.env.NEXT_PUBLIC_SSO_URL || 'http://localhost:3003';
}
```

#### 2.2. Tạo AuthContext để quản lý trạng thái xác thực

```typescript
// src/contexts/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import { getTokenFromUrl, validateToken, redirectToSSO } from '@/utils/auth';

interface User {
  id?: string;
  name?: string;
  email?: string;
  roles: string[];
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  token: null,
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const token = getTokenFromUrl();
    
    if (token) {
      const { valid, user } = validateToken(token);
      
      if (valid && user) {
        setIsAuthenticated(true);
        setUser(user);
        setToken(token);
        
        // Lưu token vào localStorage để sử dụng sau này
        localStorage.setItem('auth_token', token);
        
        // Xóa token khỏi URL để tránh lộ thông tin nhạy cảm
        window.history.replaceState({}, document.title, window.location.pathname);
      } else {
        // Token không hợp lệ, chuyển hướng về SSO
        redirectToSSO();
      }
    } else {
      // Kiểm tra token trong localStorage
      const storedToken = localStorage.getItem('auth_token');
      
      if (storedToken) {
        const { valid, user } = validateToken(storedToken);
        
        if (valid && user) {
          setIsAuthenticated(true);
          setUser(user);
          setToken(storedToken);
        } else {
          // Token không hợp lệ, xóa và chuyển hướng về SSO
          localStorage.removeItem('auth_token');
          redirectToSSO();
        }
      } else {
        // Không có token, chuyển hướng về SSO
        redirectToSSO();
      }
    }
  }, []);

  const logout = () => {
    localStorage.removeItem('auth_token');
    setIsAuthenticated(false);
    setUser(null);
    setToken(null);
    redirectToSSO();
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, token, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
```

#### 2.3. Sử dụng AuthProvider trong ứng dụng

```typescript
// src/app/layout.tsx
import { AuthProvider } from '@/contexts/AuthContext';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

#### 2.4. Tạo component bảo vệ route

```typescript
// src/components/ProtectedRoute.tsx
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { redirectToSSO } from '@/utils/auth';

export default function ProtectedRoute({
  children,
  requiredRoles = [],
}: {
  children: React.ReactNode;
  requiredRoles?: string[];
}) {
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      redirectToSSO();
      return;
    }

    if (requiredRoles.length > 0) {
      const hasRequiredRole = requiredRoles.some(role => 
        user?.roles.includes(role)
      );

      if (!hasRequiredRole) {
        // Người dùng không có quyền truy cập
        window.location.href = '/unauthorized';
      }
    }
  }, [isAuthenticated, user, requiredRoles]);

  if (!isAuthenticated) {
    return <div>Đang chuyển hướng đến trang đăng nhập...</div>;
  }

  return <>{children}</>;
}
```

#### 2.5. Sử dụng ProtectedRoute trong các trang cần xác thực

```typescript
// src/app/dashboard/page.tsx
import ProtectedRoute from '@/components/ProtectedRoute';
import Dashboard from '@/components/Dashboard';

export default function DashboardPage() {
  return (
    <ProtectedRoute requiredRoles={['user']}>
      <Dashboard />
    </ProtectedRoute>
  );
}
```

### 3. Cấu hình API calls với token

```typescript
// src/utils/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

// Thêm interceptor để tự động thêm token vào header
api.interceptors.request.use(config => {
  const token = localStorage.getItem('auth_token');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

export default api;
```

## Kiểm thử tích hợp

1. Chạy SSO Portal:
```bash
cd sso-portal
npm run dev
```

2. Chạy Micro App:
```bash
cd your-micro-app
npm run dev
```

3. Truy cập SSO Portal tại http://localhost:3003
4. Đăng nhập bằng Keycloak
5. Chọn Micro App từ dashboard
6. Kiểm tra xem Micro App có nhận và xác thực token đúng không

## Xử lý lỗi phổ biến

1. **Token không hợp lệ**: Kiểm tra cấu hình Keycloak và đảm bảo client ID và secret đúng
2. **Lỗi CORS**: Cấu hình CORS trong Keycloak và Micro App
3. **Token hết hạn**: Triển khai cơ chế refresh token
4. **Người dùng không có quyền truy cập**: Kiểm tra cấu hình role trong Keycloak và Micro App

## Tài liệu tham khảo

- [Keycloak Documentation](https://www.keycloak.org/documentation)
- [NextAuth.js Documentation](https://next-auth.js.org/)
