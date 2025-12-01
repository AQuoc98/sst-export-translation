# SST Export Translation

An Electron desktop application that exports translation data from Excel files to JSON format for multi-language support.

## Overview

This application reads a specially formatted Excel file containing translations in multiple languages and exports them into individual JSON files organized by language code. It processes both translation strings and EULA (End User License Agreement) content.

## Features

- 🎯 User-friendly GUI for file selection
- 📊 Excel file parsing (`.xlsx`, `.xls`)
- 🌍 Multi-language support (9 languages)
- 📝 Automatic JSON formatting with Prettier
- ✨ Separate translation and EULA file generation
- 💾 Organized output by language folders

## Installation

```bash
# Install dependencies
npm install
# or
yarn install
```

## Usage

### Running the Application

```bash
# Development mode
npm start
# or
yarn start
```

### Building the Application

```bash
# Build for production
npm run build
# or
yarn build
```

The built application will be available in the `dist/` directory.

## Application Architecture

The application follows Electron's security best practices with a clear separation between main and renderer processes:

```
┌─────────────────────────────────────────────────────────────┐
│                     Electron App Architecture                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐         ┌──────────────┐                 │
│  │  index.html  │────────▶│ renderer.js  │                 │
│  │              │         │              │                 │
│  │ • UI Layout  │         │ • UI Logic   │                 │
│  │ • Form       │         │ • Event      │                 │
│  │ • Buttons    │         │   Handlers   │                 │
│  └──────────────┘         └──────┬───────┘                 │
│                                   │                          │
│                                   │ electronAPI              │
│                                   │                          │
│                          ┌────────▼────────┐                │
│                          │   preload.js    │                │
│                          │                 │                │
│                          │ • Context       │                │
│                          │   Bridge        │                │
│                          │ • IPC Exposure  │                │
│                          └────────┬────────┘                │
│                                   │                          │
│                                   │ IPC                      │
│                                   │                          │
│                          ┌────────▼────────┐                │
│                          │    main.js      │                │
│                          │                 │                │
│                          │ • Window Mgmt   │                │
│                          │ • File Dialogs  │                │
│                          │ • Export Logic  │                │
│                          │ • XLSX Parsing  │                │
│                          └─────────────────┘                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Code Explanation

### 1. `main.js` - Main Process

The main process is responsible for:

#### Window Management
```javascript
const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,      // Security: isolate renderer
      nodeIntegration: false,       // Security: disable Node in renderer
    },
  });
  win.loadFile("index.html");
};
```

#### IPC Handlers

**File Selection Dialog**
```javascript
ipcMain.handle("select-file", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [
      { name: "Excel Files", extensions: ["xlsx", "xls"] },
      { name: "All Files", extensions: ["*"] },
    ],
  });
  return result.canceled ? null : result.filePaths[0];
});
```

**Destination Folder Selection**
```javascript
ipcMain.handle("select-destination", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory", "createDirectory"],
  });
  return result.canceled ? null : result.filePaths[0];
});
```

**Export Translation Logic**
```javascript
ipcMain.handle("export-translation", async (event, inputFile, outputDir) => {
  // 1. Read Excel file
  const workbook = XLSX.readFile(inputFile, {
    cellText: false,
    cellFormula: false,
  });

  // 2. Parse headers (row 2)
  // Columns 1-9: Translation languages
  // Columns 13-21: EULA languages

  // 3. Extract data from rows (starting row 3)
  // Parse format: "key": "value"

  // 4. Generate JSON files
  // - translation.json for each language
  // - eula.json for each language

  // 5. Apply Prettier formatting

  // 6. Return results
  return { success: true, filesCreated: count, files: [...] };
});
```

### 2. `preload.js` - Secure Bridge

The preload script creates a secure bridge between renderer and main processes:

```javascript
contextBridge.exposeInMainWorld("electronAPI", {
  // Exposed functions that renderer can call
  selectFile: () => ipcRenderer.invoke("select-file"),
  selectDestination: () => ipcRenderer.invoke("select-destination"),
  exportTranslation: (inputFile, outputDir) =>
    ipcRenderer.invoke("export-translation", inputFile, outputDir),
});
```

**Why Context Bridge?**
- ✅ Security: Prevents renderer from accessing Node.js APIs directly
- ✅ Controlled: Only exposes specific, safe functions
- ✅ Type-safe: Clear API contract between processes

### 3. `renderer.js` - Renderer Process

The renderer handles all UI interactions:

#### File Selection
```javascript
selectFileBtn.addEventListener("click", async () => {
  const filePath = await window.electronAPI.selectFile();
  if (filePath) {
    selectedFilePath = filePath;
    inputFileField.value = filePath;  // Display in UI
  }
});
```

#### Export Process
```javascript
exportForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // 1. Validate inputs
  if (!selectedFilePath || !selectedDestPath) {
    alert("Please select required fields");
    return;
  }

  // 2. Show loading state
  exportBtn.disabled = true;
  exportBtn.textContent = "Exporting...";

  // 3. Call main process
  const result = await window.electronAPI.exportTranslation(
    selectedFilePath,
    selectedDestPath
  );

  // 4. Show results
  if (result.success) {
    alert(`Success! Created ${result.filesCreated} files`);
  } else {
    alert(`Failed: ${result.message}`);
  }

  // 5. Reset UI
  exportBtn.disabled = false;
  exportBtn.textContent = "Export to locales";
});
```

### 4. `index.html` - User Interface

Simple, clean HTML structure:

```html
<form id="export-form">
  <!-- Input File Selection -->
  <div class="form-group">
    <label>Input File:</label>
    <input type="text" id="inputFile" readonly />
    <button type="button" id="selectFileBtn">Browse</button>
  </div>

  <!-- Destination Folder -->
  <div class="form-group">
    <label>Destination:</label>
    <input type="text" id="destination" readonly />
    <button type="button" id="selectDestBtn">Browse</button>
  </div>

  <!-- Export Button -->
  <button type="submit" class="export-btn">Export to locales</button>
</form>
```

### 5. `styles.css` - Styling

Modern, clean interface with:
- Responsive layout (max-width: 600px)
- Flexbox for input/button alignment
- Distinct button states (primary, secondary, hover, disabled)
- System font stack for native appearance

## Excel File Format

The application expects an Excel file with the following structure:

### Sheet Name
`json_tranlsation`

### Column Layout

| Column | Range | Content Type |
|--------|-------|--------------|
| B-J | 1-9 | Translation strings (9 languages) |
| N-V | 13-21 | EULA content (9 languages) |

### Row Layout

| Row | Content |
|-----|---------|
| 1 | (Reserved/Unused) |
| 2 | **Header Row** - Language names |
| 3+ | **Data Rows** - Translation key-value pairs |

### Data Format

Each cell should contain a key-value pair in this format:
```
"key_name": "translated value"
```

Example:
```
"welcome_message": "Welcome to our application"
"login_button": "Sign In"
```

## Output Structure

The application creates the following directory structure:

```
output_json/
├── en/
│   ├── translation.json
│   └── eula.json
├── fr/
│   ├── translation.json
│   └── eula.json
├── de/
│   ├── translation.json
│   └── eula.json
├── es/
│   ├── translation.json
│   └── eula.json
├── ita/                    # Special case: Italian uses "ita" not "it"
│   ├── translation.json
│   └── eula.json
└── ... (other languages)
```

### Language Folder Naming

- First 2 characters of language name (lowercase)
- **Exception**: Italian → `ita` (not `it`)

### JSON File Format

Each file is automatically formatted with Prettier:

```json
{
  "key1": "value1",
  "key2": "value2",
  "key3": "value3"
}
```

## Security Features

### Context Isolation ✅
```javascript
contextIsolation: true  // Renderer cannot access Node.js APIs
```

### No Node Integration ✅
```javascript
nodeIntegration: false  // Renderer runs in browser-like environment
```

### Preload Script ✅
```javascript
// Only specific functions are exposed via Context Bridge
// Renderer cannot call arbitrary Node.js/Electron APIs
```

### Content Security Policy ✅
```html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self'; script-src 'self'" />
```

## Data Flow

### Complete Export Flow

```
1. User clicks "Browse" for input file
   └─▶ renderer.js: selectFileBtn.click
       └─▶ preload.js: electronAPI.selectFile()
           └─▶ main.js: ipcMain.handle("select-file")
               └─▶ dialog.showOpenDialog()
                   └─▶ return filePath
                       └─▶ Update UI with selected path

2. User clicks "Browse" for destination
   └─▶ renderer.js: selectDestBtn.click
       └─▶ preload.js: electronAPI.selectDestination()
           └─▶ main.js: ipcMain.handle("select-destination")
               └─▶ dialog.showOpenDialog()
                   └─▶ return folderPath
                       └─▶ Update UI with selected path

3. User clicks "Export to locales"
   └─▶ renderer.js: exportForm.submit
       └─▶ Validate inputs
       └─▶ Show loading state
       └─▶ preload.js: electronAPI.exportTranslation()
           └─▶ main.js: ipcMain.handle("export-translation")
               ├─▶ Read Excel file (XLSX.readFile)
               ├─▶ Parse headers (row 2)
               ├─▶ Extract data (row 3+)
               │   ├─▶ Parse translation columns (1-9)
               │   └─▶ Parse EULA columns (13-21)
               ├─▶ Create output directories
               ├─▶ Generate JSON files
               │   ├─▶ translation.json (per language)
               │   └─▶ eula.json (per language)
               ├─▶ Format with Prettier
               └─▶ return { success, filesCreated, files }
                   └─▶ Show success/error message
                       └─▶ Reset UI
```

## Dependencies

### Production Dependencies
- **`xlsx`** (^0.18.5): Excel file parsing and manipulation
  - Used for reading `.xlsx` and `.xls` files
  - Extracts cell values while preserving formatting

### Development Dependencies
- **`electron`** (^39.2.4): Desktop application framework
  - Cross-platform desktop app development
  - Native system APIs (dialogs, file system)

- **`electron-builder`** (^26.0.12): Application packaging
  - Creates distributable packages (.dmg, .exe, etc.)
  - Code signing and auto-update support

- **`prettier`** (3.7.1): Code formatter
  - Ensures consistent JSON formatting
  - Beautifies output files

## Build Configuration

### macOS Build
```json
"mac": {
  "target": "dmg",
  "arch": "arm64",           // Apple Silicon (M1/M2/M3)
  "category": "public.app-category.utilities",
  "icon": "build/icon.icns"
}
```

### Output
- **Format**: DMG installer
- **Location**: `dist/` directory
- **Compression**: Maximum
- **Architecture**: ARM64 (Apple Silicon)

## Troubleshooting

### Excel file not loading
- Ensure the file has a sheet named `json_tranlsation` (note the spelling)
- Verify the file is a valid `.xlsx` or `.xls` file

### Export fails silently
- Check that you have write permissions to the destination folder
- Ensure the Excel file is not open in another application

### JSON formatting issues
- The app uses Prettier for formatting; check `.prettierrc` if you have one
- Escape sequences in Excel cells are preserved

## License

MIT

## Author

Ken
