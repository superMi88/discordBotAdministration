
const date = (client, plugin, db) => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0'); // January is 0!
    const yyyy = today.getFullYear();
    const hour = today.getHours();

    // Logik für Abfragen wie isDay, isNight, isWinter, isSummer usw.
    const isNight = hour >= 21 || hour < 6; // Nacht von 21:00 bis 6:00
    const isDay = hour >= 6 && hour < 21; // Tag von 6:00 bis 21:00

    const isWinter = mm === '12' || mm === '01' || mm === '02'; // Dezember bis Februar
    const isSummer = mm === '06' || mm === '07' || mm === '08'; // Juni bis August

    const isSpring = mm === '03' || mm === '04' || mm === '05'; // Frühling
    const isAutumn = mm === '09' || mm === '10' || mm === '11'; // Herbst

    return {
        day: `${yyyy}-${mm}-${dd}`,
        isNight,
        isDay,
        isWinter,
        isSummer,
        isSpring,
        isAutumn,
        hour, // Optional, falls du die aktuelle Stunde auch mitgeben willst
    };
};

module.exports = {
    date,
};





