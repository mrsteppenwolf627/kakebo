import AuthGate from "@/components/AuthGate";
import ExpenseCalendar from "@/components/ExpenseCalendar";

export default function MarketingHome() {
  return (
    <main className="space-y-12">
      <section className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">
          Kakebo Ahorro
        </h1>
        <p className="text-black/60 max-w-xl">
          El método japonés para controlar tu dinero, ahora en digital.
          Registra tus gastos, visualízalos en calendario y convierte
          conciencia en ahorro real.
        </p>
      </section>

      <AuthGate>
        <ExpenseCalendar />
      </AuthGate>
    </main>
  );
}
