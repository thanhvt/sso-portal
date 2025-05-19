export interface AppInfo {
  id: string;
  name: string;
  description: string;
  longDescription?: string;
  url: string;
  logoUrl?: string;
  roles: string[];
  category?: string;
  isNew?: boolean;
  isFeatured?: boolean;
  isComingSoon?: boolean;
  backgroundColor?: string;
  releaseDate?: string; // Ngày dự kiến ra mắt cho ứng dụng Coming Soon
}
