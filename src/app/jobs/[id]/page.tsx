import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import JobDetail from "@/components/jobs/JobDetail";
import { getJobById } from "@/app/actions/job";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const res = await getJobById(id);
  if (!res.success || !res.job) return { title: "Job Not Found | EthioFreelance" };
  return {
    title: `${res.job.title} | EthioFreelance`,
    description: res.job.description.slice(0, 155),
  };
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Fetch job, session, and escrow status in parallel
  const [jobRes, session] = await Promise.all([getJobById(id), auth()]);

  if (!jobRes.success || !jobRes.job) {
    return (
      <main className="min-h-screen page-bg">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-24 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Job Not Found</h1>
          <p className="text-gray-500 mb-6 text-sm">
            This job may have been removed or the link is incorrect.
          </p>
          <Link
            href="/jobs"
            className="inline-block bg-green-700 text-white font-semibold px-6 py-3 rounded-xl hover:bg-green-800 transition-colors text-sm"
          >
            Browse All Jobs
          </Link>
        </div>
        <Footer />
      </main>
    );
  }

  const currentUserId   = (session?.user as any)?.id   as string | undefined;
  const currentUserRole = (session?.user as any)?.role as string | undefined;

  // Check if escrow has been funded for this job
  const fundedTx = await prisma.transaction.findFirst({
    where: {
      jobId:  id,
      type:   "ESCROW_DEPOSIT",
      status: "COMPLETED",
    },
    select: { id: true },
  });

  const jobWithEscrow = {
    ...jobRes.job,
    escrowFunded: !!fundedTx,
  };

  return (
    <main className="min-h-screen page-bg">
      <Navbar />
      <JobDetail
        job={jobWithEscrow}
        currentUserId={currentUserId}
        currentUserRole={currentUserRole}
      />
      <Footer />
    </main>
  );
}
