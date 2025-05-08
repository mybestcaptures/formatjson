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

    document.getElementById('currentYear').textContent = new Date().getFullYear();

    csvFile.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                csvInput.value = e.target.result;
                // Optionally, trigger conversion automatically after file load
                // convertCsvToYaml();
            };
            reader.onerror = () => {
                showError("Error reading file.");
            }
            reader.readAsText(file);
        }
    });

    clearCsvBtn.addEventListener('click', () => {
        csvInput.value = '';
        csvFile.value = '';
        yamlOutput.value = '';
        hideError();
    });

    convertBtn.addEventListener('click', convertCsvToYaml);

    function convertCsvToYaml() {
        hideError();
        const csvData = csvInput.value.trim();
        if (!csvData) {
            showError("CSV input is empty. Please paste CSV data or upload a file.");
            return;
        }

        // Log the input for debugging if issues persist
        // console.log("Attempting to parse CSV:", csvData);

        Papa.parse(csvData, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: true,
            complete: (results) => {
                // Log the full results for debugging
                // console.log("PapaParse results:", results);

                if (results.errors.length > 0) {
                    let errorMsg = "Error parsing CSV:";
                    results.errors.forEach(err => {
                        // err object contains: type, code, message, row (optional index)
                        let specificError = `\n- ${err.message || 'Unknown parsing error'}`;
                        if (err.code === 'Delimiter') {
                            specificError = `\n- ${err.message}. Common delimiters are comma (,), semicolon (;), or tab. Please ensure your CSV uses a consistent delimiter.`;
                        } else if (err.row !== undefined) {
                            // PapaParse 'row' is 0-indexed for data rows. Add 1 for header row if present, and 1 for 1-based indexing.
                            const displayRow = err.row + (results.meta && results.meta.header ? 2 : 1);
                            specificError += ` (near input line ${displayRow})`;
                        }
                        errorMsg += specificError;
                    });
                    showError(errorMsg);
                    yamlOutput.value = '';
                    return;
                }

                if (!results.data || results.data.length === 0) {
                    if (results.meta && results.meta.fields && results.meta.fields.length > 0) {
                        showError("CSV parsed successfully with headers, but no data rows were found. YAML output will be empty.");
                    } else {
                        showError("No data found in CSV. The CSV might be empty or improperly formatted.");
                    }
                    yamlOutput.value = ''; // Ensure output is cleared
                    return;
                }

                try {
                    const indentOption = indentationSelect.value;
                    let indentSetting = 2; // Default for js-yaml if using spaces

                    if (indentOption === '4') indentSetting = 4;
                    // js-yaml's 'indent' option expects a number for spaces.
                    // If tabs are desired, we'll need to post-process or use a different approach,
                    // as js-yaml doesn't directly take 'tab' for its indent property in a simple way.

                    let yamlString = jsyaml.dump(results.data, {
                        indent: indentSetting,
                        // noCompatMode: true, // Might produce slightly more readable output for some structures
                    });

                    if (indentOption === 'tab') {
                        // js-yaml with `indent: N` produces N spaces.
                        // We need to replace leading spaces that match the indent level with tabs.
                        // This is a simplified replacement and might not cover all edge cases perfectly.
                        const spacesToReplace = ' '.repeat(indentSetting);
                        yamlString = yamlString.split('\n').map(line => {
                            let depth = 0;
                            let tempLine = line;
                            while (tempLine.startsWith(spacesToReplace)) {
                                depth++;
                                tempLine = tempLine.substring(indentSetting);
                            }
                            return '\t'.repeat(depth) + tempLine;
                        }).join('\n');
                    }

                    yamlOutput.value = yamlString;

                } catch (e) {
                    showError(`Error converting to YAML: ${e.message || 'Unknown conversion error'}`);
                    yamlOutput.value = '';
                }
            },
            error: (error) => { // This catches errors not handled by 'complete' (e.g., critical stream errors)
                showError(`Critical CSV Parsing Error: ${error.message || 'Unknown PapaParse error'}`);
                yamlOutput.value = '';
            }
        });
    }


    copyYamlBtn.addEventListener('click', () => {
        if (yamlOutput.value) {
            navigator.clipboard.writeText(yamlOutput.value)
                .then(() => {
                    copyYamlBtn.textContent = 'Copied!';
                    setTimeout(() => copyYamlBtn.textContent = 'Copy YAML', 1500);
                })
                .catch(err => showError('Failed to copy YAML: ' + (err.message || err)));
        } else {
            showError("Nothing to copy from YAML output.");
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
            showError("Nothing to download from YAML output.");
        }
    });

    function showError(message) {
        errorMessageDiv.textContent = message;
        errorMessageDiv.style.display = 'block';
    }

    function hideError() {
        errorMessageDiv.style.display = 'none';
        errorMessageDiv.textContent = ''; // Clear previous message
    }
});
