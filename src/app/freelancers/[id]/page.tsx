import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FreelancerProfile from "@/components/freelancers/FreelancerProfile";
import { getFreelancerProfile } from "@/app/actions/profile";
import { AlertCircle } from "lucide-react";
import Link from "next/link";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const res = await getFreelancerProfile(id);
  if (!res.success || !res.freelancer) {
    return { title: "Freelancer Not Found | EthioFreelance" };
  }
  const f = res.freelancer;
  return {
    title: `${f.name} – ${f.profile?.title ?? "Freelancer"} | EthioFreelance`,
    description: f.profile?.bio?.slice(0, 155) ?? `Hire ${f.name} on EthioFreelance.`,
  };
}

export default async function FreelancerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const res = await getFreelancerProfile(id);

  // Freelancer not found — clean 404 page
  if (!res.success || !res.freelancer) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-24 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Freelancer Not Found</h1>
          <p className="text-gray-500 mb-6 text-sm">
            This profile may have been removed or the link is incorrect.
          </p>
          <Link
            href="/freelancers"
            className="inline-block bg-green-700 text-white font-semibold px-6 py-3 rounded-xl hover:bg-green-800 transition-colors text-sm"
          >
            Browse Freelancers
          </Link>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />
      <FreelancerProfile freelancer={res.freelancer} />
      <Footer />
    </main>
  );
}
