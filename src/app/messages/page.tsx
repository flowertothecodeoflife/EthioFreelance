import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MessagesPage from "@/components/messages/MessagesPage";

export const metadata = { title: "Messages | EthioFreelance" };

export default function Messages() {
  return (
    <main className="min-h-screen page-bg flex flex-col">
      <Navbar />
      <div className="flex-1">
        <MessagesPage />
      </div>
      <Footer />
    </main>
  );
}
