import memoizee from "memoizee";
import { dynamicImport } from "@wolfpkgs/core/modules";
import type { OperationHandler } from "@directus/types";

/**
 * Types
 */

export type FlowManager = {
  initialize(): Promise<void>;
  reload(): Promise<void>;
  addOperation(id: string, operation: OperationHandler): void;
  clearOperations(): void;
  runOperationFlow(
    id: string,
    data: unknown,
    context: Record<string, unknown>
  ): Promise<unknown>;
  runWebhookFlow(
    id: string,
    data: unknown,
    context: Record<string, unknown>
  ): Promise<{
    result: unknown;
    cacheEnabled?: boolean;
  }>;
};

export type FlowsModule = Omit<
  typeof import("@directus/api/dist/flows"),
  "getFlowManager"
> & {
  getFlowManager: () => FlowManager;
};

export type DirectusModules = {
  ["app"]: typeof import("@directus/api/dist/app");
  ["auth"]: typeof import("@directus/api/dist/auth");
  ["cache"]: typeof import("@directus/api/dist/cache");
  ["errors/forbidden"]: typeof import("@directus/api/dist/errors/forbidden");
  ["errors/codes"]: typeof import("@directus/api/dist/errors/codes");
  ["errors/contains-null-values"]: typeof import("@directus/api/dist/errors/contains-null-values");
  ["errors/content-too-large"]: typeof import("@directus/api/dist/errors/content-too-large");
  ["errors/hit-rate-limit"]: typeof import("@directus/api/dist/errors/hit-rate-limit");
  ["errors/illegal-asset-transformation"]: typeof import("@directus/api/dist/errors/illegal-asset-transformation");
  ["errors/index"]: typeof import("@directus/api/dist/errors/index");
  ["errors/invalid-credentials"]: typeof import("@directus/api/dist/errors/invalid-credentials");
  ["errors/invalid-foreign-key"]: typeof import("@directus/api/dist/errors/invalid-foreign-key");
  ["errors/invalid-ip"]: typeof import("@directus/api/dist/errors/invalid-ip");
  ["errors/invalid-otp"]: typeof import("@directus/api/dist/errors/invalid-otp");
  ["errors/invalid-payload"]: typeof import("@directus/api/dist/errors/invalid-payload");
  ["errors/invalid-token"]: typeof import("@directus/api/dist/errors/invalid-token");
  ["errors/method-not-allowed"]: typeof import("@directus/api/dist/errors/method-not-allowed");
  ["errors/not-null-violation"]: typeof import("@directus/api/dist/errors/not-null-violation");
  ["errors/range-not-satisfiable"]: typeof import("@directus/api/dist/errors/range-not-satisfiable");
  ["errors/record-not-unique"]: typeof import("@directus/api/dist/errors/record-not-unique");
  ["errors/route-not-found"]: typeof import("@directus/api/dist/errors/route-not-found");
  ["errors/service-unavailable"]: typeof import("@directus/api/dist/errors/service-unavailable");
  ["errors/token-expired"]: typeof import("@directus/api/dist/errors/token-expired");
  ["errors/unexpected-response"]: typeof import("@directus/api/dist/errors/unexpected-response");
  ["errors/unsupported-media-type"]: typeof import("@directus/api/dist/errors/unsupported-media-type");
  ["errors/user-suspended"]: typeof import("@directus/api/dist/errors/user-suspended");
  ["errors/value-out-of-range"]: typeof import("@directus/api/dist/errors/value-out-of-range");
  ["errors/value-too-long"]: typeof import("@directus/api/dist/errors/value-too-long");
  ["constants"]: typeof import("@directus/api/dist/constants");
  ["database/index"]: typeof import("@directus/api/dist/database/index");
  ["database/run-ast"]: typeof import("@directus/api/dist/database/run-ast");
  ["database/errors/translate"]: typeof import("@directus/api/dist/database/errors/translate");
  ["database/errors/dialects/mssql"]: typeof import("@directus/api/dist/database/errors/dialects/mssql");
  ["database/errors/dialects/mysql"]: typeof import("@directus/api/dist/database/errors/dialects/mysql");
  ["database/errors/dialects/oracle"]: typeof import("@directus/api/dist/database/errors/dialects/oracle");
  ["database/errors/dialects/postgres"]: typeof import("@directus/api/dist/database/errors/dialects/postgres");
  ["database/errors/dialects/sqlite"]: typeof import("@directus/api/dist/database/errors/dialects/sqlite");
  ["database/errors/dialects/types"]: typeof import("@directus/api/dist/database/errors/dialects/types");
  ["middleware/authenticate"]: typeof import("@directus/api/dist/middleware/authenticate");
  ["middleware/cache"]: typeof import("@directus/api/dist/middleware/cache");
  ["middleware/check-ip"]: typeof import("@directus/api/dist/middleware/check-ip");
  ["middleware/collection-exists"]: typeof import("@directus/api/dist/middleware/collection-exists");
  ["middleware/cors"]: typeof import("@directus/api/dist/middleware/cors");
  ["middleware/error-handler"]: typeof import("@directus/api/dist/middleware/error-handler");
  ["middleware/extract-token"]: typeof import("@directus/api/dist/middleware/extract-token");
  ["middleware/get-permissions"]: typeof import("@directus/api/dist/middleware/get-permissions");
  ["middleware/graphql"]: typeof import("@directus/api/dist/middleware/graphql");
  ["middleware/rate-limiter-global"]: typeof import("@directus/api/dist/middleware/rate-limiter-global");
  ["middleware/rate-limiter-ip"]: typeof import("@directus/api/dist/middleware/rate-limiter-ip");
  ["middleware/respond"]: typeof import("@directus/api/dist/middleware/respond");
  ["middleware/sanitize-query"]: typeof import("@directus/api/dist/middleware/sanitize-query");
  ["middleware/schema"]: typeof import("@directus/api/dist/middleware/schema");
  ["middleware/use-collection"]: typeof import("@directus/api/dist/middleware/use-collection");
  ["middleware/validate-batch"]: typeof import("@directus/api/dist/middleware/validate-batch");
  ["emitter"]: typeof import("@directus/api/dist/emitter");
  ["env"]: typeof import("@directus/api/dist/env");
  ["extensions"]: typeof import("@directus/api/dist/extensions");
  ["flows"]: FlowsModule;
  ["index"]: typeof import("@directus/api/dist/index");
  ["logger"]: typeof import("@directus/api/dist/logger");
  ["mailer"]: typeof import("@directus/api/dist/mailer");
  ["messenger"]: typeof import("@directus/api/dist/messenger");
  ["server"]: typeof import("@directus/api/dist/server");
  ["services/index"]: typeof import("@directus/api/dist/services/index");
  ["request/index"]: typeof import("@directus/api/dist/request/index");
  ["request/request-interceptor"]: typeof import("@directus/api/dist/request/request-interceptor");
  ["request/response-interceptor"]: typeof import("@directus/api/dist/request/response-interceptor");
  ["request/validate-ip"]: typeof import("@directus/api/dist/request/validate-ip");
  ["synchronization"]: typeof import("@directus/api/dist/synchronization");
  ["webhooks"]: typeof import("@directus/api/dist/webhooks");
  ["types"]: typeof import("@directus/api/dist/types");
  ["utils/apply-diff"]: typeof import("@directus/api/dist/utils/apply-diff");
  ["utils/apply-function-to-column-name"]: typeof import("@directus/api/dist/utils/apply-function-to-column-name");
  ["utils/apply-query"]: typeof import("@directus/api/dist/utils/apply-query");
  ["utils/apply-snapshot"]: typeof import("@directus/api/dist/utils/apply-snapshot");
  ["utils/async-handler"]: typeof import("@directus/api/dist/utils/async-handler");
  ["utils/calculate-field-depth"]: typeof import("@directus/api/dist/utils/calculate-field-depth");
  ["utils/compress"]: typeof import("@directus/api/dist/utils/compress");
  ["utils/construct-flow-tree"]: typeof import("@directus/api/dist/utils/construct-flow-tree");
  ["utils/filter-items"]: typeof import("@directus/api/dist/utils/filter-items");
  ["utils/generate-hash"]: typeof import("@directus/api/dist/utils/generate-hash");
  ["utils/get-accountability-for-role"]: typeof import("@directus/api/dist/utils/get-accountability-for-role");
  ["utils/get-accountability-for-token"]: typeof import("@directus/api/dist/utils/get-accountability-for-token");
  ["utils/get-ast-from-query"]: typeof import("@directus/api/dist/utils/get-ast-from-query");
  ["utils/get-auth-providers"]: typeof import("@directus/api/dist/utils/get-auth-providers");
  ["utils/get-cache-headers"]: typeof import("@directus/api/dist/utils/get-cache-headers");
  ["utils/get-cache-key"]: typeof import("@directus/api/dist/utils/get-cache-key");
  ["utils/get-collection-from-alias"]: typeof import("@directus/api/dist/utils/get-collection-from-alias");
  ["utils/get-column"]: typeof import("@directus/api/dist/utils/get-column");
  ["utils/get-column-path"]: typeof import("@directus/api/dist/utils/get-column-path");
  ["utils/get-config-from-env"]: typeof import("@directus/api/dist/utils/get-config-from-env");
  ["utils/get-date-formatted"]: typeof import("@directus/api/dist/utils/get-date-formatted");
  ["utils/get-default-index-name"]: typeof import("@directus/api/dist/utils/get-default-index-name");
  ["utils/get-default-value"]: typeof import("@directus/api/dist/utils/get-default-value");
  ["utils/get-graphql-query-and-variables"]: typeof import("@directus/api/dist/utils/get-graphql-query-and-variables");
  ["utils/get-graphql-type"]: typeof import("@directus/api/dist/utils/get-graphql-type");
  ["utils/get-ip-from-req"]: typeof import("@directus/api/dist/utils/get-ip-from-req");
  ["utils/get-local-type"]: typeof import("@directus/api/dist/utils/get-local-type");
  ["utils/get-milliseconds"]: typeof import("@directus/api/dist/utils/get-milliseconds");
  ["utils/get-module-default"]: typeof import("@directus/api/dist/utils/get-module-default");
  ["utils/get-permissions"]: typeof import("@directus/api/dist/utils/get-permissions");
  ["utils/get-relation-info"]: typeof import("@directus/api/dist/utils/get-relation-info");
  ["utils/get-relation-type"]: typeof import("@directus/api/dist/utils/get-relation-type");
  ["utils/get-schema"]: typeof import("@directus/api/dist/utils/get-schema");
  ["utils/get-service"]: typeof import("@directus/api/dist/utils/get-service");
  ["utils/get-snapshot"]: typeof import("@directus/api/dist/utils/get-snapshot");
  ["utils/get-snapshot-diff"]: typeof import("@directus/api/dist/utils/get-snapshot-diff");
  ["utils/get-string-byte-size"]: typeof import("@directus/api/dist/utils/get-string-byte-size");
  ["utils/get-versioned-hash"]: typeof import("@directus/api/dist/utils/get-versioned-hash");
  ["utils/is-directus-jwt"]: typeof import("@directus/api/dist/utils/is-directus-jwt");
  ["utils/is-url-allowed"]: typeof import("@directus/api/dist/utils/is-url-allowed");
  ["utils/job-queue"]: typeof import("@directus/api/dist/utils/job-queue");
  ["utils/jwt"]: typeof import("@directus/api/dist/utils/jwt");
  ["utils/map-values-deep"]: typeof import("@directus/api/dist/utils/map-values-deep");
  ["utils/md"]: typeof import("@directus/api/dist/utils/md");
  ["utils/merge-permissions"]: typeof import("@directus/api/dist/utils/merge-permissions");
  ["utils/merge-permissions-for-share"]: typeof import("@directus/api/dist/utils/merge-permissions-for-share");
  ["utils/package"]: typeof import("@directus/api/dist/utils/package");
  ["utils/parse-image-metadata"]: typeof import("@directus/api/dist/utils/parse-image-metadata");
  ["utils/redact"]: typeof import("@directus/api/dist/utils/redact");
  ["utils/reduce-schema"]: typeof import("@directus/api/dist/utils/reduce-schema");
  ["utils/require-yaml"]: typeof import("@directus/api/dist/utils/require-yaml");
  ["utils/sanitize-error"]: typeof import("@directus/api/dist/utils/sanitize-error");
  ["utils/sanitize-query"]: typeof import("@directus/api/dist/utils/sanitize-query");
  ["utils/sanitize-schema"]: typeof import("@directus/api/dist/utils/sanitize-schema");
  ["utils/schedule"]: typeof import("@directus/api/dist/utils/schedule");
  ["utils/should-clear-cache"]: typeof import("@directus/api/dist/utils/should-clear-cache");
  ["utils/should-skip-cache"]: typeof import("@directus/api/dist/utils/should-skip-cache");
  ["utils/stall"]: typeof import("@directus/api/dist/utils/stall");
  ["utils/strip-function"]: typeof import("@directus/api/dist/utils/strip-function");
  ["utils/telemetry"]: typeof import("@directus/api/dist/utils/telemetry");
  ["utils/to-boolean"]: typeof import("@directus/api/dist/utils/to-boolean");
  ["utils/transformations"]: typeof import("@directus/api/dist/utils/transformations");
  ["utils/url"]: typeof import("@directus/api/dist/utils/url");
  ["utils/user-name"]: typeof import("@directus/api/dist/utils/user-name");
  ["utils/validate-diff"]: typeof import("@directus/api/dist/utils/validate-diff");
  ["utils/validate-env"]: typeof import("@directus/api/dist/utils/validate-env");
  ["utils/validate-keys"]: typeof import("@directus/api/dist/utils/validate-keys");
  ["utils/validate-query"]: typeof import("@directus/api/dist/utils/validate-query");
  ["utils/validate-snapshot"]: typeof import("@directus/api/dist/utils/validate-snapshot");
  ["utils/validate-storage"]: typeof import("@directus/api/dist/utils/validate-storage");
  ["utils/generate-hash"]: typeof import("@directus/api/dist/utils/generate-hash");
  ["utils/package"]: typeof import("@directus/api/dist/utils/package");
  ["rate-limiter"]: typeof import("@directus/api/dist/rate-limiter");
  ["start"]: "Do yourself a favor and don't import this in an extension.";
  // [key: string]: unknown;
};

export type DirectusModulesWithDefaultExport<Constraint = any> = {
  [K in keyof DirectusModules as DirectusModules[K] extends {
    default: Constraint;
  }
    ? K
    : never]: DirectusModules[K] extends { default: infer Default }
    ? DirectusModules[K] & {
        default: Default;
      }
    : undefined;
};

export type DirectusModuleFunctions<Module extends keyof DirectusModules> = {
  [K in keyof DirectusModules[Module] as DirectusModules[Module][K] extends (
    ...args: any
  ) => any
    ? K
    : never]: DirectusModules[Module][K] extends (...args: any) => any
    ? DirectusModules[Module][K]
    : never;
};

export type DirectusModuleWithDefaultFunction<
  Module extends keyof DirectusModulesWithDefaultExport<(...args: any) => any>
> = {
  [K in keyof DirectusModulesWithDefaultExport<
    (...args: any) => any
  >[Module] as DirectusModulesWithDefaultExport[Module][K] extends (
    ...args: any
  ) => any
    ? K
    : never]: DirectusModulesWithDefaultExport[Module];
};

/**
 * Module importer
 */

export interface GetDirectusModule {
  <const T extends keyof DirectusModules>(path: T): Promise<DirectusModules[T]>;
}

export const getDirectusModule: GetDirectusModule = memoizee(
  async function (path) {
    return await dynamicImport(`@directus/api/${path}`);
  },
  {
    async: true,
  }
);

/**
 * Module importer (default export)
 */

export interface GetDirectusModuleDefaultExport {
  <const T extends keyof DirectusModulesWithDefaultExport>(path: T): Promise<
    DirectusModulesWithDefaultExport[T]["default"]
  >;
}

export const getDirectusModuleDefaultExport: GetDirectusModuleDefaultExport =
  memoizee(
    async function (path) {
      return (await dynamicImport(`@directus/api/${path}`)).default;
    },
    {
      async: true,
    }
  );

/**
 * Function importer
 */

export interface GetDirectusFunctionFromModule {
  <
    const Module extends keyof DirectusModules,
    const Name extends keyof DirectusModuleFunctions<Module>
  >(
    path: Module,
    name: Name
  ): Promise<DirectusModuleFunctions<Module>[Name]>;
}

export const getDirectusFunctionFromModule: GetDirectusFunctionFromModule =
  memoizee(
    async function (path, name) {
      return (await dynamicImport(`@directus/api/${path}`))[name];
    },
    {
      async: true,
    }
  );

/**
 * Lazy function importer (imported on first call)
 */

export type DirectusFunctionProxy<
  Module extends keyof DirectusModules,
  Name extends keyof DirectusModuleFunctions<Module>
> = (
  ...args: Parameters<DirectusModuleFunctions<Module>[Name]>
) => Promise<Awaited<ReturnType<DirectusModuleFunctions<Module>[Name]>>>;

export interface CreateDirectusFunctionProxy {
  <
    const Module extends keyof DirectusModules,
    const Name extends keyof DirectusModuleFunctions<Module>
  >(
    path: Module,
    name: Name
  ): (
    ...args: Parameters<DirectusModuleFunctions<Module>[Name]>
  ) => Promise<Awaited<ReturnType<DirectusModuleFunctions<Module>[Name]>>>;
}

export const createDirectusFunctionProxy: CreateDirectusFunctionProxy =
  function (path, name) {
    const importFunc = memoizee(async function () {
      return (await getDirectusFunctionFromModule<
        typeof path,
        typeof name
      >(path, name)) as any;
    });
    return new Proxy(new Function(), {
      async apply(_, thisArg, argumentsList) {
        const func = await importFunc();
        return func.apply(thisArg, argumentsList);
      },
    }) as any;
  };

export interface CreateDirectusFunctionProxyFromDefault {
  <
    const Module extends keyof DirectusModulesWithDefaultExport<
      (...args: any) => any
    >,
    const TargetFunc extends DirectusModulesWithDefaultExport<
      (...args: any) => any
    >[Module]["default"] = DirectusModulesWithDefaultExport<
      (...args: any) => any
    >[Module]["default"]
  >(
    path: Module
  ): (
    ...args: Parameters<TargetFunc>
  ) => Promise<Awaited<ReturnType<TargetFunc>>>;
}

export const createDirectusFunctionProxyFromDefault: CreateDirectusFunctionProxyFromDefault =
  function (path) {
    const importFunc = memoizee(async function () {
      return (await getDirectusFunctionFromModule(
        path,
        "default" as any
      )) as any;
    });

    return new Proxy(new Function(), {
      async apply(_, thisArg, argumentsList) {
        const func = await importFunc();
        return func.apply(thisArg, argumentsList);
      },
    }) as any;
  };
