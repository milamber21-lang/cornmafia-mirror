<!-- FILE: docs/production-readiness/01_test_checklist.md -->

# Corn Mafia Web Test Checklist

## Purpose

This checklist is for production-readiness testing before the website is shown more broadly to test users.

Testers should behave as:

- Admin users
- Regular logged-in members
- Logged-in non-members
- Visitors who are not logged in

The goal is to find broken pages, confusing behavior, permission mistakes, wording issues, and anything that feels unsafe before wider release.

## How To Test

| Result | Meaning |
| --- | --- |
| Pass | Works as expected |
| Fail | Broken or clearly wrong |
| Confusing | Works, but the tester does not understand it |
| Not Tested | Tester could not test this part |

For every issue, include what you clicked, what you expected, what happened instead, screenshot or screen recording, browser, device, and account type.

## 1. Visitor / Logged-Out Testing

| Test | Expected result | Result | Notes |
| --- | --- | --- | --- |
| Open homepage while logged out | Page loads without error |  |  |
| Open main navigation | Public menu is visible and readable |  |  |
| Click public content | Public content opens |  |  |
| Click member-only content | User is asked to log in or denied clearly |  |  |
| Click role-gated content | Content is hidden or access is denied clearly |  |  |
| Open admin URL manually | User cannot access admin area |  |  |
| Use website on mobile size | Navigation and content remain usable |  |  |

## 2. Non-Member Logged-In Testing

| Test | Expected result | Result | Notes |
| --- | --- | --- | --- |
| Log in with Discord using a non-member account | Login succeeds if Discord identity is valid |  |  |
| Open profile page | Profile loads and does not claim member roles incorrectly |  |  |
| Open public content | Public content opens |  |  |
| Open member-only content | Access is denied clearly |  |  |
| Open role-gated content | Access is denied clearly |  |  |
| Open admin URL manually | Access is denied |  |  |
| Log out | User is logged out cleanly |  |  |

## 3. Regular Member Testing

| Test | Expected result | Result | Notes |
| --- | --- | --- | --- |
| Log in with normal member account | Login succeeds |  |  |
| Open profile page | Profile loads with expected Discord identity |  |  |
| Open public content | Public content opens |  |  |
| Open member-only content | Content opens when member access is allowed |  |  |
| Open role-gated content without required role | Access is denied clearly |  |  |
| Open role-gated content with required role | Content opens |  |  |
| Refresh after login | User remains logged in |  |  |
| Open admin URL manually | Access is denied |  |  |

## 4. Admin Login And Admin Access

| Test | Expected result | Result | Notes |
| --- | --- | --- | --- |
| Log in with admin account | Login succeeds |  |  |
| Open admin dashboard | Admin area loads |  |  |
| Open each admin section | Section loads or shows a clear empty state |  |  |
| Refresh admin page | Admin remains signed in and authorized |  |  |
| Open public website while admin | Normal public/member surface still behaves normally |  |  |
| Log out from admin account | Logout works |  |  |

## 5. Discord Admin - Roles

| Test | Expected result | Result | Notes |
| --- | --- | --- | --- |
| Open Discord Roles page | Role list loads |  |  |
| Search for a role | Relevant roles appear |  |  |
| Check role color/name display | Displayed role data looks correct |  |  |
| Mark role as website access role | Save succeeds |  |  |
| Remove access behavior from role | Save succeeds and access is removed |  |  |
| Test changed role with regular user | User access changes as expected |  |  |

## 6. Discord Admin - Users

| Test | Expected result | Result | Notes |
| --- | --- | --- | --- |
| Open Discord Users page | User list loads |  |  |
| Search for a user | Expected user appears |  |  |
| Open user details if available | Discord identity and roles are visible |  |  |
| Check admin user roles | Expected admin roles are present |  |  |
| Check regular user roles | Expected member roles are present |  |  |
| Check non-member account | No false member/admin roles are shown |  |  |

## 7. Web Setup - Categories And Subcategories

| Test | Expected result | Result | Notes |
| --- | --- | --- | --- |
| Create category | Category saves |  |  |
| Edit category | Changes save |  |  |
| Create subcategory | Subcategory saves under correct category |  |  |
| Edit subcategory | Changes save |  |  |
| Disable/delete unused item where allowed | Action is confirmed and safe |  |  |
| Open public side after changes | Structure still works |  |  |

## 8. Content Management

| Test | Expected result | Result | Notes |
| --- | --- | --- | --- |
| Create content page | Page saves |  |  |
| Edit title and slug | Page still opens at expected URL |  |  |
| Attach category/subcategory | Content appears in correct structure |  |  |
| Change visibility/access | Public/member/role behavior updates |  |  |
| Open content from public side | Page renders correctly |  |  |
| Test wrong route/prefix if applicable | Wrong route does not show content incorrectly |  |  |

## 9. Media

| Test | Expected result | Result | Notes |
| --- | --- | --- | --- |
| Upload media | Upload succeeds |  |  |
| Preview media | Preview displays |  |  |
| Use media in content | Media appears correctly |  |  |
| Search or filter media if available | Results are usable |  |  |
| Delete unused media | Delete is confirmed and safe |  |  |
| Open content after media changes | No broken media appears unexpectedly |  |  |

## 10. Templates And Series

| Test | Expected result | Result | Notes |
| --- | --- | --- | --- |
| Open templates area | Template list loads |  |  |
| Create or edit template | Template saves |  |  |
| Create or edit template field | Field saves and appears correctly |  |  |
| Create or edit field option | Option saves and appears correctly |  |  |
| Use template in content if available | Fields behave as expected |  |  |
| Create or edit series | Series saves and content order is understandable |  |  |

## 11. Navigation

| Test | Expected result | Result | Notes |
| --- | --- | --- | --- |
| Open Navigation Panels | Panel list loads |  |  |
| Create or edit navigation panel | Save succeeds |  |  |
| Open navigation designer | Designer loads current tree |  |  |
| Add category to navigation | Category appears in menu |  |  |
| Add content link to navigation | Link opens correct page |  |  |
| Save navigation tree | Public menu updates |  |  |
| Test menu while logged out | Only public items appear |  |  |
| Test menu as non-member logged in | No member-only items appear unless allowed |  |  |
| Test menu as regular member | Member-allowed items appear |  |  |
| Test menu as admin | Admin can verify public/member menu behavior |  |  |

## 12. Error And Edge Case Testing

| Test | Expected result | Result | Notes |
| --- | --- | --- | --- |
| Submit required form with missing fields | Clear field errors appear |  |  |
| Try to save invalid slug/name | Clear error appears |  |  |
| Cancel create/edit panel | No accidental save happens |  |  |
| Delete item and cancel confirmation | Item remains unchanged |  |  |
| Reload during admin workflow | Page recovers safely |  |  |
| Use two browsers/accounts | Access differences are correct |  |  |

## Final Sign-Off

| Area | Ready? | Notes |
| --- | --- | --- |
| Visitor experience |  |  |
| Non-member login behavior |  |  |
| Regular member experience |  |  |
| Admin experience |  |  |
| Discord login and role behavior |  |  |
| Content management |  |  |
| Navigation |  |  |
| Mobile usability |  |  |
| Error handling |  |  |

## Tester Details

- Tester name:
- Date:
- Browser/device:
- Account type tested:

## Overall Decision

- Ready for test users
- Needs fixes before test users
- Blocked
