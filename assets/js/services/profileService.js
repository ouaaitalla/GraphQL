// Profile service: transforms the raw PROFILE_QUERY GraphQL response into
// the ready-to-render values used by the profile page.
// This module is pure data shaping — no DOM access and no fetching.

import { formatXP } from "../utils/format.js";
import { escapeHTML } from "../utils/dom.js";
import { auditGraph } from "../components/charts/auditDonutChart.js";


// Keeps only the first (highest-amount) transaction per skill type,
// since the query returns skills sorted by amount desc.
export function getLatestSkills(skills) {

    const latestSkills = {};

    for (const skill of skills) {

        if (!latestSkills[skill.type]) {
            latestSkills[skill.type] = skill;
        }

    }

    return Object.values(latestSkills);

}

// Deduplicates projects by name, keeping the first occurrence.
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

// Maps the raw GraphQL response to the exact values the profile page renders.
export function mapProfileData(data) {

    const user = data.user[0];

    return {
        username: user.login,
        cohort: user?.cohort[0]?.cohorts[0]?.labelName || "Unknown",
        totalXP: formatXP(Math.round(data.totalXP.aggregate.sum?.amount) || 0),
        level: data.level.aggregate.max?.amount || 0,
        auditGraphSVG: auditGraph(user.totalUp, user.totalDown),
        auditUp: formatXP(Math.trunc(user.totalUp), 2),
        auditDown: formatXP(user.totalDown, 2),
        skills: getLatestSkills(data.skills)
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 8),
        projects: getLatestProjects(data.projects).map(project => ({
            name: escapeHTML(project.object.name),
            date: new Date(project.createdAt).toLocaleDateString(),
            xp: formatXP(project.amount, 1)
        }))
    };

}
