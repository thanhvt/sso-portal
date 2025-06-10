# Hướng dẫn kiểm thử luồng xác thực qua cookie trong SSO Portal và Micro App

## Chuẩn bị

### 1. Khởi động các ứng dụng
- Khởi động SSO Portal: `cd sso-portal && npm run dev` (port 3004)
- Khởi động Micro App Demo: `cd micro-app-sso-demo && npm run dev` (port 3001)

### 2. Cấu hình môi trường
- Đảm bảo biến môi trường `ALLOWED_ORIGINS` đã được cấu hình trong file `.env.local` của cả SSO Portal và Micro App
- Đảm bảo `JWT_SECRET` giống nhau trong cả hai ứng dụng
- Biến môi trường `NEXT_PUBLIC_SSO_URL` trong Micro App phải trỏ đến URL của SSO Portal

## Kịch bản kiểm thử 1: Đăng nhập và truy cập Micro App từ SSO Portal

### Bước 1: Đăng nhập vào SSO Portal
1. Truy cập SSO Portal: http://localhost:3004/
2. Đăng nhập bằng tài khoản hợp lệ từ Keycloak
3. Kiểm tra tình trạng đăng nhập thành công (hiển thị dashboard)

### Bước 2: Chuyển sang Micro App
1. Trong dashboard của SSO Portal, nhấp vào "Micro App Demo"
2. Quan sát DevTools > Network để xác nhận:
   - Không còn token trong URL
   - API `/api/auth/set-cookie` được gọi thành công (Status 200)
   - Tab mới mở với Micro App Demo: http://localhost:3001 (không có token trong URL)

### Bước 3: Kiểm tra xác thực trong Micro App
1. Sau khi Micro App mở, kiểm tra DevTools > Network:
   - API `/api/auth/validate-token` được gọi thành công (Status 200)
2. Kiểm tra DevTools > Application > Cookies:
   - Cookie `auth_token` tồn tại với thuộc tính `HttpOnly: true`
3. Xác nhận giao diện người dùng trong Micro App hiển thị đúng tên người dùng và đã đăng nhập

## Kịch bản kiểm thử 2: Đăng xuất từ SSO Portal

### Bước 1: Thực hiện đăng xuất từ SSO Portal
1. Trong SSO Portal, nhấp vào biểu tượng người dùng và chọn "Đăng xuất"
2. Quan sát DevTools > Network để xác nhận:
   - API `/api/auth/clear-cookie` được gọi thành công (Status 200)
   - Cookie `auth_token` đã được xóa (không còn trong DevTools > Application > Cookies)
3. Xác nhận đã được chuyển hướng về trang đăng nhập

### Bước 2: Kiểm tra Micro App sau đăng xuất
1. Truy cập lại Micro App: http://localhost:3001
2. Xác nhận rằng người dùng không được tự động đăng nhập
3. Kiểm tra DevTools > Application > Cookies để đảm bảo cookie `auth_token` không tồn tại

## Kịch bản kiểm thử 3: Đăng xuất từ Micro App

### Bước 1: Đăng nhập lại vào SSO Portal và truy cập Micro App
1. Đăng nhập vào SSO Portal và truy cập Micro App Demo như kịch bản 1

### Bước 2: Đăng xuất từ Micro App
1. Nhấp vào nút đăng xuất trong Micro App
2. Quan sát DevTools > Network để xác nhận:
   - API `/api/auth/clear-cookie` của Micro App được gọi thành công (Status 200)
   - Cookie `auth_token` đã được xóa
3. Xác nhận rằng người dùng đã được đăng xuất khỏi Micro App

### Bước 3: Kiểm tra SSO Portal sau đăng xuất từ Micro App
1. Truy cập lại SSO Portal: http://localhost:3004/
2. Xác nhận trạng thái đăng nhập trong SSO Portal phù hợp với mô hình Single Sign-Out

## Kịch bản kiểm thử 4: Kiểm tra CORS và bảo mật

### Bước 1: Kiểm tra API set-cookie từ origin không được phép
1. Mở Postman hoặc công cụ API testing khác
2. Gửi request POST đến `http://localhost:3004/api/auth/set-cookie` với:
   - Header `Origin: http://evil-site.com`
   - Nội dung JSON `{"token": "test-token"}`
3. Xác nhận nhận được lỗi CORS (status 403) và không thiết lập được cookie

### Bước 2: Kiểm tra truy cập cookie từ JavaScript
1. Trong Micro App, mở DevTools > Console và thực thi:
   ```javascript
   console.log(document.cookie);
   ```
2. Xác nhận rằng cookie `auth_token` không hiển thị (HttpOnly cookie không truy cập được từ JavaScript)

### Bước 3: Kiểm tra token cookie khi port khác nhau
1. Đảm bảo ALLOWED_ORIGINS có chứa origin của tất cả port cần thiết
2. Thử luồng đăng nhập/đăng xuất với các ứng dụng chạy trên các port khác nhau
3. Xác nhận rằng cookie được truyền và xác thực thành công giữa các origin khác nhau nhưng cùng domain (localhost)

## Chỉnh sửa nếu có vấn đề

Nếu phát hiện vấn đề trong quá trình kiểm thử:

1. Kiểm tra log console trong DevTools để xem lỗi cụ thể
2. Kiểm tra cấu hình CORS trong middleware
3. Xác nhận các thuộc tính cookie (HttpOnly, Secure, SameSite, Path) phù hợp
4. Đảm bảo API endpoints có cùng domain với ứng dụng để cookie hoạt động chính xác
5. Kiểm tra Node.js version và Next.js version có tương thích không
