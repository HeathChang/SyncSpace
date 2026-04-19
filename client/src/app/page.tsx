import HomePage from "@/views/home/ui/home.page";
import { SocketProvider } from "@/shared/socket";

export default function Home() {
  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:8001";

  return (
    <SocketProvider url={socketUrl}>
      <HomePage />
    </SocketProvider>
  );
}
