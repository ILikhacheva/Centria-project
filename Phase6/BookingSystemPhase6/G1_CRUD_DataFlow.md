# 1️⃣ CREATE – Resource (Sequence Diagram)

```mermaid
sequenceDiagram
    participant U as User (Browser)
    participant F as Frontend (form.js and resources.js)
    participant B as Backend (Express Route)
    participant V as express-validator
    participant S as Resource Service
    participant DB as PostgreSQL

    U->>F: Submit form
    F->>F: Client-side validation
    F->>B: POST /api/resources (JSON)

    B->>V: Validate request
    V-->>B: Validation result

    alt Validation fails
        B-->>F: 400 Bad Request + errors[]
        F-->>U: Show validation message
    else Validation OK
        B->>S: create Resource(data)
        S->>DB: INSERT INTO resources
        DB-->>S: Result / Duplicate error

        alt Duplicate
            S-->>B: Duplicate detected
            B-->>F: 409 Conflict
            F-->>U: Show duplicate message
        else Success
            S-->>B: Created resource
            B-->>F: 201 Created
            F-->>U: Show success message
        end
    end
```

# 2️⃣ READ — Resource (Sequence Diagram)

```mermaid
sequenceDiagram
    participant U as User (Browser)
    participant F as Frontend (resources.js)
    participant B as Backend (Express Route)
    participant DB as PostgreSQL

    U->>F: Page load / Refresh list
    F->>B: GET /api/resources

    B->>DB: SELECT * FROM resources ORDER BY created_at DESC
    DB-->>B: Result rows

    alt Success
        B-->>F: 200 OK + { ok: true, data: [...] }
        F->>F: Cache resources, renderResourceList()
        F-->>U: Display resource list
    else Database error
        B-->>F: 500 Internal Server Error
        F-->>U: Show error message
    end

    Note over U,F: User clicks a resource in the list

    U->>F: Click resource item
    F->>B: GET /api/resources/:id

    B->>B: Validate ID is numeric

    alt Invalid ID
        B-->>F: 400 Bad Request + "Invalid ID"
        F-->>U: Show error message
    else Valid ID
        B->>DB: SELECT * FROM resources WHERE id = $1
        DB-->>B: Result

        alt Resource not found
            B-->>F: 404 Not Found
            F-->>U: Show "Resource not found"
        else Success
            B-->>F: 200 OK + { ok: true, data: {...} }
            F->>F: selectResource() — populate form
            F-->>U: Show resource in edit form
        end
    end
```

# 3️⃣ UPDATE — Resource (Sequence Diagram)

```mermaid
sequenceDiagram
    participant U as User (Browser)
    participant F as Frontend (form.js and resources.js)
    participant B as Backend (Express Route)
    participant V as express-validator
    participant DB as PostgreSQL

    U->>F: Edit fields and click Update
    F->>F: Client-side validation (regex, length)
    F->>B: PUT /api/resources/:id (JSON)

    B->>V: Validate request body
    V-->>B: Validation result

    alt Validation fails
        B-->>F: 400 Bad Request + errors[]
        F-->>U: Show validation messages
    else Validation OK
        B->>B: Validate ID is numeric

        alt Invalid ID
            B-->>F: 400 Bad Request + "Invalid ID"
            F-->>U: Show error message
        else Valid ID
            B->>DB: UPDATE resources SET ... WHERE id = $1 RETURNING *
            DB-->>B: Result / Error

            alt Resource not found (rowCount = 0)
                B-->>F: 404 Not Found
                F-->>U: Show "Resource no longer exists"
            else Duplicate name (error 23505)
                B-->>F: 409 Conflict
                F-->>U: Show "Duplicate name" message
            else Success
                B-->>F: 200 OK + { ok: true, data: {...} }
                F->>F: onResourceActionSuccess() → loadResources()
                F-->>U: Show success, refresh list
            end
        end
    end
```

# 4️⃣ DELETE — Resource (Sequence Diagram)

```mermaid
sequenceDiagram
    participant U as User (Browser)
    participant F as Frontend (form.js and resources.js)
    participant B as Backend (Express Route)
    participant DB as PostgreSQL

    U->>F: Click Delete button
    F->>B: DELETE /api/resources/:id (no body)

    B->>B: Validate ID is numeric

    alt Invalid ID
        B-->>F: 400 Bad Request + "Invalid ID"
        F-->>U: Show error message
    else Valid ID
        B->>DB: DELETE FROM resources WHERE id = $1
        DB-->>B: Result (rowCount)

        alt Resource not found (rowCount = 0)
            B-->>F: 404 Not Found
            F-->>U: Show "Resource no longer exists"
        else Database error
            B-->>F: 500 Internal Server Error
            F-->>U: Show error message
        else Success
            B-->>F: 204 No Content (empty body)
            F->>F: onResourceActionSuccess() → loadResources()
            F-->>U: Show success, refresh list
        end
    end
```
