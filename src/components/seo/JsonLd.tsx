import { serialize, type JsonLdDocument } from "@/lib/seo/jsonld";

/** Server Component: emite UN único bloque application/ld+json por página (el @graph ya consolidado). */
export default function JsonLd({ graph }: { graph: JsonLdDocument }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serialize(graph) }} />;
}
