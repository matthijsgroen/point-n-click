/** @jsx h */
import { h } from "preact";
import DemoCharacter from "./DemoCharacter";
import hiddo from "../content/dolls/hiddo";

const App = () => (
  <div>
    <h1>Demo characters</h1>
    <DemoCharacter character={hiddo} />
  </div>
);

export default App;
