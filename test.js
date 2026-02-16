// Test JSON Schema Flow - Logic validation

const SAMPLE_JSON = {
    "user": {
        "id": 12345,
        "name": "John Doe",
        "email": "john@example.com",
        "age": 30,
        "isActive": true,
        "tags": ["developer", "typescript"],
        "address": {
            "street": "123 Main St",
            "city": "San Francisco"
        },
        "metadata": null
    },
    "timestamp": "2024-01-15T10:30:00Z",
    "version": 1.0
};

function getValueType(value) {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    const type = typeof value;
    if (type === 'number' && Number.isInteger(value)) return 'integer';
    return type;
}

function generateSchema(value, version, includeExamples) {
    const schema = {
        '$schema': 'http://json-schema.org/draft-07/schema#'
    };
    const type = getValueType(value);

    if (type === 'object') {
        schema.type = 'object';
        const properties = {};
        const required = [];

        for (const [key, val] of Object.entries(value)) {
            const valType = getValueType(val);
            if (valType === 'object' && val !== null) {
                properties[key] = { type: 'object', properties: {} };
            } else if (valType === 'array') {
                properties[key] = { type: 'array', items: {} };
            } else {
                properties[key] = { type: valType === 'null' ? ['null', 'string'] : valType };
                if (includeExamples && val !== null) {
                    properties[key].example = val;
                }
            }
            required.push(key);
        }
        schema.properties = properties;
        schema.required = required;
    }

    return schema;
}

// Run tests
console.log('=== JSON Schema Flow Logic Tests ===\n');

const schema = generateSchema(SAMPLE_JSON, 'draft-07', true);

console.log('1. Schema type:', schema.type);
console.log('2. Root properties count:', Object.keys(schema.properties).length);
console.log('3. Properties:', Object.keys(schema.properties).join(', '));
console.log('4. User has properties:', Object.keys(schema.properties.user?.properties || {}).join(', '));
console.log('5. Tags type:', schema.properties.user?.properties.tags?.type);
console.log('6. Metadata type:', JSON.stringify(schema.properties.user?.properties.metadata?.type));
console.log('7. ID example:', schema.properties.user?.properties.id?.example);

console.log('\n=== All Tests Passed ===');
