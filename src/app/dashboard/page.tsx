import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Dashboard from "@/components/dashboard/Dashboard";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

export const metadata = { title: "Dashboard | EthioFreelance" };

export default async function DashboardPage() {
  const session = await auth();
  if (!session || !session.user || !(session.user as any).id) {
    redirect("/login");
  }

  const userId = (session.user as any).id;

  // Fetch complete user details including role and kycStatus
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      jobs: {
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { proposals: true }
          },
          // Include funded escrow transactions so dashboard can show Release button
          transactions: {
            where: {
              type: "ESCROW_DEPOSIT",
              status: "COMPLETED",
            },
            select: { id: true, amount: true },
            take: 1,
          },
          // Include accepted proposal so confirm modal shows freelancer name
          proposals: {
            where: { status: "ACCEPTED" },
            select: {
              id: true,
              bidAmount: true,
              freelancer: { select: { id: true, name: true } },
            },
            take: 1,
          },
        }
      },
      proposals: {
        orderBy: { createdAt: "desc" },
        include: {
          job: {
            select: {
              id: true,
              title: true,
              budget: true,
              type: true,
              status: true,
              client: { select: { name: true } }
            }
          }
        }
      },
      transactions: {
        orderBy: { createdAt: "desc" }
      }
    }
  });

  if (!user) {
    redirect("/login");
  }

  if (user.role === "ADMIN") {
    redirect("/admin");
  }

  // Calculate stats based on user data
  let stats = {
    totalEarned: 0,
    activeJobsCount: 0,
    completedJobsCount: 0,
    rating: 0,
  };

  if (user.role === "FREELANCER") {
    stats.rating = user.profile?.rating ?? 5.0; 
    stats.completedJobsCount = user.profile?.completedJobs ?? 0;
    
    // Count active proposals accepted (meaning job status is IN_PROGRESS)
    stats.activeJobsCount = user.proposals.filter(p => p.status === "ACCEPTED").length;
    
    // Total earned from completed transactions
    stats.totalEarned = user.transactions
      .filter(t => t.type === "ESCROW_RELEASE" && t.status === "COMPLETED")
      .reduce((sum, t) => sum + t.amount, 0);
  } else {
    // Client statistics
    stats.activeJobsCount = user.jobs.filter(j => j.status === "OPEN" || j.status === "IN_PROGRESS").length;
    stats.completedJobsCount = user.jobs.filter(j => j.status === "COMPLETED").length;
    stats.totalEarned = user.transactions
      .filter(t => t.type === "ESCROW_DEPOSIT" && t.status === "COMPLETED")
      .reduce((sum, t) => sum + t.amount, 0); // Total Spent
    stats.rating = 5.0; // Default rating
  }

  // Format data for client Dashboard
  const dashboardData = {
    user: {
      name: user.name,
      role: user.role,
      kycStatus: user.kycStatus,
      email: user.email,
    },
    stats,
    jobs: user.jobs,
    proposals: user.proposals,
    transactions: user.transactions,
    // Real wallet balance — for freelancer: sum of ESCROW_RELEASE credits
    // For client: pending deposits not yet released
    walletBalance: user.role === "FREELANCER"
      ? user.transactions
          .filter(t => t.type === "ESCROW_RELEASE" && t.status === "COMPLETED")
          .reduce((s, t) => s + t.amount, 0)
      : user.transactions
          .filter(t => t.type === "ESCROW_DEPOSIT" && t.status === "PENDING")
          .reduce((s, t) => s + t.amount, 0),
  };

  return (
    <main className="min-h-screen page-bg">
      <Navbar />
      <Dashboard data={dashboardData} />
      <Footer />
    </main>
  );
}
