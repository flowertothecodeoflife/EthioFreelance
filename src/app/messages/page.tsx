import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MessagesPage from "@/components/messages/MessagesPage";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Messages | EthioFreelance" };

export default async function Messages() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/messages");

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
