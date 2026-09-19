const bearerSecurity = [{ bearerAuth: [] }]

const errorResponses = {
  400: { description: 'Bad request or validation error' },
  401: { description: 'Unauthorized' },
  403: { description: 'Forbidden' },
  404: { description: 'Resource not found' },
  409: { description: 'Conflict' }
}

const idParameter = (name: string, description: string) => ({
  name,
  in: 'path',
  required: true,
  description,
  schema: { type: 'string', example: '64f1c2a33e4d5f6789012345' }
})

export const swaggerDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Chat App API',
    version: '1.0.0',
    description:
      'REST API for authentication, users, friends, conversations and messages. Real-time chat and call signaling use Socket.IO and are not represented as REST endpoints here.'
  },
  servers: [{ url: '/api', description: 'Current backend' }],
  tags: [
    { name: 'Auth' },
    { name: 'Users' },
    { name: 'Friends' },
    { name: 'Messages' },
    { name: 'Conversations' }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Access token returned by POST /auth/signin or POST /auth/refresh'
      }
    },
    schemas: {
      MessageResponse: {
        type: 'object',
        properties: {
          message: { type: 'string' }
        }
      },
      AuthResponse: {
        type: 'object',
        required: ['accessToken'],
        properties: {
          message: { type: 'string' },
          accessToken: { type: 'string', description: 'JWT access token' }
        }
      },
      User: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          username: { type: 'string' },
          email: { type: 'string', format: 'email' },
          displayName: { type: 'string' },
          bio: { type: 'string', nullable: true },
          phone: { type: 'string', nullable: true },
          avatarUrl: { type: 'string', nullable: true }
        }
      },
      Conversation: {
        type: 'object',
        additionalProperties: true,
        properties: {
          _id: { type: 'string' },
          type: { type: 'string', enum: ['direct', 'group'] },
          name: { type: 'string', nullable: true },
          participants: {
            type: 'array',
            items: { $ref: '#/components/schemas/User' }
          }
        }
      },
      ChatMessage: {
        type: 'object',
        additionalProperties: true,
        properties: {
          _id: { type: 'string' },
          conversationId: { type: 'string' },
          senderId: { type: 'string' },
          content: { type: 'string', nullable: true },
          imgUrl: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' }
        }
      }
    }
  },
  paths: {
    '/auth/signup': {
      post: {
        tags: ['Auth'],
        summary: 'Create an account',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'password', 'email', 'firstName', 'lastName'],
                properties: {
                  username: { type: 'string', minLength: 3, maxLength: 50 },
                  password: { type: 'string', minLength: 6, maxLength: 50, format: 'password' },
                  email: { type: 'string', format: 'email' },
                  firstName: { type: 'string', minLength: 1, maxLength: 50 },
                  lastName: { type: 'string', minLength: 1, maxLength: 50 }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Account created',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/MessageResponse' } }
            }
          },
          400: errorResponses[400],
          409: errorResponses[409]
        }
      }
    },
    '/auth/signin': {
      post: {
        tags: ['Auth'],
        summary: 'Sign in',
        description:
          'Returns an access token and sets the refreshToken HttpOnly cookie for session renewal.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'password'],
                properties: {
                  username: { type: 'string' },
                  password: { type: 'string', format: 'password' }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Signed in',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } }
            }
          },
          400: errorResponses[400],
          401: errorResponses[401]
        }
      }
    },
    '/auth/signout': {
      post: {
        tags: ['Auth'],
        summary: 'Sign out',
        description: 'Deletes the current refresh-token session and clears its cookie.',
        responses: {
          200: { description: 'Signed out' },
          401: errorResponses[401]
        }
      }
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Refresh access token',
        description: 'Uses the refreshToken HttpOnly cookie to issue a new access token.',
        responses: {
          200: { description: 'New access token issued' },
          401: errorResponses[401],
          403: errorResponses[403]
        }
      }
    },
    '/users/me': {
      get: {
        tags: ['Users'],
        summary: 'Get current user',
        security: bearerSecurity,
        responses: {
          200: { description: 'Current user' },
          401: errorResponses[401]
        }
      },
      patch: {
        tags: ['Users'],
        summary: 'Update current user profile',
        security: bearerSecurity,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  displayName: { type: 'string', minLength: 1, maxLength: 100 },
                  bio: { type: 'string', maxLength: 500 },
                  phone: { type: 'string', example: '+84 912 345 678' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Profile updated' },
          400: errorResponses[400],
          401: errorResponses[401]
        }
      }
    },
    '/users/me/password': {
      patch: {
        tags: ['Users'],
        summary: 'Change password',
        security: bearerSecurity,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['currentPassword', 'newPassword'],
                properties: {
                  currentPassword: { type: 'string', format: 'password' },
                  newPassword: { type: 'string', minLength: 6, maxLength: 50, format: 'password' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Password updated' },
          400: errorResponses[400],
          401: errorResponses[401]
        }
      }
    },
    '/users/search': {
      get: {
        tags: ['Users'],
        summary: 'Search user by username',
        security: bearerSecurity,
        parameters: [
          {
            name: 'username',
            in: 'query',
            required: true,
            schema: { type: 'string', minLength: 3, maxLength: 50 }
          }
        ],
        responses: {
          200: { description: 'Search result' },
          400: errorResponses[400],
          401: errorResponses[401],
          404: errorResponses[404]
        }
      }
    },
    '/users/uploadAvatar': {
      post: {
        tags: ['Users'],
        summary: 'Upload current user avatar',
        security: bearerSecurity,
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['file'],
                properties: { file: { type: 'string', format: 'binary' } }
              }
            }
          }
        },
        responses: {
          200: { description: 'Avatar updated' },
          400: errorResponses[400],
          401: errorResponses[401]
        }
      }
    },
    '/friends': {
      get: {
        tags: ['Friends'],
        summary: 'List friends',
        security: bearerSecurity,
        responses: {
          200: { description: 'Friends list' },
          401: errorResponses[401]
        }
      }
    },
    '/friends/requests': {
      get: {
        tags: ['Friends'],
        summary: 'List sent and received friend requests',
        security: bearerSecurity,
        responses: {
          200: { description: 'Friend requests' },
          401: errorResponses[401]
        }
      },
      post: {
        tags: ['Friends'],
        summary: 'Send friend request',
        security: bearerSecurity,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['to'],
                properties: {
                  to: { type: 'string', description: 'Receiver user ID' },
                  message: { type: 'string', maxLength: 300 }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'Friend request sent' },
          400: errorResponses[400],
          401: errorResponses[401],
          409: errorResponses[409]
        }
      }
    },
    '/friends/requests/{requestId}/accept': {
      post: {
        tags: ['Friends'],
        summary: 'Accept friend request',
        security: bearerSecurity,
        parameters: [idParameter('requestId', 'Friend request ID')],
        responses: {
          200: { description: 'Friend request accepted' },
          400: errorResponses[400],
          401: errorResponses[401],
          404: errorResponses[404]
        }
      }
    },
    '/friends/requests/{requestId}/decline': {
      post: {
        tags: ['Friends'],
        summary: 'Decline friend request',
        security: bearerSecurity,
        parameters: [idParameter('requestId', 'Friend request ID')],
        responses: {
          204: { description: 'Friend request declined' },
          400: errorResponses[400],
          401: errorResponses[401],
          404: errorResponses[404]
        }
      }
    },
    '/messages/direct': {
      post: {
        tags: ['Messages'],
        summary: 'Send direct message',
        security: bearerSecurity,
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  recipientId: { type: 'string' },
                  conversationId: { type: 'string' },
                  content: { type: 'string', maxLength: 2000 },
                  image: { type: 'string', format: 'binary' }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'Message sent' },
          400: errorResponses[400],
          401: errorResponses[401],
          404: errorResponses[404]
        }
      }
    },
    '/messages/group': {
      post: {
        tags: ['Messages'],
        summary: 'Send group message',
        security: bearerSecurity,
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['conversationId'],
                properties: {
                  conversationId: { type: 'string' },
                  content: { type: 'string', maxLength: 2000 },
                  image: { type: 'string', format: 'binary' }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'Message sent' },
          400: errorResponses[400],
          401: errorResponses[401],
          404: errorResponses[404]
        }
      }
    },
    '/messages/{messageId}': {
      patch: {
        tags: ['Messages'],
        summary: 'Edit message',
        security: bearerSecurity,
        parameters: [idParameter('messageId', 'Message ID')],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['content'],
                properties: { content: { type: 'string', maxLength: 2000 } }
              }
            }
          }
        },
        responses: {
          200: { description: 'Message updated' },
          400: errorResponses[400],
          401: errorResponses[401],
          403: errorResponses[403],
          404: errorResponses[404]
        }
      },
      delete: {
        tags: ['Messages'],
        summary: 'Delete or revoke message',
        security: bearerSecurity,
        parameters: [idParameter('messageId', 'Message ID')],
        responses: {
          200: { description: 'Message deleted or revoked' },
          400: errorResponses[400],
          401: errorResponses[401],
          403: errorResponses[403],
          404: errorResponses[404]
        }
      }
    },
    '/conversations': {
      get: {
        tags: ['Conversations'],
        summary: 'List current user conversations',
        security: bearerSecurity,
        responses: {
          200: { description: 'Conversation list' },
          401: errorResponses[401]
        }
      },
      post: {
        tags: ['Conversations'],
        summary: 'Create direct or group conversation',
        security: bearerSecurity,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['type', 'memberIds'],
                properties: {
                  type: { type: 'string', enum: ['direct', 'group'] },
                  name: { type: 'string', minLength: 1, maxLength: 100 },
                  memberIds: {
                    type: 'array',
                    items: { type: 'string' },
                    minItems: 1
                  }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'Conversation created' },
          400: errorResponses[400],
          401: errorResponses[401],
          404: errorResponses[404]
        }
      }
    },
    '/conversations/{conversationId}/messages': {
      get: {
        tags: ['Conversations'],
        summary: 'Get conversation message history',
        security: bearerSecurity,
        parameters: [
          idParameter('conversationId', 'Conversation ID'),
          {
            name: 'limit',
            in: 'query',
            required: false,
            schema: { type: 'integer', minimum: 1, maximum: 100 }
          },
          {
            name: 'cursor',
            in: 'query',
            required: false,
            description: 'Pagination cursor returned by the previous response',
            schema: { type: 'string' }
          }
        ],
        responses: {
          200: { description: 'Messages and next cursor' },
          400: errorResponses[400],
          401: errorResponses[401],
          404: errorResponses[404]
        }
      }
    },
    '/conversations/{conversationId}/read': {
      patch: {
        tags: ['Conversations'],
        summary: 'Mark conversation as read',
        security: bearerSecurity,
        parameters: [idParameter('conversationId', 'Conversation ID')],
        responses: {
          204: { description: 'Conversation marked as read' },
          400: errorResponses[400],
          401: errorResponses[401],
          404: errorResponses[404]
        }
      }
    },
    '/conversations/{conversationId}/members': {
      post: {
        tags: ['Conversations'],
        summary: 'Add members to group conversation',
        security: bearerSecurity,
        parameters: [idParameter('conversationId', 'Conversation ID')],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['memberIds'],
                properties: {
                  memberIds: { type: 'array', items: { type: 'string' }, minItems: 1 }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Members added' },
          400: errorResponses[400],
          401: errorResponses[401],
          403: errorResponses[403],
          404: errorResponses[404]
        }
      }
    },
    '/conversations/{conversationId}/members/{memberId}': {
      delete: {
        tags: ['Conversations'],
        summary: 'Remove member from group conversation',
        security: bearerSecurity,
        parameters: [
          idParameter('conversationId', 'Conversation ID'),
          idParameter('memberId', 'Member user ID')
        ],
        responses: {
          200: { description: 'Member removed' },
          400: errorResponses[400],
          401: errorResponses[401],
          403: errorResponses[403],
          404: errorResponses[404]
        }
      }
    },
    '/conversations/{conversationId}/leave': {
      post: {
        tags: ['Conversations'],
        summary: 'Leave group conversation',
        security: bearerSecurity,
        parameters: [idParameter('conversationId', 'Conversation ID')],
        responses: {
          200: { description: 'Left group conversation' },
          400: errorResponses[400],
          401: errorResponses[401],
          404: errorResponses[404]
        }
      }
    },
    '/conversations/{conversationId}': {
      patch: {
        tags: ['Conversations'],
        summary: 'Rename group conversation',
        security: bearerSecurity,
        parameters: [idParameter('conversationId', 'Conversation ID')],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: { name: { type: 'string', minLength: 1, maxLength: 100 } }
              }
            }
          }
        },
        responses: {
          200: { description: 'Group updated' },
          400: errorResponses[400],
          401: errorResponses[401],
          403: errorResponses[403],
          404: errorResponses[404]
        }
      }
    }
  }
} as const
