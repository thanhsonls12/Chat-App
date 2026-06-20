export const COMMON_MESSAGES = {
  INTERNAL_SERVER_ERROR: 'Internal server error',
  UNAUTHORIZED: 'Unauthorized'
} as const

export const AUTH_MESSAGES = {
  SIGN_UP_FIELDS_REQUIRED: 'Username, password, email, first name and last name are required',
  SIGN_IN_FIELDS_REQUIRED: 'Username and password are required',
  USER_ALREADY_EXISTS: 'User already exists',
  USER_CREATED: 'User created successfully',
  INVALID_CREDENTIALS: 'Invalid username or password',
  SIGN_IN_SUCCESS: 'Signed in successfully',
  SIGN_OUT_SUCCESS: 'Signed out successfully'
} as const

export const USER_MESSAGES = {
  USER_NOT_FOUND: 'User not found'
} as const
