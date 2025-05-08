document.addEventListener('DOMContentLoaded', () => {
    // CSV Tool Elements
    const csvInput = document.getElementById('csvInput');
    const csvFile = document.getElementById('csvFile');
    const clearCsvBtn = document.getElementById('clearCsvBtn');
    const convertBtn = document.getElementById('convertBtn');
    const yamlOutput = document.getElementById('yamlOutput');
    const copyYamlBtn = document.getElementById('copyYamlBtn');
    const downloadYamlBtn = document.getElementById('downloadYamlBtn');
    const errorMessageDiv = document.getElementById('errorMessage');
    const indentationSelect = document.getElementById('indentation');
    const delimiterSelect = document.getElementById('delimiter');
    const noHeaderRowCheckbox = document.getElementById('noHeaderRow');

    // Dark Mode Elements
    const darkModeToggle = document.getElementById('darkModeToggle');
    const sunIcon = darkModeToggle.querySelector('.icon-sun');
    const moonIcon = darkModeToggle.querySelector('.icon-moon');

    // Footer Year
    document.getElementById('currentYear').textContent = new Date().getFullYear();

    // --- Dark Mode Logic ---
    const applyTheme = (theme) => {
        if (theme === 'dark') {
            document.body.classList.add('dark-mode');
            if (sunIcon) sunIcon.style.display = 'none';
            if (moonIcon) moonIcon.style.display = 'inline-block';
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.classList.remove('dark-mode');
            if (sunIcon) sunIcon.style.display = 'inline-block';
            if (moonIcon) moonIcon.style.display = 'none';
            localStorage.setItem('theme', 'light');
        }
    };

    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', () => {
            const currentTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
            applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
        });
    }

    // Check for saved theme preference or system preference on load
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme) {
        applyTheme(savedTheme);
    } else if (systemPrefersDark) {
        applyTheme('dark');
    } else {
        applyTheme('light'); // Default to light
    }

    // --- FAQ Accordion Logic ---
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const questionButton = item.querySelector('.faq-question');
        const icon = questionButton.querySelector('.faq-icon');

        questionButton.addEventListener('click', () => {
            const isExpanded = questionButton.getAttribute('aria-expanded') === 'true';
            questionButton.setAttribute('aria-expanded', !isExpanded);
            // CSS handles the visual expansion/collapse and icon change
        });
    });


    // --- CSV Tool Logic ---
    if (csvFile) {
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
    }

    if (clearCsvBtn) {
        clearCsvBtn.addEventListener('click', () => {
            csvInput.value = '';
            if(csvFile) csvFile.value = '';
            yamlOutput.value = '';
            yamlOutput.setAttribute('readonly', true);
            hideError();
        });
    }

    if (convertBtn) {
        convertBtn.addEventListener('click', convertCsvToYaml);
    }

    function convertCsvToYaml() {
        hideError();
        yamlOutput.setAttribute('readonly', true);
        const csvData = csvInput.value.trim();

        if (!csvData) {
            showError("CSV input is empty. Please paste CSV data or upload a file.");
            return;
        }

        const papaConfig = {
            skipEmptyLines: true,
            dynamicTyping: true,
            header: !noHeaderRowCheckbox.checked,
        };

        let selectedDelimiter = delimiterSelect.value;
        if (selectedDelimiter === 'tab') {
            papaConfig.delimiter = '\t';
        } else if (selectedDelimiter === 'space') {
             papaConfig.delimiter = ' ';
        } else if (selectedDelimiter !== 'auto') {
            papaConfig.delimiter = selectedDelimiter;
        }

        Papa.parse(csvData, {
            ...papaConfig,
            complete: (results) => {
                if (results.errors.length > 0) {
                    let errorMsg = "Error parsing CSV:";
                    results.errors.forEach(err => {
                        let specificError = `\n- ${err.message || 'Unknown parsing error'}`;
                        if (err.code === 'Delimiter' && selectedDelimiter === 'auto') {
                            specificError = `\n- ${err.message}. Try selecting a specific delimiter.`;
                        } else if (err.code === 'Delimiter' && selectedDelimiter !== 'auto') {
                            const delimChar = selectedDelimiter === '\t' ? '\\t' : (selectedDelimiter === ' ' ? 'Space' : selectedDelimiter);
                            specificError = `\n- ${err.message}. The specified delimiter '${delimChar}' might be incorrect.`;
                        } else if (err.row !== undefined) {
                            const displayRow = err.row + (results.meta && results.meta.header ? 2 : 1);
                            specificError += ` (near input line ${displayRow})`;
                        }
                        errorMsg += specificError;
                    });
                    showError(errorMsg);
                    yamlOutput.value = '';
                    return;
                }

                let dataToConvert = results.data;

                if (!dataToConvert || dataToConvert.length === 0) {
                     if (results.meta && results.meta.fields && results.meta.fields.length > 0 && !noHeaderRowCheckbox.checked) {
                        showError("CSV parsed with headers, but no data rows found. YAML output is empty.");
                    } else if (noHeaderRowCheckbox.checked && (!dataToConvert || dataToConvert.length === 0)) {
                        showError("CSV parsed, but no data rows found. Check 'First row is data' setting.");
                    } else {
                        showError("No data found in CSV. Check delimiter and header options.");
                    }
                    yamlOutput.value = '';
                    return;
                }

                if (noHeaderRowCheckbox.checked) {
                    if (dataToConvert.length > 0 && Array.isArray(dataToConvert[0])) {
                        dataToConvert = dataToConvert.map(row => {
                            const obj = {};
                            row.forEach((value, index) => {
                                obj[`column_${index + 1}`] = value;
                            });
                            return obj;
                        });
                    } else {
                        showError("Expected array of arrays for 'No Header Row' option, but data structure is different.");
                        yamlOutput.value = '';
                        return;
                    }
                }

                try {
                    const indentOption = indentationSelect.value;
                    let indentSetting = 2;
                    if (indentOption === '4') indentSetting = 4;

                    let yamlString = jsyaml.dump(dataToConvert, { indent: indentSetting });

                    if (indentOption === 'tab') {
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
                    yamlOutput.removeAttribute('readonly');

                } catch (e) {
                    showError(`Error converting to YAML: ${e.message || 'Unknown conversion error'}`);
                    yamlOutput.value = '';
                }
            },
            error: (error) => {
                showError(`Critical CSV Parsing Error: ${error.message || 'Unknown PapaParse error'}`);
                yamlOutput.value = '';
            }
        });
    }

    if (copyYamlBtn) {
        copyYamlBtn.addEventListener('click', () => {
            if (yamlOutput.value && !yamlOutput.hasAttribute('readonly')) {
                navigator.clipboard.writeText(yamlOutput.value)
                    .then(() => {
                        copyYamlBtn.textContent = 'Copied!';
                        setTimeout(() => copyYamlBtn.textContent = 'Copy YAML', 1500);
                    })
                    .catch(err => showError('Failed to copy YAML: ' + (err.message || err)));
            } else if (yamlOutput.hasAttribute('readonly')) {
                showError("Convert data first to enable copying.");
            }
            else {
                showError("Nothing to copy from YAML output.");
            }
        });
    }

    if (downloadYamlBtn) {
        downloadYamlBtn.addEventListener('click', () => {
            if (yamlOutput.value && !yamlOutput.hasAttribute('readonly')) {
                const blob = new Blob([yamlOutput.value], { type: 'text/yaml;charset=utf-8' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = 'converted_data.yaml';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(link.href);
            } else if (yamlOutput.hasAttribute('readonly')) {
                showError("Convert data first to enable download.");
            } else {
                showError("Nothing to download from YAML output.");
            }
        });
    }

    function showError(message) {
        errorMessageDiv.textContent = message;
        errorMessageDiv.style.display = 'block';
    }

    function hideError() {
        errorMessageDiv.style.display = 'none';
        errorMessageDiv.textContent = '';
    }
});
