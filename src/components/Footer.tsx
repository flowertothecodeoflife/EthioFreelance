import Link from "next/link";
import { Phone, Mail, MapPin, Share2, MessageCircle, Rss, Globe } from "lucide-react";
import BrandLogo from "./BrandLogo";
import { getTranslations } from "next-intl/server";

export default async function Footer() {
  const t = await getTranslations("footer");
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
              {t("tagline")}
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
            <h3 className="font-semibold text-white mb-4">{t("forClients")}</h3>
            <ul className="space-y-2">
              {[
                [t("clientLinks.postJob"), "/post-job"],
                [t("clientLinks.findFreelancers"), "/freelancers"],
                [t("clientLinks.browseCategories"), "/jobs"],
                [t("clientLinks.howToHire"), "/how-it-works"],
              ].map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="text-green-300 hover:text-white text-sm transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
              <li>
                <span className="text-green-600 text-sm cursor-default">
                  {t("clientLinks.enterprise")} <span className="text-[10px] bg-green-800 text-green-400 px-1.5 py-0.5 rounded-full ml-1">Soon</span>
                </span>
              </li>
            </ul>
          </div>

          {/* For Freelancers */}
          <div>
            <h3 className="font-semibold text-white mb-4">{t("forFreelancers")}</h3>
            <ul className="space-y-2">
              {[
                [t("freelancerLinks.findJobs"), "/jobs"],
                [t("freelancerLinks.createProfile"), "/register"],
              ].map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="text-green-300 hover:text-white text-sm transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
              {[t("freelancerLinks.skillTests"), t("freelancerLinks.resources"), t("freelancerLinks.stories")].map((label) => (
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
            <h3 className="font-semibold text-white mb-4">{t("contactUs")}</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span className="text-green-300 text-sm">{t("address")}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-green-400 flex-shrink-0" />
                <span className="text-green-300 text-sm">{t("phone")}</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-green-400 flex-shrink-0" />
                <span className="text-green-300 text-sm">{t("email")}</span>
              </li>
            </ul>
            <div className="mt-5">
              <p className="text-green-400 text-xs font-semibold mb-2">{t("paymentPartner")}</p>
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
            {t("copyright")}
          </p>
          <div className="flex gap-2 text-xs text-green-500">
            <span>{t("madeIn")}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
