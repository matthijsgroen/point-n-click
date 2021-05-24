/** @jsx h */
import { h, render, FunctionComponent } from "preact";

const App: FunctionComponent = () => (
  <div>
    <h1>Hello</h1>
    <p>World!</p>
  </div>
);

render(<App />, document.body);
