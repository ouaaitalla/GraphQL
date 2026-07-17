import { getToken } from "./storage.js";

export function getUserIdFromToken() {

    const token = getToken();

    if (!token) {
        return null;
    }

    try {

        const payload = token.split(".")[1];

        const decodedPayload = JSON.parse(atob(payload));

        return Number(
            decodedPayload["https://hasura.io/jwt/claims"]["x-hasura-user-id"]
        );

    } catch (error) {

        console.error("Invalid JWT:", error);

        return null;

    }

}


export function formatXP(value) {

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
        : xp.toFixed(2);

    return `${formatted} ${units[unitIndex]}`;

}

export function getLatestSkills(skills) {

    const latestSkills = {};

    for (const skill of skills) {

        if (!latestSkills[skill.type]) {
            latestSkills[skill.type] = skill;
        }

    }

    return Object.values(latestSkills);

}

export function formatSkillName(name) {

    return name
        .replace("skill_", "")
        .replaceAll("-", " ")
        .replace(/\b\w/g, letter => letter.toUpperCase());

}

export function getLatestProjects(projects) {

    const latestProjects = {};

    for (const project of projects) {

        const projectName = project.object.name;

        if (!latestProjects[projectName]) {
            latestProjects[projectName] = project;
        }

    }

    return Object.values(latestProjects);

}
