"use client";

import HomePage from "@/views/home/ui/home.page";
import { SocketProvider } from "@/shared/socket";
import { AuthProvider, LoginForm, useAuth } from "@/features/auth";

function AppShell() {
  const { user, isLoading } = useAuth();
  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:8001";

  if (isLoading) {
    return (
      <div className="login-shell">
        <p className="muted">인증 확인 중...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  return (
    <SocketProvider url={socketUrl}>
      <HomePage />
    </SocketProvider>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
