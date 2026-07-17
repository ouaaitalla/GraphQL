import { removeToken } from "../utils/storage.js";
import { router } from "../router.js";
import { graphqlRequest } from "../api/graphql.js";
import { formatXP , getLatestSkills , formatSkillName , getLatestProjects} from "../utils/helpers.js";


const PROFILE_QUERY = `
{
user {
    id
    login
    auditRatio
    totalUp
    totalDown
    attrs

    cohort: events(
      where: {
        cohorts: {
          labelName: {
            _is_null: false
          }
        }
      }
    ) {
      cohorts {
        labelName
      }
    }

    success: audits_aggregate(
      where: {
        closureType: {
          _eq: succeeded
        }
      }
    ) {
      aggregate {
        count
      }
    }

    failed: audits_aggregate(
      where: {
        closureType: {
          _eq: failed
        }
      }
    ) {
      aggregate {
        count
      }
    }
  }

  totalXP: transaction_aggregate(
    where: {
      type: {
        _eq: "xp"
      }
      event: {
        object: {
          name: {
            _eq: "Module"
          }
        }
      }
    }
  ) {
    aggregate {
      sum {
        amount
      }
    }
  }

  level: transaction_aggregate(
    where: {
      type: {
        _eq: "level"
      }
      event: {
        object: {
          name: {
            _eq: "Module"
          }
        }
      }
    }
  ) {
    aggregate {
      max {
        amount
      }
    }
  }

  skills: transaction(
    where: {
      type: {
        _ilike: "%skill%"
      }
    }
    order_by: {
      amount: desc
    }
  ) {
    type
    amount
  }

  projects: result(
    where: {
      object: {
        type: {
          _eq: "project"
        }
      }
    }
    order_by: {
      createdAt: desc
    }
  ) {
    grade
    createdAt
    path

    object {
      id
      name
      type
    }
  }
}
`;


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

                    <span class="level-label">
                        Level
                    </span>

                    <span id="level" class="level-value">
                        -
                    </span>

                    </div>

                </div>


                <div class="card projects-card">

                    <h2>
                        Projects
                    </h2>

                    <div id="projects-list">

                    </div>

                </div>


                <div class="card audit-card">

                    <h2>
                        Audit Ratio
                    </h2>

                    <div id="audit-graph">

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

export async function initProfile() {


    try {

        const data = await graphqlRequest(PROFILE_QUERY);

        const user = data.user[0];

        document.getElementById("username").textContent = user.login;

        const cohort = user.cohort?.[0]?.cohorts?.labelName || "Unknown";

        document.getElementById("cohort").textContent = cohort;

        document.getElementById("total-xp").textContent = formatXP(data.totalXP.aggregate.sum?.amount || 0);

        document.getElementById("level").textContent = data.level.aggregate.max?.amount || 0;

        document.getElementById("audit-ratio").textContent = (user.auditRatio ?? 0).toFixed(1);

        document.getElementById("total-up").textContent = formatXP(user.totalUp || 0);

        document.getElementById("total-down").textContent = formatXP(user.totalDown || 0);

        const skillsList = document.getElementById("skills-list");

        const skills = getLatestSkills(data.skills);

        let html = "";

        skills.forEach((skill) => {

            html += `
                <div class="skill">

                    <div class="skill-header">

                        <span>${formatSkillName(skill.type)}</span>

                        <span>${skill.amount}</span>

                    </div>

                    <div class="skill-bar">

                        <div
                            class="skill-fill"
                            style="width:${Math.min(skill.amount,100)}%">
                        </div>

                    </div>

                </div>`;});

        skillsList.innerHTML = html;
        
        const projectsList = document.getElementById("projects-list");

        const projects = getLatestProjects(data.projects);
        
        const names = data.projects.map(project => project.object.name);

        console.log(names);

        const count = {};

        data.projects.forEach(project => {
            const name = project.object.name;
            count[name] = (count[name] || 0) + 1;
        });

        console.log(count);
        
        let htmlproject = "";

        projects.forEach((project) => {

            htmlproject += `
                <div class="project-card">

                    <div>

                        <h3>
                            ${project.object.name}
                        </h3>

                        <small>
                            ${new Date(project.createdAt).toLocaleDateString()}
                        </small>

                    </div>

                    <div>

                        ${formatXP(project.amount)}

                    </div>

                </div>
    `;

});

projectsList.innerHTML = htmlproject;

    }catch (error) {
        console.error("Error initializing profile:", error);
    }

    const logoutBtn = document.getElementById("logout-btn");

    logoutBtn.addEventListener("click", () => {

        removeToken();

        router();

    });

}




