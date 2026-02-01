/**
 * OpenAPI 3.0 Specification for Kakebo API
 *
 * This file defines the complete API documentation following the OpenAPI standard.
 * It can be served via /api/docs endpoint or exported as YAML/JSON.
 */

export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Kakebo AI API",
    description: `
API REST para la aplicación Kakebo AI - Sistema de gestión financiera personal basado en el método japonés.

## Autenticación
Todas las rutas (excepto /health) requieren autenticación mediante Supabase Auth.
El token JWT debe enviarse en el header de la cookie de sesión.

## Categorías de Gastos
- **survival**: Gastos esenciales (comida, transporte, salud)
- **optional**: Gastos no esenciales (ropa, restaurantes)
- **culture**: Ocio y desarrollo (libros, cursos, cine)
- **extra**: Gastos inesperados y excepcionales
    `,
    version: "1.0.0",
    contact: {
      name: "Kakebo AI",
    },
  },
  servers: [
    {
      url: "/api",
      description: "API Server",
    },
  ],
  tags: [
    { name: "Health", description: "Health check endpoints" },
    { name: "Expenses", description: "Variable expense management" },
    { name: "Fixed Expenses", description: "Recurring expense management" },
    { name: "Months", description: "Monthly period management" },
    { name: "Settings", description: "User settings and budgets" },
  ],
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Health check",
        description: "Returns the health status of the API and database connection",
        responses: {
          "200": {
            description: "Service is healthy",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", enum: ["healthy", "degraded"] },
                    timestamp: { type: "string", format: "date-time" },
                    version: { type: "string" },
                    checks: {
                      type: "object",
                      properties: {
                        database: { type: "string", enum: ["ok", "error"] },
                      },
                    },
                    responseTime: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/expenses": {
      get: {
        tags: ["Expenses"],
        summary: "List expenses",
        description: "Get all expenses for the authenticated user with optional filters",
        parameters: [
          {
            name: "ym",
            in: "query",
            description: "Filter by year-month (YYYY-MM)",
            schema: { type: "string", pattern: "^\\d{4}-(0[1-9]|1[0-2])$" },
            example: "2025-01",
          },
          {
            name: "month_id",
            in: "query",
            description: "Filter by month ID (UUID)",
            schema: { type: "string", format: "uuid" },
          },
          {
            name: "category",
            in: "query",
            description: "Filter by category",
            schema: { type: "string", enum: ["survival", "optional", "culture", "extra"] },
          },
          {
            name: "from_date",
            in: "query",
            description: "Filter from date (YYYY-MM-DD)",
            schema: { type: "string", format: "date" },
          },
          {
            name: "to_date",
            in: "query",
            description: "Filter to date (YYYY-MM-DD)",
            schema: { type: "string", format: "date" },
          },
        ],
        responses: {
          "200": {
            description: "List of expenses",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/SuccessResponse",
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "422": { $ref: "#/components/responses/ValidationError" },
        },
      },
      post: {
        tags: ["Expenses"],
        summary: "Create expense",
        description: "Create a new expense. If month doesn't exist, it will be created automatically.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateExpense" },
            },
          },
        },
        responses: {
          "201": {
            description: "Expense created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponse" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "409": { $ref: "#/components/responses/Conflict" },
          "422": { $ref: "#/components/responses/ValidationError" },
        },
      },
    },
    "/expenses/{id}": {
      get: {
        tags: ["Expenses"],
        summary: "Get expense by ID",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "200": {
            description: "Expense details",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponse" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
      patch: {
        tags: ["Expenses"],
        summary: "Update expense",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateExpense" },
            },
          },
        },
        responses: {
          "200": {
            description: "Expense updated",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponse" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
          "409": { $ref: "#/components/responses/Conflict" },
          "422": { $ref: "#/components/responses/ValidationError" },
        },
      },
      delete: {
        tags: ["Expenses"],
        summary: "Delete expense",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "204": { description: "Expense deleted" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
          "409": { $ref: "#/components/responses/Conflict" },
        },
      },
    },
    "/fixed-expenses": {
      get: {
        tags: ["Fixed Expenses"],
        summary: "List fixed expenses",
        parameters: [
          {
            name: "active",
            in: "query",
            description: "Filter by active status",
            schema: { type: "boolean" },
          },
          {
            name: "category",
            in: "query",
            schema: { type: "string", enum: ["survival", "optional", "culture", "extra"] },
          },
        ],
        responses: {
          "200": {
            description: "List of fixed expenses",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponse" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
      post: {
        tags: ["Fixed Expenses"],
        summary: "Create fixed expense",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateFixedExpense" },
            },
          },
        },
        responses: {
          "201": {
            description: "Fixed expense created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponse" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "422": { $ref: "#/components/responses/ValidationError" },
        },
      },
    },
    "/fixed-expenses/{id}": {
      get: {
        tags: ["Fixed Expenses"],
        summary: "Get fixed expense by ID",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "200": {
            description: "Fixed expense details",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponse" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
      patch: {
        tags: ["Fixed Expenses"],
        summary: "Update fixed expense",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateFixedExpense" },
            },
          },
        },
        responses: {
          "200": {
            description: "Fixed expense updated",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponse" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
          "422": { $ref: "#/components/responses/ValidationError" },
        },
      },
      delete: {
        tags: ["Fixed Expenses"],
        summary: "Delete fixed expense",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "204": { description: "Fixed expense deleted" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/months": {
      get: {
        tags: ["Months"],
        summary: "List months",
        parameters: [
          {
            name: "status",
            in: "query",
            schema: { type: "string", enum: ["open", "closed"] },
          },
          {
            name: "year",
            in: "query",
            schema: { type: "integer", minimum: 2020, maximum: 2100 },
          },
        ],
        responses: {
          "200": {
            description: "List of months",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponse" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
      post: {
        tags: ["Months"],
        summary: "Get or create month",
        description: "Idempotent operation: returns existing month or creates new one",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["ym"],
                properties: {
                  ym: {
                    type: "string",
                    pattern: "^\\d{4}-(0[1-9]|1[0-2])$",
                    example: "2025-01",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Existing month returned" },
          "201": { description: "New month created" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "422": { $ref: "#/components/responses/ValidationError" },
        },
      },
    },
    "/months/{id}": {
      get: {
        tags: ["Months"],
        summary: "Get month by ID",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "200": {
            description: "Month details",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponse" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
      patch: {
        tags: ["Months"],
        summary: "Update month",
        description: "Update month status or mark savings as done",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateMonth" },
            },
          },
        },
        responses: {
          "200": {
            description: "Month updated",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponse" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
          "409": { $ref: "#/components/responses/Conflict" },
          "422": { $ref: "#/components/responses/ValidationError" },
        },
      },
    },
    "/settings": {
      get: {
        tags: ["Settings"],
        summary: "Get user settings",
        description: "Returns user settings. Creates default settings if none exist.",
        responses: {
          "200": {
            description: "User settings",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponse" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
      patch: {
        tags: ["Settings"],
        summary: "Update user settings",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateSettings" },
            },
          },
        },
        responses: {
          "200": {
            description: "Settings updated",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponse" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "422": { $ref: "#/components/responses/ValidationError" },
        },
      },
    },
  },
  components: {
    schemas: {
      SuccessResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: { type: "object" },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          error: {
            type: "object",
            properties: {
              code: { type: "string" },
              message: { type: "string" },
              details: { type: "object" },
            },
          },
        },
      },
      CreateExpense: {
        type: "object",
        required: ["date", "amount", "category"],
        properties: {
          date: { type: "string", format: "date", example: "2025-01-15" },
          amount: { type: "number", minimum: 0.01, example: 25.5 },
          category: { type: "string", enum: ["survival", "optional", "culture", "extra"] },
          note: { type: "string", maxLength: 500 },
          month_id: { type: "string", format: "uuid" },
        },
      },
      UpdateExpense: {
        type: "object",
        minProperties: 1,
        properties: {
          date: { type: "string", format: "date" },
          amount: { type: "number", minimum: 0.01 },
          category: { type: "string", enum: ["survival", "optional", "culture", "extra"] },
          note: { type: "string", maxLength: 500 },
        },
      },
      CreateFixedExpense: {
        type: "object",
        required: ["name", "amount", "category", "start_ym"],
        properties: {
          name: { type: "string", minLength: 1, maxLength: 100, example: "Netflix" },
          amount: { type: "number", minimum: 0.01, example: 15.99 },
          category: { type: "string", enum: ["survival", "optional", "culture", "extra"] },
          start_ym: { type: "string", pattern: "^\\d{4}-(0[1-9]|1[0-2])$", example: "2025-01" },
          end_ym: { type: "string", pattern: "^\\d{4}-(0[1-9]|1[0-2])$", nullable: true },
          due_day: { type: "integer", minimum: 1, maximum: 31, default: 1 },
          active: { type: "boolean", default: true },
        },
      },
      UpdateFixedExpense: {
        type: "object",
        minProperties: 1,
        properties: {
          name: { type: "string", minLength: 1, maxLength: 100 },
          amount: { type: "number", minimum: 0.01 },
          category: { type: "string", enum: ["survival", "optional", "culture", "extra"] },
          start_ym: { type: "string", pattern: "^\\d{4}-(0[1-9]|1[0-2])$" },
          end_ym: { type: "string", pattern: "^\\d{4}-(0[1-9]|1[0-2])$", nullable: true },
          due_day: { type: "integer", minimum: 1, maximum: 31 },
          active: { type: "boolean" },
        },
      },
      UpdateMonth: {
        type: "object",
        minProperties: 1,
        properties: {
          status: { type: "string", enum: ["open", "closed"] },
          savings_done: { type: "boolean" },
        },
      },
      UpdateSettings: {
        type: "object",
        minProperties: 1,
        properties: {
          monthly_income: { type: "number", minimum: 0 },
          savings_goal: { type: "number", minimum: 0 },
          budget_survival: { type: "number", minimum: 0 },
          budget_optional: { type: "number", minimum: 0 },
          budget_culture: { type: "number", minimum: 0 },
          budget_extra: { type: "number", minimum: 0 },
          current_balance: { type: "number" },
        },
      },
    },
    responses: {
      Unauthorized: {
        description: "Authentication required",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
            example: {
              success: false,
              error: { code: "UNAUTHORIZED", message: "Sesión no válida o expirada" },
            },
          },
        },
      },
      NotFound: {
        description: "Resource not found",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
            example: {
              success: false,
              error: { code: "NOT_FOUND", message: "Recurso no encontrado" },
            },
          },
        },
      },
      Conflict: {
        description: "Conflict with current state",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
            example: {
              success: false,
              error: { code: "CONFLICT", message: "El mes está cerrado" },
            },
          },
        },
      },
      ValidationError: {
        description: "Validation error",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
            example: {
              success: false,
              error: {
                code: "VALIDATION_ERROR",
                message: "Error de validación",
                details: { date: ["Formato inválido"] },
              },
            },
          },
        },
      },
    },
  },
};
