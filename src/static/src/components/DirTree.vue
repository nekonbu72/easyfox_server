<template>
  <ul>
    <li v-if="tree.isDir && tree.isAllowedSuffix">
      <details
        :class="{top:tree.isTop}"
        :open="tree.isDetailsOpened"
        @toggle="tree.isDetailsOpened = $event.target.open"
      >
        <summary @click.stop="select(tree)" tabindex="0">{{ tree.name }}</summary>
        <DirTree
          v-for="(child, index) in tree.children"
          @select="select"
          :key="index"
          :tree="child"
        />
      </details>
    </li>
    <li v-if="tree.isFile && tree.isAllowedSuffix" @click.stop="select(tree)" tabindex="0">
      <span v-show="!tree.isSaved">*</span>
      <span>{{tree.name}}</span>
    </li>
  </ul>
</template>

<script>
import { DirTree as Tree } from "../modules/dirtree";

export default {
  name: "DirTree",
  props: {
    /**
     * @type{Tree}
     */
    tree: Object
  },
  methods: {
    /**
     * @param{Tree}item
     */
    select(item) {
      this.$emit("select", item);
    }
  }
};
</script>

<style scoped>
summary {
  font-weight: bolder;
}

ul {
  list-style-type: none;
  padding-left: 10px;
}

li {
  white-space: nowrap;
}

li:focus,
summary:focus {
  background-color: lightcyan;
}
</style>
