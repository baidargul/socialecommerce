# Project.md — Mobile-Only Social Commerce Web App

## 1. Project Overview

Build a **mobile-only social commerce web application** that looks and behaves like a modern social feed with shopping built directly into posts. The app will be optimized only for **phone-size screens** and will not include a desktop layout.

The core experience is similar to a social media shopping feed where users can:

- View creator/influencer-style posts.
- Scroll through a vertical home feed.
- View story circles at the top.
- Like, comment, react, and share posts.
- See featured products attached to posts.
- Tap **Buy Now** directly from a post.
- Open product checkout in a bottom sheet.
- Add products to cart.
- Browse shop items.
- View profile and order-related screens.

The product is not a standard ecommerce store. It is a **social-first mobile web commerce app**, where content drives buying decisions.

---

## 2. Required Technology Stack

Use the following stack:

- **Next.js** — frontend and backend API routes
- **MongoDB** — primary database
- **Prisma ORM** — database modeling and queries
- **Zustand** — frontend state management

Recommended supporting tools:

- **TypeScript** — strict typing
- **Tailwind CSS** — mobile-first styling
- **React Hook Form + Zod** — forms and validation
- **Cloudinary / Cloudflare R2 / S3-compatible storage** — media uploads
- **JWT / NextAuth / custom auth** — authentication
- **Framer Motion** — mobile sheet transitions and micro-interactions
- **Lucide React / custom SVG icons** — app icons

---

## 3. Main Product Concept

The app will combine:

1. **Instagram-style feed**
2. **Stories carousel**
3. **Product tagging inside posts**
4. **Bottom-sheet comments**
5. **Bottom-sheet checkout**
6. **Mobile navigation bar**
7. **Creator/vendor profiles**
8. **Social sharing**
9. **Cart and order flow**

Every post can optionally contain a featured product. Users can interact with the post socially, then buy the attached product without leaving the feed.

---

## 4. Platform Scope

### 4.1 Mobile-Only Web Application

This application will be designed only for phone-size screens.

Supported viewport behavior:

- Primary width: **360px to 430px**
- Target ratio: vertical mobile layout
- No desktop version required
- No tablet optimization required initially
- Desktop users may see a centered mobile container or a message such as:  
  **“This app is optimized for mobile devices.”**

### 4.2 PWA Support

The app should behave like a mobile app when opened in a browser.

Include:

- Add to Home Screen support
- App icon
- Splash screen
- Mobile theme color
- Full-screen feel
- Fast loading
- Offline fallback page

---

## 5. Main Screens

## 5.1 Home Feed Screen

The home screen is the main social-commerce feed.

### Required Elements

- App title at top, for example: **Social Commerce**
- Horizontal stories section
- Vertical list of posts
- Fixed bottom navigation
- Post cards with creator info, image/video, social actions, caption, featured product, and buy button

### Home Feed Layout

Each feed post should include:

- Creator avatar
- Creator username
- Three-dot options menu
- Main media area
- Carousel dots if multiple media exist
- Floating **Buy Now** button over media if a product is attached
- Like count
- Comment count
- Share icon
- Caption
- Hashtags
- Featured product block

Example feed post structure:

```txt
[avatar] username                         [...]
[large media image/video]
                         [Buy Now]
[heart] 1.2M   [comment] 4.5k   [share]
username Caption text #fashion #summer
Featured Product
[product thumbnail] Summer Dress - $49.99
```

---

## 5.2 Stories Section

A horizontal stories carousel should appear at the top of the home screen.

### Required Features

- Circular avatars
- Gradient ring for active stories
- Grey ring for viewed stories
- Username below each story
- Ellipsis truncation for long usernames
- Tap to open story viewer

### Story Viewer

Story viewer should open full screen.

Required elements:

- Full-screen vertical image/video
- Progress bar at top
- Creator avatar and username
- Close button
- Tap right side to go next
- Tap left side to go previous
- Swipe down to close
- Product link support inside story

---

## 5.3 Post Detail Screen

A post detail screen may open when a user taps the media or caption.

Required:

- Full media carousel
- Creator information
- Caption
- Full comments preview
- Featured product
- Related products
- Buy Now button

This screen is optional for MVP if feed interactions are handled directly with bottom sheets.

---

## 5.4 Comments Bottom Sheet

When the user taps the comment icon, a bottom sheet should open.

### Required Elements

- Dark overlay behind sheet
- Rounded top corners
- Drag handle
- Title: **Comments**
- List of comments
- User avatar
- Username
- Comment text
- Reaction row
- Add comment input

### Reaction Emojis

Include quick reactions:

- ❤️
- 🙌
- 🔥
- 👏
- 🥲
- 😍
- 😮
- 😂

### Comment Features

- Add comment
- Like comment
- Reply to comment
- Delete own comment
- Load more comments
- Optimistic UI update

---

## 5.5 Checkout Bottom Sheet

When the user taps **Buy Now**, a checkout bottom sheet should open.

### Required Elements

- Product image
- Product name
- Discounted price
- Original price
- Discount percentage
- Order summary
- Subtotal
- Shipping
- Total
- Proceed to Payment button

Example:

```txt
Checkout
[Product Image] Scented Candle
$24.99
$35.00
20% OFF

Order Summary
Subtotal     $24.99
Shipping     Free

[Proceed to Payment]
```

### Checkout Requirements

- The sheet should cover around 60–75% of screen height
- Background feed should dim
- User can drag down to close
- User can proceed to full checkout screen
- Product data should be loaded from database
- Quantity selector should be included in the full checkout screen

---

## 5.6 Share Bottom Sheet

When user taps share, a native-style share sheet should open.

### Required Elements

- Title: **Sharing text**
- Close icon
- Share message preview
- Copy button
- Suggested contacts row
- Share options row

### Share Options

- Copy link
- WhatsApp
- Facebook
- Messenger
- Instagram copy text fallback
- Native Web Share API if supported

### Share Text Example

```txt
Check out this post by cozy_corner: Cozy evening essentials 🕯️ #home #decor
```

### Technical Requirements

Use:

- `navigator.share()` where supported
- Clipboard API for copy button
- Fallback modal for unsupported browsers

---

## 5.7 Product Card / Featured Product Block

Every post can have one attached product.

### Product Block Data

- Product thumbnail
- Product name
- Current price
- Original price optional
- Discount badge optional
- Stock status
- Vendor name optional

### Product Block UI

The featured product should appear under caption:

```txt
Featured Product
[thumbnail] Ceramic Bowl - $15.99
```

---

## 5.8 Shop Screen

The shop tab will show all available products.

### Required Features

- Search bar
- Product categories
- Product grid
- Product filters
- Sort options
- Product cards
- Add to cart
- Product detail page

### Product Filters

- Category
- Price range
- Discounted products
- New arrivals
- Trending
- Vendor
- Rating

---

## 5.9 Cart Screen

The cart tab should show selected products.

### Required Features

- Cart item list
- Quantity controls
- Remove item
- Product subtotal
- Shipping
- Discount/coupon field
- Grand total
- Checkout button

---

## 5.10 Profile Screen

The profile tab should support both normal users and creators/vendors.

### User Profile Features

- User avatar
- Name
- Username
- Saved posts
- Orders
- Wishlist
- Addresses
- Payment methods
- Settings

### Creator/Vendor Profile Features

- Profile banner
- Avatar
- Bio
- Follower count
- Post grid
- Products list
- Shop link
- Follow button

---

## 6. Navigation Structure

Bottom navigation must be fixed and visible on main screens.

Required tabs:

1. **Home**
2. **Shop**
3. **Cart**
4. **Profile**

Optional future tabs:

- Search
- Reels
- Orders
- Messages
- Notifications

### Bottom Navigation Behavior

- Active tab should be visually highlighted
- Icons should be large enough for thumb usage
- Labels should be clear
- Navigation should not overlap content
- Safe-area padding should support modern phones

---

## 7. User Roles

## 7.1 Guest User

Can:

- Browse feed
- View posts
- View products
- Open comments
- Share posts

Cannot:

- Like posts
- Comment
- Buy products
- Add to cart
- Follow creators

Guest should be prompted to log in when restricted actions are attempted.

## 7.2 Customer

Can:

- Like posts
- Comment
- React
- Share
- Follow creators
- Add products to cart
- Buy products
- Manage profile
- Track orders
- Save posts
- Wishlist products

## 7.3 Creator

Can:

- Create posts
- Upload media
- Attach products
- View post analytics
- Reply to comments
- Manage profile

## 7.4 Vendor / Seller

Can:

- Add products
- Manage product inventory
- Attach products to posts
- View orders
- Manage prices and discounts
- View sales analytics

## 7.5 Admin

Can:

- Manage users
- Manage creators
- Manage vendors
- Manage posts
- Manage products
- Moderate comments
- Manage categories
- View analytics
- Configure payment and shipping settings

---

## 8. Authentication Requirements

Required authentication features:

- Signup
- Login
- Logout
- Forgot password
- Reset password
- Email or phone verification
- Role-based access
- Protected routes
- Session persistence

Recommended login methods:

- Email/password
- Phone number OTP
- Google login optional

---

## 9. Content and Post System

## 9.1 Post Types

Support:

- Image post
- Multiple image carousel
- Video post
- Story post
- Product post
- Sponsored post

## 9.2 Post Fields

Each post should include:

- Creator ID
- Caption
- Hashtags
- Media files
- Product attachment
- Like count
- Comment count
- Share count
- Visibility
- Status
- Created date
- Updated date

## 9.3 Post Status

Post status options:

- Draft
- Published
- Archived
- Flagged
- Removed

---

## 10. Product System

## 10.1 Product Fields

Each product should include:

- Product name
- Slug
- Description
- Short description
- Images
- Category
- Vendor
- Current price
- Original price
- Discount percentage
- Stock quantity
- SKU
- Status
- Tags
- Shipping type
- Created date
- Updated date

## 10.2 Product Status

- Draft
- Active
- Out of stock
- Hidden
- Archived

## 10.3 Product Variants

Future support should include:

- Size
- Color
- Material
- Style
- Weight
- Custom options

---

## 11. Order and Checkout System

## 11.1 Order Flow

1. User taps Buy Now
2. Checkout bottom sheet opens
3. User reviews product
4. User proceeds to payment
5. User enters address
6. User chooses payment method
7. User confirms order
8. Order is created
9. Vendor/admin receives order
10. User can track order

## 11.2 Order Status

- Pending
- Confirmed
- Processing
- Shipped
- Delivered
- Cancelled
- Refunded

## 11.3 Payment Methods

For MVP:

- Cash on delivery
- Manual bank transfer

Future:

- Stripe
- PayPal
- Local payment gateways
- Wallet balance

---

## 12. Comments System

Comment features:

- Add comment
- Delete own comment
- Like comment
- Reply to comment
- Nested replies
- Report comment
- Admin moderation
- Soft delete

Comment UI should be optimized for mobile bottom sheet usage.

---

## 13. Reactions and Likes

Users should be able to:

- Like posts
- Unlike posts
- React with emojis in comments sheet
- See like count
- See reaction count

Use optimistic UI for fast interaction.

---

## 14. Sharing System

Share features:

- Copy post text
- Copy product link
- Share to WhatsApp
- Share to Facebook
- Share through native mobile browser share dialog
- Track share count

Each post should have a public shareable URL.

Example URL:

```txt
/post/summer-vibes-green-dress
```

---

## 15. Search System

Search should cover:

- Products
- Posts
- Creators
- Hashtags
- Categories

Search screen should include:

- Recent searches
- Trending searches
- Suggested products
- Suggested creators

---

## 16. Admin Dashboard

Although the user-facing app is mobile-only, the admin dashboard can be built later. For the first phase, admin can be simple and mobile-compatible.

Admin modules:

- User management
- Creator management
- Vendor management
- Product management
- Post management
- Category management
- Order management
- Comment moderation
- Analytics
- Settings

---

## 17. UI / UX Requirements

## 17.1 Design Style

The app should feel:

- Clean
- Modern
- Social-media-like
- Fast
- Thumb-friendly
- Minimal
- Product-focused

## 17.2 Visual Rules

- White background by default
- Large media cards
- Rounded bottom sheets
- Bold usernames
- Clear icon actions
- Mobile safe area support
- Smooth transitions
- Skeleton loaders
- Pull-to-refresh
- Infinite scroll

## 17.3 Bottom Sheet Rules

Use bottom sheets for:

- Comments
- Checkout quick view
- Share
- Post options
- Product quick view
- Filters

Bottom sheet behavior:

- Drag handle
- Swipe down to close
- Dim background
- Rounded top corners
- Smooth animation
- Prevent body scroll behind sheet

---

## 18. Performance Requirements

The app must feel fast on mobile networks.

Required optimizations:

- Image optimization with Next.js Image
- Lazy loading media
- Infinite scrolling
- Server-side pagination
- API response caching where suitable
- Optimistic UI updates
- Lightweight Zustand stores
- Database indexes for feed queries
- Compressed images
- Avoid loading full-size images in feed
- Use skeleton states instead of blank loading

Target performance:

- Home feed first load under 2 seconds on decent 4G
- Like/comment actions should feel instant
- Bottom sheets should open without delay
- Feed pagination should avoid visible freezing

---

## 19. Suggested Folder Structure

```txt
src/
  app/
    (auth)/
      login/
      signup/
    (mobile)/
      home/
      shop/
      cart/
      profile/
      post/[slug]/
      product/[slug]/
    api/
      auth/
      posts/
      products/
      comments/
      orders/
      users/
      upload/
  components/
    layout/
      MobileShell.tsx
      BottomNav.tsx
      Header.tsx
    feed/
      FeedPostCard.tsx
      FeedMedia.tsx
      FeaturedProduct.tsx
      PostActions.tsx
    stories/
      StoriesBar.tsx
      StoryCircle.tsx
      StoryViewer.tsx
    sheets/
      CommentsSheet.tsx
      CheckoutSheet.tsx
      ShareSheet.tsx
      ProductQuickViewSheet.tsx
    product/
      ProductCard.tsx
      ProductGrid.tsx
      ProductPrice.tsx
    cart/
      CartItem.tsx
      CartSummary.tsx
    ui/
      Button.tsx
      IconButton.tsx
      Avatar.tsx
      Input.tsx
      Sheet.tsx
      Skeleton.tsx
  lib/
    prisma.ts
    auth.ts
    upload.ts
    validators.ts
    utils.ts
  store/
    useAuthStore.ts
    useFeedStore.ts
    useCartStore.ts
    useSheetStore.ts
    useProductStore.ts
  server/
    services/
      post.service.ts
      product.service.ts
      order.service.ts
      comment.service.ts
      user.service.ts
    repositories/
      post.repository.ts
      product.repository.ts
      order.repository.ts
      comment.repository.ts
  prisma/
    schema.prisma
```

---

## 20. Prisma MongoDB Schema Draft

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL")
}

enum UserRole {
  CUSTOMER
  CREATOR
  VENDOR
  ADMIN
}

enum PostStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
  FLAGGED
  REMOVED
}

enum ProductStatus {
  DRAFT
  ACTIVE
  OUT_OF_STOCK
  HIDDEN
  ARCHIVED
}

enum OrderStatus {
  PENDING
  CONFIRMED
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
  REFUNDED
}

model User {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  name        String
  username    String   @unique
  email       String?  @unique
  phone       String?  @unique
  password    String?
  avatarUrl   String?
  bio         String?
  role        UserRole @default(CUSTOMER)
  isVerified  Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  posts       Post[]
  comments    Comment[]
  likes       Like[]
  orders      Order[]
  products    Product[]
}

model Post {
  id            String     @id @default(auto()) @map("_id") @db.ObjectId
  creatorId     String     @db.ObjectId
  caption       String
  hashtags      String[]
  media         PostMedia[]
  productId     String?    @db.ObjectId
  status        PostStatus @default(PUBLISHED)
  likeCount     Int        @default(0)
  commentCount  Int        @default(0)
  shareCount    Int        @default(0)
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt

  creator       User       @relation(fields: [creatorId], references: [id])
  product       Product?   @relation(fields: [productId], references: [id])
  comments      Comment[]
  likes         Like[]

  @@index([creatorId])
  @@index([productId])
  @@index([createdAt])
}

type PostMedia {
  url       String
  type      String
  width     Int?
  height    Int?
  duration  Int?
  order     Int
}

model Product {
  id              String        @id @default(auto()) @map("_id") @db.ObjectId
  vendorId        String        @db.ObjectId
  name            String
  slug            String        @unique
  description     String?
  shortDescription String?
  images          String[]
  categoryId      String?       @db.ObjectId
  price           Float
  originalPrice   Float?
  discountPercent Int?
  stockQuantity   Int           @default(0)
  sku             String?       @unique
  status          ProductStatus @default(ACTIVE)
  tags            String[]
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  vendor          User          @relation(fields: [vendorId], references: [id])
  category        Category?     @relation(fields: [categoryId], references: [id])
  posts           Post[]
  orderItems      OrderItem[]

  @@index([vendorId])
  @@index([categoryId])
  @@index([createdAt])
}

model Category {
  id        String    @id @default(auto()) @map("_id") @db.ObjectId
  name      String
  slug      String    @unique
  imageUrl  String?
  products  Product[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

model Comment {
  id        String    @id @default(auto()) @map("_id") @db.ObjectId
  postId    String    @db.ObjectId
  userId    String    @db.ObjectId
  parentId  String?   @db.ObjectId
  text      String
  likeCount Int       @default(0)
  isDeleted Boolean   @default(false)
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  post      Post      @relation(fields: [postId], references: [id])
  user      User      @relation(fields: [userId], references: [id])

  @@index([postId])
  @@index([userId])
  @@index([parentId])
}

model Like {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  postId    String   @db.ObjectId
  userId    String   @db.ObjectId
  createdAt DateTime @default(now())

  post      Post     @relation(fields: [postId], references: [id])
  user      User     @relation(fields: [userId], references: [id])

  @@unique([postId, userId])
  @@index([postId])
  @@index([userId])
}

model CartItem {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  userId    String   @db.ObjectId
  productId String   @db.ObjectId
  quantity  Int      @default(1)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([userId, productId])
  @@index([userId])
  @@index([productId])
}

model Order {
  id              String      @id @default(auto()) @map("_id") @db.ObjectId
  userId          String      @db.ObjectId
  status          OrderStatus @default(PENDING)
  subtotal        Float
  shippingAmount  Float       @default(0)
  discountAmount  Float       @default(0)
  total           Float
  paymentMethod   String
  paymentStatus   String      @default("PENDING")
  shippingAddress Address
  items           OrderItem[]
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  user            User        @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([status])
  @@index([createdAt])
}

type OrderItem {
  productId String @db.ObjectId
  name      String
  imageUrl  String?
  price     Float
  quantity  Int
  total     Float
}

type Address {
  fullName    String
  phone       String
  addressLine String
  city        String
  state       String?
  country     String
  postalCode  String?
}
```

---

## 21. Zustand Store Requirements

## 21.1 Auth Store

Responsibilities:

- Current user
- Login state
- Token/session info
- Logout action
- Role info

## 21.2 Feed Store

Responsibilities:

- Feed posts
- Pagination cursor
- Loading state
- Like/unlike optimistic updates
- Comment count updates
- Share count updates

## 21.3 Cart Store

Responsibilities:

- Cart items
- Add to cart
- Remove from cart
- Update quantity
- Cart total
- Clear cart

## 21.4 Sheet Store

Responsibilities:

- Current open sheet
- Selected post
- Selected product
- Open comments sheet
- Open checkout sheet
- Open share sheet
- Close sheet

---

## 22. API Routes

Recommended API structure:

```txt
/api/auth/signup
/api/auth/login
/api/auth/logout

/api/posts
/api/posts/[id]
/api/posts/[id]/like
/api/posts/[id]/comments
/api/posts/[id]/share

/api/products
/api/products/[id]
/api/products/slug/[slug]

/api/cart
/api/cart/add
/api/cart/update
/api/cart/remove
/api/cart/clear

/api/orders
/api/orders/[id]

/api/stories
/api/upload
/api/search
```

---

## 23. Feed API Requirements

Feed API should support:

- Cursor pagination
- Limit parameter
- Product included with post
- Creator included with post
- Like status for current user
- Saved status for current user

Example response shape:

```json
{
  "items": [],
  "nextCursor": "string-or-null"
}
```

---

## 24. Media Upload Requirements

Support uploads for:

- Avatars
- Product images
- Post images
- Post videos
- Story media

Upload rules:

- Validate file type
- Validate file size
- Compress images
- Generate thumbnails
- Store metadata
- Prevent unsafe file uploads

Recommended limits:

- Avatar: 2MB
- Product image: 5MB
- Feed image: 8MB
- Feed video: 50MB for MVP
- Story video: 30MB for MVP

---

## 25. Data Seeding

Create seed data for development:

- Users:
  - sarah_style
  - urban_explorer
  - cozy_corner
  - photo_journey
  - healthy_eats

- Products:
  - Summer Dress — $49.99
  - Denim Jacket — $89.99
  - Scented Candle — $24.99
  - Ceramic Bowl — $15.99

- Posts:
  - Fashion post
  - Travel post
  - Home decor post
  - Photography post
  - Food post

- Comments:
  - Amazing look
  - Love this style
  - Where can I buy?

---

## 26. MVP Scope

The first working version should include:

1. Mobile-only layout
2. Home feed
3. Stories row
4. Feed post card
5. Like button
6. Comments bottom sheet
7. Share bottom sheet
8. Featured product block
9. Buy Now checkout bottom sheet
10. Cart screen
11. Product shop screen
12. Profile screen
13. Basic auth
14. MongoDB + Prisma schema
15. Zustand stores
16. Seed data

---

## 27. Phase 2 Features

Add after MVP:

- Creator dashboard
- Vendor dashboard
- Product upload panel
- Post creation flow
- Story creation flow
- Saved posts
- Wishlist
- Notifications
- Follow system
- Product reviews
- Order tracking
- Coupons
- Payment gateway integration
- Admin moderation
- Analytics

---

## 28. Phase 3 Advanced Features

Future improvements:

- AI product recommendations
- Personalized feed ranking
- Live shopping events
- Short video reels
- Affiliate creator commission system
- Vendor subscription plans
- Sponsored posts
- In-app messaging
- Multi-language support
- Multi-currency support
- Push notifications
- Advanced analytics dashboard

---

## 29. Important UI Components

Build these as reusable components:

- `MobileShell`
- `BottomNav`
- `StoriesBar`
- `StoryCircle`
- `StoryViewer`
- `FeedPostCard`
- `FeedMediaCarousel`
- `PostActions`
- `FeaturedProductBlock`
- `CommentsSheet`
- `CheckoutSheet`
- `ShareSheet`
- `ProductCard`
- `ProductGrid`
- `CartItem`
- `CartSummary`
- `ProfileHeader`
- `SkeletonFeedPost`

---

## 30. Important Edge Cases

Handle these cases:

- Product is out of stock
- Post has no product
- Post has multiple images
- User is not logged in
- User tries to buy without address
- User has empty cart
- Network request fails
- Image fails to load
- Comments are empty
- Feed has no more posts
- Product was deleted but old post exists
- User opens checkout and product price changes
- User refreshes page while bottom sheet is open
- User uses browser back button with sheet open

---

## 31. Mobile Interaction Requirements

The app must feel natural on phone.

Required interactions:

- Tap to like
- Double tap media to like optional
- Swipe media carousel
- Swipe story viewer
- Pull to refresh feed
- Infinite scroll
- Drag bottom sheets
- Tap outside sheet to close
- Long press share/copy optional
- Browser back closes open sheet first

---

## 32. Security Requirements

- Hash passwords
- Validate all API inputs
- Protect private routes
- Check ownership before editing/deleting
- Rate-limit comments and likes
- Sanitize user-generated content
- Prevent duplicate likes
- Prevent invalid cart quantities
- Verify product price on server during order creation
- Do not trust client-side totals

---

## 33. Database Indexing Requirements

Add indexes for:

- Post created date
- Post creator ID
- Product vendor ID
- Product category ID
- Product slug
- Comment post ID
- Like post ID and user ID
- Order user ID
- Order status

Purpose:

- Faster feed loading
- Faster product search
- Faster comments loading
- Faster order filtering

---

## 34. Testing Requirements

Test these flows:

- User opens home feed
- User scrolls feed
- User likes a post
- User opens comments
- User adds comment
- User opens share sheet
- User copies share text
- User opens checkout sheet
- User adds product to cart
- User proceeds to checkout
- User creates order
- User views cart
- User views profile

Recommended testing tools:

- Playwright for end-to-end tests
- Vitest for utility tests
- React Testing Library for components

---

## 35. Acceptance Criteria

The project will be considered successful when:

- App works smoothly on mobile browser
- Home feed visually matches social-commerce style
- Bottom navigation works
- Stories row is visible and interactive
- Posts display image, username, caption, likes, comments, share, and product
- Comments open in a bottom sheet
- Checkout opens in a bottom sheet
- Share opens in a bottom sheet
- Products can be added to cart
- Cart total is calculated correctly
- Prisma models work with MongoDB
- Zustand stores manage UI and cart state
- App has seed data for demo
- UI feels polished and mobile-native

---

## 36. Development Priority Order

Recommended build order:

1. Setup Next.js project
2. Setup Tailwind CSS
3. Setup Prisma with MongoDB
4. Create database schema
5. Create seed data
6. Build mobile shell layout
7. Build bottom navigation
8. Build home feed UI with static data
9. Connect feed to database
10. Build post card interactions
11. Build comments bottom sheet
12. Build checkout bottom sheet
13. Build share bottom sheet
14. Build shop screen
15. Build cart store and cart screen
16. Build auth
17. Build product detail page
18. Add order creation
19. Add loading and empty states
20. Polish animations and performance

---

## 37. Final Notes

This app should be treated as a **mobile social shopping platform**, not a normal ecommerce website.

The design priority is:

1. Feed-first browsing
2. Fast social interaction
3. Product discovery inside content
4. One-tap buying intent
5. Smooth mobile bottom sheets
6. Clean and addictive user experience

The final experience should feel like a social media app where every post can become a shopping opportunity.
