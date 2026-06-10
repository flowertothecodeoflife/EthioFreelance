import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoginForm from "@/components/auth/LoginForm";

export const metadata = { title: "Sign In | EthioFreelance" };

export default function LoginPage() {
  return (
    <main className="min-h-screen page-bg">
      <Navbar />
      <LoginForm />
      <Footer />
    </main>
  );
}
