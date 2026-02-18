import { Metadata } from "next";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { SavingsCalculator } from "@/components/landing/tools/SavingsCalculator";
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'Tools.Savings.meta' });

    return {
        title: t('title'),
        description: t('description'),
        alternates: {
            canonical: "/herramientas/calculadora-ahorro",
        },
        openGraph: {
            type: "website",
            title: t('ogTitle'),
            description: t('ogDescription'),
        }
    };
}

export default function SavingsCalculatorPage() {
    return (
        <main className="min-h-screen bg-background">
            <Navbar />
            <SavingsCalculator />
            <Footer />
        </main>
    );
}
