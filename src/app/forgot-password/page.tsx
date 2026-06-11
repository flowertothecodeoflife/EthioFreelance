import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

export const metadata = { title: "Reset Password | EthioFreelance" };

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen page-bg">
      <Navbar />
      <ForgotPasswordForm />
      <Footer />
    </main>
  );
}
