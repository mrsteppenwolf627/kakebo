import TopNav from "@/components/TopNav";

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
      <header className="border-b border-black/10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="font-semibold">Kakebo Ahorro</div>
          <TopNav />
        </div>
      </header>

      {children}
    </>
  );
}
