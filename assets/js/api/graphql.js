import { getToken } from "../utils/storage.js";

const GRAPHQL_URL = "https://learn.zone01oujda.ma/api/graphql-engine/v1/graphql";

export async function graphqlRequest(query, variables = {}) {

    const token = getToken();

    const response = await fetch(GRAPHQL_URL, {
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

    const result = await response.json();

    if (!response.ok || result.errors) {

        throw new Error(
            result.errors?.[0]?.message || "GraphQL request failed"
        );

    }

    return result.data;

}
