import Navbar from "@/components/Navbar";
import MessagesPage from "@/components/messages/MessagesPage";

export const metadata = { title: "Messages | EthioFreelance" };

export default function Messages() {
  return (
    <main className="min-h-screen page-bg">
      <Navbar />
      <MessagesPage />
    </main>
  );
}
