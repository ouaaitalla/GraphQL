// Skills radar chart.
// Pure SVG-string generator: takes an array of {type, amount} skills in,
// returns an SVG string out. No DOM access and no data fetching happens here.


export function skillsRadarGraph(skills) {

    if (!skills || skills.length === 0) {

        return `
            <p class="empty-state">
                No skill data available yet.
            </p>
        `;

    }

    // 1. Scale down dimensions so it fits inside a 350px row alongside headers
    const size = 260;
    const center = size / 2;
    const radius = 80;

    const angleStep = (Math.PI * 2) / skills.length;

    // Radar values are normalized against the highest skill so the
    // polygon stays readable no matter the absolute amounts.
    const maxValue = Math.max(...skills.map(skill => skill.amount), 1);

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

        const labelX = center + Math.cos(angle) * (radius + 18);
        const labelY = center + Math.sin(angle) * (radius + 14);

        // Anchor side labels toward the chart so long names don't get clipped
        const anchor = Math.abs(Math.cos(angle)) < 0.3
            ? "middle"
            : Math.cos(angle) > 0
                ? "start"
                : "end";

        // 2. Changed fill from "white" to "#555" so it's visible on a white background
        labels += `
            <text
                x="${labelX}"
                y="${labelY}"
                text-anchor="${anchor}"
                font-size="11"
                font-weight="600"
                fill="#555">
                ${skill.type.replace("skill_", "")}
            </text>
        `;

        const valueRadius = radius * (skill.amount / maxValue);
        const x = center + Math.cos(angle) * valueRadius;
        const y = center + Math.sin(angle) * valueRadius;

        polygon += `${x},${y} `;
    });

    return `
        <svg
            width="${size}"
            height="${size}"
            viewBox="0 0 ${size} ${size}"
            style="overflow: visible;"
            role="img"
            aria-label="Radar chart of top ${skills.length} skills">  <!-- Prevents label clipping -->
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
