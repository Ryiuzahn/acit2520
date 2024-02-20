/*
 * Project: Milestone 1
 * File Name: IOhandler.js
 * Description: Collection of functions for files input/output related operations
 *
 * Created Date: 2024-02-19
 * Author: Richard Yuan
 *
 */

/**
 * Description: decompress file from given pathIn, write to given pathOut
 *
 * @param {string} pathIn
 * @param {string} pathOut
 * @return {promise}
 */
// const unzip = (pathIn, pathOut) => {};

/**
 * Description: read all the png files from given directory and return Promise containing array of each png file path
 *
 * @param {string} path
 * @return {promise}
 */
// const readDir = (dir) => {};

/**
 * Description: Read in png file by given pathIn,
 * convert to grayscale and write to given pathOut
 *
 * @param {string} filePath
 * @param {string} pathProcessed
 * @return {promise}
 */
// const grayScale = (pathIn, pathOut) => {};

// module.exports = {
//   unzip,
//   readDir,
//   grayScale,
// };

import yauzl from "yauzl-promise";
import path from "path";
import { createReadStream, createWriteStream } from "fs";
import { mkdir, readFile, readdir } from "fs/promises";
import { pipeline } from "stream/promises";
import { PNG } from "pngjs";
import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

export const unzip = async (pathIn, pathOut) => {
  try {
    await readFile(pathOut, "utf-8");
  } catch (err) {
    console.log("No directory exists for unzipped. Creating directory...");
    await mkdir(pathOut, { recursive: true });
  }
  const zip = await yauzl.open(pathIn);
  try {
    for await (const entry of zip) {
      if (entry.filename.endsWith("/")) {
        await mkdir(path.join(pathOut, `${entry.filename}`), {
          recursive: true,
        });
      } else {
        const readStream = await entry.openReadStream();
        const writeStream = createWriteStream(
          path.join(pathOut, `${entry.filename}`)
        );
        await pipeline(readStream, writeStream);
      }
    }
  } finally {
    await zip.close();
    console.log("Extraction operation complete.");
  }
};

export const readDir = (pathName) => {
  return new Promise((resolve, reject) => {
    readdir(pathName)
      .then((files) => {
        const getPng = files.filter(
          (file) => path.extname(file).toLowerCase() === ".png"
        );
        const fileArr = getPng.map((item) => path.join(pathName, item));
        resolve(fileArr);
      })
      .catch((err) => reject(err));
  });
};

const createDir = async (pathOut) => {
  await mkdir(pathOut, { recursive: true });
};

const getDir = async (pathOut) => {
  try {
    await readdir(pathOut);
  } catch (err) {
    if (err.code === "ENOENT") {
      console.log("No directory for conversion. Creating...");
      await createDir(pathOut);
      console.log("Folder created.");
    }
  }
};

const checkDir = async function (pathOut) {
  try {
    await getDir(pathOut);
  } catch (err) {
    console.log("Error checking directory:", err);
  }
};

export const menuShow = () => {
  console.log(`
        Please choose from the available options below:
        1) readDir
        2) grayScale
        3) sepia
    `);
};

const userInput = (question) =>
  new Promise((resolve) => {
    rl.question(question, resolve);
  });

export const userPrompt = async () => {
  try {
    let userPick = "";
    let valid_pick = false;
    const valid_text = ["readdir", "grayscale", "sepia", "1", "2", "3"];
    while (!valid_pick) {
      const filter = await userInput(
        "Enter the number of the desired function: "
      );
      if (valid_text.includes(filter.toLowerCase())) {
        valid_pick = true;
        userPick = filter;
      } else {
        console.log("Invalid input.");
      }
    }
    console.log(`Option ${userPick} has been selected.`);
    return userPick;
  } catch (err) {
    console.log("Error prompt: ", err);
  }
};

export const stopPrompt = () => {
  rl.close();
};

const filterGrayScale = (pathIn, pathOut) => {
  return new Promise((resolve, reject) => {
    const readStream = createReadStream(pathIn);
    const writeStream = createWriteStream(pathOut);
    const png = new PNG();
    readStream.pipe(png).on("parsed", function () {
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          const idx = (this.width * y + x) << 2;
          let edgeColour = 0;
          if (this.data[idx] > 127) {
            edgeColour = 255;
          } else {
            edgeColour = 0;
          }
          const error = this.data[idx] - edgeColour;
          if (x < this.width - 1) {
            this.data[idx + 4] += Math.round((error * 7) / 16);
          }
          if (x > 0 && y < this.height - 1) {
            this.data[idx - this.width * 4 - 4] += Math.round((error * 3) / 16);
          }
          if (y < this.height - 1) {
            this.data[idx + this.width * 4] += Math.round((error * 5) / 16);
          }
          if (x < this.width - 1 && y < this.height - 1) {
            this.data[idx + this.width * 4 + 4] += Math.round((error * 1) / 16);
          }
          this.data[idx] = edgeColour;
          this.data[idx + 1] = edgeColour;
          this.data[idx + 2] = edgeColour;
        }
      }
      this.pack()
        .pipe(writeStream)
        .on("finish", () => {
          console.log(`Image processing completed for ${pathIn}`);
          resolve();
        })
        .on("error", (err) => {
          reject(err);
        });
    });
  });
};

export const convertGrayScale = async (pathIn, pathOut) => {
  try {
    await checkDir(pathOut);
    let files = [];
    await readdir(pathIn)
      .then((data) => {
        files = data;
      })
      .catch((err) => console.log(err));
    for (const file of files) {
      if (path.extname(file).toLowerCase() === ".png") {
        const inputPath = path.join(pathIn, file);
        const outputPath = path.join(pathOut, file);
        await filterGrayScale(inputPath, outputPath);
      }
    }
    console.log("All files processed.");
  } catch (err) {
    console.log("Error processing PNG files:", err);
  }
};

const filterSepia = (pathIn, pathOut) => {
  return new Promise((resolve, reject) => {
    const readStream = createReadStream(pathIn);
    const writeStream = createWriteStream(pathOut);
    const png = new PNG();
    readStream.pipe(png).on("parsed", function () {
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          const idx = (this.width * y + x) << 2;
          const R = this.data[idx];
          const G = this.data[idx + 1];
          const B = this.data[idx + 2];
          const sepiaR = Math.min(
            255,
            Math.round(R * 0.393 + G * 0.769 + B * 0.189)
          );
          const sepiaG = Math.min(
            255,
            Math.round(R * 0.349 + G * 0.686 + B * 0.168)
          );
          const sepiaB = Math.min(
            255,
            Math.round(R * 0.272 + G * 0.534 + B * 0.131)
          );
          this.data[idx] = sepiaR;
          this.data[idx + 1] = sepiaG;
          this.data[idx + 2] = sepiaB;
        }
      }
      this.pack()
        .pipe(writeStream)
        .on("finish", () => {
          console.log(`Image processing completed for ${pathIn}`);
          resolve();
        })
        .on("error", (err) => {
          reject(err);
        });
    });
  });
};

export const convertSepia = async (pathIn, pathOut) => {
  try {
    await checkDir(pathOut);
    let files = [];
    await readdir(pathIn)
      .then((data) => {
        files = data;
      })
      .catch((err) => console.log(err));
    for (const file of files) {
      if (path.extname(file).toLowerCase() === ".png") {
        const inputPath = path.join(pathIn, file);
        const outputPath = path.join(pathOut, file);
        await filterSepia(inputPath, outputPath);
      }
    }
    console.log("All files processed.");
  } catch (err) {
    console.log("Error processing PNG files:", err);
  }
};
