import type { getFlowManager as GetFlowManager } from "@directus/api/dist/flows";
import type {
  Accountability,
  ApiExtensionContext,
  Field,
  FieldRaw,
  Item,
  OperationApiConfig,
  SchemaOverview,
} from "@directus/types";

import type {
  Request,
  Response,
  RequestHandler,
  NextFunction,
  Router,
} from "express";

import memoizee from "memoizee";
import { dynamicImport } from "@wolfpkgs/core/modules";

import { Options, useOptions } from "./options";
import { Contexts, IContextManager, initContext } from "./context";
import {
  DirectusOperationContext,
  DirectusServiceConstructors,
  DirectusServices,
} from "./types";

import type { Emitter } from "@directus/api/dist/emitter";
import type { ItemsService } from "@directus/api/dist/services/items";
import type { MetaService } from "@directus/api/dist/services/meta";
import {
  DirectusFunctionProxy,
  DirectusModuleFunctions,
  DirectusModules,
  createDirectusFunctionProxy,
  createDirectusFunctionProxyFromDefault,
  getDirectusModule,
  getDirectusModuleDefaultExport,
} from "./modules";

import { maxBy, sortBy } from "lodash-es";
import { SnapshotField, SnapshotRelation } from "@directus/api/dist/types";

export function defineOperationApi<
  OptionsType extends Record<string, any>,
  ContextsType extends Contexts = {}
>(config: {
  id: string;
  options?: Partial<OptionsType>;

  handler: (
    options: Options<OptionsType>,
    data: Record<any, any>,
    context: IContextManager<ContextsType>,
    services: DirectusServices,
    directus: DirectusOperationContext
  ) => unknown | Promise<unknown> | void;

  bindings?: (
    options: OptionsType,
    values: Record<any, any>,
    context: IContextManager<ContextsType>,
    services: DirectusServices,
    directus: DirectusOperationContext
  ) => Record<string, unknown>;
}): OperationApiConfig<OptionsType> {
  return {
    id: config.id,
    handler: async (opts, directus) => {
      // const database = directus.database;
      // const accountability = directus.accountability || undefined;
      const services = await getDirectusServices();
      const { context, values } = initContext<ContextsType>(directus.data);
      const bindings = config.bindings
        ? config.bindings(opts, values, context, services, directus)
        : {};
      const accountability = directus.accountability || null;
      const options = await useOptions<OptionsType>(
        opts,
        values,
        config.options || {},
        directus,
        accountability,
        bindings
      );
      return await config.handler(options, values, context, services, directus);
    },
  };
}

/**
 * Emitter
 */

export async function getDirectusEmitter(): Promise<Emitter> {
  return await getDirectusModuleDefaultExport("emitter");
}

/**
 * Schema
 */

export const getDirectusSchema: DirectusFunctionProxy<
  "utils/get-schema",
  "getSchema"
> = createDirectusFunctionProxy("utils/get-schema", "getSchema");

/**
 * Database
 */

export const getDirectusDatabase: DirectusFunctionProxy<
  "database/index",
  "default"
> = createDirectusFunctionProxyFromDefault("database/index");

/**
 * Services
 */

export type GetDirectusServiceOptions = {
  bypassCache: boolean;
};

export async function getDirectusServices(
  { bypassCache = false }: GetDirectusServiceOptions = { bypassCache: false }
): Promise<DirectusServices> {
  const emitter = await getDirectusEmitter();
  const services = await getDirectusServiceConstructors();
  const database = await getDirectusDatabase();
  const schema = await getDirectusSchema({
    database,
    bypassCache,
  });

  return {
    ...services,
    database,
    schema,
    emitter,
  } as any as DirectusServices;
}

const importGetFlowManager = memoizee(
  async (): Promise<typeof GetFlowManager> => {
    const mod = await dynamicImport<typeof import("@directus/api/dist/flows")>(
      "@directus/api/flows"
    );
    return mod.getFlowManager;
  }
);

type FlowManager = ReturnType<typeof GetFlowManager>;

//export const getFlowManager2 = createDirectusFunctionProxy<
//  "flows",
//  "getFlowManager"
//>("flows", "getFlowManager");

export async function getFlowManager(): Promise<FlowManager> {
  return (await importGetFlowManager())();
}

/**
 * Services
 */

export async function getDirectusServiceConstructors(): Promise<DirectusServiceConstructors> {
  return await getDirectusModule("services/index");
}

export const getDirectusDatabaseClient: DirectusFunctionProxy<
  "database/index",
  "getDatabaseClient"
> = createDirectusFunctionProxy("database/index", "getDatabaseClient");

/**
 * Services
 */

const getSnapshot: DirectusFunctionProxy<"utils/get-snapshot", "getSnapshot"> =
  createDirectusFunctionProxy("utils/get-snapshot", "getSnapshot");

export async function getDirectusSnapshot(): ReturnType<typeof getSnapshot> {
  return await getSnapshot({});
}

export async function getFullDirectusSnapshot(): ReturnType<
  typeof getSnapshot
> {
  const services = await getDirectusModule("services/index");
  const pkg = await getDirectusModule("utils/package");

  const knex = await getDirectusDatabase();
  const schema = await getDirectusSchema({
    bypassCache: true,
  });

  const vendor = await getDirectusDatabaseClient(knex);

  const collectionsService = new services.CollectionsService({ knex, schema });
  const fieldsService = new services.FieldsService({ knex, schema });
  const relationsService = new services.RelationsService({ knex, schema });

  let [collections, fields, relations] = await Promise.all([
    collectionsService.readByQuery(),
    fieldsService.readAll(),
    relationsService.readAll(),
  ]);

  const maxSortIndex =
    (maxBy(fields, (v) => v.meta?.sort || 0)?.meta?.sort || 0) + 1;

  const findGroup = (collection: string, group: string) => {
    return fields.find(
      (v) =>
        v.collection == collection &&
        v.field == group &&
        v.meta?.special?.includes("group")
    );
  };

  const getIndexes = (field: FieldRaw, indexes: number[] = []): number[] => {
    indexes.unshift(field.meta?.sort || 10000);

    if (!field.meta?.group) {
      return indexes;
    }

    const group = findGroup(field.collection, field.meta.group);
    if (!group) {
      return indexes;
    }

    return getIndexes(group, indexes);
  };

  fields = sortBy(fields, [
    "collection",
    (v) =>
      getIndexes(v).reduce((previous, current, index) => {
        if (index == 0) {
          return current;
        } else {
          return previous + current / (maxSortIndex * index);
        }
      }, 0),
  ]);

  return {
    version: 1,
    directus: pkg.version,
    vendor: vendor,
    collections,
    fields: fields as SnapshotField[],
    relations: relations as SnapshotRelation[],
  };
}

/**
 * Express
 */

const importExpressRouter = memoizee(async (): Promise<typeof Router> => {
  const { Router: value } = await dynamicImport<typeof import("express")>(
    "express"
  );
  return value;
});

export async function getExpressRouter(): Promise<typeof Router> {
  return await importExpressRouter();
}

export async function createExpressRouter(): Promise<Router> {
  return (await getExpressRouter())();
}

/**
 * Service helpers
 */

export async function getDirectusItemsService<T extends Item = Item>(
  collection: string,
  directus?: Partial<ApiExtensionContext> & {
    schema?: SchemaOverview | null;
    accountability?: Accountability | null;
  }
): Promise<ItemsService<T>> {
  const services: DirectusServices =
    directus?.services || (await getDirectusServices());
  const database = directus?.database || (await getDirectusDatabase());
  const schema =
    directus?.schema ||
    (await getDirectusSchema({
      database,
    }));

  return new services.ItemsService<T>(collection, {
    schema,
    knex: database,
    accountability: directus?.accountability || null,
  });
}

export async function getDirectusMetaService(directus?: {
  schema?: SchemaOverview | null;
  accountability?: Accountability | null;
}): Promise<MetaService> {
  const services: DirectusServices = await getDirectusServices();
  const schema =
    directus?.schema ||
    (await getDirectusSchema({
      database: await getDirectusDatabase(),
    }));

  return new services.MetaService({
    accountability: directus?.accountability || null,
    schema,
  });
}

export async function getContextFromRequest(req: Request) {
  const accountability: Accountability | null =
    (req as any).accountability || null;
  const schema: SchemaOverview =
    (req as any).schema || (await getDirectusSchema());

  return {
    accountability,
    schema,
  };
}
