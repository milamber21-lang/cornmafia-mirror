//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/auth/[...nextauth]/route.ts                                                    ////
//// Language: TS                                                                                               ////
//// NextAuth route handler using the project Discord auth options.                                             ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import NextAuth from "next-auth";
import { buildAuthOptions } from "@/lib/auth/auth";

const handler = NextAuth(buildAuthOptions());

export { handler as GET, handler as POST };

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
