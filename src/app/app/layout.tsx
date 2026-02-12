import { Suspense } from "react";
import TopNav from "@/components/TopNav";
import StripeSuccessHandler from "@/components/saas/StripeSuccessHandler";
import TrialBanner from "@/components/saas/TrialBanner";

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
      <Suspense fallback={null}>
        <StripeSuccessHandler />
      </Suspense>
      <TrialBanner />
      {children}
    </>
  );
}
