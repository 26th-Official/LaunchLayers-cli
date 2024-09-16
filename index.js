#!/usr/bin/env node

import axios from "axios";
import AdmZip from "adm-zip";
import fs from "fs";
import path from "path";
import readline from "readline";

const serverUrl = "http://localhost:3001";

// Function to validate file ID format
const isValidFileId = (fileId) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(fileId);
};

// Function to download the zip file
const downloadZip = async (url, destination) => {
  try {    
    // Make a GET request to download the file using Axios
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'arraybuffer', // Ensures the data is treated as a binary buffer
    });

    // Save the downloaded file as a zip in the specified destination
    fs.writeFileSync(destination, response.data);
  } catch (error) {
    if (error.response && error.response.status === 404) {
        console.error('\n\x1b[31mError:\x1b[0m File not found. Please check the file ID and try again.\n');
        process.exit(1);
    } else{
        console.error(`\n\x1b[31mError:\x1b[0m Something went wrong! - \x1b[31m(${error.message})\x1b[0m\n`);
        process.exit(1);
    }
  }
};

// Function to unzip the file
const unzipFile = (zipPath, extractToDir) => {
  const zip = new AdmZip(zipPath);
  zip.extractAllTo(extractToDir, true);
};

// Function to prompt user for input
const promptUserInput = (question) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (input) => {
      rl.close();
      resolve(input);
    });
  });
};

// Main function
const main = async () => {
  try {
    const args = process.argv.slice(2);

    if (args.length === 0) {
      console.error('\n\x1b[31mError:\x1b[0m Please provide a file ID.\n');
      process.exit(1);
    }

    const fileId = args[0];

    // Validate file ID format
    if (!isValidFileId(fileId)) {
      console.error('\n\x1b[31mError:\x1b[0m Invalid file ID format. Expected format is a UUID, e.g., 1af45a65-6381-4ac4-ac9f-83d054e4e184\n');
      
      process.exit(1);
    }

    // Prompt for folder name
    const defaultFolderName = 'laulyr';
    const folderName = await promptUserInput(`\n\x1b[32mTemplate name:\x1b[0m (${defaultFolderName}) `);
    
    // Use default folder name if no input is provided
    const finalFolderName = folderName.trim() || defaultFolderName;
    const currentDir = process.cwd();
    const zipPath = path.join(currentDir, `${fileId}.zip`);
    const extractDir = path.join(currentDir, finalFolderName);

    // Download the zip file
    await downloadZip(`${serverUrl}/output/${fileId}.zip`, zipPath);

    // Create a directory for extraction
    if (!fs.existsSync(extractDir)) {
      fs.mkdirSync(extractDir);
    }

    // Unzip the file in the current directory
    unzipFile(zipPath, extractDir);

    // Optionally, delete the zip file after extraction
    fs.unlinkSync(zipPath);

    console.log("\n\x1b[32mDone:\x1b[0m Template downloaded and extracted successfully!\n");
    
  } catch (error) {
    console.error(`\n\x1b[31m\x1b[31mError:\x1b[0m\x1b[0m Something went wrong! - \x1b[31m(${error.message})\x1b[0m\n`);
    process.exit(1);
  }
};

main();
