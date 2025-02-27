# DisplayObjects moeten geen state hebben

- Vlaggetjes en settings worden gedaan door state.

  - Heeft Rijmpiet een bril ? dat komt door een puzzel, laat state in game bepalen of hij dan bril heeft
  - Ligt sleutel zichtbaar in achtergrond? dat is door game state, niet render state
  - Render state is onafhankelijk van game state, zoals een pose tijdens praten

- Display objects kunnen een bounds hebben. (outer bounds, shape bounds? (mask??))

- Hoe koppelen we een interactie aan een display object?