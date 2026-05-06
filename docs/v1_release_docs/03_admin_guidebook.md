<!-- FILE: docs/production-readiness/03_admin_guidebook.md -->

# Corn Mafia Web Admin Guidebook

## Purpose

This guide explains what each admin area does in simple terms.

It is written for admins, moderators, and business-side users. It does not require programming knowledge.

## Admin Area Overview

The admin area is where trusted users manage the website.

Admins can manage:

- Discord roles and users
- website structure
- content
- media
- templates
- navigation menus
- visibility and access rules

## 1. Discord

### Discord Roles

Discord Roles shows roles imported from Discord.

Use this area to decide which Discord roles matter for website access.

What you can usually change:

- whether a role is used for website access
- whether a role grants admin-like behavior
- whether a role grants editor-like behavior
- role display or access settings

Be careful: changing role access can immediately affect what people can see or manage.

Before changing role access, ask:

```text
Should this role unlock private content?
Should this role allow admin or editor behavior?
Could this expose something to the wrong people?
```

### Discord Users

Discord Users shows people who logged into the website or were synced from Discord.

Use this area to check:

- who the user is
- what Discord roles they have
- whether their access looks correct

This area should usually be treated as a review area. Discord itself is the source of truth for user identity and Discord roles.

## 2. Web Setup

### Theme Colors

Theme Colors are reusable colors used by the website.

Use them when content, icons, or visual settings need a consistent color.

Usually safe to change, but changing important colors can affect the look of the whole website.

### Icons

Icons are reusable visual symbols.

Use icons to make navigation and content easier to understand.

Examples:

- map icon
- guide icon
- tool icon
- event icon

### Categories

Categories are the main website sections.

Examples:

```text
Guides
Tools
Maps
Events
News
```

A category is a broad group.

### Subcategories

Subcategories sit inside categories.

Example:

```text
Category: Guides
Subcategory: Beginner Guides
Subcategory: Advanced Guides
```

Use subcategories to keep content organized.

### Content Kinds

Content Kinds describe what type of content something is.

| Content Kind | Meaning |
|---|---|
| Normal page | Standard website page |
| Map page | Page related to maps |
| Tool page | Page related to a tool |
| Event page | Page related to events |
| Custom page | Special page type |

This helps the website decide how to open or render the content.

## 3. Content Management

### Content

Content is the actual page or item users open.

A content item usually has:

- title
- slug or URL name
- category
- subcategory
- content kind
- visibility or access settings
- body or structured fields
- media attachments

You can usually change:

- title
- page text
- category
- subcategory
- access level
- published status
- attached media

Be careful: changing the URL name may affect links. Changing access may expose private content or hide public content.

### Media

Media contains uploaded files used by the website.

Examples:

- images
- thumbnails
- banners
- documents
- other files

Safe habit: before deleting media, check whether it is used by content.

### Series

Series groups related content together.

Example:

```text
Series: Beginner Training
Part 1: Getting Started
Part 2: Basic Tools
Part 3: First Mission
```

Use series when content should be consumed in order.

## 4. Templates

Templates help create structured content.

A template defines what fields a content item should have.

Example:

```text
Template: Tool Page
Fields:
- Tool Name
- Description
- Download Link
- Difficulty
```

Templates are useful when many content pages should follow the same structure.

Be careful: changing a template can affect future content creation and may affect existing content depending on how the system uses it.

## 5. Navigation

### Navigation Panels

A navigation panel is a saved menu structure.

Examples:

- main website menu
- footer menu
- mobile menu
- special page menu

Navigation panels decide what users can click from menus.

### Navigation Designer

The navigation designer is where admins build the menu tree.

You can add:

- categories
- subcategories
- content links
- custom branches

Example structure:

```text
Main Menu
  Guides
    Beginner Guides
      How To Start
```

Important: navigation does not create content. Navigation only links to content that already exists.

## 6. Access And Visibility

The website has different visibility levels.

| Visibility | Meaning |
|---|---|
| Public | Anyone can see it |
| Logged-in only | User must log in with Discord |
| Member-only | User must be treated as a member |
| Role-gated | User must have a required Discord role |
| Admin/editor | User must have management access |

## 7. Safe Admin Habits

### Before Publishing Content

Check:

- title is clear
- page opens correctly
- category is correct
- navigation link works
- visibility is correct
- media displays correctly

### Before Changing Access

Check:

- who should see this
- who should not see this
- whether Discord roles are configured correctly
- whether a regular test user behaves correctly
- whether a non-member logged-in account is still denied correctly

### Before Changing Navigation

Check:

- menu still makes sense
- public users do not see private links
- member users see the right links
- links open the correct pages

### Before Deleting Anything

Ask:

```text
Is this used somewhere else?
Can this break an existing page?
Can this be disabled instead of deleted?
```

## 8. Simple Admin Workflow

A normal content workflow looks like this:

```text
Create or choose Category
Create or choose Subcategory
Create Content
Attach Media if needed
Set Visibility
Add Content to Navigation
Test as Admin
Test as Regular User
Test as Non-Member Logged In
Test while Logged Out
Publish
```
