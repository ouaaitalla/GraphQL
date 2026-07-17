import { removeToken } from "../utils/storage.js";
import { router } from "../router.js";
import { graphqlRequest } from "../api/graphql.js";
import { formatXP , getLatestSkills , formatSkillName , getLatestProjects} from "../utils/helpers.js";
import { auditGraph } from "../components/graph.js";
import { skillsRadarGraph } from "../components/graph.js";


const PROFILE_QUERY = `
{
  user {
    id
    login
    auditRatio
    totalUp
    totalDown
    attrs

    # Updated inline cohort mapping here
    cohort: events(where: {cohorts: {labelName: {_is_null: false}}}) {
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

  projects: transaction(
    where: {
      type: { _eq: "xp" }
      eventId: { _eq: 41 }
      object: {
        type: { _eq: "project" }
      }
    }
    order_by: {
      createdAt: desc
    }
  ) {
    amount
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

export async function initProfile() {


    try {

        const data = await graphqlRequest(PROFILE_QUERY);

        const user = data.user[0];

        console.log(data)

        document.getElementById("username").textContent = user.login;

        const cohort = user?.cohort[0]?.cohorts[0]?.labelName|| "Unknown";


        document.getElementById("cohort").textContent = cohort;

        document.getElementById("total-xp").textContent = formatXP(data.totalXP.aggregate.sum?.amount || 0);

        document.getElementById("level").textContent = data.level.aggregate.max?.amount || 0;

        document.getElementById("audit-graph").innerHTML = auditGraph(user.totalUp, user.totalDown);

        document.getElementById("audit-up").textContent = formatXP(user.totalUp);

        document.getElementById("audit-down").textContent = formatXP(user.totalDown);

        const skills = getLatestSkills(data.skills);

        const topSkills = skills.sort((a, b) => b.amount - a.amount).slice(0, 8);

        document.getElementById("skills-graph").innerHTML = skillsRadarGraph(topSkills);

        const projectsList = document.getElementById("projects-list");

        projectsList.innerHTML = "";

        data.projects.forEach(project => {

            projectsList.innerHTML += `
                <div class="project-item">

                    <div class="project-info">

                        <h4>${project.object.name}</h4>

                        <small>
                            ${new Date(project.createdAt).toLocaleDateString()}
                        </small>

                    </div>

                    <div class="project-xp">

                        ${formatXP(project.amount)}

                    </div>

                </div>
            `;

        });

    }catch (error) {
        console.error("Error initializing profile:", error);
    }

    const logoutBtn = document.getElementById("logout-btn");

    logoutBtn.addEventListener("click", () => {

        removeToken();

        router();

    });

}




