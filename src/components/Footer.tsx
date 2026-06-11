import Link from "next/link";
import { Phone, Mail, MapPin, Share2, MessageCircle, Rss, Globe } from "lucide-react";
import BrandLogo from "./BrandLogo";

export default function Footer() {
  return (
    <footer className="footer-surface text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <div className="mb-4">
              <BrandLogo variant="horizontal-transparent" size={64} surface="dark" />
            </div>
            <p className="text-green-300 text-sm leading-relaxed mb-5">
              Ethiopia&apos;s premier freelancing marketplace. Connecting talented professionals with clients across the country.
            </p>
            <div className="flex gap-3">
              {[Share2, MessageCircle, Rss, Globe].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-9 h-9 bg-green-800 hover:bg-green-700 rounded-lg flex items-center justify-center transition-colors"
                >
                  <Icon className="w-4 h-4 text-green-300" />
                </a>
              ))}
            </div>
          </div>

          {/* For Clients */}
          <div>
            <h3 className="font-semibold text-white mb-4">For Clients</h3>
            <ul className="space-y-2">
              {[
                ["Post a Job", "/post-job"],
                ["Find Freelancers", "/freelancers"],
                ["Browse Categories", "/jobs"],
                ["How to Hire", "/how-it-works"],
              ].map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="text-green-300 hover:text-white text-sm transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
              <li>
                <span className="text-green-600 text-sm cursor-default">
                  Enterprise Solutions <span className="text-[10px] bg-green-800 text-green-400 px-1.5 py-0.5 rounded-full ml-1">Soon</span>
                </span>
              </li>
            </ul>
          </div>

          {/* For Freelancers */}
          <div>
            <h3 className="font-semibold text-white mb-4">For Freelancers</h3>
            <ul className="space-y-2">
              {[
                ["Find Jobs", "/jobs"],
                ["Create Profile", "/register"],
              ].map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="text-green-300 hover:text-white text-sm transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
              {["Skill Tests", "Freelancer Resources", "Success Stories"].map((label) => (
                <li key={label}>
                  <span className="text-green-600 text-sm cursor-default">
                    {label} <span className="text-[10px] bg-green-800 text-green-400 px-1.5 py-0.5 rounded-full ml-1">Soon</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-white mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span className="text-green-300 text-sm">Bole Road, Addis Ababa, Ethiopia</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-green-400 flex-shrink-0" />
                <span className="text-green-300 text-sm">+251 911 000 000</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-green-400 flex-shrink-0" />
                <span className="text-green-300 text-sm">support@ethiofreelance.et</span>
              </li>
            </ul>
            <div className="mt-5">
              <p className="text-green-400 text-xs font-semibold mb-2">PAYMENT PARTNER</p>
              <div className="bg-green-800 rounded-lg px-4 py-2 inline-block">
                <span className="text-white font-bold text-sm">Chapa</span>
                <span className="text-green-400 text-xs ml-1">Payments</span>
              </div>
            </div>
          </div>
        </div>

        <hr className="border-green-800 my-10" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-green-400 text-sm">
            © 2025 EthioFreelance. All rights reserved.
          </p>
          <div className="flex gap-6">
            {[["Privacy Policy", "/privacy"], ["Terms of Service", "/terms"], ["Cookie Policy", "/cookie-policy"]].map(([item]) => (
              <span key={item} className="text-green-600 text-sm cursor-default">{item}</span>
            ))}
          </div>
          <div className="flex gap-2 text-xs text-green-500">
            <span>🇪🇹 Made in Ethiopia</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
