import fs from "node:fs";

const destinationCsvPath = process.argv[2] || "big.csv";
const requestedSizeMb = Number(process.argv[3]) || 50;

const targetBytes = requestedSizeMb * 1024 * 1024;

const csvStream = fs.createWriteStream(destinationCsvPath);

csvStream.write("id,name,email\n");

let nextRowId = 1;

function writeRows() {
  let canWriteMore = true;

  while (canWriteMore && csvStream.bytesWritten < targetBytes) {
    const rowText = `${nextRowId},User${nextRowId},user${nextRowId}@gmail.com\n`;

    canWriteMore = csvStream.write(rowText);

    nextRowId++;
  }


  if (!canWriteMore) {
    csvStream.once("drain", writeRows);
  } else {
    csvStream.end();
  }
}

csvStream.on("finish", () => {
  console.log(`CSV created: ${destinationCsvPath}`);
  console.log(`Rows: ${nextRowId - 1}`);
});

csvStream.on("error", (error) => {
  console.error("Error:", error);
});

writeRows();