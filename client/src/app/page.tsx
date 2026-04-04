import { HomePage } from "@/pages/home/ui/home-page";
import { SocketProvider } from "@/shared/socket/socketProvider";

export default function Home() {
  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:8001";

  return (
    <SocketProvider url={socketUrl}>
      <HomePage />
    </SocketProvider>
  );
}
