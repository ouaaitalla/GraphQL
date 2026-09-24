// Generic, dependency-free formatting helpers.
// These must stay pure string/number utilities — no API, DOM or app knowledge.

export function formatXP(value,n=0) {

    if (!value) {
        return "0 B";
    }

    const units = ["B", "KB", "MB"];

    let unitIndex = 0;
    let xp = value;

    while (xp >= 1000 && unitIndex < units.length - 1) {
        xp /= 1000;
        unitIndex++;
    }

    const formatted = Number.isInteger(xp)
        ? xp
        : xp.toFixed(n);

    return `${formatted} ${units[unitIndex]}`;

}

export function formatSkillName(name) {

    return name
        .replace("skill_", "")
        .replaceAll("-", " ")
        .replace(/\b\w/g, letter => letter.toUpperCase());

}
