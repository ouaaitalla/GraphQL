import { login } from "../api/auth.js";
import { setToken } from "../utils/storage.js";
import { router } from "../router.js";

export function loginTemplate() {
    return `
        <section class="login-page">
            <div class="login-card">

                <h1>GraphQL Profile</h1>

                <p class="subtitle">
                    Sign in to your account
                </p>

                <form id="login-form">

                    <div class="input-group">
                        <label for="identifier">
                            Username or Email
                        </label>

                        <input
                            id="identifier"
                            type="text"
                            placeholder="Enter your username or email"
                            required
                        >
                    </div>

                    <div class="input-group">
                        <label for="password">
                            Password
                        </label>

                        <input
                            id="password"
                            type="password"
                            placeholder="Enter your password"
                            required
                        >
                    </div>

                    <button type="submit" id="login-btn">
                        Login
                    </button>

                    <p id="error-message" role="alert" aria-live="assertive"></p>

                </form>

            </div>
        </section>
    `;
}


export function initLogin() {

    const form = document.getElementById("login-form");

    form.addEventListener("submit", async (event) => {

        event.preventDefault();

        const identifier = document
            .getElementById("identifier")
            .value
            .trim();

        const password = document
            .getElementById("password")
            .value;

        const button = document.getElementById("login-btn");

        const errorMessage = document.getElementById("error-message");

        errorMessage.textContent = "";

        button.disabled = true;

        button.textContent = "Signing in...";

        try {

            const token = await login(identifier, password);

            setToken(token);

            router();

        } catch (error) {

            errorMessage.textContent =
                error.name === "TypeError"
                    ? "Network error — please check your connection and try again"
                    : error.message;

        } finally {

            button.disabled = false;

            button.textContent = "Login";

        }

    });

}
