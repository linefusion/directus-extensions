import {
  Accountability,
  ApiExtensionContext,
  Query,
  SchemaOverview,
} from "@directus/types";

import { isObject } from "@wolfpkgs/core/guards";
import { IsAnyOrUnknown } from "@wolfpkgs/core/types";

import { Bindings, Data, createBindings } from "./bindings";
import { evaluate, isTemplate } from "./evaluation";
import { getValidator } from "./validators";
import { merge } from "@wolfpkgs/core/utils/merge";

export type ItemOptionTemplate = string;
export type ItemOptionValue = {
  collection: string;
  key: any;
};

export function isItemOptionValue(value: any): value is ItemOptionValue {
  return hasProperty(value, "key") && hasProperty(value, "collection");
}

export function isItemOptionTemplate(
  template: any
): template is ItemOptionTemplate {
  return typeof template === "string";
}

export type ItemOptions = {
  collection: string;
  query?: Query;
};

export class Options<T extends Data> {
  private _data: Data;
  private _bindings: Data;
  private _schema: SchemaOverview | null;

  constructor(
    private options: T,
    input: Data,
    private directus: ApiExtensionContext,
    private accountability?: Accountability | null,
    bindings: Bindings = {}
  ) {
    const { data, contexts } = splitDataFromContext(input);
    this._data = data;
    this._schema = null;
    this._bindings = {
      ...contexts,
      options,
      ...bindings,
    };
  }

  async schema(): Promise<SchemaOverview> {
    if (!this._schema) {
      this._schema = await this.directus.getSchema!();
    }
    return this._schema;
  }

  async initialize() {
    this._bindings = await createBindings(
      {
        ...this._bindings,
      },
      this.directus
    );
    return this;
  }

  async json<const Default = any>(
    option: keyof T,
    value?: Default
  ): Promise<Default | undefined> {
    let template = this.options[option];
    if (!isTemplate(template)) {
      let data = undefined;
      if (typeof template === "string") {
        try {
          data = JSON.parse(template);
        } catch (e) {
          data = template;
        }
      }
      return (this._bindings.options[option] = data);
    }

    const result = await evaluate(
      template,
      value || this._data,
      this._bindings
    );

    if (result.is_ok()) {
      return (this._bindings.options[option] = result.ok());
    }

    return undefined;
  }

  validator(option: keyof T) {
    return getValidator(this.options[option]);
  }

  get(option: keyof T): any {
    return (this._bindings.options[option] = this.options[option]);
  }

  async item(option: keyof T, options: ItemOptions): Promise<any> {
    options.query = options.query || {};
    options.query.fields = options.query.fields || ["*", "translations.*"];

    let item: any = this.options[option];
    let collection = options.collection;

    let key: any = undefined;
    if (isItemOptionValue(item)) {
      collection = item.collection || collection;
      key = item.key;
    } else if (isTemplate(item)) {
      const result = await evaluate(item, this._data, this._bindings);
      if (result.is_ok()) {
        key = result.ok();
      } else {
        key = item;
      }
    } else if (item == "" || item == null || typeof item == "undefined") {
      key = item;
    }

    if (key == undefined) {
      return undefined;
    }

    const items = new this.directus.services.ItemsService(collection, {
      schema: await this.schema(),
      knex: this.directus.database,
      accountability: this.accountability || null,
    });

    const result = await items.readOne(key, options.query);
    return (this._bindings.options[option] = result);
  }

  async eval(option: keyof T): Promise<any> {
    let item: any = this.options[option];

    if (typeof item !== "string") {
      return (this._bindings.options[option] = item);
    }

    if (!isTemplate(item)) {
      return (this._bindings.options[option] = item);
    }

    const result = await evaluate(item, this._data, this._bindings);
    if (result.is_ok()) {
      return (this._bindings.options[option] = result.ok());
    }

    return this.get(option);
  }

  async text(option: keyof T): Promise<any> {
    return this.get(option);
  }
}

export function splitDataFromContext(value: Data): {
  data: Data;
  contexts: Data;
} {
  return [
    ...Object.getOwnPropertyNames(value),
    ...Object.getOwnPropertySymbols(value),
  ]
    .map(
      (key) =>
        [
          typeof key === "symbol" || key.startsWith("$") ? "contexts" : "data",
          typeof key === "symbol"
            ? key
            : key.startsWith("$")
            ? key.substring(1)
            : key,
          value[key],
        ] as const
    )
    .reduce(
      (acc, [type, key, value]) => {
        acc[type] = acc[type] || {};
        acc[type][key] = value;
        return acc;
      },
      {
        data: {} as Record<string | symbol, any>,
        contexts: {} as Record<string | symbol, any>,
      }
    );
}

export async function useOptions<T extends Record<string, any>>(
  options: T,
  data: Data,
  defaultOptions: Partial<T>,
  directus: ApiExtensionContext,
  accountability?: Accountability | null,
  bindings?: Bindings
): Promise<Options<T>> {
  const mergedOpts = merge<T>({}, defaultOptions, options);
  const instance = new Options<T>(
    mergedOpts,
    data,
    directus,
    accountability,
    bindings
  );
  return await instance.initialize();
}

// Move to core

const unchecked: unique symbol = Symbol.for("@wolfpkgs/core/guards/unchecked");
export type Unchecked = typeof unchecked;

export function hasProperty<
  const T extends Record<any, any>,
  const Property extends string,
  const Value = Unchecked
>(
  obj: T,
  property: Property,
  value: Value | Unchecked = unchecked
): obj is (IsAnyOrUnknown<T> extends true ? Record<any, any> : T) & {
  [K in Property]: K extends keyof T
    ? T[K]
    : [Value] extends [Unchecked]
    ? any
    : Value;
} {
  if (isObject(obj) && property in obj) {
    return value === unchecked || obj[property] === value;
  }
  return false;
}
