# Lost and Found API Documentation

## Overview

This API provides a complete backend solution for a lost and found application. It enables users to report lost items, register found items, and facilitates the matching and claiming process to reunite owners with their belongings.

## Project Structure 

lost-and-found-api/
├── config/ # Configuration files
│ └── database.js # MongoDB connection setup
├── controllers/ # Route controllers
│ ├── auth.controller.js
│ ├── claim.controller.js
│ ├── found.controller.js
│ ├── lost.controller.js
│ ├── match.controller.js
│ └── user.controller.js
├── middleware/ # Express middleware
│ ├── auth.middleware.js
│ └── error.middleware.js
├── models/ # Mongoose models
│ ├── claim.model.js
│ ├── foundItem.model.js
│ ├── item.model.js
│ ├── lostItem.model.js
│ └── user.model.js
├── routes/ # API routes
│ ├── auth.routes.js
│ ├── claim.routes.js
│ ├── found.routes.js
│ ├── index.js
│ ├── lost.routes.js
│ ├── match.routes.js
│ └── user.routes.js
├── services/ # Business logic services
│ ├── claim.service.js
│ ├── email.service.js
│ ├── found.service.js
│ ├── image.service.js
│ ├── lost.service.js
│ ├── match.service.js
│ ├── redis.service.js
│ └── user.service.js
├── utils/ # Utility functions
│ ├── appError.js
│ ├── catchAsync.js
│ ├── helpers.js
│ ├── logger.js
│ └── similarity.js
├── app.js # Express app setup
├── server.js # Main entry point
├── .env # Environment variables (not committed)
├── .gitignore # Git ignore file
└── package.json # Project dependencies

## Getting Started

### Prerequisites

- Node.js (v14.0.0 or higher)
- MongoDB
- Redis (optional, for caching and rate limiting)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/esiepe/lou.git
   cd lou
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   # Server Configuration
   NODE_ENV=development
   PORT=3000

   # Database Configuration
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>/<database>?retryWrites=true&w=majority

   # JWT Configuration
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRES_IN=90d
   JWT_COOKIE_EXPIRES_IN=90

   # Email Configuration
   EMAIL_SERVICE=
   EMAIL_USERNAME=
   EMAIL_PASSWORD=
   EMAIL_FROM_NAME=Lost and Found
   EMAIL_FROM_ADDRESS=noreply@lostandfound.com

   # Cloudinary Configuration
   CLOUDINARY_CLOUD_NAME=
   CLOUDINARY_API_KEY=
   CLOUDINARY_API_SECRET=

   # Redis Configuration
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=
   REDIS_DB=0

   # Frontend URL for Email Links
   FRONTEND_URL=http://localhost:3000

   # API Rate Limiting
   API_RATE_LIMIT=100

   # CORS Configuration
   CORS_ORIGIN=http://localhost:3000
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. The API will be available at: `http://localhost:3000/api/v1`

## API Endpoints

### Authentication

#### Register a new user

```
POST /api/v1/auth/register
```

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:** `201 Created`

```json
{
  "status": "success",
  "message": "User registered. Please check your email to verify your account."
}
```

#### Login

```
POST /api/v1/auth/login
```

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:** `200 OK`

```json
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1NiIsInR5...",
  "refreshToken": "a1b2c3d4e5f6g7h8i9j0...",
  "expiresIn": "90d",
  "data": {
    "user": {
      "_id": "60c72b2f9b1d8a2d4c3e1f5a",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "isEmailVerified": true
    }
  }
}
```

#### Verify Email

```
GET /api/v1/auth/verify-email/:token
```

**URL Parameters:**

| Parameter | Description |
|-----------|-------------|
| token     | Email verification token |

**Response:** `200 OK`

```json
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1NiIsInR5...",
  "data": {
    "user": {
      "_id": "60c72b2f9b1d8a2d4c3e1f5a",
      "name": "John Doe",
      "email": "john@example.com",
      "isEmailVerified": true
    }
  }
}
```

#### Forgot Password

```
POST /api/v1/auth/forgot-password
```

**Request Body:**

```json
{
  "email": "john@example.com"
}
```

**Response:** `200 OK`

```json
{
  "status": "success",
  "message": "Password reset email sent."
}
```

#### Reset Password

```
POST /api/v1/auth/reset-password/:token
```

**URL Parameters:**

| Parameter | Description |
|-----------|-------------|
| token     | Password reset token |

**Request Body:**

```json
{
  "password": "newPassword123"
}
```

**Response:** `200 OK`

```json
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1NiIsInR5...",
  "data": {
    "user": {
      "_id": "60c72b2f9b1d8a2d4c3e1f5a",
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

#### Update Password

```
PATCH /api/v1/auth/update-password
```

**Request Body:**

```json
{
  "currentPassword": "password123",
  "newPassword": "newPassword123"
}
```

**Authorization:** Required

**Response:** `200 OK`

```json
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1NiIsInR5...",
  "data": {
    "user": {
      "_id": "60c72b2f9b1d8a2d4c3e1f5a",
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

### Users

#### Get Current User

```
GET /api/v1/users/me
```

**Authorization:** Required

**Response:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "user": {
      "_id": "60c72b2f9b1d8a2d4c3e1f5a",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "contactDetails": {
        "phone": "1234567890",
        "address": "123 Main St"
      },
      "preferences": {
        "notifications": {
          "email": true,
          "push": true
        },
        "locationRadius": 10
      },
      "lastActive": "2023-03-06T08:21:53.000Z",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-03-06T08:21:53.000Z"
    }
  }
}
```

#### Update User

```
PATCH /api/v1/users/me
```

**Request Body:**

```json
{
  "name": "John Smith",
  "contactDetails": {
    "phone": "9876543210"
  },
  "preferences": {
    "notifications": {
      "email": false
    }
  }
}
```

**Authorization:** Required

**Response:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "user": {
      "_id": "60c72b2f9b1d8a2d4c3e1f5a",
      "name": "John Smith",
      "email": "john@example.com",
      "contactDetails": {
        "phone": "9876543210",
        "address": "123 Main St"
      },
      "preferences": {
        "notifications": {
          "email": false,
          "push": true
        },
        "locationRadius": 10
      }
    }
  }
}
```

### Lost Items

#### Report a Lost Item

```
POST /api/v1/lost-items
```

**Request Body:**

```json
{
  "title": "Lost iPhone 13",
  "description": "Black iPhone 13 with cracked screen",
  "category": "electronics",
  "date": "2023-03-01T14:30:00Z",
  "locationName": "Central Park",
  "location": {
    "coordinates": [-73.965355, 40.782865]
  },
  "color": "black",
  "brand": "Apple",
  "reward": {
    "amount": 50,
    "currency": "USD",
    "description": "Reward for finding my phone"
  },
  "possibleLocations": [
    {
      "coordinates": [-73.975355, 40.782865],
      "address": "Near the fountain",
      "probability": 0.8
    }
  ]
}
```

**Authorization:** Required

**Response:** `201 Created`

```json
{
  "status": "success",
  "data": {
    "lostItem": {
      "_id": "60c72b2f9b1d8a2d4c3e1f5a",
      "title": "Lost iPhone 13",
      "description": "Black iPhone 13 with cracked screen",
      "category": "electronics",
      "date": "2023-03-01T14:30:00Z",
      "locationName": "Central Park",
      "location": {
        "type": "Point",
        "coordinates": [-73.965355, 40.782865]
      },
      "color": "black",
      "brand": "Apple",
      "status": "reported",
      "user": "60c72b2f9b1d8a2d4c3e1f5a",
      "reward": {
        "amount": 50,
        "currency": "USD",
        "description": "Reward for finding my phone"
      },
      "possibleLocations": [
        {
          "type": "Point",
          "coordinates": [-73.975355, 40.782865],
          "address": "Near the fountain",
          "probability": 0.8
        }
      ],
      "createdAt": "2023-03-06T08:21:53.000Z",
      "updatedAt": "2023-03-06T08:21:53.000Z"
    }
  }
}
```

#### Get All Lost Items

```
GET /api/v1/lost-items
```

**Query Parameters:**

| Parameter | Description |
|-----------|-------------|
| page      | Page number (default: 1) |
| limit     | Results per page (default: 20) |
| sort      | Sort field(s) (e.g., `-date,title` for descending date and ascending title) |
| category  | Filter by category |
| status    | Filter by status |

**Response:** `200 OK`

```json
{
  "status": "success",
  "results": 2,
  "data": {
    "lostItems": [
      {
        "_id": "60c72b2f9b1d8a2d4c3e1f5a",
        "title": "Lost iPhone 13",
        "description": "Black iPhone 13 with cracked screen",
        "category": "electronics",
        "date": "2023-03-01T14:30:00Z",
        "locationName": "Central Park",
        "status": "reported",
        "createdAt": "2023-03-06T08:21:53.000Z"
      },
      {
        "_id": "60c72b2f9b1d8a2d4c3e1f5b",
        "title": "Lost Wallet",
        "description": "Brown leather wallet with ID",
        "category": "accessories",
        "date": "2023-03-02T10:15:00Z",
        "locationName": "Times Square",
        "status": "reported",
        "createdAt": "2023-03-06T09:30:00.000Z"
      }
    ]
  },
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalPages": 1,
    "totalResults": 2
  }
}
```

#### Get Lost Item by ID

```
GET /api/v1/lost-items/:id
```

**URL Parameters:**

| Parameter | Description |
|-----------|-------------|
| id        | Lost item ID |

**Response:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "lostItem": {
      "_id": "60c72b2f9b1d8a2d4c3e1f5a",
      "title": "Lost iPhone 13",
      "description": "Black iPhone 13 with cracked screen",
      "category": "electronics",
      "date": "2023-03-01T14:30:00Z",
      "locationName": "Central Park",
      "location": {
        "type": "Point",
        "coordinates": [-73.965355, 40.782865]
      },
      "color": "black",
      "brand": "Apple",
      "status": "reported",
      "user": {
        "_id": "60c72b2f9b1d8a2d4c3e1f5a",
        "name": "John Doe"
      },
      "reward": {
        "amount": 50,
        "currency": "USD",
        "description": "Reward for finding my phone"
      },
      "possibleLocations": [
        {
          "type": "Point",
          "coordinates": [-73.975355, 40.782865],
          "address": "Near the fountain",
          "probability": 0.8
        }
      ],
      "createdAt": "2023-03-06T08:21:53.000Z",
      "updatedAt": "2023-03-06T08:21:53.000Z"
    }
  }
}
```

#### Update Lost Item

```
PATCH /api/v1/lost-items/:id
```

**URL Parameters:**

| Parameter | Description |
|-----------|-------------|
| id        | Lost item ID |

**Request Body:**

```json
{
  "title": "Lost iPhone 13 Pro",
  "reward": {
    "amount": 100
  }
}
```

**Authorization:** Required (must be the item owner)

**Response:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "lostItem": {
      "_id": "60c72b2f9b1d8a2d4c3e1f5a",
      "title": "Lost iPhone 13 Pro",
      "description": "Black iPhone 13 with cracked screen",
      "reward": {
        "amount": 100,
        "currency": "USD",
        "description": "Reward for finding my phone"
      }
    }
  }
}
```

#### Delete Lost Item

```
DELETE /api/v1/lost-items/:id
```

**URL Parameters:**

| Parameter | Description |
|-----------|-------------|
| id        | Lost item ID |

**Authorization:** Required (must be the item owner)

**Response:** `204 No Content`

### Found Items

#### Report a Found Item

```
POST /api/v1/found-items
```

**Request Body:**

```json
{
  "title": "Found iPhone",
  "description": "Black iPhone with cracked screen",
  "category": "electronics",
  "date": "2023-03-01T15:00:00Z",
  "locationName": "Central Park",
  "location": {
    "coordinates": [-73.965355, 40.782865]
  },
  "color": "black",
  "brand": "Apple",
  "holderDetails": {
    "name": "Central Park Lost and Found",
    "contactInfo": "212-555-1234",
    "location": "Central Park Visitor Center"
  },
  "handoverRequirement": {
    "identificationType": "description",
    "identificationDetails": "Must describe unique marks or provide unlock code"
  }
}
```

**Authorization:** Required

**Response:** `201 Created`

```json
{
  "status": "success",
  "data": {
    "foundItem": {
      "_id": "60c72b2f9b1d8a2d4c3e1f5c",
      "title": "Found iPhone",
      "description": "Black iPhone with cracked screen",
      "category": "electronics",
      "date": "2023-03-01T15:00:00Z",
      "locationName": "Central Park",
      "location": {
        "type": "Point",
        "coordinates": [-73.965355, 40.782865]
      },
      "color": "black",
      "brand": "Apple",
      "status": "reported",
      "finder": "60c72b2f9b1d8a2d4c3e1f5a",
      "holderDetails": {
        "name": "Central Park Lost and Found",
        "contactInfo": "212-555-1234",
        "location": "Central Park Visitor Center"
      },
      "handoverRequirement": {
        "identificationType": "description",
        "identificationDetails": "Must describe unique marks or provide unlock code"
      },
      "createdAt": "2023-03-06T10:00:00.000Z",
      "updatedAt": "2023-03-06T10:00:00.000Z"
    }
  }
}
```

#### Get All Found Items

```
GET /api/v1/found-items
```

**Query Parameters:**

| Parameter | Description |
|-----------|-------------|
| page      | Page number (default: 1) |
| limit     | Results per page (default: 20) |
| sort      | Sort field(s) (e.g., `-date,title`) |
| category  | Filter by category |
| status    | Filter by status |

**Response:** `200 OK`

```json
{
  "status": "success",
  "results": 1,
  "data": {
    "foundItems": [
      {
        "_id": "60c72b2f9b1d8a2d4c3e1f5c",
        "title": "Found iPhone",
        "description": "Black iPhone with cracked screen",
        "category": "electronics",
        "date": "2023-03-01T15:00:00Z",
        "locationName": "Central Park",
        "status": "reported",
        "createdAt": "2023-03-06T10:00:00.000Z"
      }
    ]
  },
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalPages": 1,
    "totalResults": 1
  }
}
```

#### Get Found Item by ID

```
GET /api/v1/found-items/:id
```

**URL Parameters:**

| Parameter | Description |
|-----------|-------------|
| id        | Found item ID |

**Response:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "foundItem": {
      "_id": "60c72b2f9b1d8a2d4c3e1f5c",
      "title": "Found iPhone",
      "description": "Black iPhone with cracked screen",
      "category": "electronics",
      "date": "2023-03-01T15:00:00Z",
      "locationName": "Central Park",
      "location": {
        "type": "Point",
        "coordinates": [-73.965355, 40.782865]
      },
      "color": "black",
      "brand": "Apple",
      "status": "reported",
      "finder": {
        "_id": "60c72b2f9b1d8a2d4c3e1f5a",
        "name": "John Doe"
      },
      "holderDetails": {
        "name": "Central Park Lost and Found",
        "contactInfo": "212-555-1234",
        "location": "Central Park Visitor Center"
      },
      "handoverRequirement": {
        "identificationType": "description",
        "identificationDetails": "Must describe unique marks or provide unlock code"
      },
      "createdAt": "2023-03-06T10:00:00.000Z",
      "updatedAt": "2023-03-06T10:00:00.000Z"
    }
  }
}
```

#### Update Found Item

```
PATCH /api/v1/found-items/:id
```

**URL Parameters:**

| Parameter | Description |
|-----------|-------------|
| id        | Found item ID |

**Request Body:**

```json
{
  "title": "Found iPhone 13",
  "holderDetails": {
    "contactInfo": "212-555-5678"
  }
}
```

**Authorization:** Required (must be the finder)

**Response:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "foundItem": {
      "_id": "60c72b2f9b1d8a2d4c3e1f5c",
      "title": "Found iPhone 13",
      "holderDetails": {
        "name": "Central Park Lost and Found",
        "contactInfo": "212-555-5678",
        "location": "Central Park Visitor Center"
      }
    }
  }
}
```

#### Delete Found Item

```
DELETE /api/v1/found-items/:id
```

**URL Parameters:**

| Parameter | Description |
|-----------|-------------|
| id        | Found item ID |

**Authorization:** Required (must be the finder)

**Response:** `204 No Content`

### Claims

#### Create a Claim

```
POST /api/v1/claims
```

**Request Body:**

```json
{
  "foundItemId": "60c72b2f9b1d8a2d4c3e1f5c",
  "description": "I lost my iPhone 13 in Central Park. It has a black case with my initials 'JD' on the back.",
  "evidence": [
    {
      "type": "description",
      "details": "The phone has a cracked screen and a photo of a dog as the lock screen."
    },
    {
      "type": "ownership",
      "details": "The IMEI number is 123456789012345"
    }
  ],
  "contactPreference": "email"
}
```

**Authorization:** Required

**Response:** `201 Created`

```json
{
  "status": "success",
  "data": {
    "claim": {
      "_id": "60c72b2f9b1d8a2d4c3e1f5d",
      "foundItem": "60c72b2f9b1d8a2d4c3e1f5c",
      "claimant": "60c72b2f9b1d8a2d4c3e1f5a",
      "description": "I lost my iPhone 13 in Central Park. It has a black case with my initials 'JD' on the back.",
      "evidence": [
        {
          "type": "description",
          "details": "The phone has a cracked screen and a photo of a dog as the lock screen."
        },
        {
          "type": "ownership",
          "details": "The IMEI number is 123456789012345"
        }
      ],
      "status": "pending",
      "contactPreference": "email",
      "createdAt": "2023-03-07T08:00:00.000Z",
      "updatedAt": "2023-03-07T08:00:00.000Z"
    }
  }
}
```

#### Get All Claims (Admin only)

```
GET /api/v1/claims
```

**Authorization:** Required (admin only)

**Query Parameters:**

| Parameter  | Description |
|------------|-------------|
| page       | Page number (default: 1) |
| limit      | Results per page (default: 20) |
| sort       | Sort field(s) |
| status     | Filter by status |
| foundItemId| Filter by found item ID |

**Response:** `200 OK`

```json
{
  "status": "success",
  "results": 1,
  "data": {
    "claims": [
      {
        "_id": "60c72b2f9b1d8a2d4c3e1f5d",
        "foundItem": {
          "_id": "60c72b2f9b1d8a2d4c3e1f5c",
          "title": "Found iPhone"
        },
        "claimant": {
          "_id": "60c72b2f9b1d8a2d4c3e1f5a",
          "name": "John Doe"
        },
        "status": "pending",
        "createdAt": "2023-03-07T08:00:00.000Z"
      }
    ]
  },
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalPages": 1,
    "totalResults": 1
  }
}
```

#### Get User's Claims

```
GET /api/v1/claims/my-claims
```

**Authorization:** Required

**Response:** `200 OK`

```json
{
  "status": "success",
  "results": 1,
  "data": {
    "claims": [
      {
        "_id": "60c72b2f9b1d8a2d4c3e1f5d",
        "foundItem": {
          "_id": "60c72b2f9b1d8a2d4c3e1f5c",
          "title": "Found iPhone",
          "category": "electronics",
          "date": "2023-03-01T15:00:00Z",
          "locationName": "Central Park"
        },
        "status": "pending",
        "createdAt": "2023-03-07T08:00:00.000Z",
        "updatedAt": "2023-03-07T08:00:00.000Z"
      }
    ]
  }
}
```

#### Get Claims for a Found Item

```
GET /api/v1/claims/found-item/:foundItemId
```

**URL Parameters:**

| Parameter   | Description |
|-------------|-------------|
| foundItemId | Found item ID |

**Authorization:** Required (must be the finder of the item)

**Response:** `200 OK`

```json
{
  "status": "success",
  "results": 1,
  "data": {
    "claims": [
      {
        "_id": "60c72b2f9b1d8a2d4c3e1f5d",
        "claimant": {
          "_id": "60c72b2f9b1d8a2d4c3e1f5a",
          "name": "John Doe"
        },
        "description": "I lost my iPhone 13 in Central Park. It has a black case with my initials 'JD' on the back.",
        "evidence": [
          {
            "type": "description",
            "details": "The phone has a cracked screen and a photo of a dog as the lock screen."
          },
          {
            "type": "ownership",
            "details": "The IMEI number is 123456789012345"
          }
        ],
        "status": "pending",
        "contactPreference": "email",
        "createdAt": "2023-03-07T08:00:00.000Z"
      }
    ]
  }
}
```

#### Get Claim by ID

```
GET /api/v1/claims/:id
```

**URL Parameters:**

| Parameter | Description |
|-----------|-------------|
| id        | Claim ID |

**Authorization:** Required (must be the claimant, finder, or admin)

**Response:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "claim": {
      "_id": "60c72b2f9b1d8a2d4c3e1f5d",
      "foundItem": {
        "_id": "60c72b2f9b1d8a2d4c3e1f5c",
        "title": "Found iPhone",
        "description": "Black iPhone with cracked screen",
        "category": "electronics",
        "date": "2023-03-01T15:00:00Z",
        "locationName": "Central Park"
      },
      "claimant": {
        "_id": "60c72b2f9b1d8a2d4c3e1f5a",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "description": "I lost my iPhone 13 in Central Park. It has a black case with my initials 'JD' on the back.",
      "evidence": [
        {
          "type": "description",
          "details": "The phone has a cracked screen and a photo of a dog as the lock screen."
        },
        {
          "type": "ownership",
          "details": "The IMEI number is 123456789012345"
        }
      ],
      "status": "pending",
      "contactPreference": "email",
      "createdAt": "2023-03-07T08:00:00.000Z",
      "updatedAt": "2023-03-07T08:00:00.000Z"
    }
  }
}
```

#### Update Claim Status

```
PATCH /api/v1/claims/:id/status
```

**URL Parameters:**

| Parameter | Description |
|-----------|-------------|
| id        | Claim ID |

**Request Body:**

```json
{
  "status": "approved",
  "message": "Your claim has been approved. Please contact us to arrange pickup."
}
```

**Authorization:** Required (must be the finder or admin)

**Response:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "claim": {
      "_id": "60c72b2f9b1d8a2d4c3e1f5d",
      "status": "approved",
      "finderNote": "Your claim has been approved. Please contact us to arrange pickup.",
      "updatedAt": "2023-03-08T10:00:00.000Z"
    }
  }
}
```

#### Delete Claim

```
DELETE /api/v1/claims/:id
```

**URL Parameters:**

| Parameter | Description |
|-----------|-------------|
| id        | Claim ID |

**Authorization:** Required (must be the claimant, or admin)

**Response:** `204 No Content`

### Matches

#### Get Potential Matches for a Lost Item

```
GET /api/v1/matches/lost/:lostItemId
```

**URL Parameters:**

| Parameter  | Description |
|------------|-------------|
| lostItemId | Lost item ID |

**Authorization:** Required (must be the item owner)

**Response:** `200 OK`

```json
{
  "status": "success",
  "results": 1,
  "data": {
    "matches": [
      {
        "foundItem": {
          "_id": "60c72b2f9b1d8a2d4c3e1f5c",
          "title": "Found iPhone",
          "description": "Black iPhone with cracked screen",
          "category": "electronics",
          "date": "2023-03-01T15:00:00Z",
          "locationName": "Central Park",
          "color": "black",
          "brand": "Apple"
        },
        "similarityScore": 0.85,
        "matchReasons": [
          "Same category: electronics",
          "Similar title",
          "Same color: black",
          "Same brand: Apple",
          "Close locations: 0.2 km",
          "Close dates: same day"
        ]
      }
    ]
  }
}
```

#### Get Potential Matches for a Found Item

```
GET /api/v1/matches/found/:foundItemId
```

**URL Parameters:**

| Parameter   | Description |
|-------------|-------------|
| foundItemId | Found item ID |

**Authorization:** Required (must be the finder)

**Response:** `200 OK`

```json
{
  "status": "success",
  "results": 1,
  "data": {
    "matches": [
      {
        "lostItem": {
          "_id": "60c72b2f9b1d8a2d4c3e1f5a",
          "title": "Lost iPhone 13",
          "description": "Black iPhone 13 with cracked screen",
          "category": "electronics",
          "date": "2023-03-01T14:30:00Z",
          "locationName": "Central Park",
          "color": "black",
          "brand": "Apple"
        },
        "similarityScore": 0.85,
        "matchReasons": [
          "Same category: electronics",
          "Similar title",
          "Same color: black",
          "Same brand: Apple",
          "Close locations: 0.2 km",
          "Close dates: same day"
        ]
      }
    ]
  }
}
```

#### Create Match Connection

```
POST /api/v1/matches
```

**Request Body:**

```json
{
  "lostItemId": "60c72b2f9b1d8a2d4c3e1f5a",
  "foundItemId": "60c72b2f9b1d8a2d4c3e1f5c"
}
```

**Authorization:** Required (must be owner of lost item or finder of found item)

**Response:** `201 Created`

```json
{
  "status": "success",
  "data": {
    "match": {
      "lostItem": "60c72b2f9b1d8a2d4c3e1f5a",
      "foundItem": "60c72b2f9b1d8a2d4c3e1f5c",
      "similarityScore": 0.85,
      "status": "pending",
      "createdBy": "60c72b2f9b1d8a2d4c3e1f5a"
    }
  }
}
```

## Error Handling

All API errors return a consistent error format:

```json
{
  "status": "error",
  "message": "Error message here",
  "code": "ERROR_CODE"
}
```

### Common Error Codes

| Status Code | Description |
|-------------|-------------|
| 400         | Bad Request - Invalid input data |
| 401         | Unauthorized - Authentication required |
| 403         | Forbidden - Insufficient permissions |
| 404         | Not Found - Resource not found |
| 409         | Conflict - Resource already exists |
| 422         | Unprocessable Entity - Validation error |
| 429         | Too Many Requests - Rate limit exceeded |
| 500         | Internal Server Error |

## Deployment

### Production Environment Setup

1. Set up environment variables for production
2. Build the application if needed
3. Use a process manager like PM2 to keep the app running
4. Set up a reverse proxy with Nginx or Apache

Example PM2 configuration:

```json
{
  "apps": [
    {
      "name": "lost-and-found-api",
      "script": "server.js",
      "instances": "max",
      "exec_mode": "cluster",
      "env_production": {
        "NODE_ENV": "production",
        "PORT": 3000
      }
    }
  ]
}
```

### Scaling Considerations

1. Database scaling with MongoDB replica sets or sharding
2. Load balancing across multiple app instances
3. CDN for static assets
4. Redis for caching and session storage
5. Monitoring and logging with tools like Prometheus, Grafana, or ELK stack

## Security Considerations

1. Keep dependencies updated
2. Implement proper authentication and authorization
3. Validate and sanitize all inputs
4. Use HTTPS in production
5. Set secure HTTP headers
6. Implement rate limiting
7. Use environment variables for secrets
8. Regularly audit the application

## License

This project is licensed under the MIT License - see the LICENSE file for details.
```

This comprehensive documentation file includes all the API endpoints, request/response formats, project setup instructions, and deployment considerations. You can include it in your repository's root directory or in a `docs` folder for easy reference.




