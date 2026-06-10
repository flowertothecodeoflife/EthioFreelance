import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FreelancersListing from "@/components/freelancers/FreelancersListing";
import { getFreelancers } from "@/app/actions/profile";

export const metadata = {
  title: "Find Freelancers | EthioFreelance",
  description: "Browse verified Ethiopian freelancers. Hire top talent in IT, design, writing, and more.",
};

export default async function FreelancersPage() {
  const res = await getFreelancers();
  const dbFreelancers = res.success ? res.freelancers : [];

  return (
    <main className="min-h-screen page-bg">
      <Navbar />
      <FreelancersListing initialFreelancers={dbFreelancers} />
      <Footer />
    </main>
  );
}
