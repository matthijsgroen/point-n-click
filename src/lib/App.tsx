/** @jsx h */
import { h } from "preact";
import DemoCharacter from "./DemoCharacter";
import characters from "../content/dolls";
import { useState } from "preact/hooks";

const App = () => {
  const [activeDoll, setActiveDoll] = useState(characters[0]);

  return (
    <div>
      <h1>Demo characters</h1>
      <ul>
        {characters.map((char) => (
          <li>
            <button
              disabled={char === activeDoll}
              onClick={() => {
                setActiveDoll(char);
              }}
            >
              {char.name}
            </button>
          </li>
        ))}
      </ul>
      <DemoCharacter character={activeDoll} />
    </div>
  );
};

export default App;
