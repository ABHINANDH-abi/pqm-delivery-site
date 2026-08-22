// Shared API response type definitions used internally by the backend.
// The canonical shapes are in shared/src/types/api.types.ts
// These re-export them for convenience inside backend modules.

export type {
  ApiSuccessResponse,
  ApiErrorResponse,
  ApiResponse,
  PaginationMeta,
  PaginatedResponse,
} from '../../../shared/src/types/api.types';
