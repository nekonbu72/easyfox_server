//@ts-check
"use strict";

import { DirTree } from "./dirtree";

const DIRTREE_URL = "http://127.0.0.1:5000/dirtree";
const FILE_URL = "http://127.0.0.1:5000/file";
const EXE_URL = "http://127.0.0.1:5000/exe";
const WS_EXE_URL = "ws://127.0.0.1:5000/exews";

/**
 * @returns {Promise<DirTree>}
 */
export const getDirTree = async () => {
  const resp = await fetch(DIRTREE_URL, { mode: "cors" });
  const json = await resp.json();
  return DirTree.from(json);
};

/**
 *
 * @param {DirTree} file
 * @return {Promise<string>}
 */
export const getText = async file => {
  const resp = await fetch(`${FILE_URL}/${file.relative}`, {
    mode: "cors"
  });
  return await resp.text();
};

/**
 *
 * @param {DirTree} file
 * @param {string} text
 * @return {Promise<string>}
 */
export const overwrite = async (file, text) => {
  const resp = await fetch(`${FILE_URL}/${file.relative}`, {
    method: "PUT",
    mode: "cors",
    body: text,
    headers: {
      "Content-Type": "text/plain"
    }
  });
  return await resp.text();
};

/**
 *
 * @param {DirTree} file
 * @return {Promise<string>}
 */
export const delete_ = async file => {
  const resp = await fetch(`${FILE_URL}/${file.relative}`, {
    method: "DELETE",
    mode: "cors"
  });
  return await resp.text();
};

/**
 *
 * @param {string} script
 * @return {Promise<string>}
 */
export const postExe = async script => {
  const resp = await fetch(EXE_URL, {
    method: "POST",
    mode: "cors",
    body: script,
    headers: {
      "Content-Type": "text/plain"
    }
  });
  return await resp.text();
};

/**
 *
 * @param {string} script
 */
export const websocketExe = script => {
  const socket = new WebSocket(WS_EXE_URL);

  socket.addEventListener("open", _ => {
    socket.send(script);
  });

  socket.addEventListener("message", event => {
    console.log(event.data);
  });
};
