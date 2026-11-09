import Link from "next/link";

// Se muestra cuando la URL no coincide con ninguna ruta (sin locale válido). Next.js devuelve estado 404 y añade noindex.
// Servidor puro, en español, con lang acorde al idioma por defecto del sitio.
export default function NotFound() {
    return (
        <html lang="es">
            <body style={{ fontFamily: "system-ui, sans-serif", textAlign: "center", padding: "4rem 1rem" }}>
                <h1>404</h1>
                <p>Esta página no existe.</p>
                <Link href="/">Volver al inicio</Link>
            </body>
        </html>
    );
}
