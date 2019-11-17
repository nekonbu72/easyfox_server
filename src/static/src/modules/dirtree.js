//@ts-check
"use strict";

export class DirTree {
  constructor() {
    /**
     * @type {boolean}
     */
    this.exists = false;

    /**
     * @type {string}
     */
    this.parent = "";

    /**
     * @type {string}
     */
    this.name = "";

    /**
     * @type {string}
     */
    this.stem = "";

    /**
     * @type {string}
     */
    this.suffix = "";

    /**
     * @type {string}
     */
    this.fullPath = "";

    /**
     * @type {boolean}
     */
    this.isDir = false;

    /**
     * @type {boolean}
     */
    this.isFile = false;

    /**
     * @type {number}
     */
    this.depth = 0;

    /**
     * @type {string}
     */
    this.top = "";

    /**
     * @type {boolean}
     */
    this.isTop = false;

    /**
     * @type {string}
     */
    this.relative = "";

    /**
     * @type {boolean}
     */
    this.hasChildren = false;

    /**
     * @type {number}
     */
    this.countChildren = 0;

    /**
     * @type {DirTree[]}
     */
    this.children = [];

    /**
     * @type {boolean}
     */
    this.isAllowedSuffix = false;

    /**
     * @type {boolean}
     */
    this.isSaved = true;

    /**
     * @type {boolean}
     */
    this.isSelected = false;

    /**
     * @type {boolean}
     */
    this.isOpened = false;

    /**
     * @type {boolean}
     */
    this.isDetailsOpened = false;

    /**
     * @type {?DirTree}
     */
    this.parentTree = null;
  }

  /**
   *
   * @param {Object} json
   * @returns {DirTree}
   */
  static from(json) {
    const dirTree = new DirTree();
    Object.assign(dirTree, json);
    dirTree.children = dirTree.children.map(child => {
      child.parentTree = dirTree;
      return DirTree.from(child);
    });
    return dirTree;
  }

  /**
   * @returns {DirTree[]}
   */
  flat() {
    /**
     * @type{DirTree[]}
     */
    const items = [];

    /**
     *
     * @param {DirTree} tree
     * @param {DirTree[]} items
     */
    const innerFunc = (tree, items) => {
      items.push(tree);
      tree.children.forEach(child => {
        innerFunc(child, items);
      });
    };

    innerFunc(this, items);
    return items;
  }

  /**
   *
   * @param {DirTree} item
   */
  select(item) {
    const selected = this.selectedAll();
    if (selected.length === 1 && selected[0] === item) {
      return;
    }

    this.unselectAll();

    const items = this.flat();
    items.forEach(i => {
      if (i === item) {
        i.isSelected = true;
        return;
      }
    });
  }

  /**
   * @returns{DirTree[]}
   */
  selectedAll() {
    return this.flat().filter(item => item.isSelected);
  }

  /**
   * @returns{?DirTree}
   */
  selected() {
    const all = this.selectedAll();
    if (all.length === 0) {
      return null;
    }
    return all[0];
  }

  /**
   * @returns{DirTree[]}
   */
  unselectAll() {
    const selected = this.selectedAll();
    selected.forEach(item => (item.isSelected = false));
    return selected;
  }

  /**
   *
   * @param {DirTree} item
   */
  open(item) {
    // オーバーヘッドあり
    this.select(item);

    const opened = this.openedAll();
    if (opened.length === 1 && opened[0] === item) {
      return;
    }

    this.closeAll();

    const items = this.flat();
    items.forEach(i => {
      if (i === item) {
        i.isOpened = true;
        return;
      }
    });
  }

  /**
   *
   * @param {DirTree} item
   */
  delete(item) {
    const items = this.flat();
    items.forEach(i => {
      if (i === item) {
        if (i.parentTree) {
          const index = i.parentTree.children.indexOf(i);
          i.parentTree.children.splice(index);
        }
        return;
      }
    });
  }

  /**
   * @returns{DirTree[]}
   */
  openedAll() {
    return this.flat().filter(item => item.isOpened);
  }

  /**
   * @returns{?DirTree}
   */
  opened() {
    const all = this.openedAll();
    if (all.length === 0) {
      return null;
    }
    return all[0];
  }

  /**
   * @returns{DirTree[]}
   */
  closeAll() {
    const opened = this.openedAll();
    opened.forEach(item => (item.isOpened = false));
    return opened;
  }

  /**
   * @returns{boolean}
   */
  hasGhost() {
    const all = this.flat();
    const ghosts = all.filter(item => !item.exists);
    return ghosts.length > 0;
  }
}
