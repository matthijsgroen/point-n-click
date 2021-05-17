import { readdir as readdirCb, writeFile as writeFileCb } from "fs";
import { promisify } from "util";
import { join, basename, extname } from "path";
const readdir = promisify(readdirCb);
const writefile = promisify(writeFileCb);
import { format } from "prettier";

const getImagesFromLayer = async (path: string) =>
  (await readdir(path, { withFileTypes: true }))
    .filter((e) => e.isFile())
    .map((e) => e.name)
    .sort();

const buildCharacterStructure = async (path: string, name: string) => {
  const layerEntries = await readdir(path, { withFileTypes: true });
  const layers = layerEntries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
  const layersNames = layers.map((e) => e.split("_").slice(1).join("_"));
  const images: Record<string, Record<string, string>> = {};

  for (const index in layers) {
    const imageNames = await getImagesFromLayer(join(path, layers[index]));
    images[layersNames[index]] = imageNames.reduce<Record<string, string>>(
      (result, name) => ({
        ...result,
        [basename(name, extname(name))]: join(layers[index], name),
      }),
      {}
    );
  }

  return { name, layers: layersNames, images };
};

const createCharacterFile = async (
  characterPath: string,
  folderName: string
) => {
  const data = await buildCharacterStructure(characterPath, folderName);
  let inputCounter = 1;

  const imports = [`import { Doll } from "../../../types/Doll";`];

  const generateImageLists = (layer: string): string[] => {
    const itemKeys = Object.keys(data.images[layer]);
    const result = [`    "${layer}": {`];
    for (const key of itemKeys) {
      imports.push(
        `import img${inputCounter} from "url:./${data.images[layer][key]}";`
      );
      result.push(`"${key}": img${inputCounter},`);
      inputCounter++;
    }
    result.push("},");
    return result;
  };

  const generatedCode = [
    "",
    `const ${folderName}: Doll = {`,
    `name: "${folderName}",`,
    `size: [600, 800],`, // Read from disk?
    'type: "imagestack",',
    `layers: ["${data.layers.join('", "')}"],`,
    `images: {`,
    ...data.layers.reduce((r, e) => r.concat(generateImageLists(e)), []),
    "}",
    "};",
    "",
    `export default ${folderName};`,
  ];

  const indexFileCode = [...imports, ...generatedCode].join("\n");
  const formatted = format(indexFileCode, { parser: "typescript" });

  writefile(join(characterPath, "index.ts"), formatted);
};

const program = async () => {
  const current = process.cwd();

  const dollContentPath = join(current, "src", "content", "dolls");
  const entries = await readdir(dollContentPath, { withFileTypes: true });

  const folders = entries.filter((e) => e.isDirectory()).map((e) => e.name);

  await Promise.all(
    folders.map((folder) =>
      createCharacterFile(join(dollContentPath, folder), folder)
    )
  );
};
program();
