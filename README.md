# JSON Schema Flow

Visual JSON to JSON Schema converter with real-time tree preview.

## Features

- **Instant Conversion** - Real-time JSON to JSON Schema conversion
- **Visual Tree** - See your schema structure as an interactive tree
- **Multiple Versions** - Support for draft-04, draft-07, 2019-09, and 2020-12
- **TypeScript Export** - One-click generate TypeScript interfaces
- **Zero Dependencies** - Pure vanilla JavaScript, no build step
- **Privacy First** - Everything runs in your browser, no data sent to servers

## Usage

1. Paste your JSON into the input panel
2. See the schema generate instantly
3. Copy the schema or TypeScript interface with one click

## Schema Versions Supported

- JSON Schema 2020-12 (latest)
- JSON Schema 2019-09
- JSON Schema Draft-07
- JSON Schema Draft-04

## Example

**Input:**
```json
{
  "name": "John",
  "age": 30,
  "active": true
}
```

**Output:**
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "name": { "type": "string", "example": "John" },
    "age": { "type": "integer", "example": 30 },
    "active": { "type": "boolean", "example": true }
  },
  "required": ["name", "age", "active"]
}
```

## License

MIT
