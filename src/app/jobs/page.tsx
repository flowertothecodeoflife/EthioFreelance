import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import JobsListing from "@/components/jobs/JobsListing";
import { getJobs } from "@/app/actions/job";
import { Suspense } from "react";
import PageLoader from "@/components/ui/PageLoader";

export const metadata = {
  title: "Browse Jobs | EthioFreelance",
  description: "Find freelance jobs in Ethiopia. IT, design, writing, translation, and more.",
};

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const { category, q } = await searchParams;

  // Fetch filtered jobs + total count (unfiltered) in parallel.
  // totalCount tells the listing whether the DB has ANY jobs at all,
  // so the "Sample data" badge only shows when the DB is truly empty.
  const [res, totalRes] = await Promise.all([
    getJobs({ category: category || undefined, search: q || undefined }),
    getJobs(),
  ]);

  const dbJobs    = res.success      ? res.jobs      : [];
  const dbHasJobs = totalRes.success ? totalRes.jobs.length > 0 : false;

  return (
    <main className="min-h-screen page-bg">
      <Navbar />
      <Suspense fallback={<PageLoader />}>
        <JobsListing initialJobs={dbJobs} dbHasJobs={dbHasJobs} />
      </Suspense>
      <Footer />
    </main>
  );
}
