/*
 * Project: Milestone 1
 * File Name: main.js
 * Description: BCITstragram Lab
 *
 * Created Date: 2024-02-19
 * Author: Richard Yuan
 *
 */

/*
await IOhandler.unzip(zipFilePath, pathUnzipped);
await IOhandler.readDir()
await IOhandler.grayScale(imgs)
*/

/*
Available Filters:
dithering
grayScale
inverted
lark
sepia

Enter the name of the desired filter: <insert>

>> All files processed
*/

import * as io from "./IOhandler.js";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
const __dirname = dirname(fileURLToPath(import.meta.url));
const zipFilePath = path.join(__dirname, "myfile.zip");
const pathUnzipped = path.join(__dirname, "unzipped");
const pathProcessed = path.join(__dirname, "grayscaled");
const pathSepia = path.join(__dirname, "sepia");
let userPick = "";

io.menuShow();
io.userPrompt()
  .then((data) => (userPick = data))
  .then(() => io.stopPrompt())
  .then(() => io.unzip(zipFilePath, pathUnzipped))
  .then(() => {
    if (
      userPick.toLowerCase() === "1" ||
      userPick.toLowerCase() === "readdir"
    ) {
      io.readDir(pathUnzipped).then((data) => console.log(data));
    } else if (
      userPick.toLowerCase() === "2" ||
      userPick.toLowerCase() === "grayscale"
    ) {
      io.convertGrayScale(pathUnzipped, pathProcessed);
    } else if (
      userPick.toLowerCase() === "3" ||
      userPick.toLowerCase() === "sepia"
    ) {
      io.convertSepia(pathUnzipped, pathSepia);
    } else {
      console.log("That was not a valid option.");
    }
  })
  .catch((err) => console.log("Error occurred: ", err));
