// JSON Schema Flow - Main Application
// Converts JSON to JSON Schema with visual tree representation

const TYPE_MAPPING = {
    'string': 'string',
    'number': 'number',
    'integer': 'integer',
    'boolean': 'boolean',
    'null': 'null',
    'array': 'array',
    'object': 'object'
};

// Sample JSON for testing
const SAMPLE_JSON = {
    "user": {
        "id": 12345,
        "name": "John Doe",
        "email": "john@example.com",
        "age": 30,
        "isActive": true,
        "tags": ["developer", "typescript", "ai"],
        "address": {
            "street": "123 Main St",
            "city": "San Francisco",
            "zipCode": "94102",
            "country": "USA"
        },
        "metadata": null
    },
    "timestamp": "2024-01-15T10:30:00Z",
    "version": 1.0
};

// Schema version configurations
const SCHEMA_VERSIONS = {
    '2020-12': 'https://json-schema.org/draft/2020-12/schema',
    '2019-09': 'http://json-schema.org/draft-07/schema',
    'draft-07': 'http://json-schema.org/draft-07/schema#',
    'draft-04': 'http://json-schema.org/draft-04/schema#'
};

// Main conversion function
function convertJson() {
    const input = document.getElementById('jsonInput').value.trim();
    const errorDiv = document.getElementById('errorMsg');
    const treeView = document.getElementById('treeView');
    const schemaOutput = document.getElementById('schemaOutput');

    if (!input) {
        treeView.innerHTML = '<div class="text-gray-400 text-sm text-center py-8">Paste JSON to see the schema structure</div>';
        schemaOutput.textContent = '{}';
        errorDiv.classList.add('hidden');
        return;
    }

    try {
        const json = JSON.parse(input);
        errorDiv.classList.add('hidden');

        const version = document.getElementById('schemaVersion').value;
        const includeRefs = document.getElementById('includeRefs').checked;
        const includeExamples = document.getElementById('includeExamples').checked;

        // Generate schema
        const schema = generateSchema(json, version, includeExamples);
        schemaOutput.textContent = JSON.stringify(schema, null, 2);

        // Generate tree view
        treeView.innerHTML = generateTreeView(json);

    } catch (e) {
        errorDiv.textContent = 'Invalid JSON: ' + e.message;
        errorDiv.classList.remove('hidden');
        treeView.innerHTML = '<div class="text-red-400 text-sm text-center py-8">Invalid JSON</div>';
        schemaOutput.textContent = '{}';
    }
}

// Generate JSON Schema from value
function generateSchema(value, version, includeExamples, path = '#') {
    const schema = {
        '$schema': SCHEMA_VERSIONS[version]
    };

    const type = getValueType(value);

    switch (type) {
        case 'object':
            schema.type = 'object';
            const properties = {};
            const required = [];

            for (const [key, val] of Object.entries(value)) {
                const valType = getValueType(val);

                if (valType === 'object' && val !== null) {
                    properties[key] = generateSchemaForObject(val, version, includeExamples, `${path}/properties/${key}`);
                } else if (valType === 'array') {
                    properties[key] = generateSchemaForArray(val, version, includeExamples, `${path}/properties/${key}`);
                } else {
                    properties[key] = {
                        type: valType === 'null' ? ['null', TYPE_MAPPING[getValueType(Object(val))] || 'string'] : TYPE_MAPPING[valType]
                    };
                    if (val !== null && includeExamples) {
                        properties[key].example = val;
                    }
                }

                required.push(key);
            }

            schema.properties = properties;
            if (required.length > 0) {
                schema.required = required;
            }
            break;

        case 'array':
            schema.type = 'array';
            if (value.length > 0) {
                const firstItem = value[0];
                const itemType = getValueType(firstItem);

                if (itemType === 'object') {
                    schema.items = generateSchemaForObject(firstItem, version, includeExamples, `${path}/items`);
                } else if (itemType === 'array') {
                    schema.items = generateSchemaForArray(firstItem, version, includeExamples, `${path}/items`);
                } else {
                    schema.items = { type: TYPE_MAPPING[itemType] };
                    if (includeExamples) {
                        schema.items.example = firstItem;
                    }
                }
            } else {
                schema.items = {};
            }
            break;

        default:
            schema.type = TYPE_MAPPING[type] || 'string';
            if (includeExamples && value !== null) {
                schema.example = value;
            }
    }

    return schema;
}

// Generate schema for object (without root $schema)
function generateSchemaForObject(obj, version, includeExamples, path) {
    const schema = { type: 'object' };
    const properties = {};
    const required = [];

    for (const [key, val] of Object.entries(obj)) {
        const valType = getValueType(val);

        if (valType === 'object' && val !== null) {
            properties[key] = generateSchemaForObject(val, version, includeExamples, `${path}/properties/${key}`);
        } else if (valType === 'array') {
            properties[key] = generateSchemaForArray(val, version, includeExamples, `${path}/properties/${key}`);
        } else {
            const type = TYPE_MAPPING[valType] || 'string';
            properties[key] = valType === 'null'
                ? { type: ['null', 'string'] }
                : { type };

            if (val !== null && includeExamples) {
                properties[key].example = val;
            }
        }
        required.push(key);
    }

    schema.properties = properties;
    if (required.length > 0) {
        schema.required = required;
    }

    return schema;
}

// Generate schema for array
function generateSchemaForArray(arr, version, includeExamples, path) {
    const schema = { type: 'array' };

    if (arr.length > 0) {
        const firstItem = arr[0];
        const itemType = getValueType(firstItem);

        if (itemType === 'object' && firstItem !== null) {
            schema.items = generateSchemaForObject(firstItem, version, includeExamples, `${path}/items`);
        } else if (itemType === 'array') {
            schema.items = generateSchemaForArray(firstItem, version, includeExamples, `${path}/items`);
        } else {
            schema.items = { type: TYPE_MAPPING[itemType] || 'string' };
            if (firstItem !== null && includeExamples) {
                schema.items.example = firstItem;
            }
        }
    } else {
        schema.items = {};
    }

    return schema;
}

// Get the type of a value
function getValueType(value) {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    const type = typeof value;
    if (type === 'number' && Number.isInteger(value)) return 'integer';
    return type;
}

// Generate visual tree view
function generateTreeView(obj, depth = 0) {
    const type = getValueType(obj);
    const indent = depth * 16;

    const typeColors = {
        'string': 'bg-green-100 text-green-700',
        'number': 'bg-blue-100 text-blue-700',
        'integer': 'bg-cyan-100 text-cyan-700',
        'boolean': 'bg-purple-100 text-purple-700',
        'null': 'bg-gray-100 text-gray-700',
        'array': 'bg-orange-100 text-orange-700',
        'object': 'bg-yellow-100 text-yellow-700'
    };

    const typeIcons = {
        'string': 'abc',
        'number': '#',
        'integer': '123',
        'boolean': '!',
        'null': 'ø',
        'array': '[]',
        'object': '{}'
    };

    let html = '';

    if (type === 'object' && obj !== null) {
        const keys = Object.keys(obj);
        html += `<div class="fade-in">`;
        html += `<div class="flex items-center gap-2 py-1 px-2 rounded tree-item" style="margin-left: ${indent}px">`;
        html += `<span class="text-xs font-mono w-12 h-5 flex items-center justify-center rounded ${typeColors.object}">${typeIcons.object}</span>`;
        html += `<span class="text-sm font-medium text-gray-700">object</span>`;
        html += `<span class="text-xs text-gray-400">${keys.length} properties</span>`;
        html += `</div>`;

        for (const [key, val] of Object.entries(obj)) {
            const valType = getValueType(val);
            const preview = valType === 'object' || valType === 'array'
                ? ''
                : ` = <span class="text-gray-500">${JSON.stringify(val).substring(0, 30)}</span>`;

            html += `<div class="tree-line py-0">`;
            html += `<div class="flex items-center gap-2 py-1 px-2 rounded tree-item" style="margin-left: ${indent + 16}px">`;
            html += `<span class="text-xs font-mono w-12 h-5 flex items-center justify-center rounded ${typeColors[valType]}">${typeIcons[valType]}</span>`;
            html += `<span class="text-sm text-blue-600 font-mono">${key}</span>`;
            html += `<span class="text-xs text-gray-400">: ${valType}</span>${preview}`;
            html += `</div>`;

            if (valType === 'object' && val !== null) {
                html += generateTreeView(val, depth + 2);
            } else if (valType === 'array' && val.length > 0) {
                html += `<div class="tree-line py-0">`;
                html += `<div class="flex items-center gap-2 py-1 px-2 rounded tree-item" style="margin-left: ${indent + 32}px">`;
                html += `<span class="text-xs text-gray-400">Array items (${val.length})</span>`;
                html += `</div>`;
                html += generateTreeView(val[0], depth + 3);
                html += `</div>`;
            }
            html += `</div>`;
        }
        html += `</div>`;

    } else if (type === 'array') {
        html += `<div class="fade-in">`;
        html += `<div class="flex items-center gap-2 py-1 px-2 rounded tree-item" style="margin-left: ${indent}px">`;
        html += `<span class="text-xs font-mono w-12 h-5 flex items-center justify-center rounded ${typeColors.array}">${typeIcons.array}</span>`;
        html += `<span class="text-sm font-medium text-gray-700">array</span>`;
        html += `<span class="text-xs text-gray-400">${obj.length} items</span>`;
        html += `</div>`;

        if (obj.length > 0) {
            html += generateTreeView(obj[0], depth + 1);
        }
        html += `</div>`;

    } else {
        html += `<div class="fade-in flex items-center gap-2 py-1 px-2 rounded tree-item" style="margin-left: ${indent}px">`;
        html += `<span class="text-xs font-mono w-12 h-5 flex items-center justify-center rounded ${typeColors[type]}">${typeIcons[type]}</span>`;
        html += `<span class="text-sm text-gray-700">${type}</span>`;
        html += `</div>`;
    }

    return html;
}

// Generate TypeScript interface
function generateTypeScript() {
    const input = document.getElementById('jsonInput').value.trim();
    if (!input) return '';

    try {
        const json = JSON.parse(input);
        const ts = generateTSInterface(json, 'RootObject');
        return ts;
    } catch (e) {
        return '// Invalid JSON';
    }
}

function generateTSInterface(value, name, depth = 0) {
    const type = getValueType(value);
    const indent = '  '.repeat(depth);

    if (type === 'object' && value !== null) {
        let result = `${indent}interface ${name} {\n`;
        for (const [key, val] of Object.entries(value)) {
            const valType = getValueType(val);
            const fieldName = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `"${key}"`;
            const optional = val === null || (valType === 'array' && val.length === 0) ? '?' : '';

            if (valType === 'object' && val !== null) {
                const typeName = capitalize(key);
                result += `${indent}  ${fieldName}${optional}: ${typeName};\n`;
            } else if (valType === 'array') {
                if (val.length > 0) {
                    const itemType = getValueType(val[0]);
                    if (itemType === 'object') {
                        const typeName = capitalize(key.slice(0, -1)); // singular
                        result += `${indent}  ${fieldName}${optional}: ${typeName}[];\n`;
                    } else {
                        result += `${indent}  ${fieldName}${optional}: ${TYPE_MAPPING[itemType] || 'any'}[];\n`;
                    }
                } else {
                    result += `${indent}  ${fieldName}${optional}: any[];\n`;
                }
            } else {
                const tsType = valType === 'null' ? 'null' : (TYPE_MAPPING[valType] || 'any');
                result += `${indent}  ${fieldName}${optional}: ${tsType};\n`;
            }
        }
        result += `${indent}}\n\n`;

        // Generate nested interfaces
        for (const [key, val] of Object.entries(value)) {
            const valType = getValueType(val);
            if (valType === 'object' && val !== null) {
                result += generateTSInterface(val, capitalize(key), depth);
            } else if (valType === 'array' && val.length > 0 && getValueType(val[0]) === 'object') {
                result += generateTSInterface(val[0], capitalize(key.slice(0, -1)), depth);
            }
        }

        return result;
    }

    return `${indent}type ${name} = ${TYPE_MAPPING[type] || 'any'};\n`;
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).replace(/[^a-zA-Z0-9]/g, '');
}

// Utility functions
function loadSample() {
    document.getElementById('jsonInput').value = JSON.stringify(SAMPLE_JSON, null, 2);
    convertJson();
}

function clearInput() {
    document.getElementById('jsonInput').value = '';
    convertJson();
}

function copySchema() {
    const schema = document.getElementById('schemaOutput').textContent;
    navigator.clipboard.writeText(schema);
    showToast('Schema copied to clipboard!');
}

function copyTypeScript() {
    const ts = generateTypeScript();
    if (ts) {
        navigator.clipboard.writeText(ts);
        showToast('TypeScript interface copied!');
    }
}

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.remove('translate-y-20', 'opacity-0');
    setTimeout(() => {
        toast.classList.add('translate-y-20', 'opacity-0');
    }, 2000);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Load sample by default
    loadSample();
});
