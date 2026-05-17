import { PGlite } from "@electric-sql/pglite";
import sqlInit from "./sqlInit"

import { live } from "@electric-sql/pglite/live"
import { PGliteProvider } from "@electric-sql/pglite-react"
import UnitCompositions from "./Counter";
import Economy from "./Economy";

import { loadFile } from "./loadFile";
import { getDirectoryFiles } from "./getDirectoryFiles";
import { useState } from "react";
import { BigPicture } from "./BigPicture";
import Main from "./mui";


console.log("Starting DB")
const db = await PGlite.create({
  extensions: { live }
})
await db.exec(sqlInit)

console.log("Opening directory");
const loadedFiles = await getDirectoryFiles()
loadedFiles.sort((a, b) => b.lastModified - a.lastModified)
console.log(loadedFiles)

console.log("Loading replay file");
//const file = await fetch("/replay.SC2Replay")
for (let i = 0; i < loadedFiles.length && i < 20; i++) {
  const file = loadedFiles[i];
  //console.log(file)
  await loadFile(db, file)
}


console.log("gogogo");
export default function App() {
  /*const [files, setFiles] = useState(loadedFiles);
  
  if (!files) {
    return <button onClick={async () => {
        const files = await getDirectoryFiles()
        setFiles(files)
      }}>
      Select directory
      </button>
  }*/

  return (
    <PGliteProvider db={db}>
      {/*<Economy/>*/}
      {/*<UnitCompositions />*/}
      {/*<BigPicture/>*/}
      <Main/>
    </PGliteProvider>)

}