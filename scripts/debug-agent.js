/**
 * Debug script para verificar que el agente funciona
 * Ejecutar con: node --loader ts-node/esm scripts/test-agent.ts
 */

console.log("=== DEBUG AGENT ===");
console.log("OPENAI_API_KEY present:", !!process.env.OPENAI_API_KEY);
console.log("OPENAI_API_KEY length:", process.env.OPENAI_API_KEY?.length || 0);
console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);

// Verifica que el cliente se crea correctamente
try {
    const OpenAI = require("openai").default;
    const client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY || "",
    });
    console.log("✅ OpenAI client created successfully");

    // Prueba simple de completion
    async function testCompletion() {
        try {
            const response = await client.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [{ role: "user", content: "Di hola" }],
                max_tokens: 10,
            });
            console.log("✅ API call successful:", response.choices[0].message.content);
        } catch (error: any) {
            console.error("❌ API call failed:", error.message);
        }
    }

    testCompletion();
} catch (error: any) {
    console.error("❌ Failed to create OpenAI client:", error.message);
}
