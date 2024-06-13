import { defineOperationApp } from "@directus/extensions-sdk";

export default defineOperationApp({
  id: "blurhash-extractor",
  name: "Extract BlurHash",
  icon: "forward_to_inbox",
  description: "Extract BlurHash from a File.",
  overview: ({ file }) => {
    return [
      {
        label: "File",
        text: file.startsWith("{{") ? "Template" : file,
      },
    ];
  },
  options: [
    {
      field: "file",
      name: "File",
      type: "string",
      meta: {
        field: "file",
        width: "full",
        interface: "input",
      },
    },
  ],
});
