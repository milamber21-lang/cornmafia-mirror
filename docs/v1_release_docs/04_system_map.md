<!-- FILE: docs/production-readiness/04_system_map.md -->

# Corn Mafia Web System Map

## Purpose

This document shows how the main parts of the website connect.

It is meant to give non-technical users a simple mental model of the system.

## 1. User Access Flow

```mermaid
flowchart TD
    A[User opens website] --> B{Logged in with Discord?}
    B -->|No| C[Visitor experience]
    B -->|Yes| D[Discord identity known]
    D --> E[Website checks Discord roles]
    E --> F[Website calculates access]
    F --> G[Public content]
    F --> H[Member content]
    F --> I[Role-gated content]
    F --> J[Admin tools if allowed]
    C --> G
```

Simple explanation: the website first checks whether the user is logged in. If not logged in, the user is treated as a visitor. If logged in, the website knows the user's Discord identity and can check their roles. Those roles help decide what the user can see or manage.

## 2. Content And Navigation Flow

```mermaid
flowchart TD
    A[Theme Colors] --> F[Website Appearance]
    B[Icons] --> F
    C[Categories] --> D[Subcategories]
    D --> E[Content Pages]
    G[Media] --> E
    H[Templates] --> E
    I[Series] --> E
    E --> J[Navigation Designer]
    J --> K[Navigation Panels]
    K --> L[Public Website Menu]
    L --> M[User opens page]
```

Simple explanation: categories and subcategories organize the website. Content pages are the actual pages people open. Media, templates, and series help shape content. Navigation panels decide which content appears in menus.

## 3. Admin Management Map

```mermaid
flowchart LR
    A[Admin Area] --> B[Discord]
    A --> C[Web Setup]
    A --> D[Content Management]
    A --> E[Navigation]
    B --> B1[Roles]
    B --> B2[Users]
    C --> C1[Theme Colors]
    C --> C2[Icons]
    C --> C3[Categories]
    C --> C4[Subcategories]
    C --> C5[Content Kinds]
    D --> D1[Content]
    D --> D2[Media]
    D --> D3[Series]
    D --> D4[Templates]
    E --> E1[Navigation Panels]
    E --> E2[Navigation Designer]
```

Simple explanation: Discord controls identity and roles. Web setup controls reusable structure. Content management controls pages and files. Navigation controls what appears in menus.

## 4. Regular User Experience Map

```mermaid
flowchart TD
    A[Regular user opens website] --> B[Uses navigation]
    B --> C[Opens content]
    C --> D{Is content public?}
    D -->|Yes| E[Show content]
    D -->|No| F{Is user logged in?}
    F -->|No| G[Ask user to log in]
    F -->|Yes| H{Does user have access?}
    H -->|Yes| E
    H -->|No| I[Show clear denied message]
```

Simple explanation: regular users use the menu, open pages, and see only what they are allowed to see.

## 5. How Everything Ties Together

```text
Discord
  controls identity and roles

Roles
  control access

Access
  controls what users can see or manage

Categories and Subcategories
  organize content

Content
  creates the actual pages

Media
  supports content with files and images

Templates
  help structure repeated content

Navigation Panels
  decide what appears in menus

Public Website
  shows the final result to visitors and members
```

## 6. Most Important Rule

Content and navigation are connected, but they are not the same.

```text
Content = the page exists
Navigation = the page appears in a menu
Access = the user is allowed to see it
```

A page should only feel complete when all three are correct:

```text
The content exists.
The navigation points to it.
The right users can access it.
```
