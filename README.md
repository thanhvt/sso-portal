# VSS Portal - Single Sign-On

VSS Portal là một ứng dụng Single Sign-On (SSO) làm điểm truy cập chính cho hệ thống micro frontend. Ứng dụng này cho phép người dùng đăng nhập một lần và truy cập vào các ứng dụng con mà không cần đăng nhập lại.

## Tính năng

- **Xác thực tập trung**: Sử dụng Keycloak làm hệ thống xác thực
- **Dashboard hiện đại**: Giao diện người dùng đẹp mắt với nhiều hiệu ứng
- **Quản lý ứng dụng**: Hiển thị danh sách các ứng dụng mà người dùng có quyền truy cập
- **Giao diện đơn giản**: Hiển thị tất cả ứng dụng trong một danh sách duy nhất
- **Responsive**: Hoạt động tốt trên mọi thiết bị

## Cài đặt

1. Clone repository:
```bash
git clone <repository-url>
cd sso-portal
```

2. Cài đặt dependencies:
```bash
npm install
```

3. Tạo file `.env.local` với các biến môi trường cần thiết:
```
# Keycloak Configuration
FRONTEND_CLIENT_ID=vss_app_client
FRONTEND_CLIENT_SECRET=your-client-secret
AUTH_ISSUER=https://your-keycloak-url/realms/your-realm
NEXTAUTH_URL=http://localhost:3003
NEXTAUTH_SECRET=your-nextauth-secret
END_SESSION_URL=https://your-keycloak-url/realms/your-realm/protocol/openid-connect/logout
REFRESH_TOKEN_URL=https://your-keycloak-url/realms/your-realm/protocol/openid-connect/token

```

4. Chạy ứng dụng ở môi trường development:
```bash
npm run dev
```

5. Build ứng dụng cho môi trường production:
```bash
npm run build
npm start
```

## Cấu trúc dự án

```
sso-portal/
├── public/
│   └── images/              # Hình ảnh và logo
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/             # API Routes
│   │   ├── dashboard/       # Trang dashboard
│   │   └── login/           # Trang đăng nhập
│   ├── components/          # React components
│   ├── lib/                 # Thư viện và utilities
│   ├── types/               # TypeScript types
│   └── utils/               # Utility functions
├── .env.local               # Biến môi trường
├── next.config.js           # Cấu hình Next.js
├── package.json             # Dependencies
└── tailwind.config.js       # Cấu hình Tailwind CSS
```

## Tích hợp với Micro Apps

Để tích hợp một micro app mới:

1. Thêm thông tin ứng dụng vào danh sách `availableApps` trong file `src/app/dashboard/page.tsx`:

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
    roles: ['required-role-to-access'],
    category: 'Your Category',
    // Các thuộc tính isNew và isFeatured không còn cần thiết vì tất cả ứng dụng được hiển thị trong một danh sách
  },
];
```

2. Thêm biến môi trường cho URL của ứng dụng mới trong file `.env.local`:

```
NEXT_PUBLIC_YOUR_APP_URL=http://localhost:3004
```

3. Cấu hình micro app để nhận và xác thực token từ SSO Portal.

## Luồng xác thực

1. Người dùng truy cập SSO Portal
2. SSO Portal chuyển hướng đến Keycloak để đăng nhập
3. Sau khi đăng nhập thành công, Keycloak chuyển hướng về SSO Portal với token
4. SSO Portal hiển thị dashboard với danh sách các ứng dụng
5. Khi người dùng chọn một ứng dụng, SSO Portal chuyển hướng đến ứng dụng đó với token
6. Ứng dụng con xác thực token và cho phép truy cập

## License

MIT


------------------------
Triển khai bảo vệ CSRF
Triển khai cơ chế refresh token tốt hơn
const refreshToken = async () => {
  try {
    const response = await fetch(process.env.REFRESH_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: process.env.FRONTEND_CLIENT_ID,
        refresh_token: refreshTokenValue
      })
    });
    
    const data = await response.json();
    saveToken(data.access_token);
    saveRefreshToken(data.refresh_token);
    return data.access_token;
  } catch (error) {
    console.error('Lỗi refresh token:', error);
    logout(); // Đăng xuất nếu không refresh được
    return null;
  }
};
Thiết lập Content Security Policy (CSP)
-------------------------
Automated refresh token: NextAuth có cơ chế tự động refresh token mà sso-portal có thể học hỏi
sso-portal học hỏi từ vssfe_gtcg:
Auto-refresh workflow: Logic refresh token tự động
Typed token interfaces: Interface được định nghĩa rõ ràng cho token structure
Comprehensive token storage: Lưu trữ đầy đủ các loại token (access, id, refresh)
vssfe_gtcg (Ưu điểm)
Cơ chế refresh tự động: Tự động làm mới token trước khi hết hạn
Error handling đầy đủ: Xử lý các trường hợp lỗi khi refresh token
Kiểu dữ liệu chặt chẽ: TypeScript interfaces cho token structure
--------------------------
Thêm token refresh queue:
Khi nhiều request cùng gặp lỗi 401, chỉ refresh token một lần
Các request khác đợi kết quả refresh và dùng token mới