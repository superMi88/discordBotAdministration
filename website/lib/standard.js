

function equal(obj1, obj2) {
    // Prüfen, ob beide Werte null oder nicht-objektartig sind (primitive Werte)
    if (obj1 === obj2) return true;

    // Wenn einer von beiden kein Objekt oder null ist
    if (typeof obj1 !== "object" || obj1 === null || typeof obj2 !== "object" || obj2 === null) {
        return false;
    }

    // Alle Schlüssel aus beiden Objekten sammeln
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    // Gleiche Anzahl von Schlüsseln?
    if (keys1.length !== keys2.length) return false;

    // Rekursiv die Werte vergleichen
    for (let key of keys1) {
        if (!keys2.includes(key) || !equal(obj1[key], obj2[key])) {
            return false;
        }
    }

    return true;
}

export { equal };


