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
      <TopNav />
      {children}
    </>
  );
}
