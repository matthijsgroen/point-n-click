import { readdir as readdirCb } from "fs";
import { promisify } from "util";
import { join, basename, extname } from "path";
const readdir = promisify(readdirCb);

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
  const images = {};

  for (const index in layers) {
    const imageNames = await getImagesFromLayer(join(path, layers[index]));
    images[layersNames[index]] = imageNames.reduce<Record<string, string>>(
      (result, name) => ({
        ...result,
        [basename(name, extname(name))]: join(path, layers[index], name),
      }),
      {}
    );

    // console.log(layersNames[index], layers[index], images);
  }

  return { name, layers: layersNames, images };
};

const program = async () => {
  const current = process.cwd();

  const dollContentPath = join(current, "src", "content", "dolls");
  const entries = await readdir(dollContentPath, { withFileTypes: true });

  const folders = entries.filter((e) => e.isDirectory()).map((e) => e.name);

  const items = await Promise.all(
    folders.map((folder) =>
      buildCharacterStructure(join(dollContentPath, folder), folder)
    )
  );

  console.log(JSON.stringify(items, null, 2));
};
program();
