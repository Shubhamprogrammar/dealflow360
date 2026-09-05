# API Guidelines

- Version APIs under `/api/v1` and use resource-oriented kebab-case paths.
- Use 200 for reads/updates, 201 for creation, 204 for empty deletion, and 400/401/403/404/409/422/429/500 for documented failures.
- Return `{ success, message, data }`; errors return `{ success: false, message, error: { code } }`.
- Validate body, params, query, and headers with Zod. Paginate collections and document filtering/sorting parameters.
- Send `Authorization: Bearer <access-token>` for protected resources. Roles belong in authorization middleware.
- Never return passwords, tokens, or internal database details.
