/**
 * Custom properties on the req object in express
 */

import type { Accountability, Query, SchemaOverview } from "@directus/types";

export {};

declare global {
  namespace Express {
    export interface Request {
      token: string | null;
      collection: string;
      sanitizedQuery: Query;
      schema: SchemaOverview;

      accountability?: Accountability;
      singleton?: boolean;
    }
  }
}

declare module "*.vue" {
  import { DefineComponent } from "vue";
  // eslint-disable-next-line @typescript-eslint/ban-types
  const component: DefineComponent<{}, {}, any>;
  export default component;
}
