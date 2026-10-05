import fs from "node:fs";
import { Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { StringDecoder } from "node:string_decoder";

const sourceCsvPath = "big.csv";
const destinationJsonPath = "output.json";


const start = Date.now();

let highestRss = process.memoryUsage().rss;

const monitor = setInterval(() => {
  const rss = process.memoryUsage().rss;

  highestRss = Math.max(highestRss, rss);

  console.log(
    `Current RSS: ${(rss / 1024 / 1024).toFixed(2)} MB`
  );
}, 1000);



class CsvLineSplitter extends Transform {
  constructor() {
    super({
      readableObjectMode: true
    });

    this.tail = "";

    // Safely handle UTF-8 characters split between chunks
    this.decoder = new StringDecoder("utf8");
  }

  _transform(chunk, encoding, callback) {
    const text = this.tail + this.decoder.write(chunk);

    const lines = text.split(/\r?\n/);

    // Last part may be an incomplete line
    this.tail = lines.pop();

    for (const line of lines) {
      if (line) {
        this.push(line);
      }
    }

    callback();
  }

  _flush(callback) {
    const rest = this.tail + this.decoder.end();

    if (rest) {
      this.push(rest);
    }

    callback();
  }
}


class CsvRowsToJson extends Transform {
  constructor() {
    super({
      writableObjectMode: true
    });

    this.headers = null;
    this.count = 0;
  }

  _transform(line, encoding, callback) {
    // First line = CSV headers
    if (!this.headers) {
      this.headers = line.split(",");
      callback();
      return;
    }

   
    const fields = line.split(",");

    const row = Object.fromEntries(
      this.headers.map((header, index) => [
        header,
        fields[index] ?? null
      ])
    );

    const separator = this.count === 0 ? "[\n" : ",\n";

    this.push(
      separator + JSON.stringify(row)
    );

    this.count++;

    callback();
  }

  _flush(callback) {
    if (this.count === 0) {
      this.push("[]\n");
    } else {
      this.push("\n]\n");
    }

    callback();
  }
}



try {
  await pipeline(
    fs.createReadStream(sourceCsvPath, {
      highWaterMark: 64 * 1024
    }),

    new CsvLineSplitter(),

    new CsvRowsToJson(),

    fs.createWriteStream(destinationJsonPath)
  );

  clearInterval(monitor);

  const finalRSS = process.memoryUsage().rss;

  console.log("\nCSV converted successfully!");

  console.log(
    "Peak RSS:",
    (highestRss / 1024 / 1024).toFixed(2),
    "MB"
  );

  console.log(
    "Final RSS:",
    (finalRSS / 1024 / 1024).toFixed(2),
    "MB"
  );

  console.log(
    "Execution time:",
    ((Date.now() - start) / 1000).toFixed(2),
    "seconds"
  );

} catch (error) {
  clearInterval(monitor);

  console.error("Pipeline failed:", error);

  process.exitCode = 1;
}