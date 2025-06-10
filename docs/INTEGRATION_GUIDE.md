# Hướng dẫn tích hợp Micro App với SSO Portal

Tài liệu này hướng dẫn chi tiết cách tích hợp một micro app với SSO Portal để sử dụng xác thực Single Sign-On (SSO) thông qua Keycloak.

## Tổng quan

SSO Portal là điểm truy cập chính cho hệ thống micro frontend. Người dùng đăng nhập vào SSO Portal thông qua Keycloak, sau đó có thể truy cập các micro app mà không cần đăng nhập lại.

Luồng xác thực:

1. Người dùng đăng nhập vào SSO Portal thông qua Keycloak
2. SSO Portal nhận JWT token từ Keycloak với thông tin người dùng và phân quyền
3. Khi người dùng chọn một micro app, SSO Portal chuyển hướng đến micro app với token
4. Micro app xác thực token và cho phép truy cập nếu token hợp lệ và chưa hết hạn

## Cách tích hợp

### 1. Hiểu về cấu trúc JWT Token của Keycloak

Keycloak cung cấp JWT token với các trường tiêu chuẩn và tuỳ chỉnh. Đặc biệt cần lưu ý các trường sau:

- `exp`: Thời điểm hết hạn của token, tính bằng giây kể từ Unix Epoch (1/1/1970). Đây là trường tiêu chuẩn JWT (RFC 7519).
- `iat`: Thời điểm phát hành token.
- `sub`: Định danh duy nhất của người dùng.
- `name`: Tên đầy đủ của người dùng.
- `email`: Email của người dùng.
- `realm_access.roles`: Danh sách các vai trò của người dùng trong realm.

Thời gian sống của token được cấu hình trong Keycloak, thường là 5-30 phút tùy theo cài đặt.

### 2. Đăng ký Micro App trong SSO Portal

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
  // Trường chuẩn JWT
  exp?: number;  // Thời gian hết hạn (Unix timestamp in seconds)
  iat?: number;  // Thời gian phát hành (Unix timestamp in seconds)
  sub?: string;  // Subject - Định danh người dùng
  
  // Trường do Keycloak cung cấp
  name?: string;  // Tên người dùng
  email?: string; // Email người dùng
  realm_access?: {
    roles: string[]; // Vai trò của người dùng trong realm
  };
  // Các trường khác có thể có tùy theo cấu hình Keycloak
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
    
    // Log thông tin token để debug (chỉ log thông tin cơ bản, không log nội dung chi tiết)
    console.log('Token validation:', {
      sub: decoded.sub,
      hasName: !!decoded.name,
      hasEmail: !!decoded.email,
      hasRoles: !!(decoded.realm_access?.roles),
      // Hiển thị thời gian hết hạn dưới dạng ngày giờ đọc được (múi giờ Việt Nam)
      expiration: decoded.exp ? new Date(decoded.exp * 1000).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : 'unknown',
      // Thời gian hiện tại
      currentTime: new Date(currentTime * 1000).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
      // Thời gian còn lại trước khi hết hạn (phút)
      minutesRemaining: decoded.exp ? Math.round((decoded.exp - currentTime) / 60) : 'unknown'
    });
    
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
    console.error('Token hết hạn:', {
      expTime: decoded.exp ? new Date(decoded.exp * 1000).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : 'unknown',
      currentTime: new Date(currentTime * 1000).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
    });
    return { valid: false, error: 'Token hết hạn' };
  } catch (error) {
    console.error('Token validation error:', error);
    return { valid: false, error: 'Token không hợp lệ' };
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
3. **Token hết hạn**: Triển khai cơ chế refresh token hoặc điều chỉnh thời gian sống của token
4. **Người dùng không có quyền truy cập**: Kiểm tra cấu hình role trong Keycloak và Micro App

## Cấu hình JWT Token trong Keycloak

### Cấu hình thời gian sống của token

Thời gian sống của token được cấu hình trong giao diện quản trị của Keycloak:

1. Đăng nhập vào Keycloak Admin Console
2. Chọn realm của bạn
3. Vào phần "Realm Settings" > "Tokens"
4. Các tham số cần điều chỉnh:
   - **Access Token Lifespan**: Thời gian sống của access token (mặc định: 5 phút)
   - **Client Session Idle**: Thời gian không hoạt động tối đa của phiên (mặc định: 30 phút)
   - **Client Session Max**: Thời gian sống tối đa của phiên (mặc định: 10 giờ)

### Xử lý token hết hạn

Các cách xử lý khi token hết hạn:

1. **Sử dụng refresh token**: Khi access token hết hạn, sử dụng refresh token để lấy access token mới mà không cần đăng nhập lại.

   ```typescript
   // src/utils/auth.ts
   export async function refreshAccessToken(refreshToken: string) {
     try {
       const response = await fetch('/api/auth/refresh-token', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
         },
         body: JSON.stringify({ refreshToken }),
       });
       
       const data = await response.json();
       
       if (!response.ok) {
         throw new Error(data.error || 'Failed to refresh token');
       }
       
       return {
         accessToken: data.accessToken,
         refreshToken: data.refreshToken,
       };
     } catch (error) {
       console.error('Error refreshing token:', error);
       // Chuyển hướng về trang đăng nhập nếu không thể làm mới token
       redirectToSSO();
       return null;
     }
   }
   ```

2. **Tăng thời gian sống của token** (chỉ nên sử dụng cho môi trường test):
   - Điều chỉnh "Access Token Lifespan" trong Keycloak lên cao hơn (ví dụ: 15-30 phút).
   - Lưu ý: điều này làm giảm tính bảo mật, không nên dùng cho môi trường production.

3. **Hiển thị thông báo trước khi hết hạn**: Hiển thị thông báo cho người dùng vài phút trước khi token hết hạn.

   ```typescript
   // src/components/TokenExpirationWarning.tsx
   export function TokenExpirationWarning() {
     const { token } = useAuth();
     const [showWarning, setShowWarning] = useState(false);
     
     useEffect(() => {
       if (!token) return;
       
       try {
         const decoded = jwtDecode<TokenPayload>(token);
         const expiresAt = decoded.exp ? decoded.exp * 1000 : 0;
         const currentTime = Date.now();
         const timeUntilExpiration = expiresAt - currentTime;
         
         // Hiển thị cảnh báo khi còn 2 phút trước khi hết hạn
         if (timeUntilExpiration > 0 && timeUntilExpiration < 2 * 60 * 1000) {
           setShowWarning(true);
         }
       } catch (error) {
         console.error('Error checking token expiration:', error);
       }
     }, [token]);
     
     if (!showWarning) return null;
     
     return (
       <div className="token-expiration-warning">
         Phiên làm việc của bạn sắp hết hạn. Vui lòng lưu công việc và đăng nhập lại.
       </div>
     );
   }
   ```

### Quy đổi timestamp sang định dạng ngày giờ đọc được

Khi debug hoặc log thông tin về token, nên chuyển đổi timestamp Unix (số giây từ Unix Epoch) sang định dạng ngày giờ đọc được:

```typescript
// Chuyển đổi timestamp thành định dạng giờ phút giây trong múi giờ Việt Nam (GMT+7)
function formatTimestamp(timestamp: number | undefined): string {
  if (!timestamp) return 'unknown';
  return new Date(timestamp * 1000).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
}

// Sử dụng
console.log(`Token hết hạn lúc: ${formatTimestamp(decoded.exp)}`);
console.log(`Thời gian hiện tại: ${formatTimestamp(Math.floor(Date.now() / 1000))}`);
```

## Tài liệu tham khảo

- [Keycloak Documentation](https://www.keycloak.org/documentation)
- [Keycloak Server Admin Guide](https://www.keycloak.org/docs/latest/server_admin/)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [RFC 7519 - JWT Standard](https://datatracker.ietf.org/doc/html/rfc7519)
