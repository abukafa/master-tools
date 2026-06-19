import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import { LogOut, Crown, Zap, User as UserIcon } from "lucide-react";

import { TIER_LIMITS } from "@/lib/rate-limit-mongo";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role === "anonymous") {
    redirect("/login");
  }

  // Fetch real-time quota from MongoDB
  await connectToDatabase();
  const user = await User.findOne({ uid: session.user.uid }).lean();
  
  if (!user) {
    redirect("/login");
  }

  const today = new Date().toISOString().split("T")[0];
  const dailyRecord = user.dailyUsage?.find(d => d.date === today);
  
  const getUsage = (toolId) => {
    return dailyRecord?.tools?.find(t => t.toolId === toolId)?.count || 0;
  };

  const getLimit = (toolId) => {
    return TIER_LIMITS[user.tier]?.[toolId] || 0;
  };

  const isPremium = user.tier === "premium";

  return (
    <div className="min-h-screen bg-background text-foreground p-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="max-w-5xl mx-auto space-y-12 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-card/60 border border-border backdrop-blur-xl p-6 rounded-3xl shadow-sm gap-6 md:gap-0">
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 text-center md:text-left">
            <div className="w-20 h-20 md:w-16 md:h-16 rounded-full overflow-hidden border-2 border-primary/20 flex-shrink-0">
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.image} alt={user.name || "User"} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary">
                  <UserIcon className="w-8 h-8" />
                </div>
              )}
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-display font-bold">Welcome, {user.name || "Lubna Member"}</h1>
              <div className="flex flex-col md:flex-row items-center gap-2 mt-2 md:mt-1">
                <span className={`text-xs px-3 py-1 rounded-full uppercase tracking-wider font-semibold ${isPremium ? 'bg-primary/20 text-primary' : 'bg-secondary text-secondary-foreground'}`}>
                  {isPremium ? 'Premium Tier' : 'Free Tier'}
                </span>
                <span className="text-sm text-muted-foreground">{user.email}</span>
              </div>
            </div>
          </div>
          
          <Link href="/logout" className="w-full md:w-auto">
            <Button variant="outline" className="w-full md:w-auto rounded-full gap-2 border-destructive/20 text-destructive hover:bg-destructive/10">
              <LogOut className="w-4 h-4" /> Sign Out
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Subscription & Quota Panel */}
          <div className="lg:col-span-1 space-y-6">
            {!isPremium && (
              <div className="bg-gradient-to-br from-primary/10 to-transparent border border-primary/30 p-6 rounded-3xl relative overflow-hidden">
                <Crown className="absolute right-[-10px] bottom-[-10px] w-24 h-24 text-primary/10 rotate-[-15deg]" />
                <h3 className="font-display text-xl font-bold mb-2">Upgrade to Premium</h3>
                <p className="text-sm text-muted-foreground mb-6">Dapatkan akses tak terbatas ke semua layanan AI dan hilangkan limit harian Anda.</p>
                <Button className="w-full rounded-full bg-primary text-primary-foreground hover:scale-105 transition-transform">
                  Upgrade Now
                </Button>
              </div>
            )}

            <div className="bg-card border border-border p-6 rounded-3xl">
              <h3 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" /> Pemakaian Kuota Hari Ini
              </h3>
              
              <div className="space-y-4">
                {[
                  { id: "whisper", name: "Video to Text" },
                  { id: "voiceover", name: "AI Voiceover Studio" },
                  { id: "summarizer", name: "Smart Summarizer" },
                  { id: "remove-bg", name: "AI BG Remover" },
                  { id: "downloader", name: "Media Downloader" },
                  { id: "converter", name: "Media Converter" }
                ].map((tool) => {
                  const used = getUsage(tool.id);
                  const limit = getLimit(tool.id);
                  const percentage = Math.min(100, (used / limit) * 100);
                  const isDepleted = used >= limit;

                  return (
                    <div key={tool.id} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{tool.name}</span>
                        <span className={`font-medium ${isDepleted ? 'text-destructive' : 'text-foreground'}`}>
                          {used} / {limit}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${isDepleted ? 'bg-destructive' : 'bg-primary'}`} 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Premium Tools Hub */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-display font-bold">Premium Tools Hub</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <Link href="/tools/video-to-text" className="group p-6 rounded-3xl bg-card border border-border hover:border-primary/50 transition-colors">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-transform">
                  {/* SVG Icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 10v3"/><path d="M6 6v11"/><path d="M10 3v18"/><path d="M14 8v7"/><path d="M18 5v13"/><path d="M22 10v3"/></svg>
                </div>
                <h3 className="font-display font-semibold text-lg mb-1">Video to Text (Whisper)</h3>
                <p className="text-sm text-muted-foreground">Transkrip audio dan video menggunakan kecerdasan AI.</p>
              </Link>

              <Link href="/tools/ai-background-remover" className="group p-6 rounded-3xl bg-card border border-border hover:border-primary/50 transition-colors">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
                </div>
                <h3 className="font-display font-semibold text-lg mb-1">AI Background Remover</h3>
                <p className="text-sm text-muted-foreground">Hapus latar belakang foto seketika tanpa seleksi manual.</p>
              </Link>

              <Link href="/tools/video-downloader" className="group p-6 rounded-3xl bg-card border border-border hover:border-primary/50 transition-colors">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                </div>
                <h3 className="font-display font-semibold text-lg mb-1">Media Downloader</h3>
                <p className="text-sm text-muted-foreground">Unduh video original tanpa watermark dengan mudah.</p>
              </Link>

              <Link href="/tools/ai-voiceover" className="group p-6 rounded-3xl bg-card border border-border hover:border-primary/50 transition-colors">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
                </div>
                <h3 className="font-display font-semibold text-lg mb-1">AI Voiceover Studio</h3>
                <p className="text-sm text-muted-foreground">Ubah skrip teks menjadi suara profesional secara instan.</p>
              </Link>

              <Link href="/tools/smart-summarizer" className="group p-6 rounded-3xl bg-card border border-border hover:border-primary/50 transition-colors">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                </div>
                <h3 className="font-display font-semibold text-lg mb-1">Smart Summarizer</h3>
                <p className="text-sm text-muted-foreground">Ringkas dokumen atau jurnal panjang dalam hitungan detik.</p>
              </Link>

              <Link href="/tools/media-converter" className="group p-6 rounded-3xl bg-card border border-border hover:border-primary/50 transition-colors">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                </div>
                <h3 className="font-display font-semibold text-lg mb-1">Media Converter</h3>
                <p className="text-sm text-muted-foreground">Kompres video atau ubah menjadi format MP3 dengan privasi penuh.</p>
              </Link>

              <Link href="/" className="group p-6 rounded-3xl border border-dashed border-border hover:bg-card/50 transition-colors flex flex-col items-center justify-center text-center">
                <h3 className="font-display font-semibold text-lg mb-1 text-muted-foreground">Kembali ke Beranda</h3>
                <p className="text-sm text-muted-foreground/50">Akses koleksi V1 Tools</p>
              </Link>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
