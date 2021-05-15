/** @jsx h */
import { h } from "preact";
import { useState } from "preact/hooks";
import { Doll } from "../../types/doll";
import { demoCharacter } from "./DemoCharacter.module.scss";

interface DemoCharacterProps {
  character: Doll;
}

const defaultValueForLayer = (character: Doll, layer: string) => {
  const values = Object.keys(character.images[layer]);
  return values.includes("default") ? "default" : values[0];
};

export function DemoCharacter({ character }: DemoCharacterProps) {
  const [layerConfig, setLayerConfig] = useState<Record<string, string>>(() =>
    character.layers.reduce(
      (result, key) => ({
        ...result,
        [key]: defaultValueForLayer(character, key),
      }),
      {}
    )
  );
  return (
    <div>
      <h2>{character.name}</h2>
      <figure
        class={demoCharacter}
        style={{ width: character.size[0], height: character.size[1] }}
      >
        {character.layers.map((layer) => (
          <div
            style={{
              backgroundImage: `url(${
                character.images[layer][layerConfig[layer]]
              })`,
            }}
          ></div>
        ))}
      </figure>
      {character.layers.map((layername) => (
        <div key={layername}>
          <label for={"select-" + layername}>{layername}</label>
          <select
            id={"select-" + layername}
            onChange={(event) => {
              const value = (event.target as HTMLSelectElement).value;
              setLayerConfig((config) => ({ ...config, [layername]: value }));
            }}
          >
            {Object.keys(character.images[layername]).map((name) => (
              <option value={name}>{name}</option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}
