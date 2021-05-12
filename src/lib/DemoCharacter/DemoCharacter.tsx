/** @jsx h */
import { h } from "preact";
import { Doll } from "../../types/doll";

interface DemoCharacterProps {
  character: Doll;
}

export function DemoCharacter({ character }: DemoCharacterProps) {
  return (
    <div>
      <h2>{character.name}</h2>
      {character.layers.map((layername) => (
        <div key={layername}>
          <label for={"select-" + layername}>{layername}</label>
          <select id={"select-" + layername}>
            {Object.keys(character.images[layername]).map((name) => (
              <option>{name}</option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}
