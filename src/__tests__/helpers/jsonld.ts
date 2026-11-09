// Utilidades para leer el JSON-LD de las páginas en los tests. Cada página emite UN script con UN @graph.

/** Scripts application/ld+json de un DOM renderizado, ya parseados. */
export function ldDocuments(container: ParentNode): any[] {
  return [...container.querySelectorAll('script[type="application/ld+json"]')].map((s) => JSON.parse(s.textContent ?? "{}"));
}

/** Todos los nodos de todos los @graph del DOM (aplanados). */
export function ldNodes(container: ParentNode): any[] {
  return ldDocuments(container).flatMap((d) => (Array.isArray(d["@graph"]) ? d["@graph"] : [d]));
}

/** Para páginas sin renderizar (árbol de elementos React): busca <JsonLd graph={...}/> y devuelve su documento. */
export function ldDocumentsFromTree(tree: unknown): any[] {
  const docs: any[] = [];
  const seen = new Set<unknown>();
  const walk = (n: any) => {
    if (!n || typeof n !== "object" || seen.has(n)) return;
    seen.add(n);
    if (Array.isArray(n)) return n.forEach(walk);
    if (n.props && n.props.graph && n.props.graph["@graph"]) docs.push(n.props.graph);
    if (n.props) walk(n.props.children);
    for (const k of Object.keys(n.props ?? {})) if (k !== "children") walk(n.props[k]);
  };
  walk(tree);
  return docs;
}

export const ldNodesFromTree = (tree: unknown): any[] => ldDocumentsFromTree(tree).flatMap((d) => d["@graph"]);

export const nodeOfType = (nodes: any[], type: string): any => nodes.find((n) => (Array.isArray(n["@type"]) ? n["@type"].includes(type) : n["@type"] === type));
