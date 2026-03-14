export type ExampleItem = {
  id: string;
  title: string;
  description: string;
};

// Simple in-memory model to demonstrate the BFF pattern
const EXAMPLES: ExampleItem[] = [
  {
    id: "1",
    title: "Neon + Next.js",
    description: "Example item served from a server-only BFF module.",
  },
];

export function listExamples(): ExampleItem[] {
  return EXAMPLES;
}

