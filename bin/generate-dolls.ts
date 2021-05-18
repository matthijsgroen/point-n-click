import { readdir as readdirCb, writeFile as writeFileCb } from "fs";
import { promisify } from "util";
import { join, basename, extname } from "path";
const readdir = promisify(readdirCb);
const writefile = promisify(writeFileCb);
import { format } from "prettier";
import sharp from "sharp";

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

  const imagePaths: string[] = [];
  let width = 0;
  let height = 0;

  const generateImageLists = (layer: string): string[] => {
    const itemKeys = Object.keys(data.images[layer]);
    const result = [`    "${layer}": {`];
    for (const key of itemKeys) {
      const imagePath = data.images[layer][key];
      imports.push(
        `import img${inputCounter} from "url:./${imagePath}?as=webp";`
      );
      result.push(`"${key}": img${inputCounter},`);
      inputCounter++;

      const fullImagePath = join(characterPath, imagePath);
      imagePaths.push(fullImagePath);
    }
    result.push("},");
    return result;
  };
  const imageIncludes = data.layers.reduce<string[]>(
    (r, e) => r.concat(generateImageLists(e)),
    []
  );

  for (const imagePath of imagePaths) {
    const image = sharp(imagePath);
    const metadata = await image.metadata();
    width = Math.max(width, metadata.width || 0);
    height = Math.max(height, metadata.height || 0);
  }

  const generatedCode = [
    "",
    `const ${folderName}: Doll = {`,
    `name: "${folderName}",`,
    `size: [${width}, ${height}],`,
    'type: "imagestack",',
    `layers: ["${data.layers.join('", "')}"],`,
    `images: {`,
    ...imageIncludes,
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
