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
  * Dungeon generation libraries, such as [dungeon-generator](https://github.com/domasx2/dungeon-generator) or [Dungeonizer.js](https://github.com/mlknz/Dungeonizer.js) have been approved for this specific project
  * TypeScript is allowed


* Rouge-like game with monospace ASCII / UTF-8 art interface
  * Procedurally generated maps / dungeons ☑
    * Research algorithms and test JS implementations ☑
  * Random distribution of monsters ☑ and items ☑
  * Track player status (health points ☑, experience, character name ☑)
* Controlled with keyboard ☑
  * Arrow keys, WASD ☑
* Split-screen with player and game status ☑

# Nice to have

* Map exploration ☑
* Good monster pathfinding ☑
  * Uses Dijkstra map, a simplified algorithm where all edges have identical weight
  * Pathfinding is executed on a separate worker thread ☑
* Battle system player <-> monster ☑
  * Research different damage / health parameters
* Item callbacks can effect basically all game state objects ☑
* Help screen / signs and symbols explanation for improved UX ☑
* Level and character progression
* Difficulty selection
  * Hard, Medium, Easy - with different game balancing

* Event logs

* Saving of application state / game player progress 
  * -> Save level map but keep permadeath?
* Research of UX with different algorithm parameters (map generation, distribution rules)

* Different weapons?
* Easter egg / achievements?
