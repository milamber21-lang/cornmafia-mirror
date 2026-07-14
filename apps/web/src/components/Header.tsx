//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/Header.tsx                                                                     ////
//// Language: TSX                                                                                                ////
//// Header with logo and login menu using current admin-access guard                                             ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { JSX } from "react";
import Image from "next/image";
import Link from "next/link";

import LoginClient from "@/components/login/LoginClient";
import { getAuthSession } from "@/lib/auth/auth";
import { requireAdminOrEditor } from "@/lib/auth/authz";

export default async function Header(): Promise<JSX.Element> {
	const session = await getAuthSession();
	const signedIn = Boolean(session?.user);
	const canAccessAdmin = signedIn
		? (await requireAdminOrEditor()).allowed
		: false;

	return (
		<>
			<Link href="/" className="brand">
				<Image
					src="/logos/mafia_logo.png"
					alt="Corn Mafia logo"
					width={68}
					height={68}
					priority
					className="header-logo-image"
				/>
				<Image
					src="/logos/mafia_banner_header_transparent.png"
					alt="Corn Mafia"
					width={340}
					height={68}
					priority
					className="header-wordmark-image"
				/>
			</Link>

			{!signedIn ? (
				<div className="header-right">
					<LoginClient session={session} />
				</div>
			) : (
				<div className="header-avatar">
					<LoginClient session={session} canAccessAdmin={canAccessAdmin} />
				</div>
			)}
		</>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
