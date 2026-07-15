# Maka Grace Tours and Travel
## Admin Dashboard — Server Integration Implementation Plan

*For AI coding agent use. Read this entire document before writing a single line of code.*

---

| Field | Details |
|---|---|
| **Project** | Maka Grace Tours and Travel — Admin Dashboard + Server Integration |
| **Frontend** | Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| **Server** | Node.js + Express.js (skeleton already built) |
| **Database** | MongoDB via Mongoose |
| **Auth** | JWT-based. Roles: `admin` and `super-admin` |
| **Status** | Frontend UI and admin dashboard UI already exist. Server skeleton already exists. Your job is to implement all logic, wire the database, connect the frontend to the server, and make everything work end to end. |

> **READ THIS FIRST:** Do not rebuild the UI. Do not rebuild the server skeleton. Do not write placeholder code. Your only job is to implement the business logic, create the database models, write the server controllers, define the API routes, and connect the existing frontend and admin dashboard to the server so that every feature works correctly.

---

## PART 1 — DEFAULT USERS (SEED ON FIRST RUN)

When the server starts and connects to MongoDB, check if any users exist in the database. If none exist, create the following two users automatically. Hash all passwords with bcrypt before saving. This seeder must be idempotent — running it more than once must never create duplicate users.

**User 1**
- Name: James Edwin
- Email: jamesedwin03@gmail.com
- Password: Messijunior14
- Role: super-admin

**User 2**
- Name: Maka Grace Admin
- Email: info@makagracetravel.co.ke
- Password: Makagrace@2026
- Role: super-admin

---

## PART 2 — ENVIRONMENT VARIABLES

The server needs the following environment variables. Create the `.env` file at the server root and the `.env.local` file at the Next.js root if they do not already exist.

**Server `.env`**
- MongoDB connection string
- JWT secret key
- JWT expiry (7 days)
- Server port (5000)
- Node environment
- Email credentials (sender email + password or API key)
- Sender name and from address
- Client URL for CORS (http://localhost:3000 in development)

**Next.js `.env.local`**
- Public API base URL pointing to the Express server (http://localhost:5000/api in development)

---

## PART 3 — DATABASE MODELS

Create Mongoose models for the following collections. The server skeleton may already have some of these — extend them rather than replacing them.

### Users
Fields: name, email (unique, lowercase), password (hashed), role (enum: admin / super-admin), isActive (boolean, default true), lastLogin (date), timestamps.

Never return the password field in any API response. Strip it from all JSON output at the model level.

### Packages
Fields: name, slug (unique, auto-generated from name, lowercase), destination, category (enum: Safaris / Beach / Hiking / Cultural / Honeymoon / Corporate / Weekend / International), duration, groupSize, priceFrom (number, USD), currency (default USD), badge (enum: popular / limited / new / null), overview, itinerary (array of day objects — each with day number, title, description, and activities array), inclusions (array of strings), exclusions (array of strings), meals, transport, accommodation, imageUrl, galleryUrls (array of strings), isActive (boolean, default true), isFeatured (boolean, default false), rating (0–5), reviewCount, views (counter), timestamps.

Slugs must be auto-generated from the name before validation. If a slug collision exists, append a number suffix.

### Bookings
Fields: fullName, email, phone, nationality, country, packageId (reference to Package), packageName (string — stored directly in case package is later deleted), travelDateFrom (date), travelDateTo (date), adults (number, min 1), children (number, default 0), childrenAges (string), accommodationPref (enum: budget / midrange / luxury), specialRequests, howHeard, additionalNotes, agreedToTerms (boolean, required), status (enum: pending / confirmed / cancelled / completed, default pending), depositPaid (boolean, default false), depositAmount (number), paymentMethod, paymentReference, adminNotes (internal, never sent to customer), confirmationEmailSent (boolean), adminNotificationSent (boolean), timestamps.

### Testimonials
Fields: name, location, packageBooked, travelDate, rating (1–5), review, photoUrl, isFeatured (boolean, default false), isApproved (boolean, default false), platform (enum: website / google / tripadvisor / facebook, default website), timestamps.

### Blog Posts
Fields: title, slug (unique, auto-generated from title), excerpt (max 300 chars), content, category, thumbnailUrl, author (default: Maka Grace Team), tags (array of strings), isPublished (boolean, default false), publishedAt (date — set automatically when isPublished becomes true), readTime (number, minutes), views (counter), timestamps.

### Enquiries
Fields: fullName, email, phone, destination, message, isRead (boolean, default false), isReplied (boolean, default false), repliedAt (date), timestamps.

---

## PART 4 — MIDDLEWARE

### Authentication Middleware
Every protected route must verify the JWT from the `Authorization: Bearer <token>` header. Decode the token, look up the user in the database, confirm the user is active, and attach the full user object to the request. If the token is missing, invalid, or the user is not found or deactivated, return 401.

### Role Guard Middleware
Some routes are restricted to super-admin only. After the auth middleware confirms the user is authenticated, the role guard checks that the user's role matches the required role. Return 403 if not permitted.

### Error Handler Middleware
A global error handler registered at the end of all routes. Catches all unhandled errors and returns a consistent JSON error shape with a status code and message. In development mode, include the stack trace.

### File Upload Middleware
Use multer to handle image uploads. Accept JPEG, PNG, and WebP only. Limit file size to 5MB per file. Store files in `server/public/uploads/`. Return the accessible URL of the uploaded file. In future this can be swapped to cloud storage by changing only this middleware.

---

## PART 5 — API ROUTES AND LOGIC

Register all route groups on the Express app. All routes are prefixed with `/api`.

---

### 5.1 — Auth Routes (`/api/auth`)

**POST /login**
- Accept email and password
- Find user by email. If not found, return 401 with a generic "Invalid credentials" message — never reveal which field is wrong
- Compare the submitted password against the stored bcrypt hash
- If match: update the user's lastLogin field, sign a JWT containing the user's id, email, and role, return the token and the user object (without password)
- If no match: return 401

**GET /me** *(protected)*
- Return the currently authenticated user object attached to the request

**PUT /change-password** *(protected)*
- Accept currentPassword and newPassword (min 8 characters)
- Verify currentPassword against the stored hash
- Hash the new password and save
- Return success

**POST /logout**
- Stateless — the client handles token removal. Return success confirmation. No server state to clear.

---

### 5.2 — Package Routes (`/api/packages`)

**GET /** *(public)*
- Return paginated list of packages where isActive is true
- Support query parameters: category, destination (case-insensitive partial match), minPrice, maxPrice, search (matches name, destination, or overview), featured (boolean), page (default 1), limit (default 12, max 50), sort (price_asc / price_desc / newest / rating)
- Never return inactive packages on this public endpoint

**GET /featured** *(public)*
- Return packages where isFeatured is true and isActive is true
- No pagination needed — return up to 8

**GET /:slug** *(public)*
- Return single package by slug where isActive is true
- Return 404 if not found or inactive

**GET /:id/admin** *(protected)*
- Return single package by MongoDB ID regardless of isActive status
- Used in the admin edit form

**POST /** *(protected)*
- Create a new package
- Validate all required fields
- Auto-generate slug from name, check for uniqueness
- Return the created package

**PUT /:id** *(protected)*
- Update any field of an existing package
- If name changes, regenerate the slug and check uniqueness
- Return the updated package

**PATCH /:id/toggle** *(protected)*
- Flip the isActive boolean on the package
- Return the updated package

**PATCH /:id/feature** *(protected)*
- Flip the isFeatured boolean on the package
- Return the updated package

**PATCH /:id/view** *(public)*
- Increment the views counter by 1
- Fire and forget — return 200 immediately. This is called on page load by the frontend and must not block the UI

**DELETE /:id** *(super-admin only)*
- Permanently delete the package
- Confirm the package exists before deleting
- Return success

---

### 5.3 — Booking Routes (`/api/bookings`)

**POST /** *(public)*
- Accept all booking form fields
- Validate all required fields. Return 400 with field-specific errors if validation fails
- Save the booking to the database with status "pending"
- Send a confirmation email to the customer (see Part 7)
- Send a notification email to info@makagracetravel.co.ke (see Part 7)
- Mark confirmationEmailSent and adminNotificationSent as true if emails send successfully. Log errors but do not fail the booking if email sending fails
- Return the created booking with a success message

**GET /** *(protected)*
- Return paginated list of all bookings
- Support query parameters: status, search (name, email, or phone), dateFrom (filter by travelDateFrom), page (default 1), limit (default 20)
- Sort by createdAt descending by default

**GET /export** *(protected)*
- Return a CSV file containing all bookings matching any active filters
- Set Content-Type to text/csv and Content-Disposition to attachment with a filename including today's date
- CSV columns: ID, Full Name, Email, Phone, Nationality, Country, Package, Travel Date From, Travel Date To, Adults, Children, Accommodation, Status, Deposit Paid, Created At

**GET /:id** *(protected)*
- Return a single booking by ID with full details

**PUT /:id/status** *(protected)*
- Update the booking status field
- If status is changed to "confirmed", automatically send the booking confirmed email to the customer (see Part 7)
- Return the updated booking

**PUT /:id/notes** *(protected)*
- Update the adminNotes field only
- These notes are internal — never expose them in public booking responses
- Return the updated booking

**POST /:id/email** *(protected)*
- Accept a subject and message body
- Send a custom email to the customer's email address on this booking
- Use the branded email wrapper (see Part 7)
- Return success

**DELETE /:id** *(super-admin only)*
- Permanently delete the booking
- Return success

---

### 5.4 — Enquiry Routes (`/api/enquiries`)

**POST /** *(public)*
- Accept fullName, email, phone, destination, message
- Validate required fields (fullName, email, message)
- Save to database
- Return success

**GET /** *(protected)*
- Return paginated list of all enquiries
- Support filter by isRead, search by name or email
- Sort by createdAt descending

**GET /:id** *(protected)*
- Return single enquiry by ID

**PATCH /:id/read** *(protected)*
- Toggle the isRead field
- Return the updated enquiry

**DELETE /:id** *(protected)*
- Delete the enquiry
- Return success

---

### 5.5 — Testimonial Routes (`/api/testimonials`)

**GET /** *(public)*
- Return testimonials where isApproved is true
- Sort by createdAt descending

**GET /featured** *(public)*
- Return testimonials where both isApproved and isFeatured are true
- Limit to 3

**GET /admin** *(protected)*
- Return all testimonials regardless of approval status
- Support filter by isApproved, isFeatured, platform

**POST /** *(protected)*
- Create a new testimonial
- Default isApproved to false — admin must manually approve
- Return the created testimonial

**PUT /:id** *(protected)*
- Update testimonial fields
- Return the updated testimonial

**PATCH /:id/approve** *(protected)*
- Toggle the isApproved boolean
- Return the updated testimonial

**PATCH /:id/feature** *(protected)*
- Toggle the isFeatured boolean
- Only testimonials that are already approved can be featured
- Return the updated testimonial

**DELETE /:id** *(super-admin only)*
- Delete the testimonial
- Return success

---

### 5.6 — Blog Routes (`/api/blog`)

**GET /** *(public)*
- Return paginated list of posts where isPublished is true
- Support search by title, filter by category
- Sort by publishedAt descending

**GET /:slug** *(public)*
- Return single post by slug where isPublished is true
- On each successful fetch, increment the views counter by 1
- Return 404 if not found or unpublished

**GET /admin** *(protected)*
- Return all posts including drafts
- Support filter by isPublished, search by title

**GET /admin/:id** *(protected)*
- Return single post by ID regardless of published status

**POST /** *(protected)*
- Create a new blog post
- Auto-generate slug from title, check for uniqueness
- If isPublished is true, set publishedAt to current timestamp
- Return the created post

**PUT /:id** *(protected)*
- Update any field of a blog post
- If isPublished changes from false to true and publishedAt is not already set, set publishedAt to now
- Return the updated post

**PATCH /:id/publish** *(protected)*
- Toggle the isPublished boolean
- If publishing (going from false to true) and publishedAt is not set, set it to now
- Return the updated post

**DELETE /:id** *(super-admin only)*
- Delete the blog post
- Return success

---

### 5.7 — User Routes (`/api/users`) — super-admin only

All routes in this group require both authentication and the super-admin role.

**GET /**
- Return list of all admin users
- Never return password fields

**POST /**
- Create a new admin user
- Hash the password before saving
- Validate: email must be unique, password minimum 8 characters, role must be admin or super-admin
- Return the created user without password

**PUT /:id**
- Update name, email, or role of an existing user
- Cannot change own role
- Return updated user without password

**PATCH /:id/toggle**
- Toggle the isActive boolean of a user
- A user cannot deactivate their own account
- Return the updated user

**DELETE /:id**
- Delete a user account
- A user cannot delete their own account
- Return success

---

### 5.8 — Dashboard Routes (`/api/dashboard`)

All routes protected.

**GET /stats**
- Return a single object containing all summary statistics needed by the admin dashboard overview:
  - Total bookings count
  - Pending bookings count
  - Confirmed bookings count
  - Cancelled bookings count
  - Total packages count
  - Active packages count
  - Total enquiries count
  - Unread enquiries count
  - Total testimonials count
  - Approved testimonials count
  - Published blog posts count
  - Bookings this calendar month
  - Bookings last calendar month
  - Top 5 packages by booking count with their view counts

Run all of these as parallel database queries using Promise.all for performance. Do not run them sequentially.

**GET /recent**
- Return the 5 most recent bookings and the 5 most recent enquiries in a single response
- Used for the dashboard activity feed

---

### 5.9 — Upload Routes (`/api/upload`)

All routes protected.

**POST /image**
- Accept a single image file
- Validate file type (JPEG, PNG, WebP only) and size (max 5MB)
- Save to server/public/uploads/
- Return the accessible URL of the uploaded image

**POST /gallery**
- Accept up to 10 image files
- Same validation as single upload
- Return an array of accessible URLs

**DELETE /**
- Accept an image URL or filename in the request body
- Delete the file from disk
- Return success

---

## PART 6 — CORS CONFIGURATION

Configure CORS on the Express server to allow requests only from:
- http://localhost:3000 (development)
- https://www.makagracetravel.co.ke (production)
- https://makagracetravel.co.ke (production without www)

Allow credentials. Allow methods: GET, POST, PUT, PATCH, DELETE, OPTIONS. Allow headers: Content-Type and Authorization.

Never set origin to wildcard in production.

---

## PART 7 — EMAIL SERVICE

All emails use a branded HTML template with the following consistent structure:
- Header: Forest Green (#1A4731) background with the agency name in white and the tagline in Maasai Gold (#E8C547)
- Body: white background, dark text, readable line height
- Footer: Bone Sand (#F5F0E8) background with the agency phone, email, and location

### Email 1 — Booking Received (sent to customer immediately on booking submission)
- Subject: Your Booking Request Has Been Received — [Package Name] | Maka Grace
- Content: Greet the customer by name. Confirm the booking details (package name, travel date, number of travellers, accommodation preference). Explain that the team will be in touch within 24 hours. Include the WhatsApp number (+254 705 794 254) and email (makagraceholdings@gmail.com) for questions.

### Email 2 — New Booking Notification (sent to info@makagracetravel.co.ke immediately on booking submission)
- Subject: [New Booking] [Customer Name] — [Package Name]
- Content: Full booking details including all customer fields, travel details, and special requests. Prompt the admin to log in to the dashboard to confirm.

### Email 3 — Booking Confirmed (sent to customer when admin changes status to "confirmed")
- Subject: Your Trip is Confirmed! — [Package Name] | Maka Grace
- Content: Confirm the booking is secured. Remind the customer that a 25% deposit is required. Provide M-Pesa payment instructions (pay to +254 705 794 254, Marykala). Ask them to send the payment reference via WhatsApp or email.

### Email 4 — Custom Email from Admin (sent from the booking detail view in the dashboard)
- Subject: whatever the admin enters
- Content: whatever message the admin types, wrapped in the branded template
- The admin composes this in the email composer inside the booking detail panel

### Email 5 — Review Request (can be triggered manually from the booking detail view after status is set to completed)
- Subject: How Was Your Kenya Trip? Share Your Experience
- Content: Thank the customer. Ask them to leave a Google review. Link to the Google Business review page. Keep it warm and brief.

All emails must be wrapped in try/catch. If an email fails to send, log the error, mark the email tracking fields accordingly, but never fail the API response because of an email error.

---

## PART 8 — FRONTEND API CLIENT

Create a single API client file in the Next.js project (`lib/api.ts`) that handles all communication with the Express server. It must:

- Read the API base URL from the `NEXT_PUBLIC_API_URL` environment variable
- Store the admin JWT token in localStorage under the key `mg_admin_token`
- Attach the token as a Bearer header on all protected requests
- On any 401 response from a protected endpoint, clear the token from localStorage and redirect the user to `/admin/login`
- Throw an error with the server's error message on any non-OK response
- Expose typed functions for every API endpoint group: auth, packages, bookings, enquiries, testimonials, blog, dashboard, upload

The upload functions must use `FormData` and must not set the `Content-Type` header manually — the browser sets it with the correct boundary automatically.

---

## PART 9 — ADMIN DASHBOARD PAGES — LOGIC AND INTEGRATION

The UI for all admin pages already exists. Wire each page to the server as follows.

### Login Page
- On form submit, call the login API endpoint with email and password
- On success, save the returned token to localStorage as `mg_admin_token` and save the user object as `mg_admin_user`
- Redirect to `/admin/dashboard`
- On failure, display the error message from the server inline in the form — do not clear the fields

### Admin Layout and Auth Guard
- On every admin page load, check for a token in localStorage
- If no token exists, redirect immediately to `/admin/login`
- If a token exists, call the `/api/auth/me` endpoint to verify it is still valid
- If the token is expired or invalid, clear localStorage and redirect to `/admin/login`
- The current user's name and role must be available throughout the admin UI — store in React context or component state

### Dashboard Overview Page
- On mount, call the dashboard stats endpoint and the dashboard recent endpoint in parallel
- Render the 6 stat cards using the returned data
- Render the bookings per month bar chart and bookings by category pie chart from the stats data
- Render the recent bookings table and recent enquiries list from the recent data
- Show a loading skeleton while data is fetching
- Show an error state with a retry button if the fetch fails

### Bookings Page
- On mount, fetch bookings with default filters (status: all, page: 1)
- Re-fetch whenever any filter changes (status, search, date range)
- The status badge colour must match the status: pending = yellow, confirmed = green, cancelled = red, completed = blue
- Clicking a row or a "View" button opens the booking detail panel (slide-over or modal)
- The detail panel shows all booking fields, a status dropdown, an admin notes textarea that autosaves on blur, and an email composer
- Changing the status dropdown and clicking Update calls the update status endpoint. If the new status is "confirmed", the booking confirmed email is automatically sent to the customer
- The email composer sends a custom email via the send email endpoint. Show success/error feedback inline
- The Export CSV button calls the export endpoint and triggers a file download in the browser
- Delete is only shown to super-admin users and requires a confirmation dialog before proceeding

### Packages Page
- On mount, fetch all packages (including inactive) for the admin table
- The table shows name, category, destination, price, active toggle, featured toggle, and views
- The active toggle calls the toggle active endpoint on change
- The featured toggle calls the toggle featured endpoint on change
- Add New and Edit both open the package form (same form, pre-filled for edit)
- The package form must handle:
  - Basic fields (name, category, destination, duration, group size, price, badge)
  - Overview textarea
  - Itinerary builder: a list of day rows that the admin can add, remove, and reorder. Each row has day number, title, description, and an activities input
  - Inclusions and exclusions as tag inputs (type and press Enter to add, click to remove)
  - Trip details (meals, transport, accommodation)
  - Cover image: show current image, allow replacing via file upload or URL input
  - Gallery: show current images in a grid, allow adding more, allow removing individual images
- On save, call create or update endpoint. Show validation errors from the server inline next to the relevant fields
- Delete is super-admin only with a confirmation dialog

### Enquiries Page
- On mount, fetch all enquiries
- Unread enquiries must be visually distinct (bold name, unread indicator dot)
- Clicking a row marks it as read and opens the detail view
- The detail view shows all fields and a "Mark as Read / Unread" toggle button
- Delete requires confirmation

### Testimonials Page
- On mount, fetch all testimonials from the admin endpoint
- Show approve toggle and featured toggle as switches on each row
- Featured toggle must be disabled if the testimonial is not yet approved
- Add / Edit opens a form with all testimonial fields including a star rating selector and image upload
- Delete is super-admin only with confirmation

### Blog Page
- On mount, fetch all blog posts from the admin endpoint
- The publish toggle switches a post between published and draft
- Add New and Edit open the blog post editor
- The editor must include: title, slug (auto-generated but editable), category, tags, excerpt (with character counter), thumbnail image upload, author, read time, and a content editor (rich text or markdown — use whatever is already in the UI)
- Saving a post calls create or update. Publishing sets the publishedAt timestamp
- Delete is super-admin only with confirmation

### Users Page (super-admin only)
- Only visible and accessible to users with the super-admin role
- If an admin-role user navigates to this page, redirect to the dashboard with an access denied message
- On mount, fetch all users
- Create User form: name, email, password, role dropdown
- Edit user: name, email, role only — no password editing here
- The active toggle cannot be used on the currently logged-in user
- Delete cannot be used on the currently logged-in user

---

## PART 10 — PUBLIC FRONTEND PAGES — API INTEGRATION

The frontend UI already exists. Wire each public page to the server as follows.

### Homepage
- Fetch featured packages from the featured packages endpoint and render them in the packages grid
- Fetch featured testimonials from the featured testimonials endpoint and render them in the testimonials section
- Newsletter signup form posts to the enquiries endpoint

### Packages Listing Page
- Read filter state from URL search params
- On mount and on every filter change, fetch packages from the public packages endpoint with the current filter params
- Update the URL when filters change so the URL is shareable and bookmarkable
- Show a loading state while fetching. Show an empty state if no results

### Package Detail Page
- Fetch the package by slug from the public packages endpoint
- After a successful fetch, increment the view counter by calling the view endpoint — fire and forget, do not await
- Use the package data to populate all sections: overview, itinerary accordion, inclusions/exclusions, gallery lightbox, and the sticky booking card
- The "Book This Package" button navigates to the booking form page and pre-fills the package name field via URL param or local state

### Booking Form Page
- If a package name is passed via URL param or state, pre-fill the package field
- On submit, POST to the public bookings endpoint
- On success, replace the form with a success confirmation showing a summary of what was submitted and a message that the team will be in touch within 24 hours
- On failure, show the server's error message and keep the form populated so the user does not have to re-enter data

### Contact / Enquiry Form
- On submit, POST to the public enquiries endpoint
- On success, show a success message. On failure, show the error

### Blog Listing Page
- Fetch published posts from the public blog endpoint
- Support pagination — show a Load More button that fetches the next page and appends to the list

### Blog Post Page
- Fetch the post by slug from the public blog endpoint
- Use generateMetadata to set the page title and description from the post data for SEO

---

## PART 11 — TYPESCRIPT TYPES

Extend `lib/types.ts` with the types the agent needs. Do not overwrite existing types. The agent must define typed interfaces for: AdminUser, AuthState, Booking, BookingFormData, BookingStatus, Enquiry, EnquiryFormData, DashboardStats, DashboardRecent, and all API response wrapper types for paginated and single-item responses. All these types must reflect the database model shapes exactly.

---

## PART 12 — IMPLEMENTATION ORDER

Work through these steps in sequence. Do not move to the next step until the current one is working.

1. Install any server packages that are missing from the skeleton — bcryptjs, jsonwebtoken, nodemailer, multer. Check package.json first before installing anything.
2. Create all database models that do not already exist in the skeleton. Extend existing ones if needed.
3. Create the user seeder and wire it to run after the MongoDB connection is established on server startup.
4. Create the authentication middleware, role guard middleware, error handler middleware, and file upload middleware.
5. Create the email service with all five email templates.
6. Create all route files and their controllers, working through route groups in this order: auth, packages, bookings, enquiries, testimonials, blog, users, dashboard, upload.
7. Register all routes on the Express app and configure CORS.
8. Verify the server is working by testing the login endpoint with both seed user accounts.
9. Create `lib/api.ts` in the Next.js project with typed functions for every endpoint.
10. Extend `lib/types.ts` with all required interfaces.
11. Wire the admin login page to the auth API.
12. Wire the admin layout auth guard.
13. Wire the dashboard overview page to the dashboard stats and recent endpoints.
14. Wire the bookings page and booking detail panel including status updates and email sending.
15. Wire the packages page and package form including image uploads.
16. Wire the enquiries page.
17. Wire the testimonials page and form.
18. Wire the blog page and post editor.
19. Wire the users page (super-admin only).
20. Wire all public frontend pages: homepage, packages listing, package detail, booking form, contact form, blog listing, blog post.
21. Test every flow end-to-end: login with both accounts → create a package → submit a booking from the public site → verify confirmation emails → log into admin → change booking status to confirmed → verify confirmed email → export CSV → log out.

---

## PART 13 — RULES THE AGENT MUST NOT VIOLATE

1. Passwords are always hashed with bcrypt before saving. Never store or log plain text passwords. Never return passwords in any API response.
2. Every protected route must use the auth middleware. No exceptions.
3. Super-admin-only routes must use both the auth middleware and the role guard middleware.
4. Public endpoints must never return packages where isActive is false or blog posts where isPublished is false.
5. Email sending errors must never cause a booking creation to fail. Always wrap email calls in try/catch, log the error, and continue.
6. The seeder is idempotent. It must check if users exist before creating any. It must never create duplicates.
7. JWT secrets and email credentials come from environment variables only. Never hardcode them.
8. CORS must whitelist specific origins. Never use wildcard origin in production.
9. The admin notes field on a booking is internal only. It must never appear in public booking API responses.
10. A super-admin cannot toggle their own active status or delete their own account.
11. The frontend never stores the JWT in a cookie or session — localStorage only, under the key `mg_admin_token`.
12. All list endpoints must support pagination. Default limit is 20 for admin endpoints, 12 for public package listings.
13. All destructive admin actions (delete, deactivate) must be confirmed by the user in the UI before the API call is made.
14. Image uploads accept JPEG, PNG, and WebP only. Reject any other file type with a 400 error.
15. Slug generation must guarantee uniqueness. If a slug already exists, append -2, -3, etc. until unique.
16. The dashboard stats endpoint must run all database count queries in parallel — not sequentially.
17. TypeScript strict mode is on throughout the Next.js project. No `any` types. No `@ts-ignore` comments.

---

*Prepared by Estetica Agency · Maka Grace Tours and Travel · July 2026*

*The frontend UI, admin dashboard UI, and server skeleton all already exist. This document defines what the agent must implement to make them work together.*
