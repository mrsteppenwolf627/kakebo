import TopNav from "@/components/TopNav";
import Link from "next/link";

export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="border-b border-black/10 sticky top-0 bg-white z-40 relative overflow-x-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
          <Link href="/app" className="font-semibold text-sm sm:text-base">
            Kakebo Ahorro
          </Link>
          <TopNav />
        </div>
      </header>

      {children}
    </>
  );
}
