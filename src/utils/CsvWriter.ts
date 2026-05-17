import fs from "fs";
import path from "path";

export class CsvWriter {
  static writeCsv(filePath: string, headers: string[], rows: Array<Array<string | number>>): void {
    const dir = path.dirname(filePath);
    fs.mkdirSync(dir, { recursive: true });

    const headerLine = headers.join(",");
    const bodyLines = rows.map((row) => row.map(CsvWriter.escape).join(","));
    const content = [headerLine, ...bodyLines].join("\n") + "\n";
    fs.writeFileSync(filePath, content, "utf-8");
  }

  private static escape(value: string | number): string {
    const raw = String(value);
    if (raw.includes(",") || raw.includes("\"") || raw.includes("\n")) {
      return `"${raw.replace(/\"/g, '""')}"`;
    }
    return raw;
  }
}
