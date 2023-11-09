import { illegalIds } from "./constants.js";

export { isSaveBookmarkFolderIdIllegal };

/**
 * Function that check if a bookmark folder ID is in the list of illegal IDs.
 * @param {string} bookmarkFolderId - The ID of the bookmark folder to check.
 * @returns `true` if the bookmark folder ID is illegal; otherwise `false`.
 */
function isSaveBookmarkFolderIdIllegal(bookmarkFolderId) {
  return illegalIds.includes(bookmarkFolderId);
}
