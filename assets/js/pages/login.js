// Login page: template string + event wiring for the sign-in form.
// Network logic lives in the auth API; token persistence in utils/storage.
// The router is injected as a callback (initLogin(rerender)) so pages do
// not import the router, keeping the dependency direction one-way.

import { login } from "../api/auth.js";
import { setToken } from "../utils/storage.js";

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


export function initLogin(rerender) {

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

            rerender();

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
