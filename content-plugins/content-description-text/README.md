# Content Plugin: Description Text

Allows displaying text. Just like `world.text()`. But since this is a plugin, graphical clients can omit this content.

A typical use case would be describing what themes using images would see.

## Content Language additions

```ts
world.note(() => {
  world.text("Text of the note");
  // other content is accepted as well
});
```
