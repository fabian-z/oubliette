# oubliette
*ˌuːblɪˈɛt* - 
*a dungeon with an opening only at the top*

Project work for lecture Programming I

# Must have

* Must be developed with JavaScript, no HTML/CSS or Browser
* Node.js as interpreter
* The application must run stable and be able to cope with exceptionary situations (invalid input, missing files, ..)
* Reasonable and intuitive user experience
* Code should be readable and well-structured, with comments for non-trivial code or other relevant places
* Large frameworks (gaming, web frameworks, ..) must not be used
* Simple libraries (e.g. readline-sync, lodash, node-localstorage) are allowed, more complex libraries are to be approved by [@behrends](https://github.com/behrends)
  * TUI libraries, such as some ncurses binding or [blessed](https://github.com/chjj/blessed) have been approved for this specific project
  * Dungeon generation libraries, such as [dungeon-generator](https://github.com/domasx2/dungeon-generator) or [Dungeonizer.js](https://github.com/mlknz/Dungeonizer.js) have benn approved for this specific project
  * TypeScript is allowed


* Rouge-like game with monospace ASCII / UTF-8 art interface
  * Procedurally generated maps / dungeons
    * TODO: Research algorithms and test JS implementations
  * Random distribution of monsters and items
  * Track player status (health points, experience, character name)
* Controlled with keyboard
  * Arrow keys, WASD?
* Difficulty selection
  * Hard, Medium, Easy - with different game balancing
* Split-screen with player and game status
* Help screen / signs and symbols explanation for improved UX

# Nice to have
  
* Saving of application state / game player progress 
  * Save random seed or entire level map?
* Configurable key mapping
* Research of UX with different algorithm parameters (map generation, distribution rules)
* Event logs
* Different weapons?
* Easter egg / achievements?
* Sound effects?
