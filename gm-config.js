/*
 * Who may see the answers.
 *
 * Knowing the username and password is the whole gate. This is obscurity, not
 * security: the threat model is a curious teenager with a phone, not an
 * adversary. The hash is here only so the credentials are not sitting in plain
 * text in a public repository, which would defeat the one purpose they have.
 *
 * The two fields are hashed together, so this number reveals nothing about
 * either one alone, and they cannot be swapped.
 *
 * Leading and trailing spaces are ignored, and letter case does not matter -
 * a phone keyboard capitalises without being asked, and the gate should not
 * punish that.
 *
 * To change them:  node tools/gm-hash.js <username> <password>
 * then paste the number below. Never write the credentials in this file.
 *
 * As shipped: username GM, password Adventist. Change them before a service.
 */
window.GM_CONFIG = { loginHash: 551721203 };
