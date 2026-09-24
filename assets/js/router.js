// Minimal hash-less router: checks the auth token and mounts the
// matching page (login or profile) into the #app container.

import { loginTemplate, initLogin } from "./pages/login.js";
import { profileTemplate, initProfile } from "./pages/profile.js";
import { getToken } from "./utils/storage.js";

const app = document.getElementById("app");

export function router() {

    const token = getToken();

    if (token) {

        app.innerHTML = profileTemplate();
        initProfile(router);

    } else {

        app.innerHTML = loginTemplate();
        initLogin(router);

    }
}
