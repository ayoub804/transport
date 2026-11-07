# UML Diagrams

These diagrams describe the current implementation across the Next.js web app, NestJS API, PostgreSQL/Prisma, Redis health check, and local Docker setup. Mermaid diagrams render in GitHub and Mermaid-enabled Markdown previews.

## View the diagrams

In VS Code, open this file and choose **Markdown: Open Preview** (`Ctrl+Shift+V`) or **Markdown: Open Preview to the Side** (`Ctrl+K`, then `V`). GitHub also renders the diagrams when this file is viewed in the repository. If a Markdown preview does not render Mermaid, use a Mermaid-enabled Markdown preview extension.

## Application and deployment architecture

```mermaid
flowchart TB
    Browser["Browser"]

    subgraph Windows["Windows development computer"]
        subgraph Web["Next.js PWA · port 3000"]
            Pages["Pages<br/>Client · Driver · Admin"]
            AuthProvider["Auth provider and route guards"]
            SessionRoutes["Session routes<br/>/api/session/*"]
            BackendProxy["Backend proxy<br/>/api/backend/*"]
        end
        API["NestJS REST API · port 3001"]
        Prisma["Prisma Client"]
        Docker["Docker Desktop"]
    end

    subgraph Containers["Docker Compose services"]
        PostgreSQL[("PostgreSQL 16<br/>published on 5432")]
        Redis[("Redis 7<br/>published on 6379")]
        PgVolume[("postgres_data volume")]
        RedisVolume[("redis_data volume")]
    end

    Browser --> Pages
    Pages --> AuthProvider
    AuthProvider -->|"Login, register, profile, logout"| SessionRoutes
    Pages -->|"Same-origin API requests<br/>HttpOnly cookie"| BackendProxy
    SessionRoutes -->|"API_BASE_URL"| API
    BackendProxy -->|"Authorization bearer token"| API
    API --> Prisma
    Prisma -->|"DATABASE_URL"| PostgreSQL
    API -. "Health check when REDIS_URL is set" .-> Redis
    Docker -. "runs" .-> PostgreSQL
    Docker -. "runs" .-> Redis
    PostgreSQL --- PgVolume
    Redis --- RedisVolume
```

In the documented local setup, Docker Desktop runs PostgreSQL and Redis containers and publishes their ports to Windows. Redis is currently used for the API health check; the application does not use it as a cache or data store.

## Full project component diagram

```mermaid
flowchart LR
    subgraph Frontend["web · Next.js PWA"]
        UI["App Router pages<br/>login · register · trips<br/>reservations · driver · admin"]
        Components["Shared components<br/>app shell · auth provider<br/>route guard · UI"]
        WebAPI["lib/api.ts<br/>typed API clients"]
        Session["app/api/session<br/>login · register · me · logout"]
        Proxy["app/api/backend/[...path]<br/>authenticated API proxy"]
        UI --> Components
        UI --> WebAPI
        WebAPI --> Session
        WebAPI --> Proxy
    end

    subgraph ApiComponents["api · NestJS REST API"]
        App["AppModule<br/>config · HTTP filter"]
        Health["AppController / AppService<br/>GET /health"]
        Auth["AuthModule<br/>register · login · profile · JWT"]
        Vehicles["VehiclesModule<br/>vehicle administration"]
        Trips["TripsModule<br/>search · seats · trip administration"]
        Reservations["ReservationsModule<br/>client · admin · driver"]
        Tickets["TicketsModule<br/>QR issue · validation"]
        Reports["ReportsModule<br/>admin summary"]
        Guards["JWT strategy and guards<br/>role authorization"]
        PrismaModule["PrismaModule / PrismaService"]
        Redis["RedisService<br/>optional health PING"]

        App --> Health
        App --> Auth
        App --> Vehicles
        App --> Trips
        App --> Reservations
        App --> Tickets
        App --> Reports
        Auth --> Guards
        Vehicles --> Guards
        Trips --> Guards
        Reservations --> Guards
        Tickets --> Guards
        Reports --> Guards
        Health --> PrismaModule
        Health --> Redis
        Auth --> PrismaModule
        Vehicles --> PrismaModule
        Trips --> PrismaModule
        Reservations --> PrismaModule
        Tickets --> PrismaModule
        Reports --> PrismaModule
    end

    subgraph Data["Data services"]
        PostgreSQL[("PostgreSQL")]
        RedisServer[("Redis")]
        Schema["Prisma schema<br/>User · Vehicle · Trip · Reservation"]
    end

    Session -->|"Auth endpoints"| APIEntry["NestJS HTTP server"]
    Proxy -->|"REST requests"| APIEntry
    APIEntry --> App
    PrismaModule --> Schema
    Schema --> PostgreSQL
    Redis --> RedisServer
```

### API surface by feature

| Feature | Endpoints | Access |
|---|---|---|
| Health | `GET /`, `GET /health` | Public |
| Authentication | `POST /auth/register`, `POST /auth/login`, `GET /auth/me` | Register/login public; profile requires JWT |
| Trips | `GET /trips`, `GET /trips/:id`, `GET /trips/:id/seats` | Public |
| Trip administration | `GET /trips/admin/all`, `POST /trips`, `PATCH /trips/:id`, `DELETE /trips/:id` | Admin |
| Vehicles | `GET /vehicles`, `GET /vehicles/:id`, `POST /vehicles`, `PATCH /vehicles/:id`, `DELETE /vehicles/:id` | Admin |
| Client reservations | `POST /reservations`, `GET /reservations/me`, `PATCH /reservations/:id`, `DELETE /reservations/:id` | Client |
| Reservation administration | `GET /reservations` | Admin |
| Driver reservations | `GET /driver/trips/:tripId/reservations` | Assigned driver |
| QR tickets | `GET /reservations/:id/ticket`, `POST /tickets/validate` | Ticket issue: owner client; validation: assigned driver or admin |
| Reports | `GET /reports/summary` | Admin |

## Use cases

```mermaid
flowchart LR
    Client["Client"]
    Driver["Driver"]
    Admin["Admin"]

    subgraph System["Transport Reservation System"]
        Register(["Register client account"])
        Login(["Log in"])
        Search(["Search trips and view seats"])
        Book(["Reserve a seat"])
        ManageOwn(["View, change, or cancel own reservations"])
        Ticket(["Get QR ticket"])
        Assigned(["View reservations on assigned trip"])
        Validate(["Scan and validate QR ticket"])
        Vehicles(["Manage vehicles"])
        Trips(["Manage trips and driver assignments"])
        AllReservations(["List and filter reservations"])
        Reports(["View reservation reports"])
    end

    Client --> Register
    Client --> Login
    Client --> Search
    Client --> Book
    Client --> ManageOwn
    Client --> Ticket
    Driver --> Login
    Driver --> Assigned
    Driver --> Validate
    Admin --> Login
    Admin --> Vehicles
    Admin --> Trips
    Admin --> AllReservations
    Admin --> Reports
    Admin --> Validate
```

Authorization is enforced by the API: clients manage only their own reservations, drivers can view reservations for trips assigned to them, and administrative operations require the admin role.

## Domain class diagram

```mermaid
classDiagram
    class User {
        +UUID id
        +string name
        +string email
        +string passwordHash
        +UserRole role
        +DateTime createdAt
    }

    class Vehicle {
        +UUID id
        +string plate
        +int capacity
        +DateTime createdAt
    }

    class Trip {
        +UUID id
        +string origin
        +string destination
        +DateTime departureAt
        +UUID vehicleId
        +UUID driverId
        +TripStatus status
        +DateTime createdAt
    }

    class Reservation {
        +UUID id
        +UUID userId
        +UUID tripId
        +int seatNumber
        +ReservationStatus status
        +DateTime createdAt
        +DateTime updatedAt
    }

    class UserRole {
        <<enumeration>>
        ADMIN
        DRIVER
        CLIENT
    }

    class TripStatus {
        <<enumeration>>
        SCHEDULED
        CANCELLED
        COMPLETED
    }

    class ReservationStatus {
        <<enumeration>>
        CONFIRMED
        CANCELLED
        USED
    }

    User "0..1" --> "0..*" Trip : assigned driver
    User "1" --> "0..*" Reservation : books
    Vehicle "1" --> "0..*" Trip : serves
    Trip "1" --> "0..*" Reservation : has
    User --> UserRole : role
    Trip --> TripStatus : status
    Reservation --> ReservationStatus : status
```

The database enforces unique user email, vehicle plate, and `(tripId, seatNumber)` pairs. Each trip references exactly one vehicle; a driver assignment is optional. A reservation belongs to one user and one trip.

## Sequence: reserve a seat

```mermaid
sequenceDiagram
    actor Client
    participant Web as Next.js web app
    participant API as NestJS API
    participant Guard as JWT and role guards
    participant Service as ReservationsService
    participant DB as PostgreSQL via Prisma

    Client->>Web: Select trip and seat
    Web->>API: POST /reservations (session/JWT)
    API->>Guard: Authenticate and authorize CLIENT
    Guard-->>API: Authenticated user
    API->>Service: create(user, tripId, seatNumber)
    Service->>DB: Read trip and vehicle capacity
    DB-->>Service: Trip details
    Service->>Service: Check scheduled, future trip and seat range
    Service->>DB: Insert reservation
    alt Seat is still available
        DB-->>Service: Reservation with trip/user details
        Service-->>API: Created reservation
        API-->>Web: 201 Created
        Web-->>Client: Show reservation
    else Seat already reserved
        DB-->>Service: Unique constraint violation
        Service-->>API: Conflict (409)
        API-->>Web: Seat is unavailable
        Web-->>Client: Ask client to choose another seat
    end
```

The database's unique `(tripId, seatNumber)` constraint protects against two concurrent requests reserving the same seat.

## Sequence: validate a QR ticket

```mermaid
sequenceDiagram
    actor Staff as Driver or admin
    participant Web as Next.js driver scanner
    participant API as NestJS API
    participant Service as TicketsService
    participant DB as PostgreSQL via Prisma

    Staff->>Web: Scan reservation QR code
    Web->>API: POST /tickets/validate (signed ticket token)
    API->>Service: Verify token and authenticated role
    Service->>Service: Verify signature, issuer, audience, and expiry
    Service->>DB: Load reservation and trip
    DB-->>Service: Reservation status and trip assignment
    Service->>Service: Check driver assignment, confirmed status, and trip schedule
    Service->>DB: Conditional update CONFIRMED -> USED
    alt Exactly one reservation updated
        DB-->>Service: Update count = 1
        Service-->>API: Ticket valid
        API-->>Web: 200 OK
        Web-->>Staff: Display successful validation
    else Already used or no longer valid
        DB-->>Service: Update count = 0 or validation fails
        Service-->>API: Conflict or authorization error
        API-->>Web: Error response
        Web-->>Staff: Display rejection
    end
```
