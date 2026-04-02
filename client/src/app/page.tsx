import { HomePage } from "@/pages/home/ui/home-page";
import { SocketProvider } from "@/shared/socket/socketProvider";

export default function Home() {
  return (
    <SocketProvider url="http://localhost:8001">
      <HomePage />
    </SocketProvider>
  );
}
