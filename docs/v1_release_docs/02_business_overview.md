<!-- FILE: docs/production-readiness/02_business_overview.md -->

# Corn Mafia Web: Simple Business Overview

## What This Website Is

Corn Mafia Web is a guild website connected to Discord.

The website is designed to show the right content to the right people:

- Visitors can see public information.
- Logged-in non-members can have an account session, but should not automatically receive member access.
- Logged-in members can see member content.
- People with specific Discord roles can see role-gated content.
- Admins can manage the website from the admin area.

Discord is the main identity system. Users do not create a separate website password. They log in with Discord.

## Core Idea

The website answers three simple questions:

```text
Who is this person?
What Discord roles do they have?
What are they allowed to see or manage?
```

Once those questions are answered, the website decides what content, menus, and admin tools should be visible.

## The Main Pieces

### 1. Discord Login

Discord login proves who the person is.

Simple flow:

```text
User clicks Login
User approves Discord login
Website knows which Discord user they are
Website checks what they are allowed to access
```

Important: login and membership are not the same thing. A person may be logged in with Discord but still not be a guild member or still not have the required roles for restricted content.

### 2. Discord Roles

Discord roles are used as access signals.

| Discord Role | Website Meaning |
|---|---|
| Member | Can see normal member content |
| Officer | Can see officer-only content |
| Editor | Can manage selected content |
| Admin | Can manage the website |

The exact meaning depends on how admins configure the roles.

### 3. Website Content

Content means the actual pages users can open.

Examples:

- guides
- tutorials
- tools
- announcements
- map pages
- event pages
- custom pages

Content can be public, logged-in only, member-only, or restricted by role.

### 4. Navigation

Navigation controls what appears in the website menu.

Navigation and content are connected, but they are not the same thing.

```text
Content = the page exists
Navigation = the page appears in a menu
Access = the user is allowed to see it
```

A content page may exist, but it only appears in a menu if it is added to a navigation panel and the user is allowed to see it.

## Admins Control The Website

Admins can manage:

- Discord role access
- users
- categories
- subcategories
- content
- media
- templates
- navigation menus
- visual options like icons and colors

The purpose of the admin area is to let trusted users manage the website without editing code.

## Regular Users Experience The Website

Regular users should not need to understand the admin system.

They should only experience:

```text
I log in with Discord.
I see the content I am allowed to see.
The menu shows useful links.
Pages open normally.
Restricted content is hidden or clearly blocked.
```

## What Production Ready For Test Users Means

Production ready for test users does not mean perfect.

It means:

- Login works.
- Non-members can log in without receiving member access by mistake.
- Admins can manage real content.
- Regular users can browse safely.
- Restricted content is not exposed by mistake.
- Errors are understandable.
- Testers can report issues clearly.
- Nothing critical is known to be broken.

## What Should Be Treated Carefully

| Area | Why It Matters |
|---|---|
| Discord access roles | Can change who sees protected content |
| Navigation panels | Can change what users can find |
| Content visibility | Can expose or hide pages |
| Templates | Can affect how structured content behaves |
| Media | Can affect pages that use uploaded files |

## Simple Summary

Corn Mafia Web is a Discord-connected guild website.

Discord tells the website who the user is. The website uses roles and settings to decide:

- what the user can see
- what the user can manage
- which content appears in menus
- which pages are public, member-only, or restricted
