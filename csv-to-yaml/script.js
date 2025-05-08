document.addEventListener('DOMContentLoaded', () => {
    const csvInput = document.getElementById('csvInput');
    const csvFile = document.getElementById('csvFile');
    const clearCsvBtn = document.getElementById('clearCsvBtn');
    const convertBtn = document.getElementById('convertBtn');
    const yamlOutput = document.getElementById('yamlOutput');
    const copyYamlBtn = document.getElementById('copyYamlBtn');
    const downloadYamlBtn = document.getElementById('downloadYamlBtn');
    const indentationSelect = document.getElementById('indentation');
    const errorMessageDiv = document.getElementById('errorMessage');

    // Set current year in footer
    document.getElementById('currentYear').textContent = new Date().getFullYear();

    // File input handler
    csvFile.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                csvInput.value = e.target.result;
            };
            reader.onerror = () => {
                showError("Error reading file.");
            }
            reader.readAsText(file);
        }
    });

    clearCsvBtn.addEventListener('click', () => {
        csvInput.value = '';
        csvFile.value = ''; // Reset file input
        yamlOutput.value = '';
        hideError();
    });

    convertBtn.addEventListener('click', () => {
        hideError();
        const csvData = csvInput.value.trim();
        if (!csvData) {
            showError("CSV input is empty.");
            return;
        }

        Papa.parse(csvData, {
            header: true, // Assumes first row is header
            skipEmptyLines: true,
            dynamicTyping: true, // Attempt to convert numbers, booleans
            complete: (results) => {
                if (results.errors.length > 0) {
                    let errorMsg = "Error parsing CSV: ";
                    results.errors.forEach(err => errorMsg += `\n- Row ${err.row}: ${err.message}`);
                    showError(errorMsg);
                    // console.error("CSV Parsing Errors:", results.errors);
                    yamlOutput.value = ''; // Clear output on error
                    return;
                }
                
                if (!results.data || results.data.length === 0) {
                    showError("No data found in CSV after parsing headers or empty lines.");
                    yamlOutput.value = '';
                    return;
                }

                try {
                    const indentOption = indentationSelect.value;
                    let indent = 2;
                    if (indentOption === '4') indent = 4;
                    else if (indentOption === 'tab') indent = '\t'; // js-yaml uses number for spaces, string for tab char

                    // For js-yaml, indent must be a number for spaces
                    const yamlIndent = (typeof indent === 'string') ? 2 : indent; // Default to 2 if tab, js-yaml handles tab char differently

                    const yamlString = jsyaml.dump(results.data, {
                        indent: yamlIndent,
                        // noCompatMode: true, // for more human-readable output in some cases
                    });

                    // If tab indentation was selected, js-yaml might produce spaces.
                    // We can do a simple replace if actual tabs are desired.
                    // This is a bit of a hack; a more robust YAML library might offer direct tab char for indent.
                    if (indentOption === 'tab') {
                         // js-yaml dump with indent:N makes N spaces.
                         // We need to replace sequences of N spaces at the start of lines with a tab.
                         // This regex is a simplification.
                         const spaceIndent = ' '.repeat(yamlIndent);
                         yamlOutput.value = yamlString.split('\n').map(line => {
                            let leadingSpaces = 0;
                            while(line.startsWith(spaceIndent.repeat(leadingSpaces+1))){
                                leadingSpaces++;
                            }
                            return '\t'.repeat(leadingSpaces) + line.substring(leadingSpaces * yamlIndent);
                         }).join('\n');
                    } else {
                        yamlOutput.value = yamlString;
                    }

                } catch (e) {
                    showError(`Error converting to YAML: ${e.message}`);
                    // console.error("YAML Conversion Error:", e);
                    yamlOutput.value = '';
                }
            },
            error: (error) => {
                showError(`CSV Parsing Error: ${error.message}`);
                // console.error("PapaParse Error:", error);
                yamlOutput.value = '';
            }
        });
    });

    copyYamlBtn.addEventListener('click', () => {
        if (yamlOutput.value) {
            navigator.clipboard.writeText(yamlOutput.value)
                .then(() => {
                    // Optional: Show a success message
                    copyYamlBtn.textContent = 'Copied!';
                    setTimeout(() => copyYamlBtn.textContent = 'Copy YAML', 1500);
                })
                .catch(err => showError('Failed to copy YAML: ' + err));
        } else {
            showError("Nothing to copy.");
        }
    });

    downloadYamlBtn.addEventListener('click', () => {
        if (yamlOutput.value) {
            const blob = new Blob([yamlOutput.value], { type: 'text/yaml;charset=utf-8' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'converted_data.yaml';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
        } else {
            showError("Nothing to download.");
        }
    });

    function showError(message) {
        errorMessageDiv.textContent = message;
        errorMessageDiv.style.display = 'block';
    }

    function hideError() {
        errorMessageDiv.style.display = 'none';
    }
});
