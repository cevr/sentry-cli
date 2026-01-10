import { Schema } from "effect"

export class ConfigError extends Schema.TaggedError<ConfigError>()(
  "ConfigError",
  {
    message: Schema.String,
    cause: Schema.optional(Schema.Unknown),
  }
) {}

export class ApiError extends Schema.TaggedError<ApiError>()("ApiError", {
  message: Schema.String,
  status: Schema.optional(Schema.Number),
  cause: Schema.optional(Schema.Unknown),
}) {}

// ApiNotFoundError is a type alias for ApiError for simpler error handling
export type ApiNotFoundError = ApiError

export class ApiValidationError extends Schema.TaggedError<ApiValidationError>()(
  "ApiValidationError",
  {
    message: Schema.String,
    details: Schema.optional(Schema.Unknown),
  }
) {}

export class AuthError extends Schema.TaggedError<AuthError>()("AuthError", {
  message: Schema.String,
  cause: Schema.optional(Schema.Unknown),
}) {}

export type SentryCliError =
  | ConfigError
  | ApiError
  | ApiValidationError
  | AuthError
