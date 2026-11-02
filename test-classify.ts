import { config } from "dotenv";
config({ path: ".env.local" });

// Dyn import to prevent hoisting
async function run() {
    const { classifyExpense } = await import("./src/lib/ai/classifier");
    console.log("Starting classification...");
    console.log("Using API Key length:", process.env.OPENAI_API_KEY?.length);
    try {
        const result = await classifyExpense("Soporte movil para coche");
        console.log("Result:", result);
    } catch (err) {
        console.error("Error calling classifyExpense directly:", err);
    }
}

run();
