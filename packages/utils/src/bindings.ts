import { Accountability, ApiExtensionContext } from "@directus/types";
import { merge } from "@wolfpkgs/core/utils/merge";
import { getDirectusSchema, getDirectusServices } from "./extensions";

export type Data = any;
export type Bindings = any;

export function getUrl(url: string | URL, query: Record<string, any> = {}) {
  if (typeof url !== "string") {
    url = new URL(url);
  } else {
    if (url.startsWith("/")) {
      url = new URL(`http://127.0.0.1:${process.env.PORT || 8055}${url}`);
    } else if (url.startsWith("http://") || url.startsWith("https://")) {
      url = new URL(url);
    } else {
      return getUrl(`/${url}`);
    }
  }

  for (const [key, value] of Object.entries(query).flatMap(([key, value]) => {
    const values = Array.isArray(value) ? value : [value];
    if (Array.isArray(value)) {
      key = `${key}[]`;
    }
    return values.map((v) => {
      if (typeof v == "object") {
        return [key, JSON.stringify(v)];
      } else {
        return [key, v];
      }
    });
  })) {
    url.searchParams.append(key, value);
  }

  return url;
}

export type RequestOptions = {
  headers?: Record<any, any>;
  query?: Record<any, any>;
  body?: any;
};

export async function request(
  method: string,
  url: string,
  options?: RequestOptions
) {
  method = method.toUpperCase();
  let init = {
    method,
    headers: options?.headers || {},
    body: options?.body || {},
  };

  if (method == "GET" || method == "HEAD") {
    delete init.body;
  }

  return await fetch(getUrl(url, options?.query), init);
}

export async function createBindings(
  bindings: Bindings,
  directus: ApiExtensionContext,
  accountability?: Accountability | null
) {
  const { ItemsService } = await getDirectusServices();
  return merge(
    {},
    {
      http: {
        get: async (url: string, options?: RequestOptions) => {
          try {
            const response = await request("GET", url, options);
            return await response.json();
          } catch (error) {
            return { error };
          }
        },
        post: async (url: string, options?: RequestOptions) => {
          try {
            const response = await request("POST", url, options);
            return await response.json();
          } catch (error) {
            return { error };
          }
        },
      },
      items: new Proxy(
        {},
        {
          get: (_, collection: string) => {
            const getItems = async () => {
              const items = new ItemsService(collection, {
                schema: await directus.getSchema(),
                knex: directus.database,
                accountability: accountability || null,
              });
              return items;
            };
            return {
              query: async (query: any) => {
                const items = await getItems();
                items.readByQuery(query || {}, {
                  emitEvents: false,
                });
              },
            };
          },
        }
      ),
    },
    bindings || {}
  );
}
