# Premium files (local placeholder)

Reserved for the premium Excel and PDF while the commerce flow is built.

- Everything in this folder except this README is git-ignored.
- This folder is outside `public/`, so Next.js never serves it.
- It is NOT the production solution. Final destination: private storage
  (e.g. a private Supabase Storage bucket) delivered through the protected
  `/api/premium/download` route after a verified purchase.

## Pack actual
`kakebo-master-system-pack/` contiene los tres archivos definitivos (Excel v6, tutorial PDF y ebook PDF).
Están registrados en `src/lib/premium/manifest.ts` (tamaño y sha256). Si se reemplaza un archivo,
actualiza el manifiesto.
