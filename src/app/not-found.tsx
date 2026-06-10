import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BrandLogo from "@/components/BrandLogo";
import { Search, Home, Briefcase, Users } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-screen page-bg flex flex-col">
      <Navbar />

      <div className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="text-center max-w-lg w-full">

          {/* Logo */}
          <div className="flex justify-center mb-8">
            <BrandLogo variant="circular" size={80} showLink={false} />
          </div>

          {/* 404 badge */}
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 text-xs font-bold px-3 py-1.5 rounded-full mb-5">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
            404 — Page Not Found
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 mb-3 leading-tight">
            Oops, nothing<br />here yet
          </h1>
          <p className="text-gray-500 text-base mb-10 max-w-sm mx-auto leading-relaxed">
            The page you&apos;re looking for doesn&apos;t exist or may have been moved.
          </p>

          {/* Quick links */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
            {[
              { icon: Home,     label: "Home",            href: "/"            },
              { icon: Briefcase, label: "Browse Jobs",    href: "/jobs"        },
              { icon: Users,    label: "Find Freelancers", href: "/freelancers" },
            ].map(({ icon: Icon, label, href }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5 bg-white border border-gray-200 text-gray-700 hover:border-green-400 hover:text-green-700 shadow-sm"
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-green-700 text-white font-bold px-8 py-3.5 rounded-xl hover:bg-green-800 transition-colors shadow-md text-sm"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>

      <Footer />
    </main>
  );
}
