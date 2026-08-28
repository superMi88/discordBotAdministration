const fs = require('fs');
const path = require('path');

class TimeStorage {
    constructor() {
        // Basis-Verzeichnis "Storage" im Projekt-Root
        this.baseDir = path.resolve(__dirname, '../Storage');
        this.ensureDir(this.baseDir);
    }

    /**
     * Stellt sicher, dass das Verzeichnis existiert.
     * @param {string} dirPath 
     */
    ensureDir(dirPath) {
        if (!fs.existsSync(dirPath)) {
            try {
                fs.mkdirSync(dirPath, { recursive: true });
            } catch (err) {
                console.error(`[TimeStorage] Fehler beim Erstellen des Verzeichnisses ${dirPath}:`, err);
            }
        }
    }

    /**
     * Formatiert ein Date-Objekt in das Zeit-Format DD_MM_YYYY (z. B. "16_08_2026").
     * @param {Date} [date=new Date()] 
     * @returns {string}
     */
    getTodayDateString(date = new Date()) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}_${month}_${year}`;
    }

    /**
     * Parst einen Datumsstring (z. B. "16_08_2026" oder "16_08_2026.json") in ein Date-Objekt.
     * @param {string} dateStr 
     * @returns {Date|null}
     */
    parseDateString(dateStr) {
        if (!dateStr) return null;
        const clean = dateStr.replace('.json', '');
        const parts = clean.split('_');
        if (parts.length !== 3) return null;
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        const date = new Date(year, month, day, 0, 0, 0, 0);
        if (isNaN(date.getTime())) return null;
        return date;
    }

    /**
     * Gibt den Pfad des Ordners für einen bestimmten Storage-Namen zurück.
     * @param {string} folderName z. B. "activityVoice-642..."
     * @returns {string}
     */
    getStorageDir(folderName) {
        const dirPath = path.join(this.baseDir, folderName);
        this.ensureDir(dirPath);
        return dirPath;
    }

    /**
     * Gibt den Pfad zur Tagesdatei zurück.
     * @param {string} folderName 
     * @param {string} [dateStr] 
     * @returns {string}
     */
    getDailyFilePath(folderName, dateStr = this.getTodayDateString()) {
        const dir = this.getStorageDir(folderName);
        return path.join(dir, `${dateStr}.json`);
    }

    /**
     * Lädt die JSON-Daten für einen bestimmten Tag aus dem angegebenen Ordner.
     * @param {string} folderName 
     * @param {string} [dateStr] 
     * @returns {Object}
     */
    loadDailyData(folderName, dateStr = this.getTodayDateString()) {
        const filePath = this.getDailyFilePath(folderName, dateStr);
        if (!fs.existsSync(filePath)) {
            return {};
        }
        try {
            const raw = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(raw) || {};
        } catch (err) {
            console.error(`[TimeStorage] Fehler beim Lesen von ${filePath}:`, err);
            return {};
        }
    }

    /**
     * Speichert JSON-Daten für einen Tag im angegebenen Ordner ab.
     * @param {string} folderName 
     * @param {Object} data 
     * @param {string} [dateStr] 
     */
    saveDailyData(folderName, data, dateStr = this.getTodayDateString()) {
        const filePath = this.getDailyFilePath(folderName, dateStr);
        try {
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        } catch (err) {
            console.error(`[TimeStorage] Fehler beim Schreiben von ${filePath}:`, err);
        }
    }

    /**
     * Lädt die aktuellen Tagesdaten, führt die Aktualisierungsfunktion aus und speichert das Ergebnis.
     * @param {string} folderName 
     * @param {Function} updateFn - (currentData) => updatedData
     * @param {string} [dateStr] 
     * @returns {Object} updatedData
     */
    updateDailyData(folderName, updateFn, dateStr = this.getTodayDateString()) {
        const currentData = this.loadDailyData(folderName, dateStr);
        const updatedData = updateFn(currentData) || currentData;
        this.saveDailyData(folderName, updatedData, dateStr);
        return updatedData;
    }

    /**
     * Gibt eine Liste der Datumsstrings für die letzten N Tage zurück (von heute rückwärts).
     * @param {number} [days=14] 
     * @param {Date} [fromDate=new Date()] 
     * @returns {string[]}
     */
    getLastNDaysDateStrings(days = 14, fromDate = new Date()) {
        const dateStrings = [];
        for (let i = 0; i < days; i++) {
            const d = new Date(fromDate);
            d.setDate(d.getDate() - i);
            dateStrings.push(this.getTodayDateString(d));
        }
        return dateStrings;
    }

    /**
     * Lädt die Rohdaten der letzten N Tage für den angegebenen Ordner.
     * @param {string} folderName 
     * @param {number} [days=14] 
     * @param {Date} [fromDate=new Date()] 
     * @returns {Object} Map von { [dateStr]: dayData }
     */
    loadHistory(folderName, days = 14, fromDate = new Date()) {
        const dateStrings = this.getLastNDaysDateStrings(days, fromDate);
        const history = {};
        for (const dateStr of dateStrings) {
            history[dateStr] = this.loadDailyData(folderName, dateStr);
        }
        return history;
    }

    /**
     * Bereinigt alte Tagesdateien im Ordner, die älter als maxDays Tage sind.
     * @param {string} folderName 
     * @param {number} [maxDays=14] 
     * @returns {number} Anzahl gelöschter Dateien
     */
    cleanupOldFiles(folderName, maxDays = 14) {
        const dirPath = this.getStorageDir(folderName);
        if (!fs.existsSync(dirPath)) return 0;

        let deletedCount = 0;
        const now = new Date();
        const cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - maxDays, 0, 0, 0, 0);

        try {
            const files = fs.readdirSync(dirPath);
            for (const file of files) {
                if (!file.endsWith('.json')) continue;
                const fileDate = this.parseDateString(file);
                if (fileDate && fileDate < cutoffDate) {
                    const filePath = path.join(dirPath, file);
                    fs.unlinkSync(filePath);
                    deletedCount++;
                    console.log(`[TimeStorage] Alte Datei gelöscht: ${filePath}`);
                }
            }
        } catch (err) {
            console.error(`[TimeStorage] Fehler beim Bereinigen von ${dirPath}:`, err);
        }

        return deletedCount;
    }
}

module.exports = new TimeStorage();
