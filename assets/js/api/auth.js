// Authentication API: exchanges Zone01 credentials for a JWT.
// Network layer only — no DOM access and no token storage here.

import { AUTH_URL } from "../config/api.js";

export async function login(identifier, password) {

    const credentials = btoa(`${identifier}:${password}`);

    const response = await fetch(AUTH_URL, {
        method: "POST",
        headers: {
            "Authorization": `Basic ${credentials}`
        }
    });

    if (!response.ok) {
        throw new Error("Invalid username/email or password");
    }

    const token = (await response.text()).replace(/^"|"$/g, "");

    return token;
}
