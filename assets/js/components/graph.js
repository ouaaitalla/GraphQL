


export function auditGraph(up, down) {

    const total = up + down;

    const percent = total === 0
        ? 0
        : (up / total) * 100;

    const radius = 80;

    const circumference = 2 * Math.PI * radius;

    const ratio = down === 0 ? up : up / down;

    const offset =
        circumference -
        (percent / 100) * circumference;

    return `
        <svg
            width="220"
            height="220"
            viewBox="0 0 220 220">

            <circle
                cx="110"
                cy="110"
                r="${radius}"
                stroke="#ececec"
                stroke-width="18"
                fill="none"
            />

            <circle
                cx="110"
                cy="110"
                r="${radius}"
                stroke="#4f46e5"
                stroke-width="18"
                fill="none"
                stroke-linecap="round"
                stroke-dasharray="${circumference}"
                stroke-dashoffset="${offset}"
                transform="rotate(-90 110 110)"
            />

            <text
                x="110"
                y="105"
                text-anchor="middle"
                font-size="30"
                font-weight="700">

                ${ratio.toFixed(1)}

            </text>

            <text
                x="110"
                y="130"
                text-anchor="middle"
                font-size="15">

                Ratio

            </text>

        </svg>
    `;
}


export function skillsRadarGraph(skills) {
    // 1. Scale down dimensions so it fits inside a 350px row alongside headers
    const size = 260; 
    const center = size / 2;
    const radius = 80; 

    const angleStep = (Math.PI * 2) / skills.length;

    let axes = "";
    let labels = "";
    let polygon = "";

    skills.forEach((skill, index) => {
        const angle = index * angleStep - Math.PI / 2;

        const outerX = center + Math.cos(angle) * radius;
        const outerY = center + Math.sin(angle) * radius;

        axes += `
            <line
                x1="${center}"
                y1="${center}"
                x2="${outerX}"
                y2="${outerY}"
                stroke="#ddd"
            />
        `;

        // 2. Changed fill from "white" to "#555" so it's visible on a white background
        labels += `
            <text
                x="${center + Math.cos(angle) * (radius + 18)}"
                y="${center + Math.sin(angle) * (radius + 14)}"
                text-anchor="middle"
                font-size="11"
                font-weight="600"
                fill="#555"> 
                ${skill.type.replace("skill_", "")}
            </text>
        `;

        const valueRadius = radius * (skill.amount / 100);
        const x = center + Math.cos(angle) * valueRadius;
        const y = center + Math.sin(angle) * valueRadius;

        polygon += `${x},${y} `;
    });

    return `
        <svg
            width="${size}"
            height="${size}"
            viewBox="0 0 ${size} ${size}"
            style="overflow: visible;">  <!-- Prevents label clipping -->
            ${axes}
            <polygon
                points="${polygon}"
                fill="rgba(79,70,229,.15)"
                stroke="#4f46e5"
                stroke-width="2"
            />
            ${labels}
        </svg>
    `;
}