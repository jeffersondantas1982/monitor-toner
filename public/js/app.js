// API Configuration
const API_BASE_URL = 'http://localhost:3000/api';
const AUTO_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

// State
let allPrinters = [];
let currentFilter = 'all';
let searchTerm = '';
let autoRefreshTimer = null;

// DOM Elements
const printersGrid = document.getElementById('printersGrid');
const searchInput = document.getElementById('searchInput');
const filterButtons = document.querySelectorAll('.filter-btn');
const refreshBtn = document.getElementById('refreshBtn');
const onlineCount = document.getElementById('onlineCount');
const alertCount = document.getElementById('alertCount');
const lastUpdate = document.getElementById('lastUpdate');
const toast = document.getElementById('toast');
const themeToggleBtn = document.getElementById('themeToggle');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    initializeApp();
});

function initializeTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        updateThemeIcon(true);
    } else {
        updateThemeIcon(false);
    }

    themeToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('light-mode');
        const isLight = document.body.classList.contains('light-mode');
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
        updateThemeIcon(isLight);
    });
}

function updateThemeIcon(isLight) {
    const sunIcon = themeToggleBtn.querySelector('.sun-icon');
    const moonIcon = themeToggleBtn.querySelector('.moon-icon');

    if (isLight) {
        sunIcon.style.display = 'block';
        moonIcon.style.display = 'none';
        themeToggleBtn.title = "Mudar para Modo Escuro";
    } else {
        sunIcon.style.display = 'none';
        moonIcon.style.display = 'block';
        themeToggleBtn.title = "Mudar para Modo Claro";
    }
}

async function initializeApp() {
    setupEventListeners();
    await loadPrinters();
    startAutoRefresh();
}

function setupEventListeners() {
    // Search
    searchInput.addEventListener('input', (e) => {
        searchTerm = e.target.value.toLowerCase();
        renderPrinters();
    });

    // Filter buttons
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderPrinters();
        });
    });

    // Refresh button
    refreshBtn.addEventListener('click', async () => {
        refreshBtn.disabled = true;
        await loadPrinters(true);
        refreshBtn.disabled = false;
    });
}

async function loadPrinters(forceRefresh = false) {
    try {
        showLoading();

        if (forceRefresh) {
            // Force refresh on server
            await fetch(`${API_BASE_URL}/printers/refresh`, {
                method: 'POST'
            });
        }

        // Get printer statuses
        const response = await fetch(`${API_BASE_URL}/printers/status`);

        if (!response.ok) {
            throw new Error('Failed to fetch printer data');
        }

        allPrinters = await response.json();
        renderPrinters();
        updateStats();
        updateLastUpdateTime();

        if (forceRefresh) {
            showToast('Dados atualizados com sucesso!');
        }
    } catch (error) {
        console.error('Error loading printers:', error);
        showError('Erro ao carregar dados das impressoras');
    }
}

function renderPrinters() {
    const filteredPrinters = filterPrinters(allPrinters);

    if (filteredPrinters.length === 0) {
        printersGrid.innerHTML = `
            <div class="no-data">
                <p>Nenhuma impressora encontrada</p>
            </div>
        `;
        return;
    }

    printersGrid.innerHTML = filteredPrinters.map(printer => createPrinterCard(printer)).join('');
}

function filterPrinters(printers) {
    return printers.filter(printer => {
        // Search filter
        const matchesSearch = !searchTerm ||
            printer.name.toLowerCase().includes(searchTerm) ||
            printer.location.toLowerCase().includes(searchTerm) ||
            printer.model.toLowerCase().includes(searchTerm) ||
            printer.ip.includes(searchTerm);

        if (!matchesSearch) return false;

        // Status filter
        switch (currentFilter) {
            case 'all':
                return true;
            case 'online':
                return printer.status === 'online';
            case 'alert':
                return hasLowToner(printer);
            case 'hp':
                return printer.manufacturer.toUpperCase() === 'HP';
            case 'pantum':
                return printer.manufacturer.toUpperCase() === 'PANTUM';
            default:
                return true;
        }
    });
}

function hasLowToner(printer) {
    if (!printer.toners || Object.keys(printer.toners).length === 0) {
        return false;
    }

    return Object.values(printer.toners).some(toner => toner.percentage < 20);
}

function createPrinterCard(printer) {
    const isOnline = printer.status === 'online';
    const toners = printer.toners || {};
    const hasToners = Object.keys(toners).length > 0;

    return `
        <div class="printer-card ${isOnline ? '' : 'offline'}" data-printer-id="${printer.id}">
            <div class="printer-header">
                <div class="printer-info">
                    <div class="name-edit-container">
                        <h3 class="printer-name-display">${escapeHtml(printer.name)}</h3>
                        <input 
                            type="text" 
                            class="printer-name-edit" 
                            value="${escapeHtml(printer.name)}" 
                            style="display: none;"
                            data-field="name"
                        />
                        <button class="edit-btn" onclick="toggleEditMode(${printer.id}, 'name')" title="Editar nome">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                        </button>
                    </div>
                    <div class="page-count-container" style="color: #a0aec0; font-size: 0.9rem; display: flex; align-items: center; gap: 6px; margin-top: 4px;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                            <line x1="16" y1="13" x2="8" y2="13"/>
                            <line x1="16" y1="17" x2="8" y2="17"/>
                            <polyline points="10 9 9 9 8 9"/>
                        </svg>
                        <span>Contador: <strong>${printer.pageCount || 0}</strong></span>
                    </div>
                    <div class="model">${escapeHtml(printer.model)}</div>
                </div>
                <span class="status-badge ${isOnline ? 'online' : 'offline'}">
                    ${isOnline ? 'Online' : 'Offline'}
                </span>
            </div>

            <div class="printer-details">
                <div class="detail-row">
                    <span class="detail-label">IP:</span>
                    <span class="detail-value">${escapeHtml(printer.ip)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Fabricante:</span>
                    <span class="detail-value">${escapeHtml(printer.manufacturer)}</span>
                </div>
                <div class="detail-row editable-detail-row">
                    <span class="detail-label">Série:</span>
                    <span class="detail-value serial-display">${escapeHtml(printer.serial)}</span>
                    <input 
                        type="text" 
                        class="detail-edit serial-edit" 
                        value="${escapeHtml(printer.serial)}" 
                        style="display: none;"
                        data-field="serial"
                        placeholder="Número de série"
                    />
                    <button class="edit-btn-small" onclick="toggleEditMode(${printer.id}, 'serial')" title="Editar série">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                    </button>
                </div>
            </div>

            ${isOnline && hasToners ? `
                <div class="toner-levels">
                    ${Object.entries(toners).map(([color, data]) =>
        createTonerBar(color, data)
    ).join('')}
                </div>
            ` : `
                <div class="no-data">
                    ${isOnline ? 'Dados de toner não disponíveis' : 'Impressora offline'}
                </div>
            `}
        </div>
    `;
}


function createTonerBar(color, data) {
    const percentage = data.percentage || 0;
    const level = percentage >= 50 ? 'high' : percentage >= 20 ? 'medium' : 'low';

    const colorNames = {
        'black': 'Preto',
        'cyan': 'Ciano',
        'magenta': 'Magenta',
        'yellow': 'Amarelo',
        'cartridge_1': 'Cartucho 1',
        'cartridge_2': 'Cartucho 2',
        'cartridge_3': 'Cartucho 3',
        'cartridge_4': 'Cartucho 4'
    };

    const colorIndicators = {
        'black': '#000000',
        'cyan': '#00FFFF',
        'magenta': '#FF00FF',
        'yellow': '#FFFF00',
        'cartridge_1': '#667eea',
        'cartridge_2': '#764ba2',
        'cartridge_3': '#f093fb',
        'cartridge_4': '#f5576c'
    };

    return `
        <div class="toner-item">
            <div class="toner-header">
                <span class="toner-name">
                    <span class="toner-color-indicator" style="background-color: ${colorIndicators[color] || '#667eea'}"></span>
                    ${colorNames[color] || color}
                </span>
                <span class="toner-percentage">${percentage}%</span>
            </div>
            <div class="toner-bar">
                <div class="toner-fill ${level}" style="width: ${percentage}%"></div>
            </div>
        </div>
    `;
}

function updateStats() {
    const online = allPrinters.filter(p => p.status === 'online').length;
    const alerts = allPrinters.filter(p => hasLowToner(p)).length;

    onlineCount.textContent = online;
    alertCount.textContent = alerts;
}

function updateLastUpdateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    lastUpdate.textContent = timeString;
}

function showLoading() {
    printersGrid.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>Carregando impressoras...</p>
        </div>
    `;
}

function showError(message) {
    printersGrid.innerHTML = `
        <div class="no-data">
            <p style="color: #ff6b6b;">${escapeHtml(message)}</p>
        </div>
    `;
}

function showToast(message) {
    const toastMessage = toast.querySelector('.toast-message');
    toastMessage.textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function startAutoRefresh() {
    // Clear existing timer
    if (autoRefreshTimer) {
        clearInterval(autoRefreshTimer);
    }

    // Set new timer
    autoRefreshTimer = setInterval(() => {
        loadPrinters(false);
    }, AUTO_REFRESH_INTERVAL);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Toggle edit mode for a field
function toggleEditMode(printerId, field) {
    const card = document.querySelector(`[data-printer-id="${printerId}"]`);
    if (!card) return;

    const isEditing = card.classList.contains(`editing-${field}`);

    if (isEditing) {
        // Save mode
        savePrinterField(printerId, field, card);
    } else {
        // Enter edit mode
        card.classList.add(`editing-${field}`);

        if (field === 'name') {
            const display = card.querySelector('.printer-name-display');
            const input = card.querySelector('.printer-name-edit');
            const btn = card.querySelector('.name-edit-container .edit-btn');

            display.style.display = 'none';
            input.style.display = 'block';
            input.focus();
            input.select();

            btn.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"/>
                </svg>
            `;
            btn.title = 'Salvar';
            btn.title = 'Salvar';
        } else if (field === 'serial') {
            const display = card.querySelector('.serial-display');
            const input = card.querySelector('.serial-edit');
            const btn = card.querySelector('.editable-detail-row .edit-btn-small');

            display.style.display = 'none';
            input.style.display = 'inline-block';
            input.focus();
            input.select();

            btn.innerHTML = `
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"/>
                </svg>
            `;
            btn.title = 'Salvar';
        }
    }
}

// Save printer field
async function savePrinterField(printerId, field, card) {
    let input, newValue;

    if (field === 'name') {
        input = card.querySelector('.printer-name-edit');
    } else if (field === 'serial') {
        input = card.querySelector('.serial-edit');
    }

    newValue = input.value.trim();

    if (!newValue) {
        showToast('O campo não pode estar vazio', 'error');
        return;
    }

    // Find printer in allPrinters array
    const printerIndex = allPrinters.findIndex(p => p.id === printerId);
    if (printerIndex === -1) return;

    const printer = allPrinters[printerIndex];
    const oldValue = printer[field];

    // Update local state
    printer[field] = newValue;

    try {
        // Save to server
        const response = await fetch(`${API_BASE_URL}/printers/${printerId}/update`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                field: field,
                value: newValue
            })
        });

        if (!response.ok) {
            throw new Error('Failed to update printer');
        }

        // Exit edit mode
        card.classList.remove(`editing-${field}`);

        if (field === 'name') {
            const display = card.querySelector('.printer-name-display');
            const btn = card.querySelector('.name-edit-container .edit-btn');

            display.textContent = newValue;
            display.style.display = 'block';
            input.style.display = 'none';

            btn.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
            `;
            btn.title = 'Editar nome';
            btn.title = 'Editar nome';
        } else if (field === 'serial') {
            const display = card.querySelector('.serial-display');
            const btn = card.querySelector('.editable-detail-row .edit-btn-small');

            display.textContent = newValue;
            display.style.display = 'inline';
            input.style.display = 'none';

            btn.innerHTML = `
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
            `;
            btn.title = 'Editar série';
        }

        showToast('Atualizado com sucesso!');
    } catch (error) {
        console.error('Error saving printer field:', error);
        // Revert local state
        printer[field] = oldValue;
        showToast('Erro ao salvar alteração', 'error');
    }
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
    }, 3000);
}

