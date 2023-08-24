/// <reference types="@directus/types" />

import { defineOperationApi } from "@directus/extensions-sdk";

const OFFICE_TEXT_EXTRACTOR = "office-text-extractor";

export type ValidateDataOptions = {
  file: string;
};

async function getTextExtractor(): Promise<
  ReturnType<typeof import("office-text-extractor").getTextExtractor>
> {
  return (await import(OFFICE_TEXT_EXTRACTOR)).getTextExtractor();
}

export default defineOperationApi<ValidateDataOptions>({
  id: "text-extractor",
  async handler({ file }, { services, getSchema }) {
    const schema = await getSchema();

    const FilesService: typeof import("@directus/api/dist/services/files").FilesService =
      services.FilesService;

    const files = new FilesService({
      schema,
    });

    const AssetsService: typeof import("@directus/api/dist/services/assets").AssetsService =
      services.AssetsService;

    const assets = new AssetsService({
      schema,
    });

    const asset = await assets.getAsset(file, {
      transformationParams: {},
    });

    const chunks: Buffer[] = [];
    for await (const chunk of asset.stream) {
      chunks.push(chunk);
    }

    const buffer = Buffer.concat(chunks);
    const { extractText } = await getTextExtractor();
    const text = await extractText({ input: buffer, type: "buffer" });

    return text;
  },
});
