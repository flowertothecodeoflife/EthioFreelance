import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PostJobForm from "@/components/jobs/PostJobForm";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ShieldAlert, LogIn } from "lucide-react";

export const metadata = { title: "Post a Job | EthioFreelance" };

export default async function PostJobPage() {
  const session = await auth();

  // Layer 1: Not logged in at all — middleware already handles this redirect,
  // but we double-check here for defence-in-depth.
  if (!session || !session.user || !(session.user as any).id) {
    redirect("/login?callbackUrl=/post-job");
  }

  const role = (session.user as any).role as string;

  // Layer 2: Logged in but wrong role — show a clear, friendly gate instead of
  // silently failing inside the form.
  if (role !== "CLIENT") {
    return (
      <main className="min-h-screen page-bg flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4 py-20">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <ShieldAlert className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Client Account Required</h1>
            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
              Only <strong>Client</strong> accounts can post jobs. You are currently signed in as a{" "}
              <strong className="capitalize">{role.toLowerCase()}</strong>.
              <br /><br />
              Register a separate client account to start hiring.
            </p>
            <div className="flex flex-col gap-3">
              <Link
                href="/register?role=client"
                className="w-full bg-green-700 text-white font-bold py-3 rounded-xl hover:bg-green-800 transition-colors text-sm flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" /> Create a Client Account
              </Link>
              <Link
                href="/jobs"
                className="w-full border border-gray-200 text-gray-600 font-medium py-3 rounded-xl hover:bg-gray-50 transition-colors text-sm"
              >
                Browse Jobs Instead
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  // Layer 3: Authenticated CLIENT — render the form
  return (
    <main className="min-h-screen page-bg">
      <Navbar />
      <PostJobForm />
      <Footer />
    </main>
  );
}
