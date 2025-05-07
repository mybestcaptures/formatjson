// script.js
const ipInput = document.getElementById('ipInput');
const lookupBtn = document.getElementById('lookupBtn');
const myIpBtn = document.getElementById('myIpBtn');
const resultsContainer = document.getElementById('resultsContainer');
const resultsHeader = document.getElementById('resultsHeader'); // This is the h2 inside resultsContainer
const resultsBody = document.getElementById('resultsBody');
const loader = document.getElementById('loader');
const mapContainer = document.getElementById('map-container');
const historyContainer = document.getElementById('historyContainer');
const historyList = document.getElementById('historyList');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');

const IPINFO_TOKEN = ''; // Optional: Add your ipinfo.io token here
const MAX_HISTORY_ITEMS = 5;
let map = null; // Leaflet map instance

const countryCodeToNameMap = {
    "AF": "Afghanistan", "AX": "Åland Islands", "AL": "Albania", "DZ": "Algeria", "AS": "American Samoa",
    "AD": "Andorra", "AO": "Angola", "AI": "Anguilla", "AQ": "Antarctica", "AG": "Antigua and Barbuda",
    "AR": "Argentina", "AM": "Armenia", "AW": "Aruba", "AU": "Australia", "AT": "Austria", "AZ": "Azerbaijan",
    "BS": "Bahamas", "BH": "Bahrain", "BD": "Bangladesh", "BB": "Barbados", "BY": "Belarus", "BE": "Belgium",
    "BZ": "Belize", "BJ": "Benin", "BM": "Bermuda", "BT": "Bhutan", "BO": "Bolivia", "BQ": "Bonaire, Sint Eustatius and Saba",
    "BA": "Bosnia and Herzegovina", "BW": "Botswana", "BV": "Bouvet Island", "BR": "Brazil", "IO": "British Indian Ocean Territory",
    "BN": "Brunei Darussalam", "BG": "Bulgaria", "BF": "Burkina Faso", "BI": "Burundi", "CV": "Cabo Verde", "KH": "Cambodia",
    "CM": "Cameroon", "CA": "Canada", "KY": "Cayman Islands", "CF": "Central African Republic", "TD": "Chad", "CL": "Chile",
    "CN": "China", "CX": "Christmas Island", "CC": "Cocos (Keeling) Islands", "CO": "Colombia", "KM": "Comoros",
    "CG": "Congo", "CD": "Congo (DRC)", "CK": "Cook Islands", "CR": "Costa Rica", "CI": "Côte d'Ivoire", "HR": "Croatia",
    "CU": "Cuba", "CW": "Curaçao", "CY": "Cyprus", "CZ": "Czech Republic", "DK": "Denmark", "DJ": "Djibouti",
    "DM": "Dominica", "DO": "Dominican Republic", "EC": "Ecuador", "EG": "Egypt", "SV": "El Salvador", "GQ": "Equatorial Guinea",
    "ER": "Eritrea", "EE": "Estonia", "SZ": "Eswatini", "ET": "Ethiopia", "FK": "Falkland Islands (Malvinas)",
    "FO": "Faroe Islands", "FJ": "Fiji", "FI": "Finland", "FR": "France", "GF": "French Guiana", "PF": "French Polynesia",
    "TF": "French Southern Territories", "GA": "Gabon", "GM": "Gambia", "GE": "Georgia", "DE": "Germany", "GH": "Ghana",
    "GI": "Gibraltar", "GR": "Greece", "GL": "Greenland", "GD": "Grenada", "GP": "Guadeloupe", "GU": "Guam",
    "GT": "Guatemala", "GG": "Guernsey", "GN": "Guinea", "GW": "Guinea-Bissau", "GY": "Guyana", "HT": "Haiti",
    "HM": "Heard Island and McDonald Islands", "VA": "Holy See (Vatican City State)", "HN": "Honduras", "HK": "Hong Kong",
    "HU": "Hungary", "IS": "Iceland", "IN": "India", "ID": "Indonesia", "IR": "Iran", "IQ": "Iraq", "IE": "Ireland",
    "IM": "Isle of Man", "IL": "Israel", "IT": "Italy", "JM": "Jamaica", "JP": "Japan", "JE": "Jersey", "JO": "Jordan",
    "KZ": "Kazakhstan", "KE": "Kenya", "KI": "Kiribati", "KP": "North Korea", "KR": "South Korea", "KW": "Kuwait",
    "KG": "Kyrgyzstan", "LA": "Lao People's Democratic Republic", "LV": "Latvia", "LB": "Lebanon", "LS": "Lesotho",
    "LR": "Liberia", "LY": "Libya", "LI": "Liechtenstein", "LT": "Lithuania", "LU": "Luxembourg", "MO": "Macao",
    "MG": "Madagascar", "MW": "Malawi", "MY": "Malaysia", "MV": "Maldives", "ML": "Mali", "MT": "Malta",
    "MH": "Marshall Islands", "MQ": "Martinique", "MR": "Mauritania", "MU": "Mauritius", "YT": "Mayotte", "MX": "Mexico",
    "FM": "Micronesia", "MD": "Moldova", "MC": "Monaco", "MN": "Mongolia", "ME": "Montenegro", "MS": "Montserrat",
    "MA": "Morocco", "MZ": "Mozambique", "MM": "Myanmar", "NA": "Namibia", "NR": "Nauru", "NP": "Nepal", "NL": "Netherlands",
    "NC": "New Caledonia", "NZ": "New Zealand", "NI": "Nicaragua", "NE": "Niger", "NG": "Nigeria", "NU": "Niue",
    "NF": "Norfolk Island", "MK": "North Macedonia", "MP": "Northern Mariana Islands", "NO": "Norway", "OM": "Oman",
    "PK": "Pakistan", "PW": "Palau", "PS": "Palestine, State of", "PA": "Panama", "PG": "Papua New Guinea", "PY": "Paraguay",
    "PE": "Peru", "PH": "Philippines", "PN": "Pitcairn", "PL": "Poland", "PT": "Portugal", "PR": "Puerto Rico", "QA": "Qatar",
    "RE": "Réunion", "RO": "Romania", "RU": "Russian Federation", "RW": "Rwanda", "BL": "Saint Barthélemy",
    "SH": "Saint Helena, Ascension and Tristan da Cunha", "KN": "Saint Kitts and Nevis", "LC": "Saint Lucia",
    "MF": "Saint Martin (French part)", "PM": "Saint Pierre and Miquelon", "VC": "Saint Vincent and the Grenadines",
    "WS": "Samoa", "SM": "San Marino", "ST": "Sao Tome and Principe", "SA": "Saudi Arabia", "SN": "Senegal", "RS": "Serbia",
    "SC": "Seychelles", "SL": "Sierra Leone", "SG": "Singapore", "SX": "Sint Maarten (Dutch part)", "SK": "Slovakia",
    "SI": "Slovenia", "SB": "Solomon Islands", "SO": "Somalia", "ZA": "South Africa", "GS": "South Georgia and the South Sandwich Islands",
    "SS": "South Sudan", "ES": "Spain", "LK": "Sri Lanka", "SD": "Sudan", "SR": "Suriname", "SJ": "Svalbard and Jan Mayen",
    "SE": "Sweden", "CH": "Switzerland", "SY": "Syrian Arab Republic", "TW": "Taiwan", "TJ": "Tajikistan", "TZ": "Tanzania",
    "TH": "Thailand", "TL": "Timor-Leste", "TG": "Togo", "TK": "Tokelau", "TO": "Tonga", "TT": "Trinidad and Tobago",
    "TN": "Tunisia", "TR": "Turkey", "TM": "Turkmenistan", "TC": "Turks and Caicos Islands", "TV": "Tuvalu", "UG": "Uganda",
    "UA": "Ukraine", "AE": "United Arab Emirates", "GB": "United Kingdom", "US": "United States", "UM": "United States Minor Outlying Islands",
    "UY": "Uruguay", "UZ": "Uzbekistan", "VU": "Vanuatu", "VE": "Venezuela", "VN": "Viet Nam", "VG": "Virgin Islands (British)",
    "VI": "Virgin Islands (U.S.)", "WF": "Wallis and Futuna", "EH": "Western Sahara", "YE": "Yemen", "ZM": "Zambia", "ZW": "Zimbabwe"
};

function getCountryName(code) {
    return countryCodeToNameMap[code.toUpperCase()] || code;
}

function isValidIP(ip) {
    if (!ip || typeof ip !== 'string') return false;
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^(?:[A-F0-9]{1,4}:){7}[A-F0-9]{1,4}$|^(?:[A-F0-9]{1,4}:){1,7}:?$|^(?:[A-F0-9]{1,4}:){1,6}:[A-F0-9]{1,4}$|^(?:[A-F0-9]{1,4}:){1,5}(?::[A-F0-9]{1,4}){1,2}$|^(?:[A-F0-9]{1,4}:){1,4}(?::[A-F0-9]{1,4}){1,3}$|^(?:[A-F0-9]{1,4}:){1,3}(?::[A-F0-9]{1,4}){1,4}$|^(?:[A-F0-9]{1,4}:){1,2}(?::[A-F0-9]{1,4}){1,5}$|^[A-F0-9]{1,4}:(?:(?::[A-F0-9]{1,4}){1,6})$|^(?:(?:[A-F0-9]{1,4}:){0,5}|:):(?:[A-F0-9]{1,4}:){0,5}[A-F0-9]{1,4}$|::(?:[A-F0-9]{1,4}:){0,6}[A-F0-9]{1,4}$/i;
    return ipv4Regex.test(ip) || ipv6Regex.test(ip.toUpperCase());
}

lookupBtn.addEventListener('click', () => {
    const ip = ipInput.value.trim();
    // Allow empty for "My IP" logic, otherwise validate. For "My IP", ipInput is often cleared first.
    if (ip === '' || isValidIP(ip)) { 
        fetchIpInfo(ip);
    } else {
        displayError('Please enter a valid IP address.');
    }
});

ipInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        lookupBtn.click();
    }
});

myIpBtn.addEventListener('click', () => {
    ipInput.value = ''; // Clear input for "My IP" lookup
    fetchIpInfo(''); 
});

async function fetchIpInfo(ipToLookup) {
    showLoading(true);
    resultsContainer.style.display = 'none';
    mapContainer.style.display = 'none';
    resultsBody.innerHTML = ''; 
    resultsHeader.classList.remove('error');
    resultsHeader.textContent = 'IP Information'; // The H2 element with ID "results-heading"

    const url = `https://ipinfo.io/${ipToLookup}?token=${IPINFO_TOKEN}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: { message: "Failed to parse error response." } }));
            let errorMessage = `Error: ${response.status} ${response.statusText}`;
            if (errorData && errorData.error && errorData.error.message) {
                errorMessage = errorData.error.message;
            } else if (errorData && errorData.error && errorData.error.title && errorData.error.message) {
                errorMessage = `${errorData.error.title}. ${errorData.error.message}`;
            }
            throw new Error(errorMessage);
        }
        const data = await response.json();
        displayResults(data);
        if (data.ip) {
            saveToHistory(data.ip);
        }
    } catch (error) {
        console.error('Fetch error:', error);
        displayError(error.message || 'Failed to fetch IP information.');
    } finally {
        showLoading(false);
    }
}

function displayResults(data) {
    resultsContainer.style.display = 'block';
    resultsHeader.textContent = `Details for ${data.ip || 'your IP'}`; // Update H2 text
    
    if (ipInput.value === '' && data.ip) { // If "My IP" was clicked and input was empty
        ipInput.value = data.ip;
    }

    const detailsToShow = {
        "IP Address": data.ip,
        "Hostname": data.hostname,
        "City": data.city,
        "Region": data.region,
        "Country": data.country ? `${getCountryName(data.country)} (${data.country})` : 'N/A',
        "Location (Lat,Lon)": data.loc, 
        "ISP / Organization": data.org,
        "Postal Code": data.postal,
        "Timezone": data.timezone,
    };

    if (data.asn) {
        detailsToShow["ASN"] = `${data.asn.asn} (${data.asn.name})`;
        detailsToShow["ASN Domain"] = data.asn.domain;
        detailsToShow["ASN Route"] = data.asn.route;
        detailsToShow["ASN Type"] = data.asn.type;
    }
    
    resultsBody.innerHTML = ''; 

    for (const key in detailsToShow) {
        if (detailsToShow[key] !== undefined && detailsToShow[key] !== null && detailsToShow[key] !== '') {
            const itemDiv = document.createElement('div');
            itemDiv.classList.add('result-item');
            
            const strongEl = document.createElement('strong');
            strongEl.textContent = key + ":";
            
            const spanEl = document.createElement('span');
            spanEl.textContent = detailsToShow[key];
            
            itemDiv.appendChild(strongEl);
            itemDiv.appendChild(spanEl);
            resultsBody.appendChild(itemDiv);
        }
    }

    if (data.loc) {
        const [lat, lon] = data.loc.split(',');
        initMap(parseFloat(lat), parseFloat(lon), data.ip || 'Location');
        mapContainer.style.display = 'block';
    } else {
        mapContainer.style.display = 'none';
        if (map) {
            map.remove();
            map = null;
        }
    }
}

function initMap(lat, lon, popupText) {
    if (!map) {
        map = L.map('mapid').setView([lat, lon], 10);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);
    } else {
        map.setView([lat, lon], 10);
    }
    map.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
            map.removeLayer(layer);
        }
    });
    L.marker([lat, lon]).addTo(map)
        .bindPopup(popupText)
        .openPopup();
}

function displayError(message) {
    resultsContainer.style.display = 'block';
    mapContainer.style.display = 'none';
    resultsHeader.textContent = 'Error'; // Update H2 text
    resultsHeader.classList.add('error');
    resultsBody.innerHTML = `<p style="color: var(--danger-color); text-align: center;">${message}</p>`;
    if (map) {
        map.remove();
        map = null;
    }
}

function showLoading(isLoading) {
    loader.style.display = isLoading ? 'block' : 'none';
}

function loadHistory() {
    const history = JSON.parse(localStorage.getItem('ipLookupHistory')) || [];
    historyList.innerHTML = '';
    if (history.length > 0) {
        historyContainer.style.display = 'block';
    } else {
        historyContainer.style.display = 'none';
        return;
    }
    history.forEach(ip => {
        const li = document.createElement('li');
        li.textContent = ip;
        li.addEventListener('click', () => {
            ipInput.value = ip;
            fetchIpInfo(ip);
        });
        historyList.appendChild(li);
    });
}

function saveToHistory(ip) {
    if (!ip) return;
    let history = JSON.parse(localStorage.getItem('ipLookupHistory')) || [];
    history = history.filter(item => item !== ip);
    history.unshift(ip);
    if (history.length > MAX_HISTORY_ITEMS) {
        history = history.slice(0, MAX_HISTORY_ITEMS);
    }
    localStorage.setItem('ipLookupHistory', JSON.stringify(history));
    loadHistory();
}

clearHistoryBtn.addEventListener('click', () => {
    localStorage.removeItem('ipLookupHistory');
    loadHistory();
});

document.addEventListener('DOMContentLoaded', loadHistory);
