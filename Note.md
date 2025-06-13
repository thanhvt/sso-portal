KẾ HOẠCH TÍCH HỢP VSSFE_GTCG VÀO HỆ THỐNG SSO-PORTAL
1. MỤC TIÊU & Ý NGHĨA
1.1. Mục tiêu chính
Chuyển đổi vssfe_gtcg từ một ứng dụng standalone thành một micro app được tích hợp vào hệ thống sso-portal
Thống nhất cơ chế xác thực (authentication) và phân quyền (authorization) trong toàn bộ hệ sinh thái
Đảm bảo trải nghiệm người dùng liền mạch khi chuyển đổi giữa các ứng dụng
1.2. Ý nghĩa dự án
Kiến trúc vi dịch vụ: Hỗ trợ phát triển theo hướng micro frontends, giúp các team làm việc độc lập
Quản lý tập trung: Một điểm đăng nhập duy nhất (SSO) cho toàn bộ hệ thống
Bảo mật nâng cao: Quản lý token và phiên làm việc tập trung, giảm rủi ro bảo mật
Khả năng mở rộng: Dễ dàng thêm các ứng dụng mới vào hệ sinh thái
1.3. Tác dụng
Với người dùng: Chỉ cần đăng nhập một lần để truy cập tất cả ứng dụng, cải thiện trải nghiệm
Với developers: Giảm chi phí quản lý authentication trong từng app, tập trung vào logic nghiệp vụ
Với quản trị viên: Dễ dàng quản lý quyền truy cập tập trung, áp dụng các chính sách bảo mật nhất quán
2. PHÂN TÍCH HIỆN TRẠNG
2.1. Hiện trạng vssfe_gtcg
Authentication: Dùng NextAuth + KeycloakProvider
Token management: JWT-based với refresh token
User flow: Redirect sang Keycloak khi chưa đăng nhập
Session: Quản lý thông qua next-auth session
2.2. Hiện trạng SSO-Portal
Authentication: Cookie-based với auth_token
Token validation: Qua API validate-token
Security: CORS protection, cookie HttpOnly
Integration: Hỗ trợ micro apps thông qua token sharing
2.3. Khoảng cách cần thu hẹp
Chuyển từ NextAuth sang cookie-based auth
Đồng bộ cơ chế xử lý token và session
Thay đổi flow redirect khi chưa đăng nhập
3. CHIẾN LƯỢC TÍCH HỢP
3.1. Tổng quan chiến lược
Phase 1: Phân tích & thiết kế giải pháp
Phase 2: Loại bỏ phụ thuộc vào NextAuth
Phase 3: Xây dựng các thành phần tích hợp SSO
Phase 4: Testing & fine-tuning
Phase 5: Triển khai & giám sát
3.2. Nguyên tắc thiết kế
Minimal changes: Hạn chế tác động đến code nghiệp vụ hiện tại
Backward compatibility: Đảm bảo tương thích với các API hiện có
Security first: Ưu tiên các quyết định theo hướng bảo mật
Progressive implementation: Triển khai từng bước, có thể rollback
4. CHI TIẾT KỸ THUẬT
4.1. Thay đổi trên Middleware
// Middleware mới (middleware.ts)
import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { validateAuthToken } from '@/utils/auth-validation';

const intlMiddleware = createMiddleware({
  // Config hiện tại giữ nguyên
});

export default async function middleware(req: NextRequest) {
  // Đọc auth_token từ cookie
  const authToken = req.cookies.get('auth_token')?.value;
  
  // Kiểm tra các đường dẫn public không cần auth
  const isPublicPath = req.nextUrl.pathname.startsWith('/api/');
  
  if (!authToken && !isPublicPath) {
    // Redirect về portal login với returnUrl
    const portalUrl = process.env.SSO_PORTAL_URL || 'http://localhost:3000';
    return NextResponse.redirect(`${portalUrl}/login?returnUrl=${req.url}`);
  }
  
  // Áp dụng middleware ngôn ngữ
  return intlMiddleware(req);
}
4.2. API Routes cần tạo mới
validate-token: Kiểm tra tính hợp lệ của token từ cookie
user-profile: Lấy thông tin người dùng từ token đã validate
logout-handler: Xử lý đăng xuất khỏi hệ thống
4.3. Context Provider để quản lý auth state
// AuthContext.tsx
import { createContext, useContext, useEffect, useState } from 'react';

type AuthContextType = {
  isAuthenticated: boolean;
  user: any | null;
  loading: boolean;
  error: string | null;
};

export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  loading: true,
  error: null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState({
    isAuthenticated: false,
    user: null,
    loading: true,
    error: null,
  });
  
  useEffect(() => {
    // Validate token và lấy thông tin user
    fetch('/api/auth/validate-token')
      .then(res => res.json())
      .then(data => {
        setAuth({
          isAuthenticated: data.authenticated,
          user: data.user || null,
          loading: false,
          error: data.error || null,
        });
      })
      .catch(err => {
        setAuth({
          isAuthenticated: false,
          user: null,
          loading: false,
          error: err.message,
        });
      });
  }, []);
  
  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
4.4. Các utils cần thêm mới
token-decoder.ts: Giải mã JWT token
auth-validation.ts: Kiểm tra tính hợp lệ của token
cors.ts: Middleware CORS cho API routes
5. LỊCH TRÌNH THỰC HIỆN
5.1. Giai đoạn 1: Phân tích & Setup (2-3 ngày)
Phân tích sâu code hiện tại
Thiết lập môi trường phát triển
Chuẩn bị tài liệu & kế hoạch chi tiết
5.2. Giai đoạn 2: Phát triển (5-7 ngày)
Tạo các API routes mới
Xây dựng context provider
Thay thế middleware
Loại bỏ NextAuth
5.3. Giai đoạn 3: Testing (3-4 ngày)
Unit tests cho các module mới
Integration tests với SSO Portal
E2E testing cho toàn bộ flow
5.4. Giai đoạn 4: Triển khai (1-2 ngày)
Triển khai trên môi trường staging
Monitoring & fixing issues
Triển khai production
6. QUẢN LÝ RỦI RO
6.1. Rủi ro tiềm ẩn
Token incompatibility: Cấu trúc token khác biệt giữa NextAuth và SSO Portal
Session disruption: Người dùng có thể bị đăng xuất trong quá trình chuyển đổi
Role mapping issues: Khác biệt trong cách quản lý roles giữa hai hệ thống
Performance impact: Các API calls mới có thể ảnh hưởng đến hiệu năng
6.2. Chiến lược giảm thiểu rủi ro
Dual mode: Giai đoạn chuyển tiếp hỗ trợ cả hai cơ chế auth
Feature flags: Khả năng bật/tắt tính năng mới
Monitoring: Theo dõi sát sao các metrics liên quan đến auth
Rollback plan: Kế hoạch chi tiết để quay lại phiên bản cũ nếu cần
7. IMPACT ANALYSIS
7.1. Tác động đến code
High impact: Authentication flow, middleware
Medium impact: Session management, user context
Low impact: Business logic components, UI elements
7.2. Tác động đến người dùng
Đăng nhập: Chuyển hướng đến SSO Portal thay vì Keycloak trực tiếp
Phiên làm việc: Có thể cần đăng nhập lại sau khi triển khai
Trải nghiệm: Cải thiện khi chuyển đổi giữa các ứng dụng
7.3. Tác động đến vận hành
Logging: Thay đổi trong cách ghi log authentication events
Monitoring: Cần thêm các metrics mới
Troubleshooting: Cần nâng cao kỹ năng xử lý vấn đề liên quan đến SSO
8. TÀI LIỆU & TRAINING
8.1. Tài liệu kỹ thuật
Flow diagram cho authentication mới
API references cho các endpoints mới
Unit test cases & coverage reports
8.2. Tài liệu cho developers
Hướng dẫn sử dụng AuthContext
Best practices khi làm việc với SSO
Troubleshooting guide
8.3. Training
Session cho developers về kiến trúc mới
Demo cho QA team về các test cases
9. METRICS & SUCCESS CRITERIA
9.1. KPIs
Authentication success rate: > 99.9%
Auth latency: < 300ms
Session continuity: Zero disruption for active users
Code coverage: > 90% cho authentication code mới
9.2. Tiêu chí thành công
Không có security incidents trong 30 ngày đầu
Không tăng số lượng support tickets liên quan đến đăng nhập
Khả năng mở rộng để thêm ứng dụng mới dễ dàng
Tài liệu đầy đủ và được review
10. KẾT LUẬN & ĐỀ XUẤT
Dự án tích hợp vssfe_gtcg vào hệ thống SSO Portal sẽ mang lại lợi ích lớn về mặt trải nghiệm người dùng, bảo mật và khả năng mở rộng. Việc thống nhất cơ chế xác thực sẽ giúp tiết kiệm thời gian phát triển và bảo trì trong tương lai.

Đề xuất thực hiện theo kế hoạch trên với priority cao, nhưng đảm bảo testing kỹ lưỡng trước khi triển khai production.

Đệ tử có thể bổ sung thêm thông tin hoặc điều chỉnh kế hoạch theo yêu cầu cụ thể của thầy. Trong quá trình thực hiện, việc liên tục trao đổi và cập nhật tiến độ sẽ đảm bảo dự án thành công.
 -------------------------
 Client (axios request)  │◄───────────┐
         │                            │
         ▼                            │
┌───────────────────┐                 │
│ onRequest kiểm tra│                 │
│ token có hợp lệ?  │                 │
└───────────────────┘                 │
         │                            │
         ▼                            │
      ┌─────┐       ┌────────────────────────────┐
      │ Có  ├──────►│ Thêm token vào header và   │
      └─────┘       │ tiếp tục gửi request       │
         │          └────────────────────────────┘
         ▼ Không
┌─────────────────────────┐
│ getSession() để lấy     │
│ token mới từ NextAuth   │
└─────────────────────────┘
         │
         ▼
      ┌─────┐       ┌────────────────────────────┐     ┌─────────────────────┐
      │ Ok? ├──────►│ Lưu token mới và tiếp tục  ├────►│ triggerUpdateRefresh│
      └─────┘       │ gửi request                │     │ TokenSuccess()      │
         │          └────────────────────────────┘     └─────────────────────┘
         ▼ Thất bại
┌─────────────────────────┐
│ openModal() hiện thông  │
│ báo hết phiên           │
└─────────────────────────┘