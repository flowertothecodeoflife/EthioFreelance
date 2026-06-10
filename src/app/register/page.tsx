import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import RegisterForm from "@/components/auth/RegisterForm";

export const metadata = {
  title: "Create Account | EthioFreelance",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const { role } = await searchParams;
  const initialRole: "client" | "freelancer" =
    role === "client" ? "client" : "freelancer";

  return (
    <main className="min-h-screen page-bg">
      <Navbar />
      <RegisterForm initialRole={initialRole} />
      <Footer />
    </main>
  );
}
