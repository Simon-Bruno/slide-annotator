// Mock for pdfjs-dist/legacy/build/pdf.mjs
// Used in Jest tests since the real module uses import.meta which Jest (CJS) cannot parse.

export function getDocument(_options: { data: Uint8Array; useSystemFonts?: boolean }) {
  const promise = Promise.resolve({
    numPages: 0,
    getPage: async (_num: number) => ({
      getViewport: (_opts: { scale: number }) => ({ width: 100, height: 100 }),
      render: (_opts: unknown) => ({ promise: Promise.resolve() }),
      cleanup: () => {},
    }),
    cleanup: async () => {},
  });
  return { promise };
}
