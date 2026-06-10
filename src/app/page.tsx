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

  try {
    [
      totalUsers,
      totalJobs,
      completedJobs,
      featuredJobs,
      featuredFreelancers,
      categoryCountsRaw,
    ] = await Promise.all([
      prisma.user.count({ where: { role: "FREELANCER" } }),
      prisma.job.count(),
      prisma.job.count({ where: { status: "COMPLETED" } }),

      // 8 most recent open jobs for the featured strip
      prisma.job.findMany({
        where: { status: "OPEN" },
        orderBy: { createdAt: "desc" },
        take: 8,
        include: {
          client: { select: { name: true, kycStatus: true } },
          _count: { select: { proposals: true } },
        },
      }),

      // Top 8 freelancers ordered by recency
      prisma.user.findMany({
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
      }),

      // Job counts per category
      prisma.job.groupBy({
        by: ["category"],
        where: { status: "OPEN" },
        _count: { id: true },
      }),
    ]);
  } catch (err) {
    // DB unreachable — page still renders with empty/zero data instead of 500
    console.error("[Home] DB fetch failed, rendering with fallback data:", err);
  }

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
      <HeroSection />

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
