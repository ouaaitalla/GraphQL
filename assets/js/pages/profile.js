// Profile page: dashboard template + event wiring.
// Data fetching goes through api/graphql.js; response shaping through the
// profile service; chart markup through the chart components.
// The router is injected as a callback (initProfile(rerender)) so pages do
// not import the router, keeping the dependency direction one-way.

import { removeToken } from "../utils/storage.js";
import { graphqlRequest, AuthError } from "../api/graphql.js";
import { PROFILE_QUERY } from "../queries/profile.js";
import { mapProfileData } from "../services/profileService.js";
import { skillsRadarGraph } from "../components/charts/skillsRadarChart.js";


export function profileTemplate() {
    return `
        <section class="profile-page">

            <header class="navbar">

                <div class="user-info">

                    <div class="avatar">
                        👤
                    </div>

                    <div>

                        <h2 id="username">Loading...</h2>

                        <p id="cohort">
                            Loading...
                        </p>

                    </div>

                </div>

                <button
                    id="logout-btn"
                    class="logout-btn">
                    Logout
                </button>

            </header>


            <main class="dashboard">

                <div class="card summary-card">

                    <h2>Total XP</h2>

                    <h1 id="total-xp">-</h1>

                    <div class="level-circle">
formatxp
                    <span class="level-label">
                        Level
                    </span>

                    <span id="level" class="level-value">
                        -
                    </span>

                    </div>formatxp

                </div>


                <div class="card projects-card">

                    <h2>
                        Projects
                    </h2>

                    <div id="projects-list">

                    </div>

                </div>

                <div class="audit-card card">

                    <h2>
                        Audit Ratio
                    </h2>

                    <div id="audit-graph">

                    </div>

                    <div class="audit-info">

                    <div class="audit-item">

                        <div class="audit-left">

                            <span class="audit-dot audit-up"></span>

                            <span>Up</span>

                        </div>

                        <span id="audit-up"></span>

                    </div>

                    <div class="audit-item">

                        <div class="audit-left">

                            <span class="audit-dot audit-down"></span>

                            <span>Down</span>

                        </div>

                        <span id="audit-down"></span>

                    </div>

                    </div>

                </div>

                <div class="card skills-card">

                    <h2>
                        Skills
                    </h2>

                    <div id="skills-graph">

                    </div>

                </div>

            </main>

        </section>
    `;
}

export async function initProfile(rerender) {

    const logoutBtn = document.getElementById("logout-btn");

    logoutBtn.addEventListener("click", () => {

        removeToken();

        rerender();

    });

    try {

        const data = await graphqlRequest(PROFILE_QUERY);
        console.log(data)

        const profile = mapProfileData(data);

    document.getElementById("username").textContent = profile.username;

    document.getElementById("cohort").textContent = profile.cohort;

    document.getElementById("total-xp").textContent = profile.totalXP;

    document.getElementById("level").textContent = profile.level;

    document.getElementById("audit-graph").innerHTML = profile.auditGraphSVG;

    document.getElementById("audit-up").textContent = profile.auditUp;

    document.getElementById("audit-down").textContent = profile.auditDown;

    const skillsGraph = document.getElementById("skills-graph");

    if (profile.skills.length === 0) {

        skillsGraph.innerHTML = `
            <p class="empty-state">
                No skill data available yet.
            </p>
        `;

    } else {

        skillsGraph.innerHTML = skillsRadarGraph(profile.skills);

    }

    const projectsList = document.getElementById("projects-list");

    projectsList.innerHTML = "";

    if (profile.projects.length === 0) {

        projectsList.innerHTML = `
            <p class="empty-state">
                No projects completed yet.
            </p>
        `;

    } else {

        profile.projects.forEach(project => {

            projectsList.innerHTML += `
                <div class="project-item">

                    <div class="project-info">

                        <h4>${project.name}</h4>

                        <small>
                            ${project.date}
                        </small>

                    </div>

                    <div class="project-xp">

                        ${project.xp}

                    </div>

                </div>
            `;

        });

    }

    } catch (error) {

        if (error instanceof AuthError) {

            rerender();

            return;

        }

        console.error("Error initializing profile:", error);

        showError(error.message || "Something went wrong while loading your profile");

    }
}

// Shows the profile error banner.
// NOTE: kept as-is from the original code — profileTemplate() does not
// currently render the #profile-error / #profile-error-message elements,
// so this is a no-op in practice. Preserved intentionally to avoid any
// behavior change during this refactor.
function showError(message) {

    const errorBox = document.getElementById("profile-error");

    const errorMessage = document.getElementById("profile-error-message");

    errorMessage.textContent = message;

    errorBox.hidden = false;

}
