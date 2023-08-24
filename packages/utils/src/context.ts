import { v4 } from "uuid";
import dot from "dot-object";

export type Decontextualize<T extends Record<`$${string}`, any>> = {
  [K in keyof T as K extends `$${infer K2}` ? K2 : K]: T[K];
};

export type Contextualize<T extends Record<any, any>> = {
  [K in keyof T as K extends string ? `$${K}` : K]: T[K];
};

export type DefaultContext = {
  trigger: Record<any, any>;
  last: Record<any, any>;
  env: Record<any, any>;
  accountability: Record<any, any> | null | undefined;
};

export type Context<T = any> = T;
export type Contexts = Record<string | symbol, Context<any>>;

export const DEFAULT_CONTEXT: unique symbol = Symbol.for(
  "@wolfpkgs/directus/context/default"
);

export const GENERATED_CONTEXT: unique symbol = Symbol.for(
  "@wolfpkgs/directus/context/default/generate"
);

export const INJECTED_VALUES: unique symbol = Symbol.for(
  "@wolfpkgs/directus/context/container"
);

export type IContextManager<T extends Contexts = {}> = {
  generated_id: string;
  generated: any;
  default: any;

  has(key: string | symbol | number): boolean;
  get<K>(
    key: string | symbol | number | keyof T,
    create: () => (K extends keyof T ? T[K] : any) | undefined
  ): K extends keyof T ? T[K] : any;
  set<K>(
    key: string | symbol | number | keyof T,
    value: K extends keyof T ? T[K] : any
  ): void;
} & DefaultContext &
  Partial<T>;

class ContextManager {
  private data: Context;

  constructor(data: Record<any, unknown>) {
    this.data = data;

    if ("$trigger" in data) {
      if (INJECTED_VALUES in this.trigger) {
        const existing = this.trigger[INJECTED_VALUES] as Contexts;
        for (const key of [
          ...Object.getOwnPropertyNames(existing),
          ...Object.getOwnPropertySymbols(existing),
        ]) {
          this.set(key, existing[key as any]);
        }
        delete this.trigger[INJECTED_VALUES];
      }
    }
  }

  public get trigger(): Record<any, any> {
    return this.data["$trigger"] || {};
  }

  public get last(): Record<any, any> {
    return this.data["$last"] || {};
  }

  public get env(): Record<any, any> {
    return this.data["$env"] || {};
  }

  public get accountability(): Record<any, any> | null {
    return this.data["$accountability"] || null;
  }

  public get default(): any {
    return this.data[DEFAULT_CONTEXT] || {};
  }

  public set default(value: any) {
    this.data[DEFAULT_CONTEXT] = value;
  }

  public get generated_id() {
    let name: string | undefined = undefined;
    if (GENERATED_CONTEXT in this.data) {
      name = this.data[GENERATED_CONTEXT];
    } else {
      this.data[GENERATED_CONTEXT] = name = v4();
    }
    return name!;
  }

  public get generated(): any {
    return this.get(this.generated_id, () => ({}));
  }

  keys() {
    return Array.from(
      new Set([
        ...Object.getOwnPropertyNames(this.data).filter((name) =>
          name.startsWith("$")
        ),
        ...Object.getOwnPropertySymbols(this.data),
      ])
    );
  }

  entries() {
    return this.keys().map((k) => [k, this.get(k, () => ({}))]);
  }

  values() {
    return this.keys().map((k) => this.get(k, () => ({})));
  }

  public has(key: string | symbol): boolean {
    const index = typeof key === "string" ? `$${key}` : (key as any);
    return index in this.data;
  }

  public get(
    key: string | symbol,
    create: () => any
  ): Record<any, any> | undefined {
    const index = typeof key === "string" ? `$${key}` : (key as any);
    if (index in this.data) {
      return this.data[index];
    } else {
      return (this.data[index] = create());
    }
  }

  public set(key: string | symbol, value: any): void {
    const index = typeof key === "string" ? `$${key}` : (key as any);
    this.data[index] = value;
  }

  public [Symbol.toStringTag]() {
    return "ContextManager";
  }

  public *[Symbol.iterator]() {
    for (const entry of this.entries()) {
      yield entry;
    }
  }

  public get length() {
    return this.keys().length;
  }
}

export function initContext<T extends Contexts>(
  data: Record<any, unknown>
): {
  context: IContextManager<T>;
  values: Record<any, any>;
} {
  const context = getContextManagerFor<T>(data);

  return {
    context,
    values: data,
  };
}

export function getContextManagerFor<T extends Contexts>(
  data: any
): IContextManager<T> {
  let manager = new ContextManager(data);

  return new Proxy<IContextManager<T>>(manager as any, {
    has(target, prop) {
      if (prop in target) {
        return Reflect.has(target, prop);
      } else {
        return target.has(prop);
      }
    },
    get(target, prop, receiver) {
      if (prop in target) {
        return Reflect.get(target, prop, receiver);
      } else {
        return target.get(prop, () => undefined);
      }
    },
    set(target, prop, value, receiver) {
      if (prop in target) {
        throw new Error("Cannot set a builtin context manager value.");
      } else {
        target.set(prop, value);
        return true;
      }
    },
  });
}

export function dataWithContexts<T extends Contexts>(contexts: T, data?: any) {
  return {
    ...(data || {}),
    [INJECTED_VALUES]: contexts,
  };
}

export function triggerWithContexts<T extends Contexts>(
  contexts: T,
  data?: Record<any, any>
) {
  return {
    ...(data || {}),
    $trigger: {
      ...(data?.$trigger || {}),
      [INJECTED_VALUES]: contexts,
    },
  };
}
