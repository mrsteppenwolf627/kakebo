import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function test() {
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-5-nano",
            messages: [
                { role: "system", content: "Responde solo en JSON." },
                { role: "user", content: "Test" }
            ],
            response_format: { type: "json_object" }
        });
        console.log("Success:", completion.choices[0].message.content);
    } catch (err: any) {
        console.error("Error with json_object:", err.message);
    }
}

test();
