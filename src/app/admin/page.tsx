import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminNavbar from "@/components/admin/AdminNavbar";
import AdminDashboard from "@/components/admin/AdminDashboard";
import Footer from "@/components/Footer";
import { getUsers, getDashboardStats, getAllJobs, getAllTransactions } from "@/app/actions/admin";
import { verifyAdminSession } from "@/lib/adminSession";

export const metadata = { title: "Admin Dashboard | EthioFreelance" };

export default async function AdminPage() {
  const cookieStore = await cookies();
  const adminSession = cookieStore.get("admin_session")?.value;

  if (!verifyAdminSession(adminSession)) {
    redirect("/admin/login");
  }

  // All four fetches run in parallel — single round trip
  const [usersRes, statsRes, jobsRes, txRes] = await Promise.all([
    getUsers(),
    getDashboardStats(),
    getAllJobs(),
    getAllTransactions(),
  ]);

  const users        = usersRes.success ? usersRes.users        : [];
  const stats        = statsRes.success ? statsRes.stats        : null;
  const jobs         = jobsRes.success  ? jobsRes.jobs          : [];
  const transactions = txRes.success    ? txRes.transactions    : [];

  return (
    <main className="min-h-screen page-bg">
      <AdminNavbar />
      <AdminDashboard
        initialUsers={users}
        stats={stats}
        initialJobs={jobs}
        initialTransactions={transactions}
      />
      <Footer />
    </main>
  );
}
