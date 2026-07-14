<!-- FILE: docs/auth_access_model.md -->
<!-- WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE -->

# Auth And Access Freshness Model

## Purpose

This document defines the boring, fail-closed auth/access model for Discord-backed identity and role-aware public/member/admin rendering.

Use it with:

- `docs/project_definition.md`
- `docs/codebase_rules.md`
- `docs/style_system.md`

---

## 1. Login-time rule

Discord login must not create a usable session until the app has successfully synced the user's Discord guild/member/role state into the database.

Required flow:

```text
Discord OAuth callback
	-> NextAuth signIn callback
	-> fetch Discord guild member and guild roles
	-> write/replace local DB role cache through web_api auth sync
	-> return false if sync fails
	-> allow session only after sync succeeds
```

The `signIn` callback is the door. The `jwt` callback shapes the session token after the door has allowed the user in.

Do not move required login role sync into background events or client-side profile calls.

---

## 2. Role cache freshness rule

The DB role cache is the app-facing source for access decisions, but Discord remains the source for guild role truth.

When a server-rendered surface uses actor-sensitive access, it must use a helper that:

```text
reads the current session
resolves DB access for the session Discord ID
checks whether role refresh is due
runs Discord role verification when due
resolves DB access again after a successful refresh
returns no elevated actor if refresh fails or remains due
```

This prevents the old bug where the menu/content rendered before the role cache caught up.

---

## 3. Public navigation and content rule

Public navigation, footer navigation, public content routes, public series routes, and media serving routes may render for anonymous users.

When a signed-in actor is present, those surfaces should use a fresh actor helper before calling DB access/read functions.

If role verification is due and cannot be completed, public surfaces should render as public/anonymous rather than granting stale gated access.

---

## 4. Admin and member rule

Admin and member APIs must guard themselves.

Admin/editor guards must deny elevated access while role refresh remains due.

Member-owned routes may use the same fresh actor helper when they only need the current actor Discord ID. If the helper cannot verify a stale actor, the route should treat the request as unauthenticated instead of trusting stale elevated access.

---

## 5. What not to do

Do not rely on:

```text
client-side role refresh before first server render
NextAuth signIn events for required login sync
hidden buttons for security
stale role cache when a refresh is due
```

Security-sensitive auth code should remain explicit, boring, and fail-closed.

<!-- WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE -->
