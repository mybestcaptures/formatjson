document.addEventListener('DOMContentLoaded', () => {
    const ipForm = document.getElementById('ipAddressForm');
    const ipInput = document.getElementById('ipAddressInput');
    const detectMyIpButton = document.getElementById('detectMyIpButton');
    const resultsOutput = document.getElementById('ipResultsOutput');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const errorMessageElement = document.getElementById('errorMessage');
    const mapElement = document.getElementById('map');
    const currentYearElement = document.getElementById('currentYear');

    const IP_API_BASE_URL = 'https://ip-api.com/json/'; // HTTPS for broader compatibility
    const IP_API_FIELDS = '?fields=status,message,query,country,countryCode,regionName,city,zip,lat,lon,timezone,isp,org,as,hostname';

    // Set current year in footer
    if (currentYearElement) {
        currentYearElement.textContent = new Date().getFullYear();
    }

    // Event Listeners
    if (ipForm) {
        ipForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const ipAddress = ipInput.value.trim();
            if (!ipAddress) {
                displayError('Please enter an IP address.');
                return;
            }
            // Basic validation can be expanded
            // if (!isValidIP(ipAddress)) {
            //     displayError('Please enter a valid IPv4 or IPv6 address.');
            //     return;
            // }
            await fetchIpDetails(ipAddress);
        });
    }

    if (detectMyIpButton) {
        detectMyIpButton.addEventListener('click', async () => {
            showLoading();
            try {
                // Using ip-api.com without an IP to get the current user's IP
                const response = await fetch(`${IP_API_BASE_URL}${IP_API_FIELDS}`);
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ message: 'Failed to detect IP. Network error.' }));
                    throw new Error(errorData.message || `Failed to detect IP. Status: ${response.status}`);
                }
                const data = await response.json();
                if (data.status === 'success' && data.query) {
                    ipInput.value = data.query; // Fill input with detected IP
                    await fetchIpDetails(data.query); // Fetch details for the detected IP
                } else {
                    throw new Error(data.message || 'Could not retrieve your IP address.');
                }
            } catch (error) {
                console.error('Error detecting IP:', error);
                displayError(`Could not detect your IP address. ${error.message}`);
            }
        });
    }

    // Core Functions
    async function fetchIpDetails(ip) {
        showLoading();
        try {
            const response = await fetch(`${IP_API_BASE_URL}${ip}${IP_API_FIELDS}`);
            if (!response.ok) {
                 const errorData = await response.json().catch(() => ({ message: `API request failed. Status: ${response.status}` }));
                 throw new Error(errorData.message || `API request failed. Status: ${response.status}`);
            }
            const data = await response.json();

            if (data.status === 'fail') {
                throw new Error(data.message || 'Invalid IP address or unable to retrieve data.');
            }
            displayResults(data);

        } catch (error) {
            console.error('Error fetching IP details:', error);
            displayError(`Error fetching IP details: ${error.message}`);
        }
    }

    // Helper Functions
    function showLoading() {
        if (loadingIndicator) loadingIndicator.style.display = 'flex';
        if (errorMessageElement) errorMessageElement.style.display = 'none';
        if (resultsOutput) resultsOutput.innerHTML = ''; // Clear previous results
        if (mapElement) mapElement.innerHTML = 'Map will display here (approximate location).'; // Reset map
    }

    function displayError(message) {
        if (loadingIndicator) loadingIndicator.style.display = 'none';
        if (errorMessageElement) {
            errorMessageElement.textContent = message;
            errorMessageElement.style.display = 'block';
        }
        if (resultsOutput) resultsOutput.innerHTML = '<p class="placeholder-text">Please try again or enter a different IP.</p>';
    }

    function displayResults(data) {
        if (loadingIndicator) loadingIndicator.style.display = 'none';
        if (errorMessageElement) errorMessageElement.style.display = 'none';

        if (!resultsOutput) return;

        const details = [
            { label: 'IP Address', value: data.query, icon: '📍' },
            { label: 'Hostname', value: data.hostname, icon: '🌐' },
            { label: 'Country', value: `${data.country || 'N/A'} (${data.countryCode || 'N/A'})`, icon: '🌍' },
            { label: 'Region/State', value: data.regionName, icon: '🗺️' },
            { label: 'City', value: data.city, icon: '🏙️' },
            { label: 'ZIP/Postal Code', value: data.zip, icon: '📮' },
            { label: 'Latitude', value: data.lat, icon: '↕️' },
            { label: 'Longitude', value: data.lon, icon: '↔️' },
            { label: 'ISP', value: data.isp, icon: '📡' },
            { label: 'Organization', value: data.org, icon: '🏢' },
            { label: 'ASN', value: data.as, icon: '🔗' },
            { label: 'Timezone', value: data.timezone, icon: '🕒' }
        ];

        let tableHTML = '<table class="ip-details-table"><tbody>';
        details.forEach(detail => {
            if (detail.value !== undefined && detail.value !== null && detail.value !== "") {
                 tableHTML += `<tr><th>${detail.icon} ${detail.label}</th><td>${sanitizeHTML(String(detail.value))}</td></tr>`;
            } else {
                 tableHTML += `<tr><th>${detail.icon} ${detail.label}</th><td>N/A</td></tr>`;
            }
        });
        tableHTML += '</tbody></table>';
        resultsOutput.innerHTML = tableHTML;

        // Map Placeholder Update
        if (mapElement) {
            if (data.lat && data.lon) {
                mapElement.innerHTML = `Approximate Location: Latitude: ${sanitizeHTML(String(data.lat))}, Longitude: ${sanitizeHTML(String(data.lon))}. (Full map integration requires a library like Leaflet.js)`;
                // For actual Leaflet map, you'd initialize it here.
                // Example:
                // if (typeof L !== 'undefined') { /* Leaflet loaded */
                //   if (window.ipMap) window.ipMap.remove(); // Remove previous map instance
                //   window.ipMap = L.map('map').setView([data.lat, data.lon], 10);
                //   L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                //     attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                //   }).addTo(window.ipMap);
                //   L.marker([data.lat, data.lon]).addTo(window.ipMap)
                //     .bindPopup(`Approx. location of ${sanitizeHTML(data.query)}`)
                //     .openPopup();
                // } else {
                //   mapElement.innerHTML += '<br><em>Leaflet.js library not found for map display.</em>';
                // }
            } else {
                mapElement.innerHTML = 'Map data not available for this IP address.';
            }
        }
    }

    function sanitizeHTML(str) {
        const temp = document.createElement('div');
        temp.textContent = str;
        return temp.innerHTML;
    }

    // Basic IP Validation (can be improved for stricter IPv6, etc.)
    // function isValidIP(ip) {
    //     const ipv4Pattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    //     // This IPv6 regex is comprehensive but can be complex. A simpler one might suffice for basic validation.
    //     const ipv6Pattern = /(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))/;
    //     return ipv4Pattern.test(ip) || ipv6Pattern.test(ip);
    // }
});
