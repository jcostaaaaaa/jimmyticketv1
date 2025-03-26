declare global {
  namespace JSX {
    interface IntrinsicElements {
      // Use Record with specific property types instead of any
      [elemName: string]: Record<string, unknown>;
    }
  }
}
