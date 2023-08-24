import { isArray } from "@wolfpkgs/core/guards";
import {
  getDirectusDatabase,
  getDirectusServiceConstructors,
  getDirectusServices,
  getDirectusSchema,
} from "./extensions";

export async function translate<T = any>(
  items: T,
  collection: string
): Promise<T> {
  let values: any = items;
  if (!isArray(items)) {
    values = [items];
  }

  const { FieldsService } = await getDirectusServiceConstructors();

  const schema = await getDirectusSchema();
  const database = await getDirectusDatabase();

  const fieldsService = new FieldsService({
    schema,
  });

  return items;
}
