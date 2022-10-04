# 2021-06-30 Still working on script processing

I got the execution working, by using a queue where queue items can be processed seperately, and communicate to the 'outside' world by sending requests and getting responses. This allows for recording of interactions and playing them back to restore the queue to its original execution points. This works 'ok' for now,
but is not yet resillient if content has changed between saving and loading.

# 2021-05-25 Failed proof of concept

Experimented by trying to get a redux controlled view rendered through a library, but ran into issues. The library is running in production mode inside the development project, thus not exposing the redux state for browser plugins (which hinders development insight). It's also a real challenge to let the project specific types flow through the library code, so I need to change the strategy here.

This means for now I cannot re-use the "Sint" code, and need to truly start from scratch.

# 2021-05-24 Splitting project and engine

- Started a package: 'point-n-click'
- Project is using point 'n click 'start' to run dev server
- code generation also works in watch mode now

- next steps is the library part for imports (Doll type)

# 2021-05-18 Still on 'storybook' mode

- generate a list of full doll now
- display all dolls and configure them

# 2021-05-12 Started on stack

- Created github repo
- Started on setup: Preact/Parcel
- Defined type: Doll
- Started on 'DollViewer' component

# 2021-05-10 Started 'Point 'n Click'

Created a new repo. Next step, make a todo list.

Todo list for now:

1. Text processing. I want the game to become multilingual. I should take notes
   from https://www.renpy.org/doc/html/text.html since that is for a lot of game
   developers already an established way to handle text.

Tech stack:

- Geppetto
- Preact - Typescript
  - Familiarity
  - Personal preference
  - Small footprint
  - Interop with lots if libs not that important
- Typescript

/template /src

- Package stuff, that is used in template
- Tools for creating content

  - Add character to scene
  - Configure with controls / animations
  - Setup doll - Either Geppetto or 'Sprites' (mouths, eyes, hair, clothes,
    manage layers, poses, etc)

  - Store content as JSON.
  - Allow playing 'JSON' directly (dev mode)
  - Allow easy translation of content

  - Place content in sub scripts (e.g. inventory management, certain
    conversations)

# For the type of game I want to make, why not Ren'Py?

- RenPy is optimized for desktop apps, I want mine to be optimized for web. (not
  as a huge wasm binary with everything webGL, but a health DOM/WebGL mix)
- The programming part is always the short time spend scaled on all time
  required to build a game. The large time spend is on content creation for the
  game itself (dialog / art). By leveraging existing web development tools, I
  want to create the best content creation experience there could be.

Focus:

- Content loading over web can be considerably slower than local. Smart
  pre-loading should come out of the box.
- Content should be chopped into chunks, so that only required parts are loaded,
  for instance, one 'chapter' at a time.
- Playable on SmartTV, Phone, Tablet, Chromebook, Laptop, etc. Input with
  keyboard, mouse, gamepad, touch.

Starting point:

Create 'Sinterklaas Game' As 'code I wish I had', to turn it into an engine?
