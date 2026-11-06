import type * as React from "react";

/** <velacut-app> — wrapper ของทั้งแอป (ดูเหตุผลใน app/layout.tsx) */
declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "velacut-app": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}
