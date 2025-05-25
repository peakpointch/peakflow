import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VALID_REGIONS = [
  'Africa',
  'America',
  'Antarctica',
  'Arctic',
  'Asia',
  'Atlantic',
  'Australia',
  'Europe',
  'Indian',
  'Pacific'
];

// Adjust the path to where the JSON is located inside node_modules
const tzJsonPath = path.resolve(__dirname, '../node_modules/iana-tz-data/iana-tz-data.json');

const rawData = fs.readFileSync(tzJsonPath, 'utf-8');
const tzData = JSON.parse(rawData);

const timezones = [];

for (const region of VALID_REGIONS) {
  const cities = tzData.zoneData[region];
  if (!cities) continue;

  for (const city of Object.keys(cities)) {
    timezones.push(`${region}/${city}`);
  }
}

timezones.sort();

// Write timezones.json
const outputJsonPath = path.resolve(__dirname, '../src/timezones/timezones.json');
fs.writeFileSync(outputJsonPath, JSON.stringify(timezones, null, 2));

// Generate TypeScript union type file
const unionTypeStr = timezones
  .map(tz => `  | "${tz}"`)
  .join('\n')
  .slice(4); // Remove leading " | "

const dtsContent = `// THIS FILE IS AUTO-GENERATED — DO NOT EDIT BY HAND
// Generated from iana-tz-data

export type IANATimeZone =
  \`\${string}/\${string}\`
  & (${unionTypeStr});
`;

const outputDtsPath = path.resolve(__dirname, '../src/timezones/timezones.ts');
fs.writeFileSync(outputDtsPath, dtsContent);

console.log(`✅ Extracted ${timezones.length} timezones.`);
console.log(`✅ Wrote JSON to ${outputJsonPath}`);
console.log(`✅ Wrote TS union type to ${outputDtsPath}`);
