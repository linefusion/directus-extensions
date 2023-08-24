import type { Emitter } from "@directus/api/dist/emitter";
import type {
  EventContext,
  OperationContext,
  SchemaOverview,
} from "@directus/types";

import type * as DirectusServiceList from "@directus/api/dist/services/index";
import type {
  DirectusModuleFunctions,
  DirectusModuleWithDefaultFunction,
  DirectusModulesWithDefaultExport,
} from "./modules";

export type DirectusServiceConstructors = typeof DirectusServiceList;

export type DirectusServices = DirectusServiceConstructors & {
  // ItemsService: typeof ItemsService;
  // TranslationsService: typeof TranslationsService;
  emitter: Emitter;
  schema: SchemaOverview;
  database: ReturnType<
    DirectusModulesWithDefaultExport["database/index"]["default"]
  >;
  emit<T>(
    event: string | string[],
    payload: any,
    meta?: Record<string, any>,
    context?: EventContext
  ): Promise<T>;
};

export type DirectusOperationContext = Omit<
  OperationContext,
  "data" | "services"
>;
