import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProfileSettingsForm from "@/components/profile/ProfileSettingsForm";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Profile Settings | EthioFreelance",
  description: "Manage your freelancer profile title, bio, hourly rate, and skill tags.",
};

export default async function ProfilePage() {
  const session = await auth();
  if (!session || !session.user || !(session.user as any).id) {
    redirect("/login");
  }

  const userId = (session.user as any).id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "FREELANCER") {
    redirect("/dashboard");
  }

  const profileData = {
    title: user.profile?.title || "",
    bio: user.profile?.bio || "",
    skills: user.profile?.skills || [],
    hourlyRate: user.profile?.hourlyRate || 0,
  };

  return (
    <main className="min-h-screen page-bg flex flex-col justify-between">
      <div>
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <ProfileSettingsForm initialData={profileData} />
        </div>
      </div>
      <Footer />
    </main>
  );
}
