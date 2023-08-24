/// <reference types="@directus/types" />

import { defineOperationApi } from "@directus/extensions-sdk";

export type ValidateDataOptions = {
  file: string;
};

async function getThumbhash(): Promise<typeof import("thumbhash")> {
  return await import("thumbhash");
}

getThumbhash().catch((error) => {
  console.log(`Failed to import dependency 'thumbhash': ${error}`);
  process.exit(1);
});

async function getSharp(): Promise<typeof import("sharp")> {
  return await import("sharp");
}

getSharp().catch((error) => {
  console.log(`Failed to import dependency 'sharp': ${error}`);
  process.exit(1);
});

export default defineOperationApi<ValidateDataOptions>({
  id: "thumbhash-extractor",
  async handler({ file }, { services, getSchema }) {
    const sharp = await getSharp();
    const thumbhash = await getThumbhash();
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

    const fileInfo = await files.readOne(file, {
      fields: ["id", "type", "width", "height"],
    });

    if (!file) {
      throw new Error(`File not found: ${file}`);
    }

    if (
      fileInfo.width === null ||
      fileInfo.height === null ||
      !fileInfo.type?.startsWith("image/") ||
      fileInfo.type?.includes("svg")
    ) {
      throw new Error(`Unsupported file type: ${fileInfo.type}`);
    }

    let resize = {
      width:
        fileInfo.width > fileInfo.height
          ? 100
          : fileInfo.width == fileInfo.height
          ? 100
          : undefined,
      height:
        fileInfo.height > fileInfo.width
          ? 100
          : fileInfo.width == fileInfo.height
          ? 100
          : undefined,
    };

    const asset = await assets.getAsset(fileInfo.id, {
      transformationParams: {
        key: undefined,
        withoutEnlargement: true,
        format: "webp",
        ...resize,
      },
      // Keep for backwards compatibility
      ...{
        key: undefined,
        withoutEnlargement: true,
        format: "webp",
        ...resize,
      },
    });

    const chunks: Buffer[] = [];
    for await (const chunk of asset.stream) {
      chunks.push(chunk);
    }

    const buffer = Buffer.concat(chunks);
    const image = await new Promise<
      | {
          buffer: Buffer;
          info: {
            width: number;
            height: number;
          };
        }
      | {
          error: Error;
        }
    >(async (resolve, reject) => {
      try {
        sharp(buffer)
          .raw()
          .ensureAlpha()
          .toBuffer(
            (
              error: Error,
              buffer: Buffer,
              info: { width: number; height: number }
            ) => {
              if (error) {
                reject(error);
              }
              resolve({
                buffer,
                info,
              });
            }
          );
      } catch (error) {
        resolve({
          error,
        });
      }
    });

    if ("error" in image) {
      throw new Error(image.error.message);
    }

    return Buffer.from(
      thumbhash.rgbaToThumbHash(
        image.info.width,
        image.info.height,
        image.buffer
      )
    ).toString("base64");
  },
});
