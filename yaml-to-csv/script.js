document.addEventListener('DOMContentLoaded', () => {
    // YAML to CSV Tool Elements
    const yamlInput = document.getElementById('yamlInput');
    const yamlFile = document.getElementById('yamlFile');
    const clearInputBtn = document.getElementById('clearInputBtn');
    const convertToCsvBtn = document.getElementById('convertToCsvBtn');
    const csvOutput = document.getElementById('csvOutput');
    const copyCsvBtn = document.getElementById('copyCsvBtn');
    const downloadCsvBtn = document.getElementById('downloadCsvBtn');
    const errorMessageDiv = document.getElementById('errorMessage');
    const csvDelimiterSelect = document.getElementById('csvDelimiter');
    const includeHeaderCsvCheckbox = document.getElementById('includeHeaderCsv');

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

    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme) {
        applyTheme(savedTheme);
    } else if (systemPrefersDark) {
        applyTheme('dark');
    } else {
        applyTheme('light');
    }

    // --- FAQ Accordion Logic ---
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const questionButton = item.querySelector('.faq-question');
        questionButton.addEventListener('click', () => {
            const isExpanded = questionButton.getAttribute('aria-expanded') === 'true';
            questionButton.setAttribute('aria-expanded', !isExpanded);
        });
    });

    // --- YAML to CSV Tool Logic ---
    if (yamlFile) {
        yamlFile.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    yamlInput.value = e.target.result;
                };
                reader.onerror = () => {
                    showError("Error reading file.");
                }
                reader.readAsText(file);
            }
        });
    }

    if (clearInputBtn) {
        clearInputBtn.addEventListener('click', () => {
            yamlInput.value = '';
            if (yamlFile) yamlFile.value = '';
            csvOutput.value = '';
            csvOutput.setAttribute('readonly', true);
            hideError();
        });
    }

    if (convertToCsvBtn) {
        convertToCsvBtn.addEventListener('click', convertYamlToCsv);
    }

    function convertYamlToCsv() {
        hideError();
        csvOutput.setAttribute('readonly', true);
        const yamlData = yamlInput.value.trim();

        if (!yamlData) {
            showError("YAML input is empty. Please paste YAML data or upload a file.");
            return;
        }

        try {
            let parsedYaml = jsyaml.load(yamlData);
            let dataToUnparse;

            // Papa.unparse expects an array of objects, or an array of arrays.
            if (parsedYaml === null || typeof parsedYaml === 'undefined') {
                showError("YAML input is empty or invalid, resulting in no data.");
                csvOutput.value = '';
                return;
            } else if (!Array.isArray(parsedYaml)) {
                // If it's a single object, wrap it in an array to make it a single row CSV
                if (typeof parsedYaml === 'object' && parsedYaml !== null) {
                    dataToUnparse = [parsedYaml];
                } else {
                    // If it's a scalar or something else not easily convertible to rows of objects
                    showError("YAML data could not be converted to a suitable CSV structure. Expected a list of objects or a single object.");
                    csvOutput.value = '';
                    return;
                }
            } else {
                dataToUnparse = parsedYaml;
            }

            // Ensure all items in the array are suitable (e.g. objects)
            // PapaParse handles arrays of arrays or arrays of objects.
            // If it's an array of primitives, PapaParse will make a single column CSV.
            if (dataToUnparse.length > 0 && typeof dataToUnparse[0] !== 'object' && !Array.isArray(dataToUnparse[0])) {
                // Potentially transform array of primitives to array of objects { "value": item }
                // For simplicity, we'll let PapaParse handle it; it will create a single column.
            } else if (dataToUnparse.every(item => item === null || typeof item !== 'object')){
                 // If it's an array of non-objects (e.g. all nulls, or mixed primitives), might be an issue
            }


            if (dataToUnparse.length === 0) {
                showError("YAML parsed to an empty list. CSV output will be empty.");
                csvOutput.value = '';
                return;
            }

            const papaConfig = {
                delimiter: csvDelimiterSelect.value === ' ' ? ' ' : (csvDelimiterSelect.value || ","), // Handle space correctly
                header: includeHeaderCsvCheckbox.checked,
                quotes: true, // Default to quoting fields that need it. Can be true, false, or an array.
            };
             if (papaConfig.delimiter === "\\t") { // User selected tab from dropdown
                papaConfig.delimiter = "\t";
            }


            const csvString = Papa.unparse(dataToUnparse, papaConfig);
            csvOutput.value = csvString;
            csvOutput.removeAttribute('readonly');

        } catch (e) {
            showError(`Error parsing YAML or converting to CSV: ${e.message || 'Unknown error'}`);
            csvOutput.value = '';
        }
    }

    if (copyCsvBtn) {
        copyCsvBtn.addEventListener('click', () => {
            if (csvOutput.value && !csvOutput.hasAttribute('readonly')) {
                navigator.clipboard.writeText(csvOutput.value)
                    .then(() => {
                        copyCsvBtn.textContent = 'Copied!';
                        setTimeout(() => copyCsvBtn.textContent = 'Copy CSV', 1500);
                    })
                    .catch(err => showError('Failed to copy CSV: ' + (err.message || err)));
            } else if (csvOutput.hasAttribute('readonly')) {
                showError("Convert data first to enable copying.");
            } else {
                showError("Nothing to copy from CSV output.");
            }
        });
    }

    if (downloadCsvBtn) {
        downloadCsvBtn.addEventListener('click', () => {
            if (csvOutput.value && !csvOutput.hasAttribute('readonly')) {
                const blob = new Blob([csvOutput.value], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = 'converted_data.csv';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(link.href);
            } else if (csvOutput.hasAttribute('readonly')) {
                showError("Convert data first to enable download.");
            } else {
                showError("Nothing to download from CSV output.");
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
