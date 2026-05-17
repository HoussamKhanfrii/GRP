import fs from "fs";
import { Interaction } from "../types";

export class DataLoader {
  static loadFromJson(filePath: string): Interaction[] {
    const content = fs.readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(content) as Interaction[] | { interactions: Interaction[] };
    if (Array.isArray(parsed)) {
      return parsed.map(DataLoader.normalizeInteraction);
    }
    return parsed.interactions.map(DataLoader.normalizeInteraction);
  }

  static loadFromCsv(filePath: string): Interaction[] {
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);
    if (lines.length === 0) {
      return [];
    }
    const headers = DataLoader.parseCsvLine(lines[0]).map((h) => h.trim());
    const interactions: Interaction[] = [];
    for (let i = 1; i < lines.length; i += 1) {
      const values = DataLoader.parseCsvLine(lines[i]);
      const record: Record<string, string> = {};
      headers.forEach((header, idx) => {
        record[header] = values[idx] ?? "";
      });
      interactions.push(
        DataLoader.normalizeInteraction({
          userId: record.userId,
          itemId: record.itemId,
          weight: Number(record.weight),
          timestamp: Number(record.timestamp)
        })
      );
    }
    return interactions;
  }

  private static normalizeInteraction(input: Interaction): Interaction {
    return {
      userId: String(input.userId),
      itemId: String(input.itemId),
      weight: Number(input.weight),
      timestamp: Number(input.timestamp)
    };
  }

  private static parseCsvLine(line: string): string[] {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        values.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current);
    return values;
  }
}
