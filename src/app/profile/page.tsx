import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProfileSettingsForm from "@/components/profile/ProfileSettingsForm";
import ClientProfileForm from "@/components/profile/ClientProfileForm";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Profile Settings | EthioFreelance",
  description: "Manage your profile and account details.",
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

  // ADMIN accounts have no profile form — send them to the admin panel
  if (user.role === "ADMIN") {
    redirect("/admin");
  }

  // Clients get their own settings form
  if (user.role === "CLIENT") {
    const clientData = {
      name: user.name,
      email: user.email,
      phone: user.phone ?? "",
    };

    return (
      <main className="min-h-screen page-bg flex flex-col justify-between">
        <div>
          <Navbar />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <ClientProfileForm initialData={clientData} />
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  // Freelancers
  const profileData = {
    title: user.profile?.title || "",
    bio: user.profile?.bio || "",
    skills: user.profile?.skills || [],
    hourlyRate: user.profile?.hourlyRate || 0,
    avatarUrl: user.avatarUrl ?? null,
    name: user.name,
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
