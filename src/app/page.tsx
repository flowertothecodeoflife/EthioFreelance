import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HeroSection from "@/components/home/HeroSection";
import StatsSection from "@/components/home/StatsSection";
import CategoriesSection from "@/components/home/CategoriesSection";
import FeaturedFreelancers from "@/components/home/FeaturedFreelancers";
import FeaturedJobs from "@/components/home/FeaturedJobs";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import CTASection from "@/components/home/CTASection";
import prisma from "@/lib/prisma";

// Revalidate this page every 5 minutes so stats + listings stay fresh
export const revalidate = 300;

export default async function Home() {
  // Fetch all home page data in parallel — fall back to safe defaults if DB is unreachable
  let totalUsers       = 0;
  let totalJobs        = 0;
  let completedJobs    = 0;
  let featuredJobs: {
    id: string;
    title: string;
    budget: number;
    type: import("@prisma/client").JobType;
    location: string;
    category: string;
    skills: string[];
    status: import("@prisma/client").JobStatus;
    createdAt: Date;
    updatedAt: Date;
    description: string;
    clientId: string;
    client: { name: string; kycStatus: import("@prisma/client").KycStatus };
    _count: { proposals: number };
  }[] = [];
  let featuredFreelancers: {
    id: string;
    name: string;
    kycStatus: import("@prisma/client").KycStatus;
    isOnline: boolean;
    profile: {
      title: string | null;
      skills: string[];
      hourlyRate: number | null;
      rating: number;
      completedJobs: number;
    } | null;
  }[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let categoryCountsRaw: any[] = [];

  // Helper: run a query and return its result or a fallback — never throws.
  // This means one flaky DB connection doesn't kill the whole page.
  async function safe<T>(query: Promise<T>, fallback: T): Promise<T> {
    try { return await query; } catch { return fallback; }
  }

  // Run all queries independently so a dropped connection on one
  // doesn't prevent the others from succeeding.
  [
    totalUsers,
    totalJobs,
    completedJobs,
    featuredJobs,
    featuredFreelancers,
    categoryCountsRaw,
  ] = await Promise.all([
    safe(prisma.user.count({ where: { role: "FREELANCER" } }), 0),
    safe(prisma.job.count(), 0),
    safe(prisma.job.count({ where: { status: "COMPLETED" } }), 0),

    // 8 most recent open jobs for the featured strip
    safe(prisma.job.findMany({
      where: { status: "OPEN" },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        client: { select: { name: true, kycStatus: true } },
        _count: { select: { proposals: true } },
      },
    }), []),

    // Top 8 freelancers ordered by recency
    safe(prisma.user.findMany({
      where: {
        role: "FREELANCER",
        profile: { isNot: null },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        name: true,
        kycStatus: true,
        isOnline: true,
        profile: {
          select: {
            title: true,
            skills: true,
            hourlyRate: true,
            rating: true,
            completedJobs: true,
          },
        },
      },
    }), []),

    // Job counts per category
    safe(prisma.job.groupBy({
      by: ["category"],
      where: { status: "OPEN" },
      _count: { id: true },
    }), []),
  ]);

  // Build category→count map
  const catCountMap: Record<string, number> = {};
  for (const row of categoryCountsRaw) {
    catCountMap[(row as any).category] = (row as any)._count.id;
  }

  const stats = {
    totalFreelancers: totalUsers,
    totalJobs,
    completedJobs,
  };

  return (
    <main className="min-h-screen bg-transparent">
      <Navbar />
      <HeroSection stats={stats} />

      {/* ── Glassmorphism content zone ──────────────────────────────────────
          The background image is locked (position:fixed via ParallaxBackground).
          This wrapper starts right after the hero and ends at the footer.
          All sections inside use glass panel treatment.
      ──────────────────────────────────────────────────────────────────── */}
      <div className="glass-zone">
        <StatsSection stats={stats} />
        <CategoriesSection catCounts={catCountMap} />
        <FeaturedJobs jobs={featuredJobs} />
        <FeaturedFreelancers freelancers={featuredFreelancers} />
        <TestimonialsSection />
        <CTASection />
      </div>

      <Footer />
    </main>
  );
}
