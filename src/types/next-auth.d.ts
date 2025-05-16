import 'next-auth';

declare module 'next-auth' {
  interface Session {
    access_token?: string;
    id_token?: string;
    roles?: string[];
    error?: string;
  }
}
