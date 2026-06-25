export const COMMON_MESSAGES = {
  INTERNAL_SERVER_ERROR: 'Internal server error',
  UNAUTHORIZED: 'Unauthorized',
  FORBIDDEN: 'Forbidden'
} as const

export const AUTH_MESSAGES = {
  FIRST_NAME_REQUIRED: 'First Name is required',
  FIRST_NAME_MUST_BE_STRING: 'First Name must be a string',
  FIRST_NAME_LENGTH: 'First Name must be between 1 and 50 characters',
  LAST_NAME_REQUIRED: 'Last Name is required',
  LAST_NAME_MUST_BE_STRING: 'Last Name must be a string',
  LAST_NAME_LENGTH: 'Last Name must be between 1 and 50 characters',
  USERNAME_REQUIRED: 'Username is required',
  USERNAME_MUST_BE_STRING: 'Username must be a string',
  USERNAME_LENGTH: 'Username must be between 3 and 50 characters',
  USERNAME_ALREADY_EXISTS: 'Username already exists',
  EMAIL_REQUIRED: 'Email is required',
  EMAIL_MUST_BE_VALID: 'Email must be a valid email',
  EMAIL_ALREADY_EXISTS: 'Email already exists',
  PASSWORD_REQUIRED: 'Password is required',
  PASSWORD_MUST_BE_STRING: 'Password must be a string',
  PASSWORD_LENGTH: 'Password must be between 6 and 50 characters',
  USER_CREATED: 'User created successfully',
  INVALID_CREDENTIALS: 'Invalid username or password',
  SIGN_IN_SUCCESS: 'Signed in successfully',
  SIGN_OUT_SUCCESS: 'Signed out successfully'
} as const

export const USER_MESSAGES = {
  USER_NOT_FOUND: 'User not found'
} as const

export const FRIEND_MESSAGES = {
  CANNOT_SEND_FRIEND_REQUEST: 'You cannot send a friend request to yourself',
  FRIEND_REQUEST_SENT: 'Friend request sent successfully',
  FRIEND_REQUEST_ACCEPTED: 'Friend request accepted successfully',
  FRIEND_REQUEST_DECLINED: 'Friend request declined successfully',
  ALREADY_FRIENDS: 'You are already friends with this user',
  FRIEND_REQUEST_SENT_ALREADY: 'You have already sent a friend request to this user',
  RECEIVER_ID_REQUIRED: 'Receiver id is required',
  RECEIVER_ID_MUST_BE_MONGO_ID: 'Receiver id must be a valid Mongo id',
  FRIEND_REQUEST_ID_MUST_BE_MONGO_ID: 'Friend request id must be a valid Mongo id',
  MESSAGE_MUST_BE_STRING: 'Message must be a string',
  MESSAGE_LENGTH: 'Message must be at most 300 characters',
  FRIEND_REQUEST_NOT_FOUND: 'Friend request not found',
  FORBIDDEN_ACCEPT_FRIEND_REQUEST: 'You are not allowed to accept this friend request',
  FORBIDDEN_DECLINE_FRIEND_REQUEST: 'You are not allowed to decline this friend request'
} as const

export const MESSAGE_MESSAGES = {
  RECIPIENT_ID_REQUIRED: 'Recipient id is required',
  RECIPIENT_ID_MUST_BE_MONGO_ID: 'Recipient id must be a valid Mongo id',
  CONVERSATION_ID_MUST_BE_MONGO_ID: 'Conversation id must be a valid Mongo id',
  CANNOT_MESSAGE_YOURSELF: 'You cannot message yourself',
  CONTENT_REQUIRED: 'Message content or image is required',
  CONTENT_MUST_BE_STRING: 'Message content must be a string',
  CONTENT_LENGTH: 'Message content must be at most 2000 characters',
  IMAGE_URL_MUST_BE_STRING: 'Image URL must be a string',
  MESSAGE_SENT: 'Message sent successfully'
} as const

export const CONVERSATION_MESSAGES = {
  TYPE_REQUIRED: 'Conversation type is required',
  TYPE_MUST_BE_VALID: 'Conversation type must be direct or group',
  MEMBER_IDS_REQUIRED: 'Member ids are required',
  MEMBER_IDS_MUST_BE_ARRAY: 'Member ids must be an array',
  MEMBER_ID_MUST_BE_MONGO_ID: 'Member id must be a valid Mongo id',
  DIRECT_CONVERSATION_REQUIRES_ONE_MEMBER: 'Direct conversation requires exactly one member',
  GROUP_NAME_REQUIRED: 'Group name is required',
  GROUP_NAME_MUST_BE_STRING: 'Group name must be a string',
  GROUP_NAME_LENGTH: 'Group name must be between 1 and 100 characters',
  GROUP_REQUIRES_MEMBERS: 'Group conversation requires at least one member',
  CONVERSATION_CREATED: 'Conversation created successfully',
  CONVERSATION_ID_REQUIRED: 'Conversation id is required',
  CONVERSATION_ID_MUST_BE_MONGO_ID: 'Conversation id must be a valid Mongo id',
  CONVERSATION_NOT_FOUND: 'Conversation not found',
  NOT_CONVERSATION_MEMBER: 'You are not a member of this conversation',
  DIRECT_CONVERSATION_REQUIRED: 'Conversation must be a direct conversation',
  MESSAGE_LIMIT_MUST_BE_VALID: 'Message limit must be between 1 and 100',
  MESSAGE_CURSOR_MUST_BE_DATE: 'Message cursor must be a valid date',
  GROUP_CONVERSATION_REQUIRED: 'Conversation must be a group conversation'
} as const
