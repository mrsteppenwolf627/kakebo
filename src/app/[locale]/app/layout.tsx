import TopNav from "@/components/TopNav";
import { isPlusSubscriptionsEnabled } from "@/lib/auth/require-access";

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
      <TopNav showPlan={isPlusSubscriptionsEnabled()} />
      {children}
    </>
  );
}
