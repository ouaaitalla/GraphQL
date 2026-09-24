// Audit ratio donut chart.
// Pure SVG-string generator: takes numbers in, returns an SVG string out.
// No DOM access and no data fetching happens here.

import { formatXP } from "../../utils/format.js";


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

    // When down is 0 the ratio is displayed as the total "up" figure;
    // otherwise show the up/down quotient with one decimal.
    const ratioLabel = down === 0
        ? formatXP(up)
        : ratio.toFixed(1);

    return `
        <svg
            width="220"
            height="220"
            viewBox="0 0 220 220"
            role="img"
            aria-label="Audit ratio ${ratioLabel}: ${formatXP(up)} up, ${formatXP(down)} down">

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

                ${ratioLabel}

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
