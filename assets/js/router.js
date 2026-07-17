import { loginTemplate, initLogin } from "./pages/login.js";
import { profileTemplate, initProfile } from "./pages/profile.js";
import { getToken } from "./utils/storage.js";

const app = document.getElementById("app");

export function router() {

    const token = getToken();

    if (token) {

        app.innerHTML = profileTemplate();
        initProfile();

    } else {

        app.innerHTML = loginTemplate();
        initLogin();

    }
}
