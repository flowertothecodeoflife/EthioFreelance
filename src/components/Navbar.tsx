"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu, X, Globe, Bell, MessageSquare, ChevronDown,
  Search, User, LogOut, Settings, Briefcase, Moon, Sun,
} from "lucide-react";
import { useTheme } from "./ThemeProvider";
import BrandLogo from "./BrandLogo";
import { useSession, signOut } from "next-auth/react";
import { getNotificationsAction, markNotificationReadAction, markAllNotificationsReadAction } from "@/app/actions/message";

// ── Notification type matching the Prisma model ───────────────────────────────
type NavNotification = {
  id: string;
  userId: string;
  title: string;
  content: string;
  type: string;
  read: boolean;
  createdAt: string | Date;
};

const NAV_CATEGORIES = [
  "IT & Software", "Design & Creative", "Writing & Content",
  "Local Services", "NGO & Remote Work", "Data Entry",
  "Tutoring", "Government Tasks",
];

const NAV_LINKS = [
  { label: "Browse Jobs",      href: "/jobs"         },
  { label: "Find Freelancers", href: "/freelancers"  },
  { label: "How It Works",     href: "/how-it-works" },
];

export default function Navbar() {
  const pathname                         = usePathname();
  const router                           = useRouter();
  const { data: session, status }        = useSession();
  const { theme, toggleTheme }           = useTheme();

  const [mobileOpen, setMobileOpen]     = useState(false);
  const [langOpen,   setLangOpen]       = useState(false);
  const [userOpen,   setUserOpen]       = useState(false);
  const [catOpen,    setCatOpen]        = useState(false);
  const [lang,       setLang]           = useState("EN");
  const [mobileSearch, setMobileSearch] = useState("");

  const [notifications, setNotifications] = useState<NavNotification[]>([]);
  const [notifOpen, setNotifOpen]         = useState(false);
  const [activeToast, setActiveToast]     = useState<{ title: string; content: string } | null>(null);

  // ── Refs for outside-click detection ─────────────────────────────────────
  const catRef    = useRef<HTMLDivElement>(null);
  const langRef   = useRef<HTMLDivElement>(null);
  const userRef   = useRef<HTMLDivElement>(null);
  const notifRef  = useRef<HTMLDivElement>(null);
  const mobileRef = useRef<HTMLDivElement>(null);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  // ── Close any open dropdown when clicking outside ─────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (catRef.current   && !catRef.current.contains(target))   setCatOpen(false);
      if (langRef.current  && !langRef.current.contains(target))  setLangOpen(false);
      if (userRef.current  && !userRef.current.contains(target))  setUserOpen(false);
      if (notifRef.current && !notifRef.current.contains(target)) setNotifOpen(false);
      if (mobileRef.current && !mobileRef.current.contains(target)) setMobileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, []);

  // Load notifications + SSE stream
  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) return;

    getNotificationsAction().then((res) => {
      if (res.success && res.notifications) setNotifications(res.notifications as NavNotification[]);
    });

    const es = new EventSource("/api/notifications/stream");
    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as NavNotification;
        if ((data as any).heartbeat || (data as any).ping) return;
        setNotifications((prev) => {
          if (prev.some((n) => n.id === data.id)) return prev;
          return [data, ...prev];
        });
        setActiveToast({ title: data.title, content: data.content });
      } catch {}
    };
    return () => es.close();
  }, [status, session?.user?.id]);

  useEffect(() => {
    if (!activeToast) return;
    const t = setTimeout(() => setActiveToast(null), 4000);
    return () => clearTimeout(t);
  }, [activeToast]);

  const handleMarkAsRead = async (id: string) => {
    const res = await markNotificationReadAction(id);
    if (res.success) {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    }
  };

  const handleMarkAllAsRead = async () => {
    const res = await markAllNotificationsReadAction();
    if (res.success) {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  };
  // ── Mobile search submit ──────────────────────────────────────────────────
  const handleMobileSearch = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    const q = mobileSearch.trim();
    if (!q) return;
    setMobileOpen(false);
    router.push(`/jobs?search=${encodeURIComponent(q)}`);
  }, [mobileSearch, router]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const isAuthenticated = status === "authenticated";
  const userRole        = (session?.user as any)?.role as string | undefined;

  const postJobHref = isAuthenticated ? "/post-job" : "/register?role=client";

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const navLinkClass = (href: string) =>
    `text-sm transition-colors relative pb-0.5 ${
      isActive(href)
        ? "text-green-300 font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-green-400 after:rounded-full"
        : "text-white/80 hover:text-green-300"
    }`;

  const mobileNavLinkClass = (href: string) =>
    `flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
      isActive(href)
        ? "bg-green-800 text-green-300"
        : "text-white/80 hover:bg-green-800/60 hover:text-white"
    }`;

  const languages = [
    { code: "EN", label: "English" },
    { code: "አማ", label: "አማርኛ"   },
  ];

  return (
    <nav className="bg-green-900 text-white sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex items-center justify-between min-h-[4.5rem] py-2">

          {/* Logo — smaller on mobile */}
          <BrandLogo variant="horizontal" size={52} surface="dark" priority className="sm:!h-[68px]" />

          {/* ── Desktop nav links ── */}
          <div className="hidden md:flex items-center gap-6">

            {/* Browse Jobs dropdown */}
            <div className="relative" ref={catRef}>
              <button
                onClick={() => setCatOpen((o) => !o)}
                className={navLinkClass("/jobs") + " flex items-center gap-1 cursor-pointer"}
              >
                Browse Jobs <ChevronDown className="w-4 h-4" />
              </button>
              {catOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-white text-gray-800 rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                  {NAV_CATEGORIES.map((cat) => (
                    <Link
                      key={cat}
                      href={`/jobs?category=${encodeURIComponent(cat)}`}
                      className="block px-4 py-2 text-sm hover:bg-green-50 hover:text-green-800 transition-colors"
                      onClick={() => setCatOpen(false)}
                    >
                      {cat}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link href="/freelancers" className={navLinkClass("/freelancers")}>Find Freelancers</Link>
            <Link href="/how-it-works" className={navLinkClass("/how-it-works")}>How It Works</Link>
          </div>

          {/* ── Desktop right side ── */}
          <div className="hidden md:flex items-center gap-3">

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-green-800 rounded-lg transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>

            {/* Language picker */}
            <div className="relative" ref={langRef}>
              <button
                onClick={() => setLangOpen((o) => !o)}
                className="flex items-center gap-1 text-sm hover:text-green-300 transition-colors px-2 py-1 rounded-lg hover:bg-green-800"
              >
                <Globe className="w-4 h-4" /> {lang} <ChevronDown className="w-3 h-3" />
              </button>
              {langOpen && (
                <div className="absolute top-full right-0 mt-2 w-40 bg-white text-gray-800 rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                  {languages.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => { setLang(l.code); setLangOpen(false); }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-green-50 hover:text-green-800 transition-colors"
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Auth state */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                {/* Messages */}
                <Link
                  href="/messages"
                  className={`p-2 rounded-lg transition-colors ${isActive("/messages") ? "bg-green-800 text-green-300" : "hover:bg-green-800"}`}
                >
                  <MessageSquare className="w-5 h-5" />
                </Link>

                {/* Notifications bell */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => { setNotifOpen((o) => !o); setUserOpen(false); }}
                    className="p-2 hover:bg-green-800 rounded-lg transition-colors relative"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-green-400 text-green-950 font-extrabold text-[9px] rounded-full flex items-center justify-center animate-pulse">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                  {notifOpen && (
                    <div className="absolute top-full right-0 mt-2 w-80 bg-white text-gray-800 rounded-2xl shadow-2xl border border-gray-100 py-3.5 z-50">
                      <div className="px-4 pb-2 border-b border-gray-100 flex items-center justify-between">
                        <span className="font-bold text-sm text-gray-900">Notifications</span>
                        <div className="flex items-center gap-2">
                          {unreadCount > 0 && (
                            <>
                              <span className="text-[10px] text-green-700 bg-green-50 px-2 py-0.5 rounded-full font-bold">
                                {unreadCount} new
                              </span>
                              <button
                                onClick={handleMarkAllAsRead}
                                className="text-[10px] text-gray-400 hover:text-green-700 font-medium transition-colors"
                              >
                                Mark all read
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="max-h-64 overflow-y-auto divide-y divide-gray-50">
                        {notifications.length > 0 ? (
                          notifications.map((n) => (
                            <button
                              key={n.id}
                              onClick={() => { handleMarkAsRead(n.id); setNotifOpen(false); }}
                              className={`w-full text-left p-3.5 hover:bg-green-50/30 transition-colors flex gap-3 items-start ${!n.read ? "bg-green-50/10" : ""}`}
                            >
                              <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!n.read ? "bg-green-500" : "bg-gray-300"}`} />
                              <div className="min-w-0">
                                <div className="font-bold text-xs text-gray-900">{n.title}</div>
                                <div className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">{n.content}</div>
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="py-8 text-center text-xs text-gray-400">No notifications yet.</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User menu */}
                <div className="relative" ref={userRef}>
                  <button
                    onClick={() => { setUserOpen((o) => !o); setNotifOpen(false); }}
                    className="flex items-center gap-2 bg-green-800 hover:bg-green-700 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <div className="w-7 h-7 bg-green-400 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-green-900" />
                    </div>
                    <span className="text-sm font-medium">{session?.user?.name?.split(" ")[0]}</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  {userOpen && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-white text-gray-800 rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                      {(userRole === "FREELANCER" || userRole === "CLIENT") && (
                        <Link href="/dashboard" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-green-50 hover:text-green-800 transition-colors" onClick={() => setUserOpen(false)}>
                          <User className="w-4 h-4" /> Dashboard
                        </Link>
                      )}
                      {userRole === "FREELANCER" && (
                        <Link href="/profile" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-green-50 hover:text-green-800 transition-colors" onClick={() => setUserOpen(false)}>
                          <Settings className="w-4 h-4" /> Profile Settings
                        </Link>
                      )}
                      {userRole === "CLIENT" && (
                        <Link href="/profile" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-green-50 hover:text-green-800 transition-colors" onClick={() => setUserOpen(false)}>
                          <Settings className="w-4 h-4" /> Account Settings
                        </Link>
                      )}
                      {userRole === "ADMIN" && (
                        <Link href="/admin" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-green-50 hover:text-green-800 transition-colors" onClick={() => setUserOpen(false)}>
                          <Settings className="w-4 h-4" /> Admin Panel
                        </Link>
                      )}
                      <hr className="my-1 border-gray-100" />
                      <button
                        onClick={() => signOut()}
                        className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-red-50 hover:text-red-600 transition-colors w-full text-left"
                      >
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : status === "loading" ? (
              <div className="w-20 h-8 rounded-lg bg-green-800 animate-pulse" />
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login"    className="text-sm border border-green-400 text-green-400 px-3 py-1.5 rounded-lg hover:bg-green-800 transition-colors">Sign In</Link>
                <Link href="/register" className="text-sm bg-green-400 text-green-900 font-semibold px-3 py-1.5 rounded-lg hover:bg-green-300 transition-colors">Sign Up</Link>
              </div>
            )}

            {/* Post a Job */}
            <Link
              href={postJobHref}
              className="bg-green-400 text-green-900 font-semibold px-4 py-2 rounded-lg text-sm hover:bg-green-300 transition-colors"
            >
              Post a Job
            </Link>
          </div>

          {/* Mobile hamburger — inside mobileRef so outside-click doesn't conflict */}
          <div ref={mobileRef} className="md:hidden">
            <button
              className="p-2 hover:bg-green-800 rounded-lg transition-colors"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* ── Mobile dropdown ── */}
            <div
              className={`absolute left-0 right-0 overflow-hidden transition-all duration-300 ease-in-out z-40 ${
                mobileOpen ? "max-h-[32rem] opacity-100" : "max-h-0 opacity-0 pointer-events-none"
              }`}
              style={{ top: "100%" }}
            >
              <div className="bg-green-900 border-t border-green-800 px-3 py-3 space-y-0.5 shadow-xl">

                {/* Search */}
                <form onSubmit={handleMobileSearch} className="relative mb-2.5">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-green-400" />
                  <input
                    type="text"
                    value={mobileSearch}
                    onChange={(e) => setMobileSearch(e.target.value)}
                    placeholder="Search jobs..."
                    className="w-full bg-green-800 text-white placeholder-green-400 pl-8 pr-14 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-green-400 text-green-900 text-xs font-bold px-2 py-0.5 rounded-lg"
                  >
                    Go
                  </button>
                </form>

                {/* Nav links */}
                {NAV_LINKS.map(({ label, href }) => (
                  <Link
                    key={label}
                    href={href}
                    className={mobileNavLinkClass(href)}
                    onClick={() => setMobileOpen(false)}
                  >
                    {label}
                  </Link>
                ))}

                {isAuthenticated ? (
                  <>
                    <Link href="/dashboard" className={mobileNavLinkClass("/dashboard")} onClick={() => setMobileOpen(false)}>Dashboard</Link>
                    <Link href="/messages"  className={mobileNavLinkClass("/messages")}  onClick={() => setMobileOpen(false)}>Messages</Link>
                    <hr className="border-green-800 my-1.5" />
                    <button
                      onClick={() => signOut()}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-300 hover:bg-red-900/30 hover:text-red-200 transition-colors w-full"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <hr className="border-green-800 my-1.5" />
                    <div className="flex gap-2 py-1">
                      <Link href="/login"    className="flex-1 text-center border border-green-400 text-green-400 py-2 rounded-xl text-sm hover:bg-green-800 transition-colors" onClick={() => setMobileOpen(false)}>Sign In</Link>
                      <Link href="/register" className="flex-1 text-center bg-green-400 text-green-900 font-semibold py-2 rounded-xl text-sm hover:bg-green-300 transition-colors" onClick={() => setMobileOpen(false)}>Sign Up</Link>
                    </div>
                    <Link
                      href="/register?role=client"
                      className="flex items-center justify-center gap-2 bg-green-400/20 border border-green-400/40 text-green-300 py-2 rounded-xl text-sm font-medium hover:bg-green-400/30 transition-colors"
                      onClick={() => setMobileOpen(false)}
                    >
                      <Briefcase className="w-3.5 h-3.5" /> Post a Job
                    </Link>
                  </>
                )}

                {/* Theme toggle */}
                <button
                  onClick={toggleTheme}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-white/70 hover:bg-green-800/60 hover:text-white transition-colors w-full"
                >
                  {theme === "light" ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
                  {theme === "light" ? "Dark Mode" : "Light Mode"}
                </button>
              </div>
            </div>
          </div>

        </div>{/* end flex items-center row */}
      </div>{/* end max-w-7xl */}

      {/* Notification toast */}
      {activeToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-green-950 border border-green-600/30 text-white rounded-2xl p-4 shadow-2xl flex gap-3.5 items-start max-w-xs animate-slideUp">
          <div className="w-8 h-8 bg-green-500 rounded-xl flex items-center justify-center text-green-950 flex-shrink-0">
            <Bell className="w-4 h-4 animate-bounce" />
          </div>
          <div className="min-w-0">
            <div className="font-extrabold text-xs tracking-tight">{activeToast.title}</div>
            <div className="text-[10px] text-green-200 mt-0.5 font-semibold leading-normal">{activeToast.content}</div>
          </div>
        </div>
      )}
    </nav>
  );
}
