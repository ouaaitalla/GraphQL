const AUTH_URL = "https://learn.zone01oujda.ma/api/auth/signin";

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

    return token;
}
