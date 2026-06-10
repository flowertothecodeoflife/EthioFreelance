"use client";
import { useTransition } from "react";
import { logoutAdmin } from "@/app/actions/adminAuth";
import { LogOut, Terminal, Activity } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";

export default function AdminNavbar() {
  const [isPending, startTransition] = useTransition();

  const handleDisconnect = () => {
    startTransition(async () => {
      await logoutAdmin();
    });
  };

  return (
    <nav className="bg-gray-950 text-gray-100 border-b border-gray-900 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Operational Hub Name */}
          <div className="flex items-center gap-3">
            <BrandLogo variant="circular" size={56} showLink={false} />
            <div className="flex flex-col">
              <span className="text-sm font-extrabold tracking-wider text-white uppercase flex items-center gap-1.5">
                EthioFreelance <span className="text-xs bg-green-900/50 text-green-400 border border-green-500/20 px-1.5 py-0.5 rounded font-mono font-normal tracking-normal lowercase">v1.0-sec</span>
              </span>
              <span className="text-[10px] text-gray-400 font-mono tracking-widest uppercase">
                Operations console
              </span>
            </div>
          </div>

          {/* Secure Status Badge */}
          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 px-3 py-1.5 rounded-full text-xs font-mono text-gray-300">
              <Activity className="w-3.5 h-3.5 text-green-400 animate-spin" />
              <span>SECURE PROTOCOL ACTIVE</span>
            </div>
            
            <div className="flex items-center gap-2 bg-green-950/30 border border-green-500/20 px-3 py-1.5 rounded-full text-xs font-semibold text-green-400">
              <Terminal className="w-3.5 h-3.5" />
              <span>System Administrator</span>
            </div>
          </div>

          {/* Connection Disconnect Action */}
          <div>
            <button
              onClick={handleDisconnect}
              disabled={isPending}
              className="flex items-center gap-2 border border-red-500/30 hover:border-red-500 bg-red-950/20 hover:bg-red-950/40 text-red-400 hover:text-red-200 font-extrabold text-xs tracking-wider uppercase px-4 py-2.5 rounded-xl transition-all shadow-md shadow-red-950/10 cursor-pointer disabled:opacity-50"
            >
              {isPending ? (
                <span className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Disconnect Portal</span>
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </nav>
  );
}
