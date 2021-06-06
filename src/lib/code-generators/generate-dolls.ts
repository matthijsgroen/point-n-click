import { readdir, writeFile } from "fs/promises";
import { watch } from "fs";
import { join, basename, extname } from "path";
import { format } from "prettier";
import sharp from "sharp";

const getImagesFromLayer = async (path: string) =>
  (await readdir(path, { withFileTypes: true }))
    .filter((e) => e.isFile())
    .map((e) => e.name)
    .sort();

const capitalize = (text: string): string =>
  text.slice(0, 1).toUpperCase() + text.slice(1);

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

  const imports = [
    "// THIS FILE IS AUTO-GENERATED, DO NOT CHANGE",
    'import { Doll } from "point-n-click";',
  ];

  const imagePaths: string[] = [];
  const props: Record<string, string[]> = {};
  let width = 0;
  let height = 0;

  const generateImageLists = (layer: string): string[] => {
    const itemKeys = Object.keys(data.images[layer]);
    const result = [`    "${layer}": {`];
    props[layer] = [];
    for (const key of itemKeys) {
      const imagePath = data.images[layer][key];
      imports.push(
        `import img${inputCounter} from "url:./${imagePath}?as=webp";`
      );
      result.push(`"${key}": img${inputCounter},`);
      inputCounter++;
      props[layer] = props[layer].concat(key);

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
  const propLines = Object.entries(props).map(
    ([key, values]) =>
      `${key}${values.includes("default") ? "" : "?"}: "${values.join('"|"')}";`
  );

  const generatedCode = [
    "",
    `export interface ${capitalize(folderName)}Props {`,
    ...propLines,
    "}",
    "",
    `const ${folderName}: Doll<${capitalize(folderName)}Props> = {`,
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

  await writeFile(join(characterPath, "index.ts"), formatted);

  return folderName;
};

const updateDolls = async (dollContentPath: string) => {
  const entries = await readdir(dollContentPath, { withFileTypes: true });

  const folders = entries.filter((e) => e.isDirectory()).map((e) => e.name);

  const characters = await Promise.all(
    folders.map((folder) =>
      createCharacterFile(join(dollContentPath, folder), folder)
    )
  );
  const indexMap = characters
    .map((char) => `import ${char} from "./${char}";`)
    .concat("", `export default [${characters.join(",")}];`)
    .join("\n");
  const indexContent = format(indexMap, { parser: "typescript" });
  await writeFile(join(dollContentPath, "index.ts"), indexContent);
};

type Options = {
  watchMode?: boolean;
};
const generateDolls = async (
  current = process.cwd(),
  { watchMode = false }: Options = {}
) => {
  const dollContentPath = join(current, "src", "content", "dolls");

  await updateDolls(dollContentPath);

  if (watchMode) {
    let processing = false;
    watch(dollContentPath, { recursive: true }, async () => {
      if (processing) return;
      processing = true;
      await updateDolls(dollContentPath);
      setTimeout(() => {
        processing = false;
      }, 200);
    });
  }
};

export default generateDolls;
