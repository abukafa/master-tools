import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export default async function Home() {
  const session = await getServerSession(authOptions);
  
  // Periksa apakah pengguna adalah Guest atau belum login sama sekali
  const isGuestOrPublic = !session || session.user?.role === "anonymous";

  const tools = [
    { title: "Image Converter", desc: "Convert & compress images effortlessly.", href: "/tools/image-converter", isPremium: false },
    { title: "QR Generator", desc: "Create elegant QR codes.", href: "/tools/qr-generator", isPremium: false },
    { title: "Code Formatter", desc: "Beautify your snippets.", href: "/tools/code-formatter", isPremium: false },
    { title: "PDF Studio", desc: "Securely split and merge PDFs.", href: "/tools/pdf-studio", isPremium: false },
    { title: "Text Suite", desc: "Extract, read, dan dictate text.", href: "/tools/text-extractor", isPremium: false },
    { title: "Color Generator", desc: "Neon palettes & smooth CSS gradients.", href: "/tools/color-generator", isPremium: false },
    
    // V2 Tools (Requires Google Login)
    { 
      title: "Media Downloader", 
      desc: "Unduh video & audio sosial media (Premium).", 
      href: isGuestOrPublic ? "/login" : "/tools/video-downloader", 
      isPremium: true 
    },
    { 
      title: "Video to Text", 
      desc: "Transkrip video dengan AI Whisper (Premium).", 
      href: isGuestOrPublic ? "/login" : "/tools/video-to-text", 
      isPremium: true 
    },
    { 
      title: "AI BG Remover", 
      desc: "Hapus background foto instan (Premium).", 
      href: isGuestOrPublic ? "/login" : "/tools/ai-background-remover", 
      isPremium: true 
    },
  ];

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-background relative overflow-hidden">
      {/* Ambient Background Blur */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-secondary/15 rounded-full blur-[150px] pointer-events-none" />
      
      <div className="z-10 max-w-5xl w-full flex flex-col items-center gap-12 text-center relative">
        <div className="space-y-6">
          <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight text-foreground drop-shadow-md">
            Lubna
            <span className="block text-3xl md:text-5xl font-normal text-primary mt-4 text-glow">
              Master Tools
            </span>
          </h1>
          <p className="max-w-[600px] text-lg text-muted-foreground mx-auto font-sans">
            Aesthetic and powerful suite of utilities designed for elegance and efficiency.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-4xl mt-8">
          {tools.map((tool, i) => (
            <Link
              key={i}
              href={tool.href}
              className={`group block relative overflow-hidden rounded-2xl border ${tool.isPremium ? 'border-primary/30' : 'border-border'} bg-card p-6 shadow-sm transition-all hover:border-primary/50 hover:bg-card/80 backdrop-blur-sm cursor-pointer text-left`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <h3 className="font-display text-2xl font-semibold mb-2 relative z-10 text-foreground group-hover:text-primary transition-colors">
                {tool.title}
                {tool.isPremium && <span className="ml-2 text-[10px] uppercase tracking-wider bg-primary/20 text-primary px-2 py-1 rounded-full align-middle">Pro</span>}
              </h3>
              <p className="text-sm text-muted-foreground relative z-10 font-sans">
                {tool.desc}
              </p>
            </Link>
          ))}
        </div>

        <div className="mt-8">
          {isGuestOrPublic ? (
            <Link href="/login">
              <Button size="lg" className="rounded-full px-8 font-semibold tracking-wide bg-gradient-to-r from-primary to-secondary text-primary-foreground border-0 transition-all hover:scale-105 hover:btn-glow">
                Join Lubna Circle
              </Button>
            </Link>
          ) : (
            <Link href="/dashboard">
              <Button size="lg" className="rounded-full px-8 font-semibold tracking-wide bg-gradient-to-r from-primary to-secondary text-primary-foreground border-0 transition-all hover:scale-105 hover:btn-glow">
                Go to Dashboard
              </Button>
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
