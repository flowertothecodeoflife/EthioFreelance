import Link from "next/link";
import {
  Code2, Palette, PenTool, Languages, BookOpen, Database,
  Building2, Mic, Calculator, Camera, Truck, GraduationCap,
} from "lucide-react";
import ScrollStrip from "@/components/ui/ScrollStrip";

interface Props {
  catCounts?: Record<string, number>;
}

const CATEGORIES = [
  { icon: Code2,         label: "IT & Software",        key: "IT & Software",        color: "from-blue-500 to-indigo-600",    href: "/jobs?category=IT+%26+Software"        },
  { icon: Palette,       label: "Design & Creative",    key: "Design & Creative",    color: "from-purple-500 to-pink-600",    href: "/jobs?category=Design+%26+Creative"    },
  { icon: PenTool,       label: "Writing & Content",    key: "Writing & Content",    color: "from-orange-500 to-amber-600",   href: "/jobs?category=Writing+%26+Content"    },
  { icon: Languages,     label: "Translation",          key: "Translation",          color: "from-green-500 to-emerald-600",  href: "/jobs?category=Translation"            },
  { icon: GraduationCap, label: "Tutoring",             key: "Tutoring",             color: "from-yellow-500 to-orange-500",  href: "/jobs?category=Tutoring"               },
  { icon: Database,      label: "Data Entry",           key: "Data Entry",           color: "from-cyan-500 to-sky-600",       href: "/jobs?category=Data+Entry"             },
  { icon: Building2,     label: "NGO & Remote Work",    key: "NGO & Remote Work",    color: "from-teal-500 to-cyan-600",      href: "/jobs?category=NGO+%26+Remote+Work"    },
  { icon: Mic,           label: "Voice & Audio",        key: "Voice & Audio",        color: "from-pink-500 to-rose-600",      href: "/jobs?category=Voice+%26+Audio"        },
  { icon: Calculator,    label: "Finance & Accounting", key: "Finance & Accounting", color: "from-indigo-500 to-violet-600",  href: "/jobs?category=Finance+%26+Accounting" },
  { icon: Camera,        label: "Photography & Video",  key: "Photography & Video",  color: "from-red-500 to-pink-600",       href: "/jobs?category=Photography+%26+Video"  },
  { icon: Truck,         label: "Local Services",       key: "Local Services",       color: "from-amber-500 to-yellow-600",   href: "/jobs?category=Local+Services"         },
  { icon: BookOpen,      label: "Government Tasks",     key: "Government Tasks",     color: "from-slate-500 to-gray-600",     href: "/jobs?category=Government+Tasks"       },
];

export default function CategoriesSection({ catCounts = {} }: Props) {
  return (
    <section className="glass-section py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Browse by Category</h2>
            <p className="text-gray-500 max-w-md">Explore opportunities tailored for the Ethiopian market.</p>
          </div>
          <Link
            href="/jobs"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-green-700 hover:text-green-900 px-4 py-2 rounded-xl transition-all"
            style={{
              background: "rgba(255,255,255,0.35)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.55)",
            }}
          >
            All categories →
          </Link>
        </div>

        <ScrollStrip className="-mx-4 px-4 sm:-mx-0 sm:px-0">
          {CATEGORIES.map(({ icon: Icon, label, key, color, href }) => {
            const count = catCounts[key] ?? 0;
            return (
              <Link key={label} href={href} className="group flex-shrink-0 snap-start w-40 sm:w-44">
                <div className="glass-card rounded-2xl p-5 h-full flex flex-col items-center text-center gap-3">
                  {/* Icon bubble */}
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-800 leading-tight mb-1.5">{label}</div>
                    {/* Count pill */}
                    <span
                      className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                      style={{
                        background: "rgba(255,255,255,0.30)",
                        backdropFilter: "blur(6px)",
                        WebkitBackdropFilter: "blur(6px)",
                        border: "1px solid rgba(255,255,255,0.50)",
                        color: "inherit",
                      }}
                    >
                      {count > 0 ? `${count} job${count !== 1 ? "s" : ""}` : "Browse"}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </ScrollStrip>

      </div>
    </section>
  );
}
