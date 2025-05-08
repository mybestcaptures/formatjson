document.addEventListener('DOMContentLoaded', () => {
    // ... (all existing const declarations for CSV tool elements) ...
    const darkModeToggle = document.getElementById('darkModeToggle');
    const sunIcon = darkModeToggle.querySelector('.icon-sun');
    const moonIcon = darkModeToggle.querySelector('.icon-moon');

    // --- Dark Mode Logic ---
    const applyTheme = (theme) => {
        if (theme === 'dark') {
            document.body.classList.add('dark-mode');
            sunIcon.style.display = 'none';
            moonIcon.style.display = 'inline-block';
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.classList.remove('dark-mode');
            sunIcon.style.display = 'inline-block';
            moonIcon.style.display = 'none';
            localStorage.setItem('theme', 'light');
        }
    };

    darkModeToggle.addEventListener('click', () => {
        const currentTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
    });

    // Check for saved theme preference or system preference
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
        const answerPanel = item.querySelector('.faq-answer');
        const icon = questionButton.querySelector('.faq-icon');

        questionButton.addEventListener('click', () => {
            const isExpanded = questionButton.getAttribute('aria-expanded') === 'true';

            // Optional: Close other open FAQs when one is opened
            // faqItems.forEach(otherItem => {
            //     if (otherItem !== item) {
            //         otherItem.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
            //         otherItem.querySelector('.faq-answer').style.maxHeight = null;
            //         otherItem.querySelector('.faq-icon').textContent = '+';
            //          otherItem.querySelector('.faq-icon').style.transform = 'rotate(0deg)';
            //     }
            // });

            if (isExpanded) {
                questionButton.setAttribute('aria-expanded', 'false');
                // answerPanel.style.maxHeight = null; // Collapses it via CSS transition
                icon.textContent = '+';
                icon.style.transform = 'rotate(0deg)';
            } else {
                questionButton.setAttribute('aria-expanded', 'true');
                // answerPanel.style.maxHeight = answerPanel.scrollHeight + "px"; // Expands it via CSS transition
                icon.textContent = '-'; // Or keep +, CSS will handle rotation
                icon.style.transform = 'rotate(45deg)';
            }
        });
        // Ensure answers are collapsed by default (CSS already handles this with max-height: 0)
        // answerPanel.style.maxHeight = null;
    });


    // ... (REST OF YOUR EXISTING CSV CONVERSION JAVASCRIPT) ...
    // Make sure this existing code is placed after the new Dark Mode and FAQ logic,
    // or at least the const declarations are at the top of the DOMContentLoaded scope.

    const csvInput = document.getElementById('csvInput');
    const csvFile = document.getElementById('csvFile');
    // ... and so on for all your CSV tool elements

    // Then your functions: convertCsvToYaml, showError, hideError, etc.
});
