// GraphQL API layer: the single request helper used for every query.
// Handles Bearer auth headers, error normalization, and auth-error detection.

import { getToken, removeToken } from "../utils/storage.js";
import { GRAPHQL_URL } from "../config/api.js";

export class AuthError extends Error {

    constructor(message) {

        super(message);

        this.name = "AuthError";

    }

}

export async function graphqlRequest(query, variables = {}) {

    const token = getToken();

    let response;

    try {

        response = await fetch(GRAPHQL_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                query,
                variables
            })
        });

    } catch (error) {

        throw new Error("Network error — please check your connection and try again");

    }

    let result;

    try {

        result = await response.json();

    } catch (error) {

        throw new Error("Invalid server response");

    }

    if (!response.ok || result.errors) {

        const message = result.errors?.[0]?.message || "GraphQL request failed";

        const authError =
            response.status === 401 ||
            /JWT|jwt|Expired|expired|unauthorized|Unauthoriz/i.test(message);

        if (authError) {

            removeToken();

            throw new AuthError("Your session has expired. Please sign in again.");

        }

        throw new Error(message);

    }

    return result.data;

}
