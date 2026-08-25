/*
 * Print the hash for a game master username and password.
 *
 *   node tools/gm-hash.js GM Adventist
 *
 * Paste the number it prints into gm-config.js. Neither the username nor the
 * password is written to any file, so neither lands in git history.
 *
 * The two are hashed together, so the stored number reveals nothing about
 * either one alone and the fields cannot be swapped.
 */
'use strict';
require('../core/gm.js');
var user = process.argv[2];
var pass = process.argv[3];
if (!user || !pass) {
  console.error('usage: node tools/gm-hash.js <username> <password>');
  process.exit(2);
}
console.log(globalThis.BibleGames.gm.credentials(user, pass));
