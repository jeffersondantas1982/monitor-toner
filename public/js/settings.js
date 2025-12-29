// API Configuration
const API_BASE_URL = 'http://localhost:3000/api';

// State
let discoveredPrinters = [];
let selectedPrinters = new Set();

// DOM Elements
const startIPInput = document.getElementById('startIP');
const endIPInput = document.getElementById('endIP');
const discoverBtn = document.getElementById('discoverBtn');
const discoveryProgress = document.getElementById('discoveryProgress');
const progressText = document.getElementById('progressText');
const discoveredSection = document.getElementById('discoveredSection');
const discoveredPrintersContainer = document.getElementById('discoveredPrinters');
const savePrintersBtn = document.getElementById('savePrintersBtn');
const selectAllBtn = document.getElementById('selectAllBtn');
const deselectAllBtn = document.getElementById('deselectAllBtn');
const currentPrintersContainer = document.getElementById('currentPrinters');
const toast = document.getElementById('toast');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    loadCurrentPrinters();
    setupEventListeners();
});

function setupEventListeners() {
    discoverBtn.addEventListener('click', discoverPrinters);
    savePrintersBtn.addEventListener('click', savePrinters);
    selectAllBtn.addEventListener('click', selectAll);
    deselectAllBtn.addEventListener('click', deselectAll);
}

async function loadSettings() {
    try {
        const response = await fetch(`${API_BASE_URL}/settings`);
        const settings = await response.json();

        if (settings.ipRange) {
            startIPInput.value = settings.ipRange.start || '';
            endIPInput.value = settings.ipRange.end || '';
        }
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

async function loadCurrentPrinters() {
    try {
        const response = await fetch(`${API_BASE_URL}/printers`);
        const printers = await response.json();

        renderCurrentPrinters(printers);
    } catch (error) {
        console.error('Error loading current printers:', error);
        currentPrintersContainer.innerHTML = '<p class="no-data">Erro ao carregar impressoras</p>';
    }
}

function renderCurrentPrinters(printers) {
    if (!printers || printers.length === 0) {
        currentPrintersContainer.innerHTML = '<p class="no-data">Nenhuma impressora configurada</p>';
        return;
    }

    currentPrintersContainer.innerHTML = printers.map(printer => `
        <div class="current-printer-card">
            <h3>${escapeHtml(printer.name)}</h3>
            <div class="details">
                <div class="detail-row">
                    <span class="detail-label">IP:</span>
                    <span class="detail-value">${escapeHtml(printer.ip)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Modelo:</span>
                    <span class="detail-value">${escapeHtml(printer.model)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Fabricante:</span>
                    <span class="detail-value">${escapeHtml(printer.manufacturer)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Local:</span>
                    <span class="detail-value">${escapeHtml(printer.location)}</span>
                </div>
            </div>
        </div>
    `).join('');
}

async function discoverPrinters() {
    const startIP = startIPInput.value.trim();
    const endIP = endIPInput.value.trim();

    if (!startIP || !endIP) {
        showToast('Por favor, preencha os campos de IP inicial e final', 'error');
        return;
    }

    if (!validateIP(startIP) || !validateIP(endIP)) {
        showToast('Endereços IP inválidos', 'error');
        return;
    }

    // Save settings
    try {
        await fetch(`${API_BASE_URL}/settings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ipRange: {
                    start: startIP,
                    end: endIP
                }
            })
        });
    } catch (error) {
        console.error('Error saving settings:', error);
    }

    // Start discovery
    discoverBtn.disabled = true;
    discoveryProgress.style.display = 'block';
    discoveredSection.style.display = 'none';
    progressText.textContent = 'Escaneando rede...';

    try {
        const response = await fetch(`${API_BASE_URL}/discover`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ startIP, endIP })
        });

        const result = await response.json();

        if (response.ok) {
            discoveredPrinters = result.printers || [];
            selectedPrinters.clear();

            // Auto-select all discovered printers
            discoveredPrinters.forEach(printer => {
                selectedPrinters.add(printer.ip);
            });

            renderDiscoveredPrinters();
            discoveryProgress.style.display = 'none';
            discoveredSection.style.display = 'block';

            showToast(`${discoveredPrinters.length} impressora(s) encontrada(s)`, 'success');
        } else {
            throw new Error(result.error || 'Erro ao descobrir impressoras');
        }
    } catch (error) {
        console.error('Discovery error:', error);
        discoveryProgress.style.display = 'none';
        showToast('Erro ao descobrir impressoras: ' + error.message, 'error');
    } finally {
        discoverBtn.disabled = false;
    }
}

function renderDiscoveredPrinters() {
    if (discoveredPrinters.length === 0) {
        discoveredPrintersContainer.innerHTML = '<p class="no-data">Nenhuma impressora encontrada no range especificado</p>';
        return;
    }

    discoveredPrintersContainer.innerHTML = discoveredPrinters.map((printer, index) => {
        const isSelected = selectedPrinters.has(printer.ip);
        return `
            <div class="printer-discovery-card ${isSelected ? 'selected' : ''}" data-ip="${printer.ip}" data-index="${index}">
                <input type="checkbox" ${isSelected ? 'checked' : ''}>
                <div class="printer-discovery-header">
                    <div class="checkbox-custom">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                            <polyline points="20 6 9 17 4 12"/>
                        </svg>
                    </div>
                    <div class="printer-discovery-info">
                        <input 
                            type="text" 
                            class="editable-field name-field" 
                            value="${escapeHtml(printer.name)}" 
                            placeholder="Nome da impressora"
                            data-field="name"
                            onclick="event.stopPropagation()"
                        />
                    </div>
                </div>
                <div class="printer-discovery-details">
                    <div class="editable-row">
                        <span class="label">IP:</span>
                        <span class="value">${escapeHtml(printer.ip)}</span>
                    </div>
                    <div class="editable-row">
                        <span class="label">Modelo:</span>
                        <span class="value">${escapeHtml(printer.model)}</span>
                    </div>
                    <div class="editable-row">
                        <span class="label">Fabricante:</span>
                        <span class="value">${escapeHtml(printer.manufacturer)}</span>
                    </div>
                    <div class="editable-row">
                        <span class="label">Série:</span>
                        <input 
                            type="text" 
                            class="editable-field serial-field" 
                            value="${escapeHtml(printer.serial)}" 
                            placeholder="Número de série"
                            data-field="serial"
                            onclick="event.stopPropagation()"
                        />
                    </div>
                    <div class="editable-row">
                        <span class="label">Local:</span>
                        <input 
                            type="text" 
                            class="editable-field location-field" 
                            value="${escapeHtml(printer.location)}" 
                            placeholder="Ex: Recepção, Sala 101"
                            data-field="location"
                            onclick="event.stopPropagation()"
                        />
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // Add click handlers for selection
    document.querySelectorAll('.printer-discovery-card').forEach(card => {
        card.addEventListener('click', (e) => {
            // Don't toggle if clicking on input fields
            if (e.target.classList.contains('editable-field')) {
                return;
            }

            const ip = card.dataset.ip;
            const checkbox = card.querySelector('input[type="checkbox"]');

            if (selectedPrinters.has(ip)) {
                selectedPrinters.delete(ip);
                card.classList.remove('selected');
                checkbox.checked = false;
            } else {
                selectedPrinters.add(ip);
                card.classList.add('selected');
                checkbox.checked = true;
            }
        });
    });

    // Add input handlers to update printer data
    document.querySelectorAll('.editable-field').forEach(input => {
        input.addEventListener('input', (e) => {
            const card = e.target.closest('.printer-discovery-card');
            const index = parseInt(card.dataset.index);
            const field = e.target.dataset.field;
            const value = e.target.value;

            if (discoveredPrinters[index]) {
                discoveredPrinters[index][field] = value;
            }
        });
    });
}


function selectAll() {
    selectedPrinters.clear();
    discoveredPrinters.forEach(printer => {
        selectedPrinters.add(printer.ip);
    });
    renderDiscoveredPrinters();
}

function deselectAll() {
    selectedPrinters.clear();
    renderDiscoveredPrinters();
}

async function savePrinters() {
    if (selectedPrinters.size === 0) {
        showToast('Selecione pelo menos uma impressora', 'error');
        return;
    }

    const printersToSave = discoveredPrinters
        .filter(printer => selectedPrinters.has(printer.ip))
        .map((printer, index) => ({
            id: index + 1,
            name: printer.name,
            ip: printer.ip,
            model: printer.model,
            manufacturer: printer.manufacturer,
            location: printer.location,
            serial: printer.serial
        }));

    savePrintersBtn.disabled = true;

    try {
        const response = await fetch(`${API_BASE_URL}/printers/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ printers: printersToSave })
        });

        const result = await response.json();

        if (response.ok) {
            showToast(`${printersToSave.length} impressora(s) salva(s) com sucesso!`, 'success');

            // Reload current printers
            await loadCurrentPrinters();

            // Hide discovered section
            setTimeout(() => {
                discoveredSection.style.display = 'none';
                discoveredPrinters = [];
                selectedPrinters.clear();
            }, 2000);
        } else {
            throw new Error(result.error || 'Erro ao salvar impressoras');
        }
    } catch (error) {
        console.error('Save error:', error);
        showToast('Erro ao salvar impressoras: ' + error.message, 'error');
    } finally {
        savePrintersBtn.disabled = false;
    }
}

function validateIP(ip) {
    const pattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return pattern.test(ip);
}

function showToast(message, type = 'success') {
    const toastMessage = toast.querySelector('.toast-message');
    const toastIcon = toast.querySelector('.toast-icon');

    toastMessage.textContent = message;

    if (type === 'error') {
        toastIcon.innerHTML = `
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
        `;
        toastIcon.style.color = '#ff6b6b';
    } else {
        toastIcon.innerHTML = `
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
        `;
        toastIcon.style.color = '#4facfe';
    }

    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
