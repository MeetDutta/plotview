// State Management
let plots = [];
let decorations = [];
let selectedPlotId = null;
let currentImageFilename = null;
let activeProjectId = null;
let projects = [];

let activeTool = 'select'; // select, draw, edit, delete
let apiKey = '';

// Auth State Management
let currentUser = null; // { id, username, name, role }
let authToken = localStorage.getItem('auth_token') || null;

// Viewport Zoom & Pan
let scale = 1;
let panX = 0;
let panY = 0;
let isDraggingViewport = false;
let dragStartX = 0;
let dragStartY = 0;

// Interactive Vector drawing / editing
let drawingPoints = [];
let draggedNodeIndex = null;
let currentFilter = 'all';

// State Management for Plot Editing
let ploteditCropper = null;
let ploteditFilename = null;
let ploteditCandidates = [];
let ploteditImageSize = { width: 0, height: 0 };
let ploteditBlobUrl = null;
let ploteditIsCropperReady = false;

// DOM Elements
const loginView = document.getElementById('login-view');
const loginUsernameInput = document.getElementById('login-username');
const loginPasswordInput = document.getElementById('login-password');
const loginSubmitBtn = document.getElementById('login-submit-btn');
const loginErrorMsg = document.getElementById('login-error-msg');
const loginErrorText = document.getElementById('login-error-text');
const logoutBtn = document.getElementById('logout-btn');
const logoutBtnEditor = document.getElementById('logout-btn-editor');
const adminUsersBtn = document.getElementById('admin-users-btn');

// DOM Elements for Plot Editing
const ploteditModal = document.getElementById('plotedit-modal');
const ploteditCloseBtn = document.getElementById('plotedit-close-btn');
const ploteditCancelBtn = document.getElementById('plotedit-cancel-btn');
const ploteditSaveBtn = document.getElementById('plotedit-save-btn');
const openPloteditBtn = document.getElementById('open-plotedit-btn');
const ploteditSourceImg = document.getElementById('plotedit-source-img');
const ploteditPreviewImg = document.getElementById('plotedit-preview-img');
const ploteditPreviewPlaceholder = document.getElementById('plotedit-preview-placeholder');
const ploteditPreviewCard = document.getElementById('plotedit-preview-card');

const ploteditRotateLeft = document.getElementById('plotedit-rotate-left');
const ploteditRotateRight = document.getElementById('plotedit-rotate-right');
const ploteditReset = document.getElementById('plotedit-reset');
const ploteditSuggestionChips = document.getElementById('plotedit-suggestion-chips');
const ploteditSuggestionsBar = document.getElementById('plotedit-suggestions-bar');

const ploteditColorPreview = document.getElementById('plotedit-color-preview');
const ploteditColorHex = document.getElementById('plotedit-color-hex');
const ploteditColorPicker = document.getElementById('plotedit-color-picker');
const ploteditTriggerPicker = document.getElementById('plotedit-trigger-picker');
const ploteditEyedropper = document.getElementById('plotedit-eyedropper');

const ploteditToleranceSlider = document.getElementById('plotedit-tolerance-slider');
const ploteditToleranceVal = document.getElementById('plotedit-tolerance-val');
const ploteditSharpnessSlider = document.getElementById('plotedit-sharpness-slider');
const ploteditSharpnessVal = document.getElementById('plotedit-sharpness-val');
const ploteditContrastSlider = document.getElementById('plotedit-contrast-slider');
const ploteditContrastVal = document.getElementById('plotedit-contrast-val');
const ploteditBrightnessSlider = document.getElementById('plotedit-brightness-slider');
const ploteditBrightnessVal = document.getElementById('plotedit-brightness-val');
const ploteditSaturationSlider = document.getElementById('plotedit-saturation-slider');
const ploteditSaturationVal = document.getElementById('plotedit-saturation-val');
const ploteditDimensionInfo = document.getElementById('plotedit-dimension-info');

const homeView = document.getElementById('home-view');
const editorView = document.getElementById('editor-view');
const backToHomeBtn = document.getElementById('back-to-home-btn');
const homeCreateBtn = document.getElementById('home-create-btn');
const homeUsersBtn = document.getElementById('home-users-btn');
const projectSearch = document.getElementById('project-search');
const projectGrid = document.getElementById('project-grid');
const activeProjectTitle = document.getElementById('active-project-title');
const renameProjectBtn = document.getElementById('rename-project-btn');

const viewport = document.getElementById('canvas-container'); // viewport points to canvas-container
const canvasContainer = document.getElementById('canvas-container');
const mapImage = document.getElementById('map-image');
const svgOverlay = document.getElementById('svg-overlay');
const fileInput = document.getElementById('file-input');
const uploadZone = document.getElementById('upload-zone');
const fileInfoCard = document.getElementById('file-info-card');
const fileInfoName = document.getElementById('file-info-name');
const removeFileBtn = document.getElementById('remove-file-btn');

const csvUploadZone = document.getElementById('csv-upload-zone');
const csvFileInput = document.getElementById('csv-file-input');
const csvFileInfoCard = document.getElementById('csv-file-info-card');
const csvFileInfoName = document.getElementById('csv-file-info-name');
const removeCsvFileBtn = document.getElementById('remove-csv-file-btn');

const apiKeyInput = document.getElementById('api-key-input');
const saveKeyBtn = document.getElementById('save-key-btn');
const toggleKeyVisibility = document.getElementById('toggle-key-visibility');
const apiStatusDot = document.getElementById('api-status-dot');
const apiStatusText = document.getElementById('api-status-text');

const runAiBtn = document.getElementById('run-ai-btn');
const runCvBtn = document.getElementById('run-cv-btn');

const toolSelect = document.getElementById('tool-select');
const toolDraw = document.getElementById('tool-draw');
const toolEdit = document.getElementById('tool-edit');
const toolDelete = document.getElementById('tool-delete');

const exportHtmlBtn = document.getElementById('export-html-btn');
const addPlotBtn = document.getElementById('add-plot-btn');

const zoomInBtn = document.getElementById('zoom-in-btn');
const zoomOutBtn = document.getElementById('zoom-out-btn');
const zoomResetBtn = document.getElementById('zoom-reset-btn');

const tabListBtn = document.getElementById('tab-list-btn');
const tabEditBtn = document.getElementById('tab-edit-btn');
const tabAnalyticsBtn = document.getElementById('tab-analytics-btn');
const tabList = document.getElementById('tab-list');
const tabEdit = document.getElementById('tab-edit');
const tabAnalytics = document.getElementById('tab-analytics');
const printReceiptBtn = document.getElementById('print-receipt-btn');

const searchPlots = document.getElementById('search-plots');
const plotsList = document.getElementById('plots-list');
const editPaneContent = document.getElementById('edit-pane-content');
const editPanePlaceholder = document.getElementById('edit-pane-placeholder');

// Read-only info elements
const infoNumber = document.getElementById('info-number');
const infoSize = document.getElementById('info-size');
const infoArea = document.getElementById('info-area');
const infoPrice = document.getElementById('info-price');
const infoNotes = document.getElementById('info-notes');
const infoStatusBadge = document.getElementById('info-status-badge');

// Edit inputs
const editNumber = document.getElementById('edit-number');
const editSize = document.getElementById('edit-size');
const editArea = document.getElementById('edit-area');
const editPrice = document.getElementById('edit-price');
const editNotes = document.getElementById('edit-notes');

// Conditional inputs and overlays
const agentReservationBox = document.getElementById('agent-reservation-box');
const agentBuyerName = document.getElementById('agent-buyer-name');
const agentTokenAmount = document.getElementById('agent-token-amount');
const agentConfirmResBtn = document.getElementById('agent-confirm-res-btn');

const infoReservationRow = document.getElementById('info-reservation-row');
const infoReservationVal = document.getElementById('info-reservation-val');
const infoContractRow = document.getElementById('info-contract-row');
const infoContractVal = document.getElementById('info-contract-val');

const toggleEditorBtn = document.getElementById('toggle-editor-btn');
const plotEditFields = document.getElementById('plot-edit-fields');

const toggleStatusBtn = document.getElementById('toggle-status-btn');
const plotStatusFields = document.getElementById('plot-status-fields');
const deletePlotBtn = document.getElementById('delete-plot-btn');
const editStatus = document.getElementById('edit-status');
const editBuyerName = document.getElementById('edit-buyer-name');
const editTokenAmount = document.getElementById('edit-token-amount');
const editContractRef = document.getElementById('edit-contract-ref');
const saveStatusBtn = document.getElementById('save-status-btn');
const saveSpecsBtn = document.getElementById('save-specs-btn');
const statusReservationGroup = document.getElementById('status-reservation-group');
const statusSaleGroup = document.getElementById('status-sale-group');

let editorExpanded = false;
let statusEditorExpanded = false;

const themeSelectors = document.querySelectorAll('.theme-selector');
const homeHelpBtn = document.getElementById('home-help-btn');
const editorHelpBtn = document.getElementById('editor-help-btn');
const helpModal = document.getElementById('help-modal');
const helpCloseBtn = document.getElementById('help-close-btn');
const helpOkBtn = document.getElementById('help-ok-btn');

let currentTheme = localStorage.getItem('workspace_theme') || 'slate';

const statTotal = document.getElementById('stat-total');
const statAvailable = document.getElementById('stat-available');
const statSold = document.getElementById('stat-sold');

const loadingOverlay = document.getElementById('loading-overlay');
const loadingText = document.getElementById('loading-text');
const loadingSubtext = document.getElementById('loading-subtext');

// Confirmation and Tooltip overlays
const confirmModal = document.getElementById('confirm-modal');
const confirmModalTitle = document.getElementById('confirm-modal-title');
const confirmModalBody = document.getElementById('confirm-modal-body');
const confirmCancelBtn = document.getElementById('confirm-cancel-btn');
const confirmProceedBtn = document.getElementById('confirm-proceed-btn');
let confirmCallback = null;

// Custom Prompt Modal elements
const promptModal = document.getElementById('prompt-modal');
const promptModalTitle = document.getElementById('prompt-modal-title');
const promptModalLabel = document.getElementById('prompt-modal-label');
const promptModalInput = document.getElementById('prompt-modal-input');
const promptCancelBtn = document.getElementById('prompt-cancel-btn');
const promptSubmitBtn = document.getElementById('prompt-submit-btn');

// CV Advanced settings elements
const cvSettingsPanel = document.getElementById('cv-settings-panel');
const toggleCvSettingsBtn = document.getElementById('toggle-cv-settings-btn');
const cvSettingsChevron = document.getElementById('cv-settings-chevron');
const cvSettingsContent = document.getElementById('cv-settings-content');

const cvMinAreaSlider = document.getElementById('cv-min-area-slider');
const cvMinAreaVal = document.getElementById('cv-min-area-val');
const cvMaxAreaSlider = document.getElementById('cv-max-area-slider');
const cvMaxAreaVal = document.getElementById('cv-max-area-val');
const cvEpsilonSlider = document.getElementById('cv-epsilon-slider');
const cvEpsilonVal = document.getElementById('cv-epsilon-val');
const cvSoliditySlider = document.getElementById('cv-solidity-slider');
const cvSolidityVal = document.getElementById('cv-solidity-val');

const mapTooltip = document.getElementById('map-tooltip');

// Agent Manager modal elements
const agentManagerModal = document.getElementById('agent-manager-modal');
const closeAgentsBtn = document.getElementById('close-agents-btn');
const newAgentUsername = document.getElementById('new-agent-username');
const newAgentPassword = document.getElementById('new-agent-password');
const newAgentName = document.getElementById('new-agent-name');
const newAgentRole = document.getElementById('new-agent-role');
const createAgentSubmit = document.getElementById('create-agent-submit');
const agentsListTbody = document.getElementById('agents-list-tbody');

// Tabs for approvals modal
const tabActiveUsers = document.getElementById('tab-active-users');
const tabPendingRequests = document.getElementById('tab-pending-requests');
const activeUsersPanel = document.getElementById('active-users-panel');
const pendingRequestsPanel = document.getElementById('pending-requests-panel');
const requestsListTbody = document.getElementById('requests-list-tbody');

// Signup Request DOM Elements
const signinCard = document.getElementById('signin-card');
const signupCard = document.getElementById('signup-card');
const toggleSignupBtn = document.getElementById('toggle-signup-btn');
const toggleSigninBtn = document.getElementById('toggle-signin-btn');
const signupNameInput = document.getElementById('signup-name');
const signupUsernameInput = document.getElementById('signup-username');
const signupPasswordInput = document.getElementById('signup-password');
const signupSubmitBtn = document.getElementById('signup-submit-btn');
const signupMsg = document.getElementById('signup-msg');
const signupMsgText = document.getElementById('signup-msg-text');

// Helper wrapper for API communication
async function authFetch(url, options = {}) {
    if (!options.headers) {
        options.headers = {};
    }
    const token = localStorage.getItem('auth_token');
    if (token) {
        options.headers['X-User-Token'] = token;
    }
    
    // Auto stringify bodies if needed
    if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
        options.body = JSON.stringify(options.body);
        options.headers['Content-Type'] = 'application/json';
    }
    
    const response = await fetch(url, options);
    if (response.status === 401) {
        logout();
        throw new Error('Unauthorized session. Relogging...');
    }
    return response;
}

// Initialize session state
function init() {
    setTheme(currentTheme);
    setupEventListeners();
    checkLoginState();
    checkBackendApiConfig();
}

// Check if user is logged in
function checkLoginState() {
    const token = localStorage.getItem('auth_token');
    const savedUser = localStorage.getItem('current_user');
    if (token && savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            authToken = token;
            loginView.style.display = 'none';
            applyRolePermissions();
            
            const urlParams = new URLSearchParams(window.location.search);
            const projectParam = urlParams.get('project');
            if (projectParam) {
                showEditorView(projectParam);
            } else {
                showHomeView();
            }
            return;
        } catch (e) {
            console.error('Error parsing saved user', e);
        }
    }
    
    // Show login page
    loginView.style.display = 'flex';
    homeView.style.display = 'none';
    editorView.style.display = 'none';
}

// Perform login request
async function login(username, password) {
    loginErrorMsg.style.display = 'none';
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const result = await response.json();
        if (result.success) {
            localStorage.setItem('auth_token', result.token);
            localStorage.setItem('current_user', JSON.stringify(result.user));
            currentUser = result.user;
            authToken = result.token;
            
            // Clear inputs
            loginUsernameInput.value = '';
            loginPasswordInput.value = '';
            
            // Fade out login overlay
            loginView.style.display = 'none';
            applyRolePermissions();
            showHomeView();
        } else {
            showLoginError(result.error || 'Invalid credentials');
        }
    } catch (e) {
        showLoginError('Connection error. Please try again.');
        console.error(e);
    }
}

function showLoginError(msg) {
    loginErrorText.textContent = msg;
    loginErrorMsg.style.display = 'flex';
}

// Perform logout
function logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');
    currentUser = null;
    authToken = null;
    
    // Redirect to login overlay
    loginView.style.display = 'flex';
    homeView.style.display = 'none';
    editorView.style.display = 'none';
    
    // Clear project state
    plots = [];
    decorations = [];
    selectedPlotId = null;
    activeProjectId = null;
}

// Update DOM elements layout according to role access boundaries
function applyRolePermissions() {
    if (!currentUser) return;
    
    const role = currentUser.role;
    
    // Set user profiles display
    const homeUserName = document.getElementById('home-user-name');
    const editorUserName = document.getElementById('editor-user-name');
    
    if (homeUserName) homeUserName.textContent = `${currentUser.name} (${role === 'admin' ? 'Admin' : 'Agent'})`;
    if (editorUserName) editorUserName.textContent = `${currentUser.name} (${role === 'admin' ? 'Admin' : 'Agent'})`;
    
    // Hide/show elements based on roles
    const adminElements = document.querySelectorAll('.admin-only');
    const agentElements = document.querySelectorAll('.agent-only');
    
    if (role === 'admin') {
        adminElements.forEach(el => {
            if (el.id === 'plot-edit-fields') {
                el.style.display = editorExpanded ? 'flex' : 'none';
            } else if (el.id === 'admin-controls-wrapper') {
                el.style.display = 'flex';
            } else {
                el.style.display = 'block';
            }
        });
        agentElements.forEach(el => el.style.display = 'none');
        
        // Ensure manual geometry canvas tools are enabled
        if (toolDraw) toolDraw.disabled = false;
        if (toolEdit) toolEdit.disabled = false;
        if (toolDelete) toolDelete.disabled = false;
    } else {
        adminElements.forEach(el => el.style.display = 'none');
        agentElements.forEach(el => {
            if (el.id === 'agent-dashboard-wrapper') {
                el.style.display = 'flex';
            } else {
                el.style.display = 'block';
            }
        });
        
        // Disable layout edit tools
        if (toolDraw) toolDraw.disabled = true;
        if (toolEdit) toolEdit.disabled = true;
        if (toolDelete) toolDelete.disabled = true;
        
        // Revert active tool to 'select' if drawing tools were active
        if (activeTool !== 'select') {
            switchTool('select');
        }
    }
}


function checkBackendApiConfig() {
    fetch('/api/config')
        .then(res => res.json())
        .then(data => {
            apiKeyConfiguredOnBackend = !!data.gemini_api_configured;
            if (apiKeyInput) {
                if (apiKeyConfiguredOnBackend) {
                    apiKeyInput.placeholder = "Configured in background";
                } else {
                    apiKeyInput.placeholder = "Enter Gemini API Key";
                }
            }
            updateApiStatus(!!apiKey || apiKeyConfiguredOnBackend);
        })
        .catch(err => console.error("Error checking backend API config:", err));
}

// Theme Manager Helper
function setTheme(themeName) {
    document.body.classList.remove('theme-slate', 'theme-emerald', 'theme-amethyst', 'theme-amber', 'theme-frost');
    document.body.classList.add(`theme-${themeName}`);
    currentTheme = themeName;
    localStorage.setItem('workspace_theme', themeName);
    
    themeSelectors.forEach(select => {
        select.value = themeName;
    });
}

// API Status Helper
function updateApiStatus(active) {
    if (active) {
        apiStatusDot.classList.add('active');
        apiStatusText.textContent = "Gemini AI Configured";
    } else {
        apiStatusDot.classList.remove('active');
        apiStatusText.textContent = "Gemini AI Offline";
    }
}

// Event Listeners Configuration
function setupEventListeners() {
    // Signup request toggles
    toggleSignupBtn.addEventListener('click', (e) => {
        e.preventDefault();
        signinCard.style.display = 'none';
        signupCard.style.display = 'flex';
        signupMsg.style.display = 'none';
        signupNameInput.value = '';
        signupUsernameInput.value = '';
        signupPasswordInput.value = '';
    });
    
    toggleSigninBtn.addEventListener('click', (e) => {
        e.preventDefault();
        signupCard.style.display = 'none';
        signinCard.style.display = 'flex';
        loginErrorMsg.style.display = 'none';
    });
    
    signupSubmitBtn.addEventListener('click', submitSignupRequest);

    // Modal Tabs Toggling
    tabActiveUsers.addEventListener('click', () => {
        tabActiveUsers.className = 'btn btn-primary';
        tabPendingRequests.className = 'btn btn-secondary';
        activeUsersPanel.style.display = 'block';
        pendingRequestsPanel.style.display = 'none';
        openAgentManagerModal();
    });
    
    tabPendingRequests.addEventListener('click', () => {
        tabPendingRequests.className = 'btn btn-primary';
        tabActiveUsers.className = 'btn btn-secondary';
        activeUsersPanel.style.display = 'none';
        pendingRequestsPanel.style.display = 'block';
        fetchRequestsList();
    });

    // Authentication events
    loginSubmitBtn.addEventListener('click', () => {
        login(loginUsernameInput.value.trim(), loginPasswordInput.value);
    });
    loginUsernameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') loginPasswordInput.focus();
    });
    loginPasswordInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') login(loginUsernameInput.value.trim(), loginPasswordInput.value);
    });
    
    logoutBtn.addEventListener('click', logout);
    logoutBtnEditor.addEventListener('click', logout);
    
    // Agent Manager Modal listeners
    adminUsersBtn.addEventListener('click', openAgentManagerModal);
    homeUsersBtn.addEventListener('click', openAgentManagerModal);
    closeAgentsBtn.addEventListener('click', () => {
        agentManagerModal.style.display = 'none';
        agentManagerModal.classList.remove('active');
        // Reset tabs on close
        tabActiveUsers.className = 'btn btn-primary';
        tabPendingRequests.className = 'btn btn-secondary';
        activeUsersPanel.style.display = 'block';
        pendingRequestsPanel.style.display = 'none';
    });
    createAgentSubmit.addEventListener('click', createAgentAccount);
    
    // Confirmation dialogue listeners
    confirmCancelBtn.addEventListener('click', () => {
        confirmModal.style.display = 'none';
        confirmModal.classList.remove('active');
        confirmCallback = null;
    });
    confirmProceedBtn.addEventListener('click', () => {
        if (confirmCallback) confirmCallback();
        confirmModal.style.display = 'none';
        confirmModal.classList.remove('active');
        confirmCallback = null;
    });

    // Transaction action listeners
    agentConfirmResBtn.addEventListener('click', handleAgentReservationSubmit);
    
    // Status Form listeners
    toggleStatusBtn.addEventListener('click', () => {
        statusEditorExpanded = !statusEditorExpanded;
        plotStatusFields.style.display = statusEditorExpanded ? 'flex' : 'none';
        
        // Collapse specs form when opening status form
        if (statusEditorExpanded) {
            editorExpanded = false;
            plotEditFields.style.display = 'none';
            toggleEditorBtn.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Edit Plot Specifications';
        }
        
        toggleStatusBtn.innerHTML = statusEditorExpanded 
            ? '<i class="fa-solid fa-compress"></i> Hide Status Form' 
            : '<i class="fa-solid fa-sliders"></i> Change Plot Status';
    });

    editStatus.addEventListener('change', updateStatusFieldsVisibility);

    saveStatusBtn.addEventListener('click', handleAdminStatusChangeSubmit);
    if (deletePlotBtn) {
        deletePlotBtn.addEventListener('click', handleDeletePlotSubmit);
    }

    // Help and Themes
    homeHelpBtn.addEventListener('click', () => {
        helpModal.style.display = 'flex';
        helpModal.classList.add('active');
    });
    editorHelpBtn.addEventListener('click', () => {
        helpModal.style.display = 'flex';
        helpModal.classList.add('active');
    });
    helpCloseBtn.addEventListener('click', () => {
        helpModal.style.display = 'none';
        helpModal.classList.remove('active');
    });
    helpOkBtn.addEventListener('click', () => {
        helpModal.style.display = 'none';
        helpModal.classList.remove('active');
    });

    themeSelectors.forEach(select => {
        select.addEventListener('change', (e) => {
            setTheme(e.target.value);
        });
    });

    // Homepage Catalog Navigation
    backToHomeBtn.addEventListener('click', showHomeView);
    homeCreateBtn.addEventListener('click', createNewProject);
    projectSearch.addEventListener('input', () => renderProjectsGrid(projectSearch.value));
    renameProjectBtn.addEventListener('click', handleProjectRename);

    // Tabs Toggling
    tabListBtn.addEventListener('click', () => switchTab('list'));
    tabEditBtn.addEventListener('click', () => switchTab('edit'));
    if (tabAnalyticsBtn) {
        tabAnalyticsBtn.addEventListener('click', () => switchTab('analytics'));
    }
    
    if (printReceiptBtn) {
        printReceiptBtn.addEventListener('click', () => {
            if (selectedPlotId) {
                const plot = plots.find(p => p.id === selectedPlotId);
                if (plot) {
                    printBookingReceipt(plot);
                }
            }
        });
    }
    
    // File Uploads
    uploadZone.addEventListener('click', () => {
        if (currentUser && currentUser.role === 'admin') fileInput.click();
    });
    fileInput.addEventListener('change', handleFileSelect);
    
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (currentUser && currentUser.role === 'admin') uploadZone.classList.add('dragover');
    });
    uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));
    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('dragover');
        if (currentUser && currentUser.role === 'admin' && e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
        }
    });
    
    removeFileBtn.addEventListener('click', removeUploadedFile);
    
    // CSV Upload Event Listeners (Admin only)
    if (csvUploadZone) {
        csvUploadZone.addEventListener('click', () => {
            if (currentUser && currentUser.role === 'admin') csvFileInput.click();
        });
        csvFileInput.addEventListener('change', handleCsvFileSelect);
        
        csvUploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (currentUser && currentUser.role === 'admin') csvUploadZone.classList.add('dragover');
        });
        csvUploadZone.addEventListener('dragleave', () => csvUploadZone.classList.remove('dragover'));
        csvUploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            csvUploadZone.classList.remove('dragover');
            if (currentUser && currentUser.role === 'admin' && e.dataTransfer.files.length > 0) {
                handleCsvFile(e.dataTransfer.files[0]);
            }
        });
    }
    if (removeCsvFileBtn) {
        removeCsvFileBtn.addEventListener('click', removeCsvFile);
    }
    

    
    // Processing triggers
    runCvBtn.addEventListener('click', triggerLocalCvDetection);
    runAiBtn.addEventListener('click', triggerAiDetection);

    // CV Settings accordion toggle
    if (toggleCvSettingsBtn) {
        toggleCvSettingsBtn.addEventListener('click', () => {
            const isHidden = cvSettingsContent.style.display === 'none';
            cvSettingsContent.style.display = isHidden ? 'flex' : 'none';
            cvSettingsChevron.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
        });
    }

    // CV sliders value displays update
    if (cvMinAreaSlider) {
        cvMinAreaSlider.addEventListener('input', (e) => {
            cvMinAreaVal.textContent = e.target.value + '%';
        });
    }
    if (cvMaxAreaSlider) {
        cvMaxAreaSlider.addEventListener('input', (e) => {
            cvMaxAreaVal.textContent = e.target.value + '%';
        });
    }
    if (cvEpsilonSlider) {
        cvEpsilonSlider.addEventListener('input', (e) => {
            cvEpsilonVal.textContent = e.target.value;
        });
    }
    if (cvSoliditySlider) {
        cvSoliditySlider.addEventListener('input', (e) => {
            cvSolidityVal.textContent = e.target.value;
        });
    }
    
    // Tool buttons triggers
    toolSelect.addEventListener('click', () => setTool('select'));
    toolDraw.addEventListener('click', () => {
        if (currentUser && currentUser.role === 'admin') setTool('draw');
    });
    toolEdit.addEventListener('click', () => {
        if (currentUser && currentUser.role === 'admin') setTool('edit');
    });
    toolDelete.addEventListener('click', () => {
        if (currentUser && currentUser.role === 'admin') setTool('delete');
    });
    
    // Zoom Buttons
    zoomInBtn.addEventListener('click', () => zoomView(0.2));
    zoomOutBtn.addEventListener('click', () => zoomView(-0.2));
    zoomResetBtn.addEventListener('click', resetView);
    
    // Viewport mouse navigation
    viewport.addEventListener('mousedown', handleViewportMouseDown);
    window.addEventListener('mousemove', handleViewportMouseMove);
    window.addEventListener('mouseup', handleViewportMouseUp);
    viewport.addEventListener('wheel', handleViewportWheel, { passive: false });
    
    // Viewport mobile touch navigation
    viewport.addEventListener('touchstart', handleViewportTouchStart, { passive: false });
    viewport.addEventListener('touchmove', handleViewportTouchMove, { passive: false });
    viewport.addEventListener('touchend', handleViewportTouchEnd);
    
    // Text inputs in details pane (updates only on submit button - Admin only)
    if (saveSpecsBtn) {
        saveSpecsBtn.addEventListener('click', handleAdminSpecsChangeSubmit);
    }

    
    // Search / Filters
    searchPlots.addEventListener('input', () => renderPlotsList());
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderPlotsList();
        });
    });
    
    // Toggle edit specifications collapsible form
    toggleEditorBtn.addEventListener('click', () => {
        editorExpanded = !editorExpanded;
        plotEditFields.style.display = editorExpanded ? 'flex' : 'none';
        
        // Collapse status form when opening specs form
        if (editorExpanded) {
            statusEditorExpanded = false;
            plotStatusFields.style.display = 'none';
            toggleStatusBtn.innerHTML = '<i class="fa-solid fa-sliders"></i> Change Plot Status';
        }
        
        toggleEditorBtn.innerHTML = editorExpanded 
            ? '<i class="fa-solid fa-compress"></i> Hide Specifications Form' 
            : '<i class="fa-solid fa-pen-to-square"></i> Edit Plot Specifications';
    });

    // Exports
    exportHtmlBtn.addEventListener('click', exportInteractiveMap);
    
    // Add Plot manually
    if (addPlotBtn) {
        addPlotBtn.addEventListener('click', () => {
            const plotNum = prompt("Enter Plot Number:");
            if (plotNum === null) return;
            const cleanedNum = plotNum.trim();
            if (!cleanedNum) {
                alert("Plot number cannot be empty.");
                return;
            }
            
            const exists = plots.some(p => p.plot_number.toLowerCase() === cleanedNum.toLowerCase());
            if (exists) {
                alert(`Plot ${cleanedNum} already exists.`);
                return;
            }
            
            // Default center relative SVG coords box [45, 45, 55, 55]
            const defaultPolygon = [
                [45.0, 45.0],
                [55.0, 45.0],
                [55.0, 55.0],
                [45.0, 55.0]
            ];
            
            const newPlot = {
                id: `plot_drawn_${Date.now()}`,
                plot_number: cleanedNum,
                size: "30 x 40",
                area: "1200 SQFT",
                polygon: defaultPolygon,
                status: "available",
                price: "",
                notes: "Manually created plot"
            };
            
            plots.push(newPlot);
            renderPlotsList();
            updateStats();
            renderSVG();
            selectPlot(newPlot.id);
            setTool('edit');
            autoSaveActiveProject();
        });
    }
    
    // Cancel drawing using Escape key
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && activeTool === 'draw') {
            cancelDrawing();
        }
    });
    
    // Call PlotEdit event listeners setup
    setupPlotEditEventListeners();
}



// Tab Switching
function switchTab(tabName) {
    tabListBtn.classList.remove('active');
    tabEditBtn.classList.remove('active');
    if (tabAnalyticsBtn) tabAnalyticsBtn.classList.remove('active');
    
    tabList.classList.remove('active');
    tabEdit.classList.remove('active');
    if (tabAnalytics) {
        tabAnalytics.classList.remove('active');
        tabAnalytics.style.display = 'none';
    }
    
    if (tabName === 'list') {
        tabListBtn.classList.add('active');
        tabList.classList.add('active');
    } else if (tabName === 'edit') {
        tabEditBtn.classList.add('active');
        tabEdit.classList.add('active');
    } else if (tabName === 'analytics') {
        if (tabAnalyticsBtn && tabAnalytics) {
            tabAnalyticsBtn.classList.add('active');
            tabAnalytics.classList.add('active');
            tabAnalytics.style.display = 'flex';
            renderAnalyticsDashboard();
        }
    }
}

// File uploads helpers
function handleFileSelect(e) {
    if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
    }
}

function handleFile(file) {
    if (!activeProjectId) {
        alert("No active plan selected!");
        return;
    }
    const formData = new FormData();
    formData.append('image', file);
    
    showLoader("Uploading original layout...", "Analyzing contours and color palettes...");
    
    authFetch('/api/projects/' + activeProjectId + '/plotedit/upload-temp', {
        method: 'POST',
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        hideLoader();
        if (data.success) {
            // Clear inputs
            fileInput.value = '';
            
            // Set state
            ploteditFilename = data.filename;
            ploteditCandidates = data.candidates;
            ploteditImageSize = data.image_size;
            
            // Set suggested background color
            const bgRgb = data.suggested_bg_color;
            const bgHex = rgbToHex(bgRgb[0], bgRgb[1], bgRgb[2]);
            updateActiveColor(bgHex);
            
            // Set custom preset chip color
            const customPreset = document.getElementById('plotedit-custom-preset');
            if (customPreset) {
                customPreset.setAttribute('data-color', bgHex);
                customPreset.style.setProperty('--chip-color', bgHex);
            }
            
            // Open Plotedit modal
            openPlotEditModal(data.filename);
        } else {
            alert("Upload failed: " + data.error);
        }
    })
    .catch(err => {
        hideLoader();
        console.error(err);
        alert("Server error uploading layout image.");
    });
}

function removeUploadedFile() {
    currentImageFilename = null;
    mapImage.src = '';
    mapImage.style.display = 'none';
    fileInfoCard.style.display = 'none';
    fileInput.value = '';
    if (openPloteditBtn) openPloteditBtn.style.display = 'none';
    
    // Disable generation buttons
    runAiBtn.disabled = true;
    runCvBtn.disabled = true;
    if (cvSettingsPanel) cvSettingsPanel.style.display = 'none';
    
    plots = [];
    decorations = [];
    selectedPlotId = null;
    renderSVG();
    renderPlotsList();
    updateStats();
    
    // Auto-save the cleared image filename state
    if (activeProjectId) {
        fetch(`/api/projects/${activeProjectId}/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                plots: [],
                decorations: [],
                image_filename: null
            })
        });
    }
}

// CSV File Upload Handlers
function handleCsvFileSelect(e) {
    if (e.target.files.length > 0) {
        handleCsvFile(e.target.files[0]);
    }
}

function handleCsvFile(file) {
    if (!activeProjectId) {
        alert("No active plan selected!");
        return;
    }
    
    if (!file.name.endsWith('.csv')) {
        alert("Please upload a valid CSV file (.csv)!");
        return;
    }
    
    const formData = new FormData();
    formData.append('csv_file', file);
    
    showLoader("Uploading CSV plot data...", "Parsing properties and syncing layout databases");
    
    authFetch(`/api/projects/${activeProjectId}/upload-csv`, {
        method: 'POST',
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        hideLoader();
        if (data.success) {
            plots = data.plots || [];
            csvFileInfoName.textContent = file.name;
            csvFileInfoCard.style.display = 'block';
            
            // Re-render display
            selectedPlotId = null;
            renderSVG();
            renderPlotsList();
            updateStats();
            
            alert(data.message || "CSV plot data successfully imported!");
        } else {
            alert("CSV Upload failed: " + data.error);
        }
        csvFileInput.value = '';
    })
    .catch(err => {
        hideLoader();
        console.error(err);
        alert("Server error uploading CSV.");
        csvFileInput.value = '';
    });
}

function removeCsvFile() {
    csvFileInfoCard.style.display = 'none';
    csvFileInfoName.textContent = '';
    csvFileInput.value = '';
}




// API Extraction Trigger: OpenCV
function triggerLocalCvDetection() {
    if (!currentImageFilename) {
        alert("Please upload a map image first!");
        return;
    }
    
    showLoader("Computer Vision Processing...", "Executing contour vector approximation on server...");
    
    const minArea = cvMinAreaSlider ? parseFloat(cvMinAreaSlider.value) / 100.0 : 0.0005;
    const maxArea = cvMaxAreaSlider ? parseFloat(cvMaxAreaSlider.value) / 100.0 : 0.08;
    const epsilon = cvEpsilonSlider ? parseFloat(cvEpsilonSlider.value) : 0.02;
    const solidity = cvSoliditySlider ? parseFloat(cvSoliditySlider.value) : 0.70;

    authFetch('/api/detect-cv', {
        method: 'POST',
        body: { 
            filename: currentImageFilename,
            min_area_ratio: minArea,
            max_area_ratio: maxArea,
            epsilon_ratio: epsilon,
            solidity_threshold: solidity
        }
    })
    .then(res => res.json())
    .then(data => {
        hideLoader();
        if (data.success) {
            plots = data.plots;
            selectedPlotId = null;
            renderSVG();
            renderPlotsList();
            updateStats();
            autoSaveActiveProject();
            alert(`Found ${plots.length} layout shapes using CV. You can now label them and update details.`);
        } else {
            alert("Error in CV detection: " + data.error);
        }
    })
    .catch(err => {
        hideLoader();
        console.error(err);
        alert("Failed to communicate with local CV backend.");
    });
}

// API Extraction Trigger: Gemini
function triggerAiDetection() {
    if (!currentImageFilename) {
        alert("Please upload a map image first!");
        return;
    }
    
    if (!apiKeyConfiguredOnBackend) {
        alert("Gemini API is not configured on the backend server. Please define the GEMINI_API_KEY environment variable in the server's .env file.");
        return;
    }
    
    showLoader("AI Processing (Gemini)...", "Sending layout map to Gemini Multimodal. This may take 15-20 seconds...");
    
    authFetch('/api/detect-ai', {
        method: 'POST',
        body: {
            filename: currentImageFilename,
            ...(apiKey ? { api_key: apiKey } : {})
        }
    })
    .then(res => res.json())
    .then(data => {
        hideLoader();
        if (data.success) {
            plots = data.plots;
            decorations = data.decorations || [];
            selectedPlotId = null;
            renderSVG();
            renderPlotsList();
            updateStats();
            autoSaveActiveProject();
            alert(`Successfully digitized ${plots.length} plots with numbers, sizes and boundary polygons!`);

        } else {
            alert("AI Error: " + data.error);
        }
    })
    .catch(err => {
        hideLoader();
        console.error(err);
        alert("Failed to communicate with AI server.");
    });
}

// Canvas Navigation: Pan and Zoom
function handleViewportWheel(e) {
    e.preventDefault();
    const zoomSpeed = 0.08;
    const delta = e.deltaY > 0 ? -zoomSpeed : zoomSpeed;
    
    // Zoom centering on mouse pointer coordinates
    const rect = viewport.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const imageMouseX = (mouseX - panX) / scale;
    const imageMouseY = (mouseY - panY) / scale;
    
    scale = Math.max(0.4, Math.min(6, scale + delta));
    
    panX = mouseX - imageMouseX * scale;
    panY = mouseY - imageMouseY * scale;
    
    updateCanvasTransform();
}

function handleViewportMouseDown(e) {
    // Drag nodes takes precedence in edit mode
    if (activeTool === 'edit' && e.target.classList.contains('handle-circle')) {
        draggedNodeIndex = parseInt(e.target.dataset.index);
        e.stopPropagation();
        return;
    }
    
    // Select/Delete polygon takes precedence on click
    if ((activeTool === 'select' || activeTool === 'delete') && e.target.tagName === 'polygon') {
        const id = e.target.dataset.id;
        if (activeTool === 'delete') {
            if (confirm("Delete this plot boundary?")) {
                plots = plots.filter(p => p.id !== id);
                if (selectedPlotId === id) selectedPlotId = null;
                renderSVG();
                renderPlotsList();
                updateStats();
                updatePropertiesPanel();
                autoSaveActiveProject();
            }
        } else {
            selectPlot(id);
        }
        e.stopPropagation();
        return;
    }

    // Custom drawing action in draw tool
    if (activeTool === 'draw') {
        const coords = getSVGCoords(e);
        
        // If clicking close to the first point, close the polygon
        if (drawingPoints.length > 2 && getDistance(coords, {x: drawingPoints[0][0], y: drawingPoints[0][1]}) < 1.5) {
            closeDrawing();
        } else {
            drawingPoints.push([coords.x, coords.y]);
            renderSVG();
        }
        e.stopPropagation();
        return;
    }
    
    // Otherwise fallback to viewport drag panning
    isDraggingViewport = true;
    dragStartX = e.clientX - panX;
    dragStartY = e.clientY - panY;
    viewport.style.cursor = 'grabbing';
}

function handleViewportMouseMove(e) {
    // If dragging node in Adjust mode
    if (activeTool === 'edit' && draggedNodeIndex !== null && selectedPlotId) {
        const coords = getSVGCoords(e);
        const plot = plots.find(p => p.id === selectedPlotId);
        if (plot) {
            plot.polygon[draggedNodeIndex] = [coords.x, coords.y];
            renderSVG();
        }
        return;
    }

    // If viewport panning
    if (isDraggingViewport) {
        panX = e.clientX - dragStartX;
        panY = e.clientY - dragStartY;
        updateCanvasTransform();
        return;
    }
    
    // Live update drawing temporary lines
    if (activeTool === 'draw' && drawingPoints.length > 0) {
        const coords = getSVGCoords(e);
        renderSVG(coords);
    }
}

function handleViewportMouseUp() {
    isDraggingViewport = false;
    if (draggedNodeIndex !== null) {
        autoSaveActiveProject();
    }
    draggedNodeIndex = null;
    viewport.style.cursor = activeTool === 'select' ? 'default' : (activeTool === 'draw' ? 'crosshair' : 'default');
}

function updateCanvasTransform() {
    canvasContainer.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
}

function zoomView(factor) {
    scale = Math.max(0.4, Math.min(6, scale + factor));
    updateCanvasTransform();
}

function resetView() {
    scale = 1;
    panX = 0;
    panY = 0;
    updateCanvasTransform();
}

// Mobile Touch Navigation Logic
let touchStartX = 0;
let touchStartY = 0;
let touchStartDist = 0;
let isPanningTouch = false;
let isPinchingTouch = false;

function handleViewportTouchStart(e) {
    if (e.touches.length === 1) {
        const touch = e.touches[0];
        
        // Handle touch plot selection (similar to click)
        if (activeTool === 'select' && e.target.tagName === 'polygon') {
            const id = e.target.dataset.id;
            selectPlot(id);
            e.preventDefault();
            return;
        }
        
        isPanningTouch = true;
        touchStartX = touch.clientX - panX;
        touchStartY = touch.clientY - panY;
    } else if (e.touches.length === 2) {
        isPanningTouch = false;
        isPinchingTouch = true;
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        touchStartDist = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
        e.preventDefault();
    }
}

function handleViewportTouchMove(e) {
    if (isPanningTouch && e.touches.length === 1) {
        const touch = e.touches[0];
        panX = touch.clientX - touchStartX;
        panY = touch.clientY - touchStartY;
        updateCanvasTransform();
        e.preventDefault();
    } else if (isPinchingTouch && e.touches.length === 2) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const dist = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
        
        const scaleChange = (dist - touchStartDist) * 0.015;
        const newScale = Math.max(0.4, Math.min(6, scale + scaleChange));
        
        const midX = (touch1.clientX + touch2.clientX) / 2;
        const midY = (touch1.clientY + touch2.clientY) / 2;
        const rect = viewport.getBoundingClientRect();
        const mouseX = midX - rect.left;
        const mouseY = midY - rect.top;
        
        const imageMouseX = (mouseX - panX) / scale;
        const imageMouseY = (mouseY - panY) / scale;
        
        scale = newScale;
        panX = mouseX - imageMouseX * scale;
        panY = mouseY - imageMouseY * scale;
        
        touchStartDist = dist;
        updateCanvasTransform();
        e.preventDefault();
    }
}

function handleViewportTouchEnd(e) {
    isPanningTouch = false;
    isPinchingTouch = false;
}

// Convert screen mouse coords to relative SVG percentage coordinates (0-100)
function getSVGCoords(event) {
    const rect = svgOverlay.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    return {
        x: Math.max(0.0, Math.min(100.0, Math.round(x * 100) / 100)),
        y: Math.max(0.0, Math.min(100.0, Math.round(y * 100) / 100))
    };
}

function getDistance(p1, p2) {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

// Tool Selection
function setTool(tool) {
    activeTool = tool;
    
    // Toggle active CSS classes
    toolSelect.classList.remove('active');
    toolDraw.classList.remove('active');
    toolEdit.classList.remove('active');
    toolDelete.classList.remove('active');
    
    viewport.classList.remove('pan-mode', 'draw-mode');
    
    if (tool === 'select') {
        toolSelect.classList.add('active');
        viewport.classList.add('pan-mode');
    } else if (tool === 'draw') {
        toolDraw.classList.add('active');
        viewport.classList.add('draw-mode');
        drawingPoints = [];
    } else if (tool === 'edit') {
        toolEdit.classList.add('active');
    } else if (tool === 'delete') {
        toolDelete.classList.add('active');
    }
    
    renderSVG();
}

// Plot Selection Management
function selectPlot(id, zoomTo = false) {
    selectedPlotId = id;
    renderSVG();
    
    // Highlight list row
    document.querySelectorAll('.plot-row').forEach(row => {
        row.classList.remove('selected');
        if (row.dataset.id === id) {
            row.classList.add('selected');
            row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    });
    
    updatePropertiesPanel();
    
    if (id) {
        switchTab('edit');
    }
    
    if (zoomTo && id) {
        const plot = plots.find(p => p.id === id);
        if (plot && plot.polygon.length > 0) {
            const center = getPolygonCenter(plot.polygon);
            const viewRect = viewport.getBoundingClientRect();
            const containerRect = canvasContainer.getBoundingClientRect();
            
            // Zoom to 1.8x centered on the polygon center
            scale = 1.8;
            const containerWidth = 800;
            const containerHeight = 800;
            panX = (viewRect.width / 2) - ((center.x / 100) * containerWidth * scale);
            panY = (viewRect.height / 2) - ((center.y / 100) * containerHeight * scale);
            updateCanvasTransform();
        }
    }
}

function getPolygonCenter(points) {
    let xSum = 0, ySum = 0;
    points.forEach(pt => {
        xSum += pt[0];
        ySum += pt[1];
    });
    return { x: xSum / points.length, y: ySum / points.length };
}

// Status editor visibility helpers
function updateStatusFieldsVisibility() {
    const val = editStatus.value;
    if (val === 'available') {
        statusReservationGroup.style.display = 'none';
        statusSaleGroup.style.display = 'none';
    } else if (val === 'reserved') {
        statusReservationGroup.style.display = 'flex';
        statusSaleGroup.style.display = 'none';
    } else if (val === 'sold') {
        statusReservationGroup.style.display = 'flex';
        statusSaleGroup.style.display = 'flex';
    }
}

async function handleAdminStatusChangeSubmit() {
    if (!selectedPlotId) return;
    const plot = plots.find(p => p.id === selectedPlotId);
    if (!plot) return;

    const newStatus = editStatus.value;
    const buyer = editBuyerName.value.trim();
    const token = editTokenAmount.value.trim();
    const contract = editContractRef.value.trim();

    if (newStatus === 'reserved') {
        if (!buyer || !token) {
            alert("Buyer Name and Token Amount are required to reserve this plot.");
            return;
        }
    } else if (newStatus === 'sold') {
        if (!buyer || !token) {
            alert("Buyer Name and Token Amount are required when marking a plot as Sold.");
            return;
        }
        if (!contract) {
            alert("Contract Reference Number is required when marking a plot as Sold.");
            return;
        }
    }

    // Apply changes
    plot.status = newStatus;
    if (newStatus === 'available') {
        plot.buyer_name = null;
        plot.token_amount = null;
        plot.contract_ref = null;
        plot.reserved_by_agent = null;
        plot.reserved_at = null;
        plot.sold_at = null;
    } else if (newStatus === 'reserved') {
        plot.buyer_name = buyer;
        plot.token_amount = token;
        plot.contract_ref = null;
        plot.sold_at = null;
        if (!plot.reserved_by_agent) {
            plot.reserved_by_agent = currentUser.id;
            plot.reserved_at = new Date().toISOString();
        }
    } else if (newStatus === 'sold') {
        plot.buyer_name = buyer;
        plot.token_amount = token;
        plot.contract_ref = contract;
        if (!plot.reserved_by_agent) {
            plot.reserved_by_agent = currentUser.id;
            plot.reserved_at = new Date().toISOString();
        }
        plot.sold_at = new Date().toISOString();
    }

    // Update visuals & list
    renderSVG();
    renderPlotsList();
    updatePropertiesPanel();
    
    // Save to server
    autoSaveActiveProject();
    
    alert("Plot status successfully updated to " + newStatus.toUpperCase());
}

function handleDeletePlotSubmit() {
    if (!selectedPlotId) return;
    if (!currentUser || currentUser.role !== 'admin') {
        alert("Only administrators can delete plots.");
        return;
    }
    
    const plot = plots.find(p => p.id === selectedPlotId);
    if (!plot) return;
    
    const confirmDelete = confirm(`Are you sure you want to delete Plot ${plot.plot_number} completely from this layout?`);
    if (!confirmDelete) return;
    
    // Remove the plot
    plots = plots.filter(p => p.id !== selectedPlotId);
    selectedPlotId = null;
    
    // Update display and switch tab
    renderSVG();
    renderPlotsList();
    updateStats();
    switchTab('list');
    
    // Auto-save changes to the server
    autoSaveActiveProject();
    
    alert("Plot was successfully deleted.");
}

// Properties editor updating
function updatePropertiesPanel() {
    const plot = plots.find(p => p.id === selectedPlotId);
    if (plot) {
        // Reset subform values
        agentBuyerName.value = '';
        agentTokenAmount.value = '';

        // Populate read-only specifications sheet
        infoNumber.textContent = plot.plot_number || 'N/A';
        
        infoStatusBadge.textContent = plot.status.toUpperCase();
        infoStatusBadge.className = `status-badge badge-${plot.status}`;
        
        const infoNoBoundaryMsg = document.getElementById('info-no-boundary-msg');
        if (infoNoBoundaryMsg) {
            if (!plot.polygon || plot.polygon.length === 0) {
                infoNoBoundaryMsg.style.display = 'flex';
            } else {
                infoNoBoundaryMsg.style.display = 'none';
            }
        }
        
        infoSize.textContent = plot.size || 'N/A';
        infoArea.textContent = plot.area || 'N/A';
        infoPrice.textContent = plot.price || 'N/A';
        infoNotes.textContent = plot.notes || 'No description provided.';
        
        // Show/hide reservation info row
        if (plot.status === 'reserved') {
            infoReservationRow.style.display = 'flex';
            
            const isOwner = currentUser && (plot.reserved_by_agent === currentUser.id);
            if (currentUser && currentUser.role === 'admin') {
                infoReservationVal.textContent = `Reserved by ${plot.reserved_by_name || 'System'} (Buyer: ${plot.buyer_name || 'Anonymous'}, Token: ₹${plot.token_amount || '0'})`;
            } else if (isOwner) {
                infoReservationVal.textContent = `Reserved by you (Buyer: ${plot.buyer_name}, Token: ₹${plot.token_amount})`;
            } else {
                infoReservationVal.textContent = `Reserved by ${plot.reserved_by_name || 'another agent'}`;
            }
        } else {
            infoReservationRow.style.display = 'none';
        }
        
        // Show/hide contract info row
        if (plot.status === 'sold') {
            infoContractRow.style.display = 'flex';
            infoContractVal.textContent = plot.contract_ref === '[Restricted]' ? '[Restricted]' : `#${plot.contract_ref || 'N/A'}`;
        } else {
            infoContractRow.style.display = 'none';
        }

        // Show/hide appropriate action boxes based on status & role
        if (currentUser) {
            const role = currentUser.role;
            
            if (role === 'agent') {
                // Agents reserve available plots
                if (plot.status === 'available') {
                    agentReservationBox.style.display = 'flex';
                } else {
                    agentReservationBox.style.display = 'none';
                }
                toggleEditorBtn.style.display = 'none';
                toggleStatusBtn.style.display = 'none';
                if (deletePlotBtn) deletePlotBtn.style.display = 'none';
            } else if (role === 'admin') {
                agentReservationBox.style.display = 'none';
                toggleEditorBtn.style.display = 'flex';
                toggleStatusBtn.style.display = 'flex';
                if (deletePlotBtn) deletePlotBtn.style.display = 'flex';
            }
        }

        // Populate edit inputs (Admin only)
        editNumber.value = plot.plot_number || '';
        editSize.value = plot.size || '';
        editArea.value = plot.area || '';
        editPrice.value = plot.price || '';
        editNotes.value = plot.notes || '';
        
        editStatus.value = plot.status || 'available';
        editBuyerName.value = plot.buyer_name || '';
        editTokenAmount.value = plot.token_amount || '';
        editContractRef.value = plot.contract_ref || '';
        
        // Configure input visibility based on current status
        updateStatusFieldsVisibility();
        
        if (printReceiptBtn) {
            if (plot.status === 'reserved' || plot.status === 'sold') {
                printReceiptBtn.style.display = 'flex';
            } else {
                printReceiptBtn.style.display = 'none';
            }
        }
        
        // Reset collapsible form display when changing selection
        editorExpanded = false;
        plotEditFields.style.display = 'none';
        toggleEditorBtn.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Edit Plot Specifications';
        
        statusEditorExpanded = false;
        plotStatusFields.style.display = 'none';
        toggleStatusBtn.innerHTML = '<i class="fa-solid fa-sliders"></i> Change Plot Status';
        
        editPaneContent.style.display = 'flex';
        editPanePlaceholder.style.display = 'none';
    } else {
        if (printReceiptBtn) printReceiptBtn.style.display = 'none';
        editPaneContent.style.display = 'none';
        editPanePlaceholder.style.display = 'flex';
    }
}

// Update state when editor fields change
// Update state when admin clicks specs submit button
async function handleAdminSpecsChangeSubmit() {
    if (!selectedPlotId) return;
    if (!currentUser || currentUser.role !== 'admin') {
        alert("Only administrators can modify plot specifications.");
        return;
    }
    const plot = plots.find(p => p.id === selectedPlotId);
    if (!plot) return;

    const newNumber = editNumber.value.trim();
    if (!newNumber) {
        alert("Plot number cannot be empty.");
        return;
    }

    // Check uniqueness if the plot number changes
    const oldId = plot.id;
    const newId = `plot_${newNumber}`;
    if (newId !== oldId) {
        const idExists = plots.some(p => p.id === newId);
        if (idExists) {
            alert(`Plot number "${newNumber}" already exists. Please choose a unique plot number.`);
            return;
        }
        plot.id = newId;
        selectedPlotId = newId;
    }

    // Apply values
    plot.plot_number = newNumber;
    plot.size = editSize.value.trim();
    plot.area = editArea.value.trim();
    plot.price = editPrice.value.trim();
    plot.notes = editNotes.value.trim();

    // Dynamic update to the read-only specifications sheet
    document.getElementById('info-number').textContent = plot.plot_number || 'N/A';
    document.getElementById('info-size').textContent = plot.size || 'N/A';
    document.getElementById('info-area').textContent = plot.area || 'N/A';
    document.getElementById('info-price').textContent = plot.price || 'N/A';
    document.getElementById('info-notes').textContent = plot.notes || 'No description provided.';

    // Re-render components
    renderSVG();
    renderPlotsList();
    updateStats();

    // Save to server
    autoSaveActiveProject();

    alert("Plot specifications successfully updated");
}


// Manual Drawing Helpers
function closeDrawing() {
    if (drawingPoints.length < 3) {
        cancelDrawing();
        return;
    }
    
    // Check if we are drawing for an existing selected plot
    const existingPlot = plots.find(p => p.id === selectedPlotId);
    if (existingPlot) {
        const hasNoPolygon = !existingPlot.polygon || existingPlot.polygon.length === 0;
        if (hasNoPolygon || confirm(`Redraw boundary for Plot ${existingPlot.plot_number}?`)) {
            existingPlot.polygon = [...drawingPoints];
            drawingPoints = [];
            setTool('select');
            selectPlot(existingPlot.id);
            renderPlotsList();
            updateStats();
            autoSaveActiveProject();
            return;
        }
    }
    
    // Create new plot object
    const nextIndex = plots.length + 1;
    const newPlot = {
        id: `plot_drawn_${Date.now()}`,
        plot_number: `${nextIndex}`,
        size: "Custom Size",
        area: "Custom Area",
        polygon: [...drawingPoints],
        status: "available",
        price: "",
        notes: "Manually drawn boundary"
    };
    
    plots.push(newPlot);
    drawingPoints = [];
    setTool('select');
    selectPlot(newPlot.id);
    renderPlotsList();
    updateStats();
    autoSaveActiveProject();
}

function cancelDrawing() {
    drawingPoints = [];
    setTool('select');
}

// Render SVGs to the canvas
function renderSVG(tempCursorPos = null) {
    svgOverlay.innerHTML = '';
    
    // 1. Draw static decorations (roads, parks, surrounding sites)
    decorations.forEach(dec => {
        const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        const pointsStr = dec.polygon.map(pt => pt.join(',')).join(' ');
        polygon.setAttribute("points", pointsStr);
        polygon.setAttribute("class", dec.type); // 'road' or 'site_boundary'
        svgOverlay.appendChild(polygon);
        
        // Render road/boundary text labels
        if (dec.label) {
            const center = getPolygonCenter(dec.polygon);
            const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            text.setAttribute("x", center.x);
            text.setAttribute("y", center.y);
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("dominant-baseline", "middle");
            
            let font_size = "0.7px";
            let fill_color = "#94a3b8";
            if (dec.type === 'site_boundary') {
                font_size = "0.55px";
                fill_color = "#475569";
            } else if (dec.type === 'open_space' || dec.type === 'park' || dec.type === 'garden') {
                font_size = "0.65px";
                fill_color = "#a7f3d0"; // Mint green text for contrast
            } else if (dec.type === 'amenity') {
                font_size = "0.65px";
                fill_color = "#fde68a"; // Soft amber text for contrast
            }
            
            text.setAttribute("style", `fill: ${fill_color}; font-size: ${font_size}; font-weight: 600; pointer-events: none;`);
            text.textContent = dec.label;
            svgOverlay.appendChild(text);
        }
    });
    
    // 2. Draw Saved Plots
    plots.forEach(plot => {
        const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        const pointsStr = plot.polygon.map(pt => pt.join(',')).join(' ');
        
        polygon.setAttribute("points", pointsStr);
        
        let statusClass = `status-${plot.status}`;
        if (plot.status === 'reserved') {
            if (currentUser && plot.reserved_by_agent === currentUser.id) {
                statusClass += ' by-me';
            } else {
                statusClass += ' by-other';
            }
        }
        polygon.setAttribute("class", `plot-shape ${statusClass} ${plot.id === selectedPlotId ? 'selected' : ''}`);
        polygon.setAttribute("data-id", plot.id);
        
        // Tooltip hover handlers
        polygon.addEventListener('mouseenter', (e) => {
            mapTooltip.style.display = 'block';
            updateTooltipContent(plot);
        });
        
        polygon.setAttribute("style", "outline: none;");
        polygon.addEventListener('mousemove', (e) => {
            mapTooltip.style.left = (e.pageX + 12) + 'px';
            mapTooltip.style.top = (e.pageY + 12) + 'px';
        });
        
        polygon.addEventListener('mouseleave', () => {
            mapTooltip.style.display = 'none';
        });
        
        svgOverlay.appendChild(polygon);
        
        // Render plot numbers on right top corner (or center for special spaces)
        if (plot.polygon.length > 2 && plot.plot_number) {
            const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            text.setAttribute("class", `plot-label ${plot.id === selectedPlotId ? 'selected' : ''}`);
            
            let x, y;
            let textAnchor = "end";
            let dominantBaseline = "hanging";
            let font_size = "0.75px";
            let text_shadow = "0.4px 0.4px 1px #000";
            
            if (plot.plot_number === "Open Space" || plot.plot_number === "Amenity Space") {
                const center = getPolygonCenter(plot.polygon);
                x = center.x;
                y = center.y;
                textAnchor = "middle";
                dominantBaseline = "middle";
                font_size = "1.2px";
                text_shadow = "none";
            } else {
                let maxX = -Infinity;
                let minY = Infinity;
                plot.polygon.forEach(pt => {
                    if (pt[0] > maxX) maxX = pt[0];
                    if (pt[1] < minY) minY = pt[1];
                });
                x = maxX - 0.7;
                y = minY + 0.7;
            }
            
            text.setAttribute("x", x);
            text.setAttribute("y", y);
            text.setAttribute("text-anchor", textAnchor);
            text.setAttribute("dominant-baseline", dominantBaseline);
            
            text.setAttribute("style", `fill: #fff; font-size: ${font_size}; font-weight: 700; pointer-events: none; text-shadow: ${text_shadow}; letter-spacing: -0.05px; transition: opacity 0.25s ease;`);
            text.textContent = plot.plot_number;
            svgOverlay.appendChild(text);
        }
    });

    
    // 2. Draw handles if Adjust tool is selected
    if (activeTool === 'edit' && selectedPlotId) {
        const plot = plots.find(p => p.id === selectedPlotId);
        if (plot) {
            plot.polygon.forEach((pt, index) => {
                const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                circle.setAttribute("cx", pt[0]);
                circle.setAttribute("cy", pt[1]);
                circle.setAttribute("class", "handle-circle");
                circle.setAttribute("data-index", index);
                svgOverlay.appendChild(circle);
            });
        }
    }
    
    // 3. Draw temporary line segments during custom Drawing Mode
    if (activeTool === 'draw' && drawingPoints.length > 0) {
        // Draw path polygon
        if (drawingPoints.length > 1) {
            const tempPoly = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
            let pts = [...drawingPoints];
            if (tempCursorPos) pts.push([tempCursorPos.x, tempCursorPos.y]);
            tempPoly.setAttribute("points", pts.map(p => p.join(',')).join(' '));
            tempPoly.setAttribute("class", "temp-polygon");
            svgOverlay.appendChild(tempPoly);
        }
        
        // Draw dots at vertices
        drawingPoints.forEach(pt => {
            const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            circle.setAttribute("cx", pt[0]);
            circle.setAttribute("cy", pt[1]);
            circle.setAttribute("class", "temp-point");
            svgOverlay.appendChild(circle);
        });
        
        // Draw temporary text "Click first node to close" or standard lines
        if (tempCursorPos) {
            const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            const lastPt = drawingPoints[drawingPoints.length - 1];
            line.setAttribute("x1", lastPt[0]);
            line.setAttribute("y1", lastPt[1]);
            line.setAttribute("x2", tempCursorPos.x);
            line.setAttribute("y2", tempCursorPos.y);
            line.setAttribute("class", "temp-line");
            svgOverlay.appendChild(line);
        }
    }
}

// Render Plot directory (List of plots)
function renderPlotsList() {
    plotsList.innerHTML = '';
    const searchQuery = searchPlots.value.trim().toLowerCase();
    
    const filteredPlots = plots.filter(plot => {
        const matchesFilter = currentFilter === 'all' || plot.status === currentFilter;
        const matchesSearch = plot.plot_number.toLowerCase().includes(searchQuery);
        return matchesFilter && matchesSearch;
    });
    
    if (filteredPlots.length === 0) {
        plotsList.innerHTML = `
            <div class="no-selection" style="height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 2rem;">
                <i class="fa-solid fa-circle-exclamation no-selection-icon" style="font-size: 2rem; color: var(--primary); opacity: 0.5; margin-bottom: 0.5rem; filter: drop-shadow(0 4px 8px var(--primary-glow));"></i>
                <div style="font-weight: 700; color: var(--text-muted); font-size: 0.85rem;">No plots match filters</div>
            </div>
        `;
        return;
    }
    
    filteredPlots.forEach(plot => {
        const row = document.createElement('div');
        row.className = `plot-row ${plot.id === selectedPlotId ? 'selected' : ''}`;
        row.dataset.id = plot.id;
        
        row.innerHTML = `
            <div class="plot-row-left">
                <span class="plot-row-num">Plot ${plot.plot_number}</span>
                <span class="badge badge-${plot.status}">${plot.status}</span>
            </div>
            <div class="plot-row-right">
                <div>Size: ${plot.size}</div>
                <div>Area: ${plot.area || 'N/A'}</div>
            </div>
        `;
        
        row.addEventListener('click', () => {
            selectPlot(plot.id, true); // Zoom to plot when selected from list
        });
        
        plotsList.appendChild(row);
    });
}

// Statistics Update
function updateStats() {
    statTotal.textContent = plots.length;
    statAvailable.textContent = plots.filter(p => p.status === 'available').length;
    statSold.textContent = plots.filter(p => p.status === 'sold').length;
    
    // Auto trigger agent dashboard stats if agent
    if (currentUser && currentUser.role === 'agent') {
        updateAgentDashboard();
    }
}

// Loading Spinner Helpers
function showLoader(title, subtitle) {
    loadingText.textContent = title;
    loadingSubtext.textContent = subtitle;
    loadingOverlay.classList.add('active');
}

// Global modal overlays togglers
function hideLoader() {
    loadingOverlay.classList.remove('active');
}

// Confirmation dialogue displayer
function showConfirmation(title, body, callback) {
    confirmModalTitle.textContent = title;
    confirmModalBody.textContent = body;
    confirmCallback = callback;
    confirmModal.style.display = 'flex';
    confirmModal.classList.add('active');
}

// Beautiful Custom Prompt Modal Overlay Promise Displayer
function showPromptModal(title, label, defaultValue = '', placeholder = '') {
    return new Promise((resolve) => {
        promptModalTitle.textContent = title;
        promptModalLabel.textContent = label;
        promptModalInput.value = defaultValue;
        promptModalInput.placeholder = placeholder;
        
        promptModal.style.display = 'flex';
        promptModal.classList.add('active');
        promptModalInput.focus();

        const cleanup = () => {
            promptModal.style.display = 'none';
            promptModal.classList.remove('active');
            promptSubmitBtn.onclick = null;
            promptCancelBtn.onclick = null;
            promptModalInput.onkeydown = null;
        };

        promptSubmitBtn.onclick = () => {
            const val = promptModalInput.value.trim();
            cleanup();
            resolve(val);
        };

        promptCancelBtn.onclick = () => {
            cleanup();
            resolve(null);
        };

        promptModalInput.onkeydown = (e) => {
            if (e.key === 'Enter') {
                promptSubmitBtn.click();
            } else if (e.key === 'Escape') {
                promptCancelBtn.click();
            }
        };
    });
}


// Update Map Hover Tooltip
function updateTooltipContent(plot) {
    const isReserved = plot.status === 'reserved';
    const isSold = plot.status === 'sold';
    
    let isOwner = false;
    if (currentUser && plot.reserved_by_agent === currentUser.id) {
        isOwner = true;
    }
    
    const canViewPrice = (currentUser && currentUser.role === 'admin') || (!isSold && (!isReserved || isOwner));
    const displayPrice = canViewPrice ? (plot.price || 'N/A') : '[Restricted]';
    
    let statusLabel = plot.status.toUpperCase();
    if (isReserved) {
        if (isOwner) {
            statusLabel = "RESERVED BY YOU";
        } else {
            statusLabel = `RESERVED BY ${plot.reserved_by_name || 'Another Agent'}`;
        }
    }
    
    mapTooltip.innerHTML = `
        <div style="font-weight: 700; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 2px; margin-bottom: 4px;">Plot ${plot.plot_number || 'N/A'}</div>
        <div style="display: flex; flex-direction: column; gap: 2px; font-size: 0.7rem;">
            <div><strong>Area:</strong> ${plot.area || 'N/A'}</div>
            <div><strong>Price:</strong> ${displayPrice}</div>
            <div><strong>Status:</strong> <span style="color: ${
                plot.status === 'available' ? '#ffffff' : 
                (isReserved ? (isOwner ? '#cbd5e1' : '#94a3b8') : '#64748b')
            }; font-weight: bold;">${statusLabel}</span></div>
        </div>
    `;
}

// Simplified Agent Dashboard Calculations
function updateAgentDashboard() {
    if (!currentUser || currentUser.role !== 'agent') return;
    
    // My Reserved plots
    const myReservations = plots.filter(p => p.status === 'reserved' && p.reserved_by_agent === currentUser.id);
    document.getElementById('dash-active-reservations').textContent = myReservations.length;
    
    // My Closed sales (Sold plots)
    const myClosedSales = plots.filter(p => p.status === 'sold' && p.reserved_by_agent === currentUser.id);
    document.getElementById('dash-closed-sales').textContent = myClosedSales.length;
    
    // Total Token volume
    let totalTokenVal = 0;
    plots.forEach(p => {
        if (p.reserved_by_agent === currentUser.id && p.token_amount && p.token_amount !== '[Restricted]') {
            const val = parseFloat(p.token_amount.replace(/[^0-9.]/g, ''));
            if (!isNaN(val)) totalTokenVal += val;
        }
    });
    
    document.getElementById('dash-token-volume').textContent = `₹${totalTokenVal.toLocaleString()}`;
    
    // Render my bookings sidebar list
    const agentReservationsList = document.getElementById('agent-reservations-list');
    agentReservationsList.innerHTML = '';
    
    if (myReservations.length === 0) {
        agentReservationsList.innerHTML = `<li style="font-size: 0.75rem; color: var(--text-muted); text-align: center; padding: 1rem 0;">No active reservations.</li>`;
        return;
    }
    
    myReservations.forEach(p => {
        const li = document.createElement('li');
        li.style.cssText = "background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 0.4rem 0.6rem; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: background 0.2s; margin-bottom: 4px;";
        li.innerHTML = `
            <div style="font-weight: 600; font-size: 0.75rem;">Plot ${p.plot_number}</div>
            <div style="font-size: 0.65rem; color: var(--text-muted);">₹${p.token_amount || '0'}</div>
        `;
        li.addEventListener('mouseenter', () => li.style.background = 'rgba(255,255,255,0.06)');
        li.addEventListener('mouseleave', () => li.style.background = 'rgba(255,255,255,0.02)');
        li.addEventListener('click', () => {
            selectPlot(p.id, true); // Select and center focus
        });
        agentReservationsList.appendChild(li);
    });
}

// Admin Agent Accounts CRUD
async function openAgentManagerModal() {
    agentManagerModal.style.display = 'flex';
    agentManagerModal.classList.add('active');
    try {
        const response = await authFetch('/api/admin/agents');
        const agents = await response.json();
        renderAgentsList(agents);
    } catch (e) {
        alert(e.message);
    }
}

function renderAgentsList(agents) {
    agentsListTbody.innerHTML = '';
    
    if (agents.length === 0) {
        agentsListTbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 1.5rem; color: var(--text-muted);">No agents registered.</td></tr>`;
        return;
    }
    
    agents.forEach(agent => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid var(--border-color)';
        
        tr.innerHTML = `
            <td style="padding: 0.5rem 0.75rem; font-weight: 600;">${agent.name}</td>
            <td style="padding: 0.5rem 0.75rem; color: var(--text-muted);">${agent.username}</td>
            <td style="padding: 0.5rem 0.75rem;">
                <span class="status-badge" style="background: ${agent.active ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)'}; color: ${agent.active ? '#4ade80' : '#f87171'}; border: none; font-size: 0.65rem; padding: 0.15rem 0.35rem; display: inline-block;">
                    ${agent.active ? 'Active' : 'Deactivated'}
                </span>
            </td>
            <td style="padding: 0.5rem 0.75rem; text-align: right; display: flex; justify-content: flex-end; gap: 0.4rem;">
                <button class="btn btn-secondary" style="padding: 2px 6px; font-size: 0.65rem;" onclick="toggleAgentStatus('${agent.id}', ${!agent.active})">
                    <i class="fa-solid ${agent.active ? 'fa-user-slash' : 'fa-user-check'}"></i> ${agent.active ? 'Deactivate' : 'Activate'}
                </button>
                <button class="btn btn-danger" style="padding: 2px 6px; font-size: 0.65rem;" onclick="deleteAgentAccount('${agent.id}')">
                    <i class="fa-solid fa-trash"></i> Delete
                </button>
            </td>
        `;
        agentsListTbody.appendChild(tr);
    });
}

async function createAgentAccount() {
    const username = newAgentUsername.value.trim();
    const password = newAgentPassword.value;
    const name = newAgentName.value.trim();
    const role = newAgentRole.value;
    
    if (!username || !password || !name) {
        alert("All fields are required to create an account.");
        return;
    }
    
    try {
        const response = await authFetch('/api/admin/agents/new', {
            method: 'POST',
            body: { username, password, name, role }
        });
        const result = await response.json();
        if (result.success) {
            newAgentUsername.value = '';
            newAgentPassword.value = '';
            newAgentName.value = '';
            newAgentRole.value = 'agent';
            
            // Refresh list
            openAgentManagerModal();
        } else {
            alert("Failed to create user: " + result.error);
        }
    } catch (e) {
        alert(e.message);
    }
}

async function deleteAgentAccount(agentId) {
    if (!confirm("Are you sure you want to delete this user account permanently? This action cannot be undone.")) return;
    
    try {
        const response = await authFetch(`/api/admin/agents/${agentId}/delete`, {
            method: 'POST'
        });
        const result = await response.json();
        if (result.success) {
            openAgentManagerModal();
        } else {
            alert("Delete failed: " + result.error);
        }
    } catch (e) {
        alert(e.message);
    }
}

async function toggleAgentStatus(agentId, newActiveState) {
    try {
        const response = await authFetch(`/api/admin/agents/${agentId}/update`, {
            method: 'POST',
            body: { active: newActiveState }
        });
        const result = await response.json();
        if (result.success) {
            openAgentManagerModal();
        } else {
            alert("Update failed: " + result.error);
        }
    } catch (e) {
        alert(e.message);
    }
}

// Signup Request Submission (Public)
async function submitSignupRequest() {
    const name = signupNameInput.value.trim();
    const username = signupUsernameInput.value.trim();
    const password = signupPasswordInput.value;

    if (!name || !username || !password) {
        showSignupMessage("All fields are required.", false);
        return;
    }

    signupSubmitBtn.disabled = true;
    signupSubmitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting...';

    try {
        const response = await fetch('/api/register-request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, username, password })
        });
        const result = await response.json();
        
        if (result.success) {
            showSignupMessage(result.message, true);
            signupNameInput.value = '';
            signupUsernameInput.value = '';
            signupPasswordInput.value = '';
        } else {
            showSignupMessage(result.error, false);
        }
    } catch (err) {
        showSignupMessage("Network error. Please try again.", false);
    } finally {
        signupSubmitBtn.disabled = false;
        signupSubmitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Submit Access Request';
    }
}

function showSignupMessage(text, isSuccess) {
    signupMsgText.textContent = text;
    signupMsg.style.display = 'flex';
    
    if (isSuccess) {
        signupMsg.style.background = 'rgba(34, 197, 94, 0.15)';
        signupMsg.style.border = '1px solid rgba(34, 197, 94, 0.2)';
        signupMsg.style.color = '#4ade80';
        signupMsg.querySelector('.id-icon').className = 'fa-solid fa-circle-check id-icon';
    } else {
        signupMsg.style.background = 'rgba(239, 68, 68, 0.15)';
        signupMsg.style.border = '1px solid rgba(239, 68, 68, 0.2)';
        signupMsg.style.color = '#f87171';
        signupMsg.querySelector('.id-icon').className = 'fa-solid fa-circle-exclamation id-icon';
    }
}

// Fetch pending registrations queue
async function fetchRequestsList() {
    requestsListTbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 1.5rem; color: var(--text-muted);"><i class="fa-solid fa-spinner fa-spin"></i> Loading requests...</td></tr>';
    try {
        const response = await authFetch('/api/admin/requests');
        const requests = await response.json();
        renderRequestsList(requests);
    } catch (e) {
        requestsListTbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 1.5rem; color: #f87171;">Failed to load: ${e.message}</td></tr>`;
    }
}

function renderRequestsList(requests) {
    requestsListTbody.innerHTML = '';
    
    if (requests.length === 0) {
        requestsListTbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 1.5rem; color: var(--text-muted);">No pending authorization requests.</td></tr>';
        return;
    }
    
    requests.forEach(req => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid var(--border-color)';
        
        // Format ISO date cleanly
        let displayDate = 'N/A';
        if (req.requested_at) {
            try {
                const dateObj = new Date(req.requested_at);
                displayDate = dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            } catch (err) {}
        }
        
        tr.innerHTML = `
            <td style="padding: 0.5rem 0.75rem; font-weight: 600;">${req.name}</td>
            <td style="padding: 0.5rem 0.75rem; color: var(--text-muted);">${req.username}</td>
            <td style="padding: 0.5rem 0.75rem; color: var(--text-muted); font-size: 0.7rem;">${displayDate}</td>
            <td style="padding: 0.5rem 0.75rem; text-align: right; display: flex; justify-content: flex-end; gap: 0.4rem;">
                <button class="btn btn-primary" style="padding: 2px 8px; font-size: 0.65rem; font-weight: 700; background: #22c55e; border-color: #22c55e;" onclick="approveAgentRequest('${req.id}')">
                    <i class="fa-solid fa-user-check"></i> Approve
                </button>
                <button class="btn btn-danger" style="padding: 2px 8px; font-size: 0.65rem;" onclick="rejectAgentRequest('${req.id}')">
                    <i class="fa-solid fa-user-xmark"></i> Reject
                </button>
            </td>
        `;
        requestsListTbody.appendChild(tr);
    });
}

async function approveAgentRequest(reqId) {
    try {
        const response = await authFetch(`/api/admin/requests/${reqId}/approve`, { method: 'POST' });
        const result = await response.json();
        if (result.success) {
            fetchRequestsList();
        } else {
            alert("Approval failed: " + result.error);
        }
    } catch (e) {
        alert(e.message);
    }
}

async function rejectAgentRequest(reqId) {
    if (!confirm("Are you sure you want to reject this request? This will dismiss it permanently.")) return;
    try {
        const response = await authFetch(`/api/admin/requests/${reqId}/reject`, { method: 'POST' });
        const result = await response.json();
        if (result.success) {
            fetchRequestsList();
        } else {
            alert("Rejection failed: " + result.error);
        }
    } catch (e) {
        alert(e.message);
    }
}

// Bind callbacks to window so that inline HTML handlers can find them
window.approveAgentRequest = approveAgentRequest;
window.rejectAgentRequest = rejectAgentRequest;

// Transaction operations
async function handleAgentReservationSubmit() {
    const buyer = agentBuyerName.value.trim();
    const token = agentTokenAmount.value.trim();
    
    if (!buyer || !token) {
        alert("Buyer Name and Token Amount Paid are required to reserve this plot.");
        return;
    }
    
    showLoader("Submitting Reservation...", "Validating availability lock and recording deal...");
    try {
        const response = await authFetch(`/api/projects/${activeProjectId}/plots/${selectedPlotId}/reserve`, {
            method: 'POST',
            body: { buyer_name: buyer, token_amount: token }
        });
        const result = await response.json();
        hideLoader();
        if (result.success) {
            // Re-load current project editor coordinates and update stats
            showEditorView(activeProjectId);
        } else {
            alert("Booking failed: " + result.error);
        }
    } catch (e) {
        hideLoader();
        alert(e.message);
    }
}

async function handleAdminCancelReservationSubmit() {
    showLoader("Cancelling Booking...", "Updating plot availability status...");
    try {
        const response = await authFetch(`/api/projects/${activeProjectId}/plots/${selectedPlotId}/cancel`, {
            method: 'POST'
        });
        const result = await response.json();
        hideLoader();
        if (result.success) {
            showEditorView(activeProjectId);
        } else {
            alert("Cancellation failed: " + result.error);
        }
    } catch (e) {
        hideLoader();
        alert(e.message);
    }
}

async function handleAdminSaleSubmit() {
    const ref = adminContractRefInput.value.trim();
    if (!ref) {
        alert("Contract Reference Number is required to finalize the sale.");
        return;
    }
    
    showLoader("Registering Sale Contract...", "Signing contract details in plan registry...");
    try {
        const response = await authFetch(`/api/projects/${activeProjectId}/plots/${selectedPlotId}/sell`, {
            method: 'POST',
            body: { contract_ref: ref }
        });
        const result = await response.json();
        hideLoader();
        if (result.success) {
            showEditorView(activeProjectId);
        } else {
            alert("Contract registration failed: " + result.error);
        }
    } catch (e) {
        hideLoader();
        alert(e.message);
    }
}

async function handleAdminRevertSoldSubmit() {
    showLoader("Reverting Sale Contract...", "Releasing contract boundaries back to Available...");
    try {
        const response = await authFetch(`/api/projects/${activeProjectId}/plots/${selectedPlotId}/cancel`, {
            method: 'POST'
        });
        const result = await response.json();
        hideLoader();
        if (result.success) {
            showEditorView(activeProjectId);
        } else {
            alert("Revert failed: " + result.error);
        }
    } catch (e) {
        hideLoader();
        alert(e.message);
    }
}

// Bind callbacks to window so that inline HTML handlers can find them
window.deleteProject = deleteProject;
window.toggleAgentStatus = toggleAgentStatus;
window.deleteAgentAccount = deleteAgentAccount;

// Export Standalone HTML map
function exportInteractiveMap() {
    if (plots.length === 0) {
        alert("Cannot export empty map! Please run CV/AI extraction or draw some plots first.");
        return;
    }
    
    showLoader("Compiling Map Export...", "Embedding layout image and overlays into a standalone HTML...");
    
    authFetch('/api/export-html', {
        method: 'POST',
        body: {
            plots: plots,
            decorations: decorations,
            filename: currentImageFilename
        }
    })
    .then(res => res.json())
    .then(data => {
        hideLoader();
        if (data.success) {
            // Trigger download of the HTML file
            const blob = new Blob([data.html], { type: 'text/html' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `interactive_map_${currentImageFilename.split('.')[0]}.html`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } else {
            alert("Export failed: " + data.error);
        }
    })
    .catch(err => {
        hideLoader();
        console.error(err);
        alert("Failed to export Standalone HTML Map.");
    });
}

// --- PROJECT CATALOG HOME VIEW & DYNAMIC ROUTING ---

// Show catalog dashboard view
function showHomeView() {
    if (updateEventSource) {
        updateEventSource.close();
        updateEventSource = null;
    }
    activeProjectId = null;
    homeView.style.display = 'flex';
    editorView.style.display = 'none';
    
    showLoader("Loading project catalog...", "Fetching available real estate plans...");
    
    authFetch('/api/projects')
    .then(res => res.json())
    .then(data => {
        hideLoader();
        projects = data;
        renderProjectsGrid();
    })
    .catch(err => {
        hideLoader();
        console.error(err);
        alert("Failed to load real estate plans catalog.");
    });
}

// Show interactive editor view for a project
function showEditorView(projectId) {
    showLoader("Loading interactive plan...", "Fetching vector geometries and plot sheet overlays...");
    
    authFetch(`/api/projects/${projectId}`)
    .then(res => res.json())
    .then(data => {
        hideLoader();
        if (data.success) {
            const project = data.project;
            activeProjectId = project.id;
            plots = project.plots || [];
            decorations = project.decorations || [];
            currentImageFilename = project.image_filename;
            
            // Toggle view panels
            homeView.style.display = 'none';
            editorView.style.display = 'flex';
            
            // Set plan details
            activeProjectTitle.textContent = project.name;
            
            if (project.image_filename) {
                mapImage.src = `/uploads/${project.image_filename}?t=${Date.now()}`;
                mapImage.style.display = 'block';
                fileInfoName.textContent = project.image_filename;
                fileInfoCard.style.display = 'block';
                if (openPloteditBtn) openPloteditBtn.style.display = (currentUser && currentUser.role === 'admin') ? 'flex' : 'none';
                
                // Enable extraction modes (admin only)
                runAiBtn.disabled = !(currentUser && currentUser.role === 'admin');
                runCvBtn.disabled = !(currentUser && currentUser.role === 'admin');
                if (cvSettingsPanel) cvSettingsPanel.style.display = (currentUser && currentUser.role === 'admin') ? 'block' : 'none';
            } else {
                mapImage.src = '';
                mapImage.style.display = 'none';
                fileInfoCard.style.display = 'none';
                if (openPloteditBtn) openPloteditBtn.style.display = 'none';
                
                runAiBtn.disabled = true;
                runCvBtn.disabled = true;
                if (cvSettingsPanel) cvSettingsPanel.style.display = 'none';
            }
            
            // Apply layout visibility
            applyRolePermissions();
            
            // Setup real-time updates event stream
            setupRealTimeUpdates();
            
            // Reset viewport and render SVGs
            resetView();
            renderSVG();
            renderPlotsList();
            updateStats();
            
            // Reset selected plot pane
            selectedPlotId = null;
            updatePropertiesPanel();
            
            // Check for direct plot focus query parameter
            const urlParams = new URLSearchParams(window.location.search);
            const plotParam = urlParams.get('plot');
            if (plotParam) {
                const targetPlot = plots.find(p => p.plot_number === plotParam || p.id === plotParam);
                if (targetPlot) {
                    selectPlot(targetPlot.id, true);
                }
            }
        } else {
            alert("Failed to load project details: " + data.error);
        }
    })
    .catch(err => {
        hideLoader();
        console.error(err);
        alert("Server error fetching plan details.");
    });
}

// Create new blank project
async function createNewProject() {
    const name = await showPromptModal("New Real Estate Plan", "Layout Plan Name", "", "e.g., Green Valley Phase 1");
    if (!name || name.trim() === '') return;
    
    showLoader("Creating new plan...", "Initializing empty layout in database");
    
    authFetch('/api/projects/new', {
        method: 'POST',
        body: { name: name.trim() }
    })
    .then(res => res.json())
    .then(data => {
        hideLoader();
        if (data.success) {
            // Auto open the new plan in editor
            showEditorView(data.project.id);
        } else {
            alert("Failed to create plan: " + data.error);
        }
    })
    .catch(err => {
        hideLoader();
        console.error(err);
        alert("Server error creating new plan.");
    });
}

// Rename active project layout
async function handleProjectRename() {
    if (!activeProjectId) return;
    if (!currentUser || currentUser.role !== 'admin') {
        alert("Only administrators can rename plan layouts.");
        return;
    }
    
    const currentName = activeProjectTitle.textContent;
    const name = await showPromptModal("Rename Plan Layout", "New Layout Name", currentName, "e.g., Updated Sector 4 Plan");
    if (!name || name.trim() === '' || name.trim() === currentName) return;
    
    showLoader("Renaming plan...", "Updating layout catalog name in database");
    
    authFetch(`/api/projects/${activeProjectId}/rename`, {
        method: 'POST',
        body: { name: name.trim() }
    })
    .then(res => res.json())
    .then(data => {
        hideLoader();
        if (data.success) {
            activeProjectTitle.textContent = data.name;
            // Update the locally stored projects array so changes persist back to Catalog grid
            const project = projects.find(p => p.id === activeProjectId);
            if (project) {
                project.name = data.name;
            }
            alert("Plan renamed successfully!");
        } else {
            alert("Failed to rename plan: " + data.error);
        }
    })
    .catch(err => {
        hideLoader();
        console.error(err);
        alert("Server error renaming plan.");
    });
}

// Delete project
function deleteProject(projectId, event) {
    if (event) event.stopPropagation(); // Avoid triggering card click
    
    const proj = projects.find(p => p.id === projectId);
    if (!proj) return;
    
    if (!confirm(`Are you sure you want to delete "${proj.name}"? This will permanently erase all plotted vector data.`)) {
        return;
    }
    
    showLoader("Deleting plan...", "Removing project logs from database");
    
    authFetch(`/api/projects/${projectId}/delete`, {
        method: 'POST'
    })
    .then(res => res.json())
    .then(data => {
        hideLoader();
        if (data.success) {
            showHomeView(); // Refresh and return home
        } else {
            alert("Failed to delete plan: " + data.error);
        }
    })
    .catch(err => {
        hideLoader();
        console.error(err);
        alert("Error communicating with delete api.");
    });
}

// Render dynamic project cards grid
function renderProjectsGrid(filterText = '') {
    projectGrid.innerHTML = '';
    
    const query = filterText.toLowerCase().trim();
    const filtered = projects.filter(p => p.name.toLowerCase().includes(query));
    
    if (filtered.length === 0) {
        projectGrid.innerHTML = `
            <div class="no-selection" style="grid-column: 1 / -1; height: 260px; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 2.5rem; background: rgba(255,255,255,0.01); border: 1px solid var(--border-color); border-radius: 14px;">
                <i class="fa-solid fa-folder-open no-selection-icon" style="font-size: 2.5rem; color: var(--primary); opacity: 0.45; margin-bottom: 0.6rem; filter: drop-shadow(0 4px 10px var(--primary-glow));"></i>
                <div style="font-weight: 700; color: #fff; font-size: 1rem;">No layout plans found</div>
                <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">Try searching for a different keyword or initialize a new project layout.</div>
            </div>
        `;
        return;
    }
    
    filtered.forEach(p => {
        const card = document.createElement('div');
        card.className = 'project-card';
        card.addEventListener('click', () => showEditorView(p.id));
        
        // Percent calculations
        const total = p.plots_count;
        const available = p.available_count;
        const sold = p.sold_count;
        
        const isAdmin = currentUser && currentUser.role === 'admin';
        
        card.innerHTML = `
            <div class="project-card-image-wrapper">
                ${p.image_filename ? `
                    <img class="project-card-img" src="/uploads/${p.image_filename}" alt="${p.name}" loading="lazy">
                ` : `
                    <div class="project-card-image-wrapper no-image">
                        <i class="fa-solid fa-map-location-dot"></i>
                    </div>
                `}
            </div>
            <div class="project-card-content">
                <div>
                    <h3><i class="fa-solid fa-map-location-dot" style="color: var(--primary);"></i> ${p.name}</h3>
                    <div class="project-meta">
                        <span><i class="fa-regular fa-image"></i> ${p.image_filename ? p.image_filename : 'No image uploaded'}</span>
                    </div>
                    
                    <div class="project-stats">
                        <div class="stat-box">
                            <div class="val" style="color: #fff;">${total}</div>
                            <div class="lbl">Total</div>
                        </div>
                        <div class="stat-box">
                            <div class="val" style="color: var(--success);">${available}</div>
                            <div class="lbl">Avail</div>
                        </div>
                        <div class="stat-box">
                            <div class="val" style="color: var(--danger);">${sold}</div>
                            <div class="lbl">Sold</div>
                        </div>
                    </div>
                </div>
                
                <div class="card-actions">
                    <button class="btn btn-primary" style="flex: 1; padding: 0.45rem; font-size: 0.75rem; font-weight: 600;">
                        <i class="fa-solid fa-folder-open"></i> Open Interactive Map
                    </button>
                    ${isAdmin ? `
                    <button class="btn btn-danger" style="padding: 0.45rem 0.75rem; font-size: 0.75rem;" title="Delete Plan" onclick="deleteProject('${p.id}', event)">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                    ` : ''}
                </div>
            </div>
        `;
        
        projectGrid.appendChild(card);
    });
}

// Auto-Save active project state debounced helper (Admin only)
let autoSaveTimeout = null;
function autoSaveActiveProject() {
    if (!activeProjectId || !currentUser || currentUser.role !== 'admin') return;
    
    clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(() => {
        authFetch(`/api/projects/${activeProjectId}/save`, {
            method: 'POST',
            body: {
                plots: plots,
                decorations: decorations
            }
        })
        .then(res => res.json())
        .then(data => {
            if (!data.success) {
                console.error("Auto-save failed:", data.error);
            }
        })
        .catch(err => console.error("Auto-save error:", err));
    }, 500);
}

// Parse price strings to integers/floats defensively
function parsePrice(priceStr) {
    if (!priceStr) return 0;
    let cleaned = priceStr.toString().replace(/[^\d.]/g, '');
    let val = parseFloat(cleaned);
    return isNaN(val) ? 0 : val;
}

// Parse area strings to floats defensively
function parseArea(areaStr) {
    if (!areaStr) return 0;
    let cleaned = areaStr.toString().replace(/[^\d.]/g, '');
    let val = parseFloat(cleaned);
    return isNaN(val) ? 0 : val;
}

// Render Executive Analytics Dashboard details (Admin only)
function renderAnalyticsDashboard() {
    if (!activeProjectId || !tabAnalytics) return;
    
    let totalRevenue = 0;
    let pipelineValue = 0;
    let totalValue = 0;
    let soldArea = 0;
    
    let availCount = 0;
    let resCount = 0;
    let soldCount = 0;
    
    plots.forEach(plot => {
        const price = parsePrice(plot.price);
        const area = parseArea(plot.area);
        
        totalValue += price;
        
        if (plot.status === 'sold') {
            soldCount++;
            totalRevenue += price;
            soldArea += area;
        } else if (plot.status === 'reserved') {
            resCount++;
            pipelineValue += price;
        } else {
            availCount++;
        }
    });
    
    const avgPricePerSqFt = soldArea > 0 ? (totalRevenue / soldArea) : 0;
    
    // Update dashboard labels
    document.getElementById('analytics-revenue').textContent = '₹' + totalRevenue.toLocaleString('en-IN');
    document.getElementById('analytics-pipeline').textContent = '₹' + pipelineValue.toLocaleString('en-IN');
    document.getElementById('analytics-total-val').textContent = '₹' + totalValue.toLocaleString('en-IN');
    document.getElementById('analytics-avg-sqft').textContent = avgPricePerSqFt > 0 ? ('₹' + Math.round(avgPricePerSqFt).toLocaleString('en-IN') + ' / SQFT') : '₹0 / SQFT';
    
    document.getElementById('analytics-avail-count').textContent = availCount;
    document.getElementById('analytics-res-count').textContent = resCount;
    document.getElementById('analytics-sold-count').textContent = soldCount;
    document.getElementById('analytics-total-count').textContent = plots.length;
}

// Generate Invoice receipt and prompt print-to-PDF
function printBookingReceipt(plot) {
    let container = document.getElementById('print-voucher-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'print-voucher-container';
        document.body.appendChild(container);
    }
    
    const dateStr = new Date(plot.reserved_at || plot.sold_at || Date.now()).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Prepare highlighted vector boundary overlay
    const svgClone = svgOverlay.cloneNode(true);
    // Style highlighted plot vs rest of coordinates
    svgClone.querySelectorAll('polygon, path').forEach(el => {
        if (el.dataset && el.dataset.id === plot.id) {
            el.setAttribute('style', 'fill: rgba(59, 130, 246, 0.45); stroke: #3b82f6; stroke-width: 2.0;');
        } else {
            el.setAttribute('style', 'fill: rgba(0,0,0,0.03); stroke: rgba(0,0,0,0.08); stroke-width: 0.5;');
        }
    });
    
    container.innerHTML = `
        <div style="font-family: 'Outfit', sans-serif; max-width: 800px; margin: 0 auto; color: #0f172a; line-height: 1.5;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #3b82f6; padding-bottom: 1.5rem; margin-bottom: 2rem;">
                <div>
                    <h1 style="margin: 0; color: #1e3a8a; font-size: 1.8rem; font-weight: 800; letter-spacing: -0.5px;">ANTIGRAVITY DEVELOPERS</h1>
                    <p style="margin: 4px 0 0 0; font-size: 0.8rem; color: #64748b; font-weight: 500;">Premium Residential Layouts & Site Infrastructure</p>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 1.25rem; font-weight: 800; color: #3b82f6; text-transform: uppercase; letter-spacing: 1px;">Booking Receipt</div>
                    <div style="font-size: 0.75rem; color: #64748b; margin-top: 4px;">Receipt Ref: BOOK-${plot.id.split('_').pop().toUpperCase()}</div>
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 2rem; margin-bottom: 2rem;">
                <div>
                    <h3 style="color: #1e3a8a; font-size: 0.85rem; text-transform: uppercase; margin-bottom: 0.8rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.25rem;">Buyer Information</h3>
                    <table style="width: 100%; font-size: 0.85rem; border-collapse: collapse;">
                        <tr>
                            <td style="color: #64748b; padding: 4px 0; width: 40%;">Name:</td>
                            <td style="font-weight: 700; color: #0f172a; padding: 4px 0;">${plot.buyer_name || 'Anonymous'}</td>
                        </tr>
                        <tr>
                            <td style="color: #64748b; padding: 4px 0;">Status:</td>
                            <td style="font-weight: 700; color: ${plot.status === 'sold' ? '#ef4444' : '#f59e0b'}; padding: 4px 0; text-transform: uppercase;">${plot.status}</td>
                        </tr>
                        <tr>
                            <td style="color: #64748b; padding: 4px 0;">Date:</td>
                            <td style="color: #0f172a; padding: 4px 0;">${dateStr}</td>
                        </tr>
                    </table>
                </div>
                <div>
                    <h3 style="color: #1e3a8a; font-size: 0.85rem; text-transform: uppercase; margin-bottom: 0.8rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.25rem;">Plot Information</h3>
                    <table style="width: 100%; font-size: 0.85rem; border-collapse: collapse;">
                        <tr>
                            <td style="color: #64748b; padding: 4px 0; width: 40%;">Plot Number:</td>
                            <td style="font-weight: 700; color: #0f172a; padding: 4px 0;">Plot ${plot.plot_number}</td>
                        </tr>
                        <tr>
                            <td style="color: #64748b; padding: 4px 0;">Dimensions:</td>
                            <td style="font-weight: 700; color: #0f172a; padding: 4px 0;">${plot.size || 'N/A'}</td>
                        </tr>
                        <tr>
                            <td style="color: #64748b; padding: 4px 0;">Area Size:</td>
                            <td style="font-weight: 700; color: #0f172a; padding: 4px 0;">${plot.area || 'N/A'}</td>
                        </tr>
                    </table>
                </div>
            </div>

            <div style="margin-bottom: 2.5rem;">
                <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem; text-align: left;">
                    <thead>
                        <tr style="background-color: #f1f5f9; border-bottom: 2px solid #cbd5e1; color: #1e3a8a; font-weight: 700;">
                            <th style="padding: 10px 12px;">Description</th>
                            <th style="padding: 10px 12px; text-align: right;">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 12px;">Site Booking token payment for Plot ${plot.plot_number}</td>
                            <td style="padding: 12px; text-align: right; font-weight: 700;">₹${parseInt(plot.token_amount || 0).toLocaleString('en-IN')}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #cbd5e1;">
                            <td style="padding: 12px; font-weight: 700; color: #475569;">Total Booking Token Paid:</td>
                            <td style="padding: 12px; text-align: right; font-weight: 800; font-size: 1.05rem; color: #1e3a8a;">₹${parseInt(plot.token_amount || 0).toLocaleString('en-IN')}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div style="margin-bottom: 2.5rem; page-break-inside: avoid;">
                <h3 style="color: #1e3a8a; font-size: 0.85rem; text-transform: uppercase; margin-bottom: 0.8rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.25rem;">Plot Location Layout Map</h3>
                <div style="position: relative; width: 320px; height: 320px; margin: 0 auto; background: #fafafa; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; padding: 10px; box-sizing: border-box;">
                    ${svgClone.outerHTML}
                </div>
                <p style="font-size: 0.65rem; color: #94a3b8; text-align: center; margin-top: 0.5rem; font-style: italic;">Highlighted boundary shows relative position of Plot ${plot.plot_number} on site layout.</p>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 4rem; page-break-inside: avoid;">
                <div style="text-align: center; width: 200px;">
                    <div style="border-bottom: 1px solid #cbd5e1; height: 40px; margin-bottom: 0.4rem;"></div>
                    <div style="font-size: 0.75rem; color: #64748b;">Booking Agent Signature</div>
                </div>
                <div style="text-align: center; width: 200px;">
                    <div style="border-bottom: 1px solid #cbd5e1; height: 40px; margin-bottom: 0.4rem;"></div>
                    <div style="font-size: 0.75rem; color: #64748b;">Authorized Signatory</div>
                </div>
            </div>
            
            <div style="margin-top: 4rem; border-top: 1px solid #e2e8f0; padding-top: 1rem; font-size: 0.65rem; color: #94a3b8; line-height: 1.4;">
                <p><strong>Terms & Conditions:</strong> This receipt acts as a validation of the booking token received for the selected plot and is subject to full payment realization. Layout map coordinates are for visual reference and boundaries are verified physically as per site maps at registry time.</p>
            </div>
        </div>
    `;
    
    window.print();
}

// Server-Sent Events (SSE) dynamic update setup
let updateEventSource = null;
function setupRealTimeUpdates() {
    if (updateEventSource) {
        updateEventSource.close();
    }
    
    updateEventSource = new EventSource('/api/projects/stream');
    
    updateEventSource.addEventListener('project_update', (e) => {
        try {
            const data = JSON.parse(e.data);
            if (data.project_id === activeProjectId) {
                // Prevent overrides if actively drawing or editing points
                if (activeTool !== 'draw' && activeTool !== 'edit' && draggedNodeIndex === null) {
                    plots = data.plots;
                    decorations = data.decorations;
                    renderSVG();
                    renderPlotsList();
                    updateStats();
                    if (selectedPlotId) {
                        updatePropertiesPanel();
                    }
                    if (tabAnalytics.style.display === 'flex') {
                        renderAnalyticsDashboard();
                    }
                }
            }
        } catch (err) {
            console.error("Error processing real-time stream update:", err);
        }
    });
}

// Trigger script execution
init();

/* ----------------------------------------------------
   PLOTEDIT INTEGRATED SERVICE LOGIC
---------------------------------------------------- */

function setupPlotEditEventListeners() {
    if (openPloteditBtn) {
        openPloteditBtn.addEventListener('click', handleLoadExistingMapForEdit);
    }
    if (ploteditCloseBtn) {
        ploteditCloseBtn.addEventListener('click', closePlotEditModal);
    }
    if (ploteditCancelBtn) {
        ploteditCancelBtn.addEventListener('click', closePlotEditModal);
    }
    if (ploteditSaveBtn) {
        ploteditSaveBtn.addEventListener('click', savePlotEditLayout);
    }

    // Action button controls on cropper
    if (ploteditRotateLeft) {
        ploteditRotateLeft.addEventListener('click', () => {
            if (ploteditCropper) {
                ploteditCropper.rotate(-90);
                debouncedPlotEditProcess();
            }
        });
    }
    if (ploteditRotateRight) {
        ploteditRotateRight.addEventListener('click', () => {
            if (ploteditCropper) {
                ploteditCropper.rotate(90);
                debouncedPlotEditProcess();
            }
        });
    }
    if (ploteditReset) {
        ploteditReset.addEventListener('click', () => {
            if (ploteditCropper) {
                ploteditCropper.reset();
                if (ploteditCandidates && ploteditCandidates.length > 0) {
                    setPlotEditCropperToCandidate(0);
                    document.querySelectorAll('#plotedit-modal .suggestion-chip').forEach((c, idx) => {
                        if (idx === 0) c.classList.add('active');
                        else c.classList.remove('active');
                    });
                }
                processPlotEditLayout();
            }
        });
    }

    // Color picker
    if (ploteditColorPicker) {
        ploteditColorPicker.addEventListener('input', (e) => {
            const val = e.target.value.toUpperCase();
            updateActiveColor(val);
            
            document.querySelectorAll('#plotedit-modal .preset-chip').forEach(chip => chip.classList.remove('active'));
            const customPreset = document.getElementById('plotedit-custom-preset');
            if (customPreset) {
                customPreset.classList.add('active');
                customPreset.setAttribute('data-color', val);
            }
            debouncedPlotEditProcess();
        });
    }

    if (ploteditTriggerPicker) {
        ploteditTriggerPicker.addEventListener('click', () => {
            if (ploteditColorPicker) ploteditColorPicker.click();
        });
    }

    // Preset chips
    document.querySelectorAll('#plotedit-modal .preset-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('#plotedit-modal .preset-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            
            const color = chip.getAttribute('data-color');
            if (color !== 'custom') {
                updateActiveColor(color);
                debouncedPlotEditProcess();
            } else {
                if (ploteditColorPicker) ploteditColorPicker.click();
            }
        });
    });

    // EyeDropper API integration
    if ('EyeDropper' in window && ploteditEyedropper) {
        ploteditEyedropper.addEventListener('click', async () => {
            const eyeDropper = new EyeDropper();
            try {
                const result = await eyeDropper.open();
                const color = result.sRGBHex.toUpperCase();
                updateActiveColor(color);
                
                document.querySelectorAll('#plotedit-modal .preset-chip').forEach(c => c.classList.remove('active'));
                const customPreset = document.getElementById('plotedit-custom-preset');
                if (customPreset) {
                    customPreset.classList.add('active');
                    customPreset.setAttribute('data-color', color);
                }
                processPlotEditLayout();
            } catch (err) {
                console.warn("Eyedropper cancelled or failed:", err);
            }
        });
    }

    // Sliders sync
    if (ploteditToleranceSlider) {
        ploteditToleranceSlider.addEventListener('input', (e) => {
            if (ploteditToleranceVal) ploteditToleranceVal.textContent = e.target.value;
            debouncedPlotEditProcess();
        });
    }
    if (ploteditSharpnessSlider) {
        ploteditSharpnessSlider.addEventListener('input', (e) => {
            if (ploteditSharpnessVal) ploteditSharpnessVal.textContent = e.target.value;
            debouncedPlotEditProcess();
        });
    }
    if (ploteditContrastSlider) {
        ploteditContrastSlider.addEventListener('input', (e) => {
            if (ploteditContrastVal) ploteditContrastVal.textContent = e.target.value;
            debouncedPlotEditProcess();
        });
    }
    if (ploteditBrightnessSlider) {
        ploteditBrightnessSlider.addEventListener('input', (e) => {
            if (ploteditBrightnessVal) ploteditBrightnessVal.textContent = e.target.value;
            debouncedPlotEditProcess();
        });
    }
    if (ploteditSaturationSlider) {
        ploteditSaturationSlider.addEventListener('input', (e) => {
            if (ploteditSaturationVal) ploteditSaturationVal.textContent = e.target.value;
            debouncedPlotEditProcess();
        });
    }

    // Upscale switches
    document.querySelectorAll('input[name="plotedit-upscale"]').forEach(radio => {
        radio.addEventListener('change', () => {
            processPlotEditLayout();
        });
    });

    // Format switches
    document.querySelectorAll('input[name="plotedit-format"]').forEach(radio => {
        radio.addEventListener('change', () => {
            processPlotEditLayout();
        });
    });
}

function handleLoadExistingMapForEdit() {
    if (!activeProjectId) return;
    
    showLoader("Loading map layout...", "Fetching existing layout coordinates...");
    
    authFetch(`/api/projects/${activeProjectId}/plotedit/load-existing`)
    .then(res => res.json())
    .then(data => {
        hideLoader();
        if (data.success) {
            ploteditFilename = data.filename;
            ploteditCandidates = data.candidates;
            ploteditImageSize = data.image_size;
            
            // Set suggested background color
            const bgRgb = data.suggested_bg_color;
            const bgHex = rgbToHex(bgRgb[0], bgRgb[1], bgRgb[2]);
            updateActiveColor(bgHex);
            
            // Set custom preset chip color
            const customPreset = document.getElementById('plotedit-custom-preset');
            if (customPreset) {
                customPreset.setAttribute('data-color', bgHex);
                customPreset.style.setProperty('--chip-color', bgHex);
            }
            
            openPlotEditModal(data.filename);
        } else {
            alert("Could not load original plan: " + data.error);
        }
    })
    .catch(err => {
        hideLoader();
        console.error(err);
        alert("Server error loading original layout image.");
    });
}

function openPlotEditModal(filename) {
    if (ploteditModal) {
        ploteditModal.style.display = 'flex';
        ploteditModal.classList.add('active');
    }
    
    // Destroy previous cropper if exists
    if (ploteditCropper) {
        ploteditCropper.destroy();
        ploteditCropper = null;
    }
    ploteditIsCropperReady = false;

    if (ploteditSourceImg) {
        ploteditSourceImg.onload = () => {
            ploteditCropper = new Cropper(ploteditSourceImg, {
                viewMode: 1,
                dragMode: 'move',
                autoCropArea: 0.9,
                restore: false,
                responsive: true,
                modal: true,
                guides: true,
                highlight: true,
                cropBoxMovable: true,
                cropBoxResizable: true,
                toggleDragModeOnDblclick: false,
                ready() {
                    ploteditIsCropperReady = true;
                    if (ploteditCandidates && ploteditCandidates.length > 0) {
                        setPlotEditCropperToCandidate(0);
                    }
                    renderPlotEditSuggestionChips();
                    processPlotEditLayout();
                },
                cropend() {
                    if (ploteditIsCropperReady) {
                        debouncedPlotEditProcess();
                    }
                },
                zoom() {
                    if (ploteditIsCropperReady) {
                        debouncedPlotEditProcess();
                    }
                }
            });
        };
        ploteditSourceImg.src = `/uploads/${filename}?t=${Date.now()}`;
    }
}

function closePlotEditModal() {
    if (ploteditModal) {
        ploteditModal.style.display = 'none';
        ploteditModal.classList.remove('active');
    }
    if (ploteditCropper) {
        ploteditCropper.destroy();
        ploteditCropper = null;
    }
    ploteditIsCropperReady = false;
    ploteditFilename = null;
    ploteditCandidates = [];
    if (ploteditBlobUrl) {
        URL.revokeObjectURL(ploteditBlobUrl);
        ploteditBlobUrl = null;
    }
}

function renderPlotEditSuggestionChips() {
    if (!ploteditSuggestionChips) return;
    ploteditSuggestionChips.innerHTML = '';
    
    if (!ploteditCandidates || ploteditCandidates.length === 0) {
        if (ploteditSuggestionsBar) ploteditSuggestionsBar.style.display = 'none';
        return;
    }
    
    if (ploteditSuggestionsBar) ploteditSuggestionsBar.style.display = 'flex';
    
    ploteditCandidates.forEach((cand, idx) => {
        const isDefault = idx === 0;
        const chip = document.createElement('button');
        chip.className = `suggestion-chip ${isDefault ? 'active' : ''}`;
        
        let label = cand.label || `Layout Area ${idx + 1}`;
        if (isDefault && !cand.label) label += " (Main)";
        
        chip.innerHTML = `<i class="fa-solid fa-expand"></i> ${label}`;
        chip.addEventListener('click', () => {
            document.querySelectorAll('#plotedit-modal .suggestion-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            setPlotEditCropperToCandidate(idx);
            processPlotEditLayout();
        });
        ploteditSuggestionChips.appendChild(chip);
    });
}

function setPlotEditCropperToCandidate(index) {
    if (!ploteditCropper || !ploteditCandidates[index]) return;
    const cand = ploteditCandidates[index];
    ploteditCropper.setData({
        x: cand.x,
        y: cand.y,
        width: cand.width,
        height: cand.height,
        rotate: 0,
        scaleX: 1,
        scaleY: 1
    });
}

// Debounce wrapper
function ploteditDebounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}
const debouncedPlotEditProcess = ploteditDebounce(processPlotEditLayout, 300);

async function processPlotEditLayout() {
    if (!ploteditFilename || !ploteditCropper || !ploteditIsCropperReady) return;

    if (ploteditPreviewPlaceholder) ploteditPreviewPlaceholder.classList.add('active');
    if (ploteditPreviewImg) ploteditPreviewImg.style.display = 'none';
    if (ploteditSaveBtn) ploteditSaveBtn.disabled = true;

    const cropData = ploteditCropper.getData(true);
    const hexColor = ploteditColorPicker ? ploteditColorPicker.value : '#B5D38A';
    const bgRgb = hexToRgb(hexColor);
    
    const tolerance = ploteditToleranceSlider ? ploteditToleranceSlider.value : 30;
    
    let format = 'png';
    document.querySelectorAll('input[name="plotedit-format"]').forEach(radio => {
        if (radio.checked) format = radio.value;
    });

    let upscale = 1.0;
    document.querySelectorAll('input[name="plotedit-upscale"]').forEach(radio => {
        if (radio.checked) upscale = parseFloat(radio.value);
    });

    const sharpness = ploteditSharpnessSlider ? parseInt(ploteditSharpnessSlider.value) : 0;
    const contrast = ploteditContrastSlider ? parseInt(ploteditContrastSlider.value) : 0;
    const brightness = ploteditBrightnessSlider ? parseInt(ploteditBrightnessSlider.value) : 0;
    const saturation = ploteditSaturationSlider ? parseFloat(ploteditSaturationSlider.value) : 1.0;

    const payload = {
        filename: ploteditFilename,
        x: cropData.x,
        y: cropData.y,
        width: cropData.width,
        height: cropData.height,
        bg_color: bgRgb,
        tolerance: tolerance,
        format: format,
        brightness: brightness,
        contrast: contrast,
        sharpness: sharpness,
        saturation: saturation,
        upscale: upscale,
        rotate: cropData.rotate || 0
    };

    try {
        const response = await authFetch(`/api/projects/${activeProjectId}/plotedit/process`, {
            method: 'POST',
            body: payload
        });

        if (response.ok) {
            const blob = await response.blob();
            if (ploteditBlobUrl) {
                URL.revokeObjectURL(ploteditBlobUrl);
            }
            ploteditBlobUrl = URL.createObjectURL(blob);
            
            if (ploteditPreviewImg) {
                ploteditPreviewImg.onload = () => {
                    if (ploteditPreviewPlaceholder) ploteditPreviewPlaceholder.classList.remove('active');
                    ploteditPreviewImg.style.display = 'block';
                    if (ploteditSaveBtn) ploteditSaveBtn.disabled = false;
                    
                    if (ploteditDimensionInfo) {
                        ploteditDimensionInfo.textContent = `${ploteditPreviewImg.naturalWidth} × ${ploteditPreviewImg.naturalHeight} px`;
                    }
                };
                ploteditPreviewImg.src = ploteditBlobUrl;
            }
        } else {
            const errObj = await response.json();
            console.error("Processing failed", errObj.error);
            if (ploteditPreviewPlaceholder) {
                ploteditPreviewPlaceholder.innerHTML = `<i class="fa-solid fa-circle-exclamation text-danger"></i><p>Process Error: ${errObj.error}</p>`;
            }
        }
    } catch (e) {
        console.error(e);
        if (ploteditPreviewPlaceholder) {
            ploteditPreviewPlaceholder.innerHTML = `<i class="fa-solid fa-circle-exclamation text-danger"></i><p>Network Error</p>`;
        }
    }
}

async function savePlotEditLayout() {
    if (!ploteditFilename || !ploteditCropper || !ploteditIsCropperReady) return;
    
    showLoader("Saving plan...", "Applying enhancements and archiving map layout...");
    
    const cropData = ploteditCropper.getData(true);
    const hexColor = ploteditColorPicker ? ploteditColorPicker.value : '#B5D38A';
    const bgRgb = hexToRgb(hexColor);
    const tolerance = ploteditToleranceSlider ? ploteditToleranceSlider.value : 30;
    
    let format = 'png';
    document.querySelectorAll('input[name="plotedit-format"]').forEach(radio => {
        if (radio.checked) format = radio.value;
    });

    let upscale = 1.0;
    document.querySelectorAll('input[name="plotedit-upscale"]').forEach(radio => {
        if (radio.checked) upscale = parseFloat(radio.value);
    });

    const sharpness = ploteditSharpnessSlider ? parseInt(ploteditSharpnessSlider.value) : 0;
    const contrast = ploteditContrastSlider ? parseInt(ploteditContrastSlider.value) : 0;
    const brightness = ploteditBrightnessSlider ? parseInt(ploteditBrightnessSlider.value) : 0;
    const saturation = ploteditSaturationSlider ? parseFloat(ploteditSaturationSlider.value) : 1.0;

    const payload = {
        filename: ploteditFilename,
        x: cropData.x,
        y: cropData.y,
        width: cropData.width,
        height: cropData.height,
        bg_color: bgRgb,
        tolerance: tolerance,
        format: format,
        brightness: brightness,
        contrast: contrast,
        sharpness: sharpness,
        saturation: saturation,
        upscale: upscale,
        rotate: cropData.rotate || 0
    };

    try {
        const response = await authFetch(`/api/projects/${activeProjectId}/plotedit/save`, {
            method: 'POST',
            body: payload
        });
        
        const data = await response.json();
        hideLoader();
        
        if (data.success) {
            currentImageFilename = data.filename;
            mapImage.src = data.url;
            mapImage.style.display = 'block';
            fileInfoName.textContent = data.filename;
            fileInfoCard.style.display = 'block';
            if (openPloteditBtn) openPloteditBtn.style.display = 'flex';
            
            // Enable generation buttons
            runAiBtn.disabled = false;
            runCvBtn.disabled = false;
            if (cvSettingsPanel) cvSettingsPanel.style.display = (currentUser && currentUser.role === 'admin') ? 'block' : 'none';
            
            resetView();
            plots = [];
            decorations = [];
            selectedPlotId = null;
            renderSVG();
            renderPlotsList();
            updateStats();
            
            closePlotEditModal();
        } else {
            alert("Failed to save layout: " + data.error);
        }
    } catch (err) {
        hideLoader();
        console.error(err);
        alert("Server error saving cropped layout plan.");
    }
}

function updateActiveColor(hex) {
    if (ploteditColorPicker) ploteditColorPicker.value = hex;
    if (ploteditColorHex) ploteditColorHex.value = hex.toUpperCase();
    if (ploteditColorPreview) ploteditColorPreview.style.backgroundColor = hex;
}

// Utility Color Conversions
function hexToRgb(hex) {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
    ] : null;
}

function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

