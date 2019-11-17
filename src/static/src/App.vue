<template>
  <div>
    <div class="header">
      <div class="header item flex">
        <input type="text" class="path" v-model="this.path" required readonly />
      </div>
      <div class="header item solid" v-show="isHeaderSolidShown">
        <input type="submit" class="btn reload" @click="loadDirTree" value="Reload" />
        <input type="submit" class="btn save" @click="save" :disabled="!isSaveEnabled" value="Save" />
        <input
          type="submit"
          class="btn new"
          @click="newUnsavedFile"
          :disabled="!isNewEnabled"
          value="new"
        />
        <input
          type="submit"
          class="btn delete"
          @click="delete_"
          :disabled="!isDeleteEnabled"
          value="Delete"
        />
        <input type="submit" class="btn rename" value="Rename" />
        <input
          type="submit"
          class="btn exe"
          @click="executeScript"
          :disabled="!isExeEnabled"
          value="Exe"
        />
        <label class="status">{{ status }}</label>
      </div>
    </div>
    <div class="body">
      <div class="body item solid" @dragover="handleDragOver" v-show="isBodySolidShown">
        <input type="submit" class="btn close" @click="closeAllDetails" value="-" />
        <DirTree class="tree" @select="select" :tree="tree" />
      </div>
      <div
        class="gutter"
        draggable="true"
        @dragstart="handleGutterDragStart"
        @dragend="handleGutterDragEnd"
        v-show="isBodySolidShown"
      ></div>
      <div class="body item flex" @dragover="handleDragOver">
        <div id="editor"></div>
      </div>
    </div>
  </div>
</template>

<script>
import DirTree from "./components/DirTree.vue";
import {
  getDirTree,
  getText,
  overwrite,
  delete_ as httpDelete,
  postExe
} from "./modules/http";
import { DirTree as Tree } from "./modules/dirtree";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";

export default {
  name: "app",
  components: {
    DirTree
  },
  data() {
    return {
      status: "Waiting...",

      /**
       * @type {Tree}
       */
      tree: {},

      /**
       * @type {monaco.editor.IStandaloneCodeEditor}
       */
      editor: {},

      /**
       * @type {string}
       */
      lastSavedText: "",

      isHeaderSolidShown: true,
      isBodySolidShown: true,

      /**
       * @type {HTMLDivElement}
       */
      bodySolid: {},

      beforeClientX: -1,
      afterClientX: -1
    };
  },
  computed: {
    minSolidWidth() {
      return 700;
    },

    path() {
      if (!this.tree.selected) {
        return "";
      }

      const selected = this.tree.selected();
      if (!selected) {
        console.log("selected is empty");
        return "";
      }

      return selected.fullPath;
    },

    isNewEnabled() {
      if (!this.tree.selected) {
        return false;
      }
      return this.tree.selected() !== null && !this.tree.hasGhost();
    },

    isSaveEnabled() {
      if (!this.tree.opened) {
        return false;
      }
      return this.tree.opened() !== null;
    },

    isDeleteEnabled() {
      return this.isSaveEnabled;
    },

    isExeEnabled() {
      if (!this.editor.getValue) {
        return false;
      }
      return this.editor.getValue().trim() !== "";
    }
  },
  mounted() {
    this.initHeaderSolidShown();
    this.initBodySolid();
    this.initBodySolidShown();
    this.initEditor();
    this.loadDirTree();
  },
  methods: {
    initHeaderSolidShown() {
      window.addEventListener("resize", () => {
        const header = this.$el.querySelector(".header");
        this.isHeaderSolidShown = header.clientWidth >= this.minSolidWidth;
      });
    },

    initBodySolid() {
      this.bodySolid = this.$el.querySelector(".body.item.solid");
    },

    initBodySolidShown() {
      window.addEventListener("resize", () => {
        const body = this.$el.querySelector(".body");
        const beforeIsBodySolidShown = this.isBodySolidShown;
        this.isBodySolidShown = body.clientWidth >= this.minSolidWidth;
        if (this.isBodySolidShown !== beforeIsBodySolidShown) {
          //
          this.editor.layout();
        }
      });
    },

    /**
     * @param {DragEvent} event
     */
    handleGutterDragStart(event) {
      // Firefox52 では setData しないと drag イベントが発生しない
      event.dataTransfer.setData("text/plain", "");
      this.beforeClientX = event.clientX;
    },

    handleGutterDragEnd() {
      const moveX = this.afterClientX - this.beforeClientX;
      const style = window.getComputedStyle(this.bodySolid);
      const widthPx = style.getPropertyValue("width");
      const width = parseFloat(widthPx);
      this.bodySolid.style.width = `${width + moveX}px`;
      this.beforeClientX = this.afterClientX;
      //
      this.editor.layout();
    },
    /**
     * @param {DragEvent} event
     */
    handleDragOver(event) {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      // dragend イベントでは clientX を取得できないため dragover で取得
      this.afterClientX = event.clientX;
    },

    initEditor() {
      this.editor = monaco.editor.create(document.getElementById("editor"), {
        language: "python",
        minimap: { enabled: false }
      });
      window.addEventListener("resize", () => {
        this.editor.layout();
      });
      this.editor.getModel().onDidChangeContent(() => {
        this.updateOpenedFileIsSaved();
      });
    },

    async loadDirTree() {
      const timerStart = new Date();
      this.status = "Loading...";

      this.tree = await getDirTree();
      this.close();
      this.tree.select(this.tree);
      this.tree.isDetailsOpened = true;

      const timerEnd = new Date();
      const timeGap = timerEnd.getTime() - timerStart.getTime();
      this.status = `Done(${timeGap / 1000}s).`;
    },

    closeAllDetails() {
      const tree = this.$el.querySelector(".tree");
      tree
        .querySelectorAll("details")
        .forEach(details => (details.open = false));
    },

    /**
     * @param{Tree}item
     */
    select(item) {
      if (item.isFile) {
        this.selectFile(item);
        return;
      }
      this.tree.select(item);
    },

    /**
     * @param{Tree}file
     */
    selectFile(file) {
      const opened = this.tree.opened();
      if (opened) {
        if (opened === file) {
          console.log("already opened file");
          return;
        }
        if (!opened.isSaved) {
          if (
            !confirm(
              `Are you sure to discard unsaved changes on [${opened.name}]?`
            )
          ) {
            console.log("open canceled");
            return;
          }
        }
        if (!opened.exists) {
          this.tree.delete(opened);
        }
      }

      this.tree.open(file);
      if (!file.exists) {
        console.log("ghost: ", file.name);
        return;
      }
      this.open(file);
    },

    /**
     * @param{Tree}newfile
     */
    async open(newFile) {
      const text = await getText(newFile);
      this.lastSavedText = text;

      // updateOpenedFileIsSaved が発火
      this.editor.setValue(text);
    },

    /**
     * open せずに閉じるだけの時に使う
     */
    close() {
      this.tree.unselectAll();
      this.tree.closeAll();
      this.lastSavedText = "";
      this.editor.setValue("");
    },

    updateOpenedFileIsSaved() {
      const opened = this.tree.opened();
      if (opened) {
        const currentText = this.editor.getValue();
        opened.isSaved = currentText === this.lastSavedText;
      }
    },

    /**
     * @param{string}name
     */
    newUnsavedFile() {
      const selected = this.tree.selected();
      const tgtDir = selected.isDir ? selected : selected.parentTree;

      const ghost = new Tree();
      ghost.isSaved = false;
      ghost.isAllowedSuffix = true;
      ghost.isFile = true;
      ghost.name = "untitled";
      ghost.fullPath = `${tgtDir.fullPath}\\${ghost.name}`;
      ghost.top = tgtDir.top;
      ghost.parentTree = tgtDir;
      ghost.relative = ghost.fullPath.replace(ghost.top, "").slice(1);

      tgtDir.children.push(ghost);
      tgtDir.isDetailsOpened = true;
      this.select(ghost);
    },

    async save() {
      const tgtFile = this.tree.opened();
      const orgRelative = tgtFile.relative;
      if (!tgtFile.exists) {
        const name = prompt("Name?", tgtFile.name);
        const re = new RegExp(`${tgtFile.name}$`);
        tgtFile.relative = tgtFile.relative.replace(re, name);
      }

      const newText = this.editor.getValue();
      const resp = await overwrite(tgtFile, newText);
      if (newText.length.toString() === resp) {
        await this.loadDirTree();
        await this.open(tgtFile);
      } else {
        alert("save failed");
        tgtFile.relative = orgRelative;
      }
    },

    async delete_() {
      const tgtFile = this.tree.opened();

      if (tgtFile.exists) {
        const resp = await httpDelete(tgtFile);
        if (resp !== "ok") {
          alert("delete failed");
          return;
        }
      }

      this.tree.delete(tgtFile);
      // 一瞬 path = "" になる this.tree.selected() === null のため
      this.loadDirTree();
    },

    async executeScript() {
      const script = this.editor.getValue();
      const result = await postExe(script);
      console.log(result);
    }
  }
};
</script>

<style scoped>
.header {
  display: flex;
  height: 34px;
}

.header.item.flex {
  flex: 1;
  white-space: nowrap;
}

.header.item.flex .path {
  width: 100%;
  padding: 0;
  box-sizing: border-box;
}

.header.item.solid {
  display: flex;
  width: fit-content;
}

.header.item.solid * {
  flex: 0 1 auto;
  margin: 0 1vh;
  padding: 0 2vh;
}

.body {
  display: flex;
  height: 85vh;
  margin-top: 2vh;
}

.body.item {
  white-space: nowrap;
  margin: 0;
}

.body.item.solid {
  width: 50vh;
  overflow-y: scroll;
  overflow-x: hidden;
  display: block;
}

.btn.close {
  height: 34px;
  width: 34px;
}

.body .gutter {
  width: 5px;
  background-color: #ccc;
  cursor: ew-resize;
}

.body.item.flex {
  flex: 1;
  overflow-x: scroll;
}

#editor {
  width: calc(100% - 2px);
  border: 1px solid #ccc;
}
</style>
