/*
 * pdfjs-dommatrix-polyfill
 * Side-effect module: defines globalThis.DOMMatrix before pdfjs-dist evaluates.
 * pdfjs-dist v6 asserts `new DOMMatrix()` at module scope (SCALE_MATRIX) and
 * only polyfills it from @napi-rs/canvas when that optional dep can be
 * require()d — which fails in a Next.js serverless lambda bundle, crashing
 * the whole route module at import time with
 *   ReferenceError: DOMMatrix is not defined
 *
 * ponytail: identity-matrix only. Text extraction (getTextContent) never
 * touches 2D matrix math; if canvas rendering is ever added, grow this.
 */

if (typeof globalThis.DOMMatrix === "undefined") {
  (globalThis as unknown as Record<string, unknown>).DOMMatrix = class {
    m11 = 1; m12 = 0; m13 = 0; m14 = 0;
    m21 = 0; m22 = 1; m23 = 0; m24 = 0;
    m31 = 0; m32 = 0; m33 = 1; m34 = 0;
    m41 = 0; m42 = 0; m43 = 0; m44 = 1;

    constructor(init?: string | number[]) {
      if (typeof init === "string") {
        const m = /matrix\((.*)\)/.exec(init)?.[1]?.split(/[,\s]+/).map(Number);
        if (m?.length === 6) this.setMatrix(m[0], m[1], m[2], m[3], m[4], m[5]);
      } else if (Array.isArray(init) && init.length === 6) {
        this.setMatrix(init[0], init[1], init[2], init[3], init[4], init[5]);
      }
    }

    setMatrix(a: number, b: number, c: number, d: number, e: number, f: number): void {
      this.m11 = a; this.m12 = b; this.m13 = 0; this.m14 = 0;
      this.m21 = c; this.m22 = d; this.m23 = 0; this.m24 = 0;
      this.m31 = 0; this.m32 = 0; this.m33 = 1; this.m34 = 0;
      this.m41 = e; this.m42 = f; this.m43 = 0; this.m44 = 1;
    }

    get a() { return this.m11; }
    set a(v: number) { this.m11 = v; }
    get b() { return this.m12; }
    set b(v: number) { this.m12 = v; }
    get c() { return this.m21; }
    set c(v: number) { this.m21 = v; }
    get d() { return this.m22; }
    set d(v: number) { this.m22 = v; }
    get e() { return this.m41; }
    set e(v: number) { this.m41 = v; }
    get f() { return this.m42; }
    set f(v: number) { this.m42 = v; }
    get is2D() { return true; }
    get isIdentity() { return true; }
  };
}