'use client'

/**
 * SessionProvider cho Next-Auth trong app router
 * Cung cấp thông tin session cho toàn bộ ứng dụng
 */

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react"

type Props = {
  children: React.ReactNode;
}

/**
 * SessionProvider bọc toàn bộ ứng dụng để cung cấp thông tin session
 * @param children - Các component con
 * @returns SessionProvider với các component con
 */
export function SessionProvider({ children }: Props) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>
}
