import AuthGate from "@/components/AuthGate";
import ExpenseCalendar from "@/components/ExpenseCalendar";

export default function HomePage() {
  return (
    <AuthGate>
      <main className="min-h-screen px-6 py-10">
        <div className="max-w-5xl mx-auto space-y-6">
          <h1 className="text-4xl font-semibold">Kakebo Ahorro</h1>
          <p className="text-black/60">
            Registra tus gastos y visualízalos en calendario.
          </p>

          <ExpenseCalendar />
        </div>
      </main>
    </AuthGate>
  );
}
