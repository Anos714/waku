export { default, alt, size, contentType } from "./opengraph-image";

// Keep the same freshness window as the Open Graph image so a republish is
// reflected in both preview surfaces together.
export const revalidate = 300;
