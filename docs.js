const date_today = new Date();
const date_future = new Date();

date_future.setFullYear(2025, 1, 1);
date_today.setHours(0, 0, 0, 0);
date_future.setHours(0, 0, 0, 0);

module.exports = {
	swagger: '2.0',
	info: {
		title: "PUML - NFT",
		version: "1.16",
		description: '',
	},
	securityDefinitions: {
		Bearer: {
			type: "apiKey",
			name: "Authorization",
			in: "header",
			description: "The value should be: `Bearer: ACCESS_TOKEN`",
			default: "Bearer "
		}
	},
	tags: [
		{name: "Auth"},
		{name: "Tokens"},
		{name: "Offers"},
		{name: "Collections"},
		{name: "Categories"},
		{name: "Users"},
		{name: "Activities"},
		{name: "Search"}
	],
	paths: {
		"/api/auth/signin": {
			post: {
				tags: [ "Auth" ],
				summary: "Sign In user",
				description: "Method for authorizing an already existing user",
				consumes: [ "application/json" ],
				deprecated: true,
				parameters: [
					{
						in: "body",
						name: "body",
						required: true,
						schema: {
							type: "object",
							properties: {
								email: {type: "string", required: true},
								password: {type: "string", required: true},
							}
						}
					}
				],
				responses: {
					200: {description: "Success. Gives out user `token`"},
					422: {description: "Failed! Not all fields has filled"},
					404: {description: "Failed! User is not found"},
					500: {description: "Failed! Unexpected server error"}
				}
			}
		},

		"/api/auth/signup": {
			post: {
				tags: [ "Auth" ],
				summary: "Sign Up user",
				description: "Method for creating a new user",
				consumes: [ "application/json" ],
				deprecated: true,
				parameters: [
					{
						in: "body",
						name: "body",
						required: true,
						schema: {
							type: "object",
							properties: {
								name: {type: "string", required: true},
								email: {type: "string", required: true},
								password: {type: "string", required: true},
							}
						}
					}
				],
				responses: {
					200: {description: "Success. Gives out user `token`"},
					422: {description: "Failed! Not all fields has filled"},
					404: {description: "Failed! User already exist"},
					500: {description: "Failed! Unexpected server error"}
				}
			}
		},

		"/api/auth/wallet": {
			post: {
				tags: [ "Auth" ],
				summary: "Authorize user by wallet",
				description: "Method for authorization user",
				consumes: [ "application/json" ],
				parameters: [
					{
						in: "body",
						name: "body",
						required: true,
						schema: {
							type: "object",
							properties: {
								wallet: {type: "string", required: true}
							}
						}
					}
				],
				responses: {
					200: {description: "Success. Gives out user `token`"},
					422: {description: "Failed! Not all fields has filled"},
					404: {description: "Failed! User already exist"},
					500: {description: "Failed! Unexpected server error"}
				}
			}
		},

		"/api/tokens": {
			get: {
				tags: [ "Tokens" ],
				summary: "Get all tokens",
				description: "Method for getting all tokens from DB",
 				responses: {
					200: {description: "Success. Gives out all `tokens`"},
					500: {description: "Failed! Unexpected server error"}
				}
			},

			post: {
				tags: [ "Tokens" ],
				summary: "Create new token",
				description: "Method for creating a new token",
				consumes: [ "multipart/form-data" ],
				security: [{Bearer: []}],
				parameters: [{
					in: "formData",
					name: "name",
					type: "string",
					description: "Token name"
				},{
					in: "formData",
					name: "description",
					type: "string",
					description: "Token description"
				},{
					in: "formData",
					name: "collection",
					required: false,
					type: "string",
					description: "Collection ID (not required)"
				},{
					in: "formData",
					name: "categories",
					type: "string",
					default: "art|music|games",
					description: "Array of categories"
				},{
					in: "formData",
					name: "royalties",
					type: "number",
					description: "Royalties percent for token"
				},{
					in: "formData",
					name: "locked",
					type: "string",
					required: false,
					description: "Locked content (if needed)"
				},{
					in: "formData",
					name: "offchain",
					type: "boolean",
					description: "Create NFT off-chain"
				},{
					in: "formData",
					name: "media",
					type: "file",
					description: "Media file for token"
				},{
					in: "formData",
					name: "thumbnail",
					type: "file",
					description: "Thumbnail image for token"
				},{
					in: "formData",
					name: "blockchain",
					type: "string",
					description: "Blockchain",
					enum: ["ETH", "MATIC" ]
				}],
				responses: {
					200: {description: "Success. Gives out new `token`, `offer` and `link` to JSON"},
					401: {description: "Failed! User not authorized or bad token"},
					422: {description: "Failed! Not all fields has filled"},
					// 404: {description: "Failed! User already exist"},
					500: {description: "Failed! Unexpected server error"}
				}
			}
		},

		"/api/tokens/my": {
			get: {
				tags: [ "Tokens" ],
				summary: "Get current user tokens",
				description: "Method for getting all current user tokens from DB",
				security: [{Bearer: []}],
 				responses: {
					200: {description: "Success. Gives out all `tokens`"},
					401: {description: "Failed! User not authorized or bad token"},
					500: {description: "Failed! Unexpected server error"}
				}
			}
		},

		"/api/tokens/{token_id}": {
			get: {
				tags: [ "Tokens" ],
				summary: "Get token by ID",
				description: "Method for getting full token info",
				responses: {
					200: {description: "Success. Gives out all `token` info"},
					404: {description: "Failed! Token is not exist"},
					500: {description: "Failed! Unexpected server error"}
				},
				parameters: [{
					name: "token_id",
					in: "path",
					type: "string",
					required: true
				}]
			},
			delete: {
				tags: [ "Tokens" ],
				summary: "Delete token by ID",
				description: "Method for deleting one token by ID",
				responses: {
					200: {description: "Success."},
					403: {description: "Failed! Forbidden"},
					404: {description: "Failed! Token is not exist"},
					500: {description: "Failed! Unexpected server error"}
				},
				parameters: [{
					name: "token_id",
					in: "path",
					type: "string",
					required: true
				}]
			}
		},

		"/api/tokens/{token_id}.json": {
			get: {
				tags: [ "Tokens" ],
				summary: "Get token JSON by ID",
				description: "Method for getting small token info",
				responses: {
					200: {description: "Success. Gives out all `token` info"},
					404: {description: "Failed! Token is not exist"},
					500: {description: "Failed! Unexpected server error"}
				},
				parameters: [{
					name: "token_id",
					in: "path",
					type: "string",
					required: true
				}]
			}
		},

		"/api/tokens/{token_id}/chain": {
			post: {
				tags: [ "Tokens" ],
				summary: "Set chain_id for token",
				description: "Set blockchain id for one token by ID",
				consumes: [ "application/json" ],
				security: [{Bearer: []}],
				parameters: [
					{
						in: "body",
						name: "body",
						required: true,
						schema: {
							type: "object",
							properties: {
								chain_id: {type: "number", required: true},
							}
						}
					},
					{
						name: "token_id",
						in: "path",
						type: "string",
						required: true
					}
				],
				responses: {
					200: {description: "Success"},
					403: {description: "Failed! Forbidden for this user"},
					404: {description: "Failed! User is not found"},
					422: {description: "Failed! Not all fields has filled"},
					500: {description: "Failed! Unexpected server error"}
				}
			}
		},

		"/api/tokens/{token_id}/like": {
			get: {
				tags: [ "Tokens" ],
				summary: "Like token",
				description: "Method for like token",
 				responses: {
					200: {description: "Success."},
					404: {description: "Failed! Token not found"},
					422: {description: "Failed! Bad data"},
					500: {description: "Failed! Unexpected server error"}
				},
				parameters: [{
					name: "token_id",
					in: "path",
					type: "string",
					required: true
				}], 
			}
		},

		"/api/tokens/{token_id}/unlike": {
			get: {
				tags: [ "Tokens" ],
				summary: "Unlike token",
				description: "Method for unlike token",
 				responses: {
					200: {description: "Success."},
					404: {description: "Failed! Token not found"},
					422: {description: "Failed! Bad data"},
					500: {description: "Failed! Unexpected server error"}
				},
				parameters: [{
					name: "token_id",
					in: "path",
					type: "string",
					required: true
				}], 
			}
		},

		// "/api/tokens/{token_id}/complete": {
		// 	post: {
		// 		tags: [ "Tokens" ],
		// 		summary: "Completion of the token creation",
		// 		description: "Completion of the token creation stage and start of the offer trading",
		// 		consumes: [ "application/json" ],
		// 		security: [{Bearer: []}],
		// 		parameters: [
		// 			{
		// 				name: "token_id",
		// 				in: "path",
		// 				type: "string",
		// 				required: true
		// 			}
		// 		],
		// 		responses: {
		// 			200: {description: "Success"},
		// 			403: {description: "Failed! Forbidden for this user"},
		// 			404: {description: "Failed! Not found"},
		// 			500: {description: "Failed! Unexpected server error"}
		// 		}
		// 	}
		// },

		"/api/collections": {
			get: {
				tags: [ "Collections" ],
				summary: "Get all collections",
				description: "Method for getting all collections from DB",
 				responses: {
					200: {description: "Success. Gives out array of `collections`"},
					500: {description: "Failed! Unexpected server error"}
				},
				parameters: [{
					in: "query",
					name: "type",
					type: "string",
					enum: ["hot", "featured", "sponsored" ]
				}]
			},

			post: {
				tags: [ "Collections" ],
				summary: "Create new collection",
				description: "Method for creating a new collection",
				consumes: [ "multipart/form-data" ],
				security: [{Bearer: []}],
				parameters: [{
					in: "formData",
					name: "name",
					type: "string",
					description: "Collection name"
				},{
					in: "formData",
					name: "symbol",
					type: "string",
					description: "Token symbol"
				},{
					in: "formData",
					name: "description",
					type: "string",
					description: "Collection description"
				},{
					in: "formData",
					name: "short",
					type: "string",
					description: "Short url"
				},{
					in: "formData",
					name: "image",
					type: "file",
					description: "Thumbanil image file"
				},{
					in: "formData",
					name: "cover",
					type: "file",
					description: "Cover image file"
				}],
				responses: {
					200: {description: "Success. Gives out new `collection`"},
					422: {description: "Failed! Not all fields has filled"},
					// 404: {description: "Failed! User already exist"},
					500: {description: "Failed! Unexpected server error"}
				}
			}
		},

		"/api/collections/user/my": {
			get: {
				tags: [ "Collections" ],
				summary: "Get current user collections",
				description: "Method for getting all collections created by current loggined user",
				security: [{Bearer: []}],
 				responses: {
					200: {description: "Success. Gives out array of `collections`"},
					401: {description: "Failed! User not authorized or bad token"},
					500: {description: "Failed! Unexpected server error"}
				}
			},
		},

		"/api/collections/user/{user_id}": {
			get: {
				tags: [ "Collections" ],
				summary: "Get user collections",
				description: "Method for getting all collections created by user",
 				responses: {
					200: {description: "Success. Gives out array of `collections`"},
					401: {description: "Failed! User not authorized or bad token"},
					403: {description: "Failed! Forbidden"},
					500: {description: "Failed! Unexpected server error"}
				},
				parameters: [{
					name: "user_id",
					in: "path",
					type: "string",
					required: true
				}]
			},
		},

		"/api/collections/{collection_id}": {
			get: {
				tags: [ "Collections" ],
				summary: "Get one collection info by ID",
				description: "Method for getting all tokens by collection ID",
				responses: {
					200: {description: "Success. Gives out all `tokens`"},
					404: {description: "Failed! Collection is not exist"},
					500: {description: "Failed! Unexpected server error"}
				},
				parameters: [{
					name: "collection_id",
					in: "path",
					type: "string",
					required: true
				}]
			},

			delete: {
				tags: [ "Collections" ],
				summary: "Delete one collection by ID",
				description: "Method for deleting one collection by collection ID",
				responses: {
					200: {description: "Success. Gives out all `tokens`"},
					403: {description: "Failed! Forbidden"},
					404: {description: "Failed! Collection is not exist"},
					500: {description: "Failed! Unexpected server error"}
				},
				parameters: [{
					name: "collection_id",
					in: "path",
					type: "string",
					required: true
				}]
			}
		},

		"/api/collections/{collection_id}/items/{type}": {
			get: {
				tags: [ "Collections" ],
				summary: "Get all items of collection by type",
				description: "Method for getting all items of collection<br><br>`on_sale` - is Offers. `owned` - is Tokens",
				responses: {
					200: {description: "Success. Gives out all `tokens`"},
					404: {description: "Failed! Collection is not exist"},
					500: {description: "Failed! Unexpected server error"}
				},
				parameters: [{
					name: "collection_id",
					in: "path",
					type: "string",
					required: true
				}, {
					name: "type",
					in: "path",
					type: "string",
					enum: ["on_sale", "owned"],
					required: true
				}]
			},
		},

		"/api/collections/search": {
			post: {
				tags: [ "Collections", "Search" ],
				summary: "Search collection by params",
				description: "Search all collections by parameters",
				consumes: [ "application/json" ],
				parameters: [
					{
						in: "body",
						name: "body",
						required: true,
						schema: {
							type: "object",
							properties: {
								name: {type: "string", required: false},
								description: {type: "string", required: false},
								date_from: {type: "string", format: "date-time"}
							}
						}
					}
				],
				responses: {
					200: {description: "Success. Gives out user `collections`"},
					404: {description: "Failed! User is not found"},
					422: {description: "Failed! Not all fields has filled"},
					500: {description: "Failed! Unexpected server error"}
				}
			}
		},

		"/api/categories": {
			get: {
				tags: [ "Categories" ],
				summary: "Get all categories",
				description: "Method for getting all categories from DB",
 				responses: {
					200: {description: "Success. Gives out all `categories`"},
					500: {description: "Failed! Unexpected server error"}
				}
			},

			post: {
				tags: [ "Categories" ],
				summary: "Create a new category",
				description: "Create a new category in DB. **TEMPORARY METHOD**",
				consumes: [ "application/json" ],
				parameters: [
					{
						in: "body",
						name: "body",
						required: true,
						schema: {
							type: "object",
							properties: {
								_id: {type: "string", required: true, default: "helloworld"},
								name: {type: "string", required: true, default: "Hello World"},
							}
						}
					}
				],
				responses: {
					200: {description: "Success. Gives out new `category`"},
					422: {description: "Failed! Not all fields has filled"},
					500: {description: "Failed! Unexpected server error"}
				}
			}
		},

		"/api/categories/{category_id}": {
			delete: {
				tags: [ "Categories" ],
				summary: "Delete category by ID",
				description: "Method for deleting one category by ID. **TEMPORARY METHOD**",
				responses: {
					200: {description: "Success"},
					403: {description: "Failed! Forbidden"},
					404: {description: "Failed! Category is not exist"},
					500: {description: "Failed! Unexpected server error"}
				},
				parameters: [{
					name: "category_id",
					in: "path",
					type: "string",
					required: true,
					default: "helloworld"
				}]
			}
		},

		"/api/offers": {
			post: {
				tags: [ "Offers" ],
				summary: "Create a new offer for token",
				description: "Create a new offer for token in DB.<br><br>**All fields except `token_id` are optional**",
				consumes: [ "application/json" ],
				security: [{Bearer: []}],
				parameters: [
					{
						in: "body",
						name: "body",
						required: true,
						schema: {
							type: "object",
							properties: {
								token_id: {
									type: "string", 
									required: true
								},
								offer_price: {
									type: "number", 
									required: false, 
									default: 3,
									description: "Instant Sell Price"
								},
								min_bid: {
									type: "number", 
									required: false,
									default: 0.25, 
									description: "Minimal auction price"
								},
								expiry_date: {
									type: "string", 
									required: false, 
									format: "date-time", 
									default: date_future.toISOString(),
									description: "Put up for sale"
								}
							}
						}
					}
				],
				responses: {
					200: {description: "Success. Gives out new `offer`"},
					403: {description: "Failed! Forbidden"},
					422: {description: "Failed! Bad data"},
					500: {description: "Failed! Unexpected server error"}
				}
			}
		},

		"/api/offers/explore": {
			get: {
				tags: [ "Offers" ],
				summary: "Get offers by type",
				description: "Method for getting all offers by **Explore** type",
				parameters: [{
					name: "category",
					in: "query",
					type: "string",
					description: "Specific category (if needed)"
				}, {
					name: "sort",
					in: "query",
					type: "string",
					required: false,
                 	enum : ["recent", "cheap", "costly", "liked"]
				}],
 				responses: {
					200: {description: "Success. Gives out array of `offers` with `token`"},
					500: {description: "Failed! Unexpected server error"}
				}
			},
		},

		"/api/offers/live": {
			get: {
				tags: [ "Offers" ],
				summary: "Get offers by type",
				description: "Method for getting all offers by **Live** type",
				parameters: [{
					name: "category",
					in: "query",
					type: "string",
					description: "Specific category (if needed)"
				}, {
					name: "sort",
					in: "query",
					type: "string",
					required: false,
                 	enum : ["recent", "cheap", "costly", "liked"]
				}],
 				responses: {
					200: {description: "Success. Gives out array of `offers` with `token`"},
					500: {description: "Failed! Unexpected server error"}
				}
			},
		},

		"/api/offers/new": {
			get: {
				tags: [ "Offers" ],
				summary: "Get offers by type",
				description: "Method for getting all offers by **New** type",
				parameters: [{
					name: "category",
					in: "query",
					type: "string",
					description: "Specific category (if needed)"
				}, {
					name: "sort",
					in: "query",
					type: "string",
					required: false,
                 	enum : ["recent", "cheap", "costly", "liked"]
				}],
 				responses: {
					200: {description: "Success. Gives out array of `offers` with `token`"},
					500: {description: "Failed! Unexpected server error"}
				}
			},
		},

		"/api/offers/{offer_id}": {
			get: {
				tags: [ "Offers" ],
				summary: "Get one offer info",
				description: "Method for getting info about one offer",
 				responses: {
					200: {description: "Success. Gives out one `offer`"},
					500: {description: "Failed! Unexpected server error"}
				},
				parameters: [{
					name: "offer_id",
					in: "path",
					type: "string",
					required: true
				}], 
			}
		},

		"/api/offers/{offer_id}/bid": {
			post: {
				tags: [ "Offers" ],
				summary: "Add bid to existing auction",
				description: "Method for bidding to existing auction (offer)",
 				responses: {
					200: {description: "Success."},
					404: {description: "Failed! Offer not founded"},
					422: {description: "Failed! Small bid price"},
					500: {description: "Failed! Unexpected server error"}
				},
				consumes: [ "application/json" ],
				security: [{Bearer: []}],
				parameters: [{
					name: "offer_id",
					in: "path",
					type: "string",
					required: true
				},
				{
					name: "body",
					in: "body",
					required: true,
					schema: {
						type: "object",
						properties: {
							price: {type: "number", required: true, default: 1.5},
							hash: {type: "string", required: true}
						}
					}
				}]
			},
		},

		"/api/offers/{offer_id}/buy": {
			post: {
				tags: [ "Offers" ],
				summary: "Buy token in direct sale",
				description: "Method for buying token in direct sale",
 				responses: {
					200: {description: "Success."},
					404: {description: "Failed! Offer not founded"},
					422: {description: "Failed! Small bid price"},
					500: {description: "Failed! Unexpected server error"}
				},
				consumes: [ "application/json" ],
				security: [{Bearer: []}],
				parameters: [{
					name: "offer_id",
					in: "path",
					type: "string",
					required: true
				},
				{
					name: "body",
					in: "body",
					required: true,
					schema: {
						type: "object",
						properties: {
							price: {type: "number", required: true, default: 1.5},
							hash: {type: "string", required: true}
						}
					}
				}]
			},
		},

		"/api/offers/search": {
			post: {
				tags: [ "Offers", "Search" ],
				summary: "Search offer by params",
				description: "Search all offers (auctions, direct, both) by parameters<br>**All fields is not required!**",
				consumes: [ "application/json" ],
				parameters: [
					{
						in: "body",
						name: "body",
						required: true,
						schema: {
							type: "object",
							properties: {
								name: {type: "string", required: false},
								date_start: {type: "string", default: date_today.toISOString(), format: "date-time"},
								date_end: {type: "string", default: date_future.toISOString(), format: "date-time"},
								price_min: {type: "number", default: 1},
								price_max: {type: "number", default: 5},
								verified: {type: "boolean", default: false},
								categories: {type: "array", default: ["art", "games"]},
								sort: {type: "string", default: "costly OR cheap OR recent OR liked"}
							}
						}
					}
				],
				responses: {
					200: {description: "Success. Gives out all `offers`"},
					422: {description: "Failed! Not all fields has filled"},
					500: {description: "Failed! Unexpected server error"}
				}
			}
		},

		"/api/users/{id_or_wallet}": {
			get: {
				tags: [ "Users" ],
				summary: "Get one user info",
				description: "Method for getting info about one user",
 				responses: {
					200: {description: "Success. Gives out `user` and `stats`"},
					500: {description: "Failed! Unexpected server error"}
				},
				parameters: [{
					name: "id_or_wallet",
					in: "path",
					type: "string",
					required: true
				}], 
			}
		},
		
		"/api/users/{id_or_wallet}/items/{type}": {
			get: {
				tags: [ "Users" ],
				summary: "Get user items by type",
				description: "Method for getting all user items by type",
 				responses: {
					200: {description: "Success. Gives out `items`"},
					422: {description: "Failed! Bad data"},
					500: {description: "Failed! Unexpected server error"}
				},
				parameters: [{
					name: "id_or_wallet",
					in: "path",
					type: "string",
					required: true
				}, {
					name: "type",
					in: "path",
					type: "string",
					required: true,
					enum: ["on_sale", "collectibles", "expiring", "created", "liked", "activity", "following", "followers", "royalties"]
				}], 
			}
		},

		"/api/users/{user_id}/follow": {
			get: {
				tags: [ "Users" ],
				summary: "Follow user",
				description: "Method for follow user",
 				responses: {
					200: {description: "Success."},
					404: {description: "Failed! User not found"},
					422: {description: "Failed! Bad data"},
					500: {description: "Failed! Unexpected server error"}
				},
				parameters: [{
					name: "user_id",
					in: "path",
					type: "string",
					required: true
				}], 
			}
		},

		"/api/users/{user_id}/unfollow": {
			get: {
				tags: [ "Users" ],
				summary: "Unfollow user",
				description: "Method for unfollow user",
 				responses: {
					200: {description: "Success."},
					404: {description: "Failed! User not found"},
					422: {description: "Failed! Bad data"},
					500: {description: "Failed! Unexpected server error"}
				},
				parameters: [{
					name: "user_id",
					in: "path",
					type: "string",
					required: true
				}], 
			}
		},

		"/api/users/settings": {
			get: {
				tags: [ "Users" ],
				summary: "Get current user settings",
				description: "Method for getting current user info (all settings)",
				security: [{Bearer: []}],
 				responses: {
					200: {description: "Success. Gives out `user` and `stats`"},
					404: {description: "Failed! User not found"},
					500: {description: "Failed! Unexpected server error"}
				},
			},

			post: {
				tags: [ "Users" ],
				summary: "Update current user settings",
				description: "Method for updating current user settings (info)<br><br>`All fields is not required!`",
				consumes: [ "multipart/form-data" ],
				security: [{Bearer: []}],
				parameters: [{
					in: "formData",
					name: "name",
					type: "string",
					description: "User name"
				},{
					in: "formData",
					name: "email",
					type: "string",
					format: "email",
					description: "User email"
				},{
					in: "formData",
					name: "bio",
					type: "string",
					description: "User biography"
				},{
					in: "formData",
					name: "twitter",
					type: "string",
					description: "User twitter account"
				},{
					in: "formData",
					name: "instagram",
					type: "string",
					description: "User instagram account"
				},{
					in: "formData",
					name: "avatar",
					type: "file",
					description: "Avatar image file"
				}],
				responses: {
					200: {description: "Success."},
					422: {description: "Failed! Not all fields has filled"},
					500: {description: "Failed! Unexpected server error"}
				}
			}
		},

		"/api/users/verify": {
			get: {
				tags: [ "Users" ],
				summary: "Verify current user",
				description: "Method for verifying the current user",
				security: [{Bearer: []}],
 				responses: {
					200: {description: "Success."},
					403: {description: "Failed! Forbidden"},
					// 404: {description: "Failed! User not found"},
					500: {description: "Failed! Unexpected server error"}
				},
			},
		},

		"/api/users/cover": {
			post: {
				tags: [ "Users" ],
				summary: "Update cover image",
				description: "Method for updating cover image for current user<br><br>`For remove image - send empty request!`",
				consumes: [ "multipart/form-data" ],
				security: [{Bearer: []}],
				parameters: [{
					in: "formData",
					name: "image",
					type: "file",
					description: "Cover image file"
				}],
				responses: {
					200: {description: "Success."},
					422: {description: "Failed! Not all fields has filled"},
					500: {description: "Failed! Unexpected server error"}
				}
			}
		},

		"/api/users/tops/sellers": {
			get: {
				tags: [ "Users" ],
				summary: "Get top sellers",
				description: "Method for getting top sellers by date (days from 1 to 30)",
 				responses: {
					200: {description: "Success. Gives out all `users`"},
					500: {description: "Failed! Unexpected server error"}
				},
				parameters: [{
					name: "days",
					in: "query",
					type: "number",
					description: "In the last how many days? (max 30)",
					required: true,
					default: 3
				}]
			}
		},

		"/api/users/tops/buyers": {
			get: {
				tags: [ "Users" ],
				summary: "Get top buyers",
				description: "Method for getting top buyers by date (days from 0 to 30)",
 				responses: {
					200: {description: "Success. Gives out all `users`"},
					500: {description: "Failed! Unexpected server error"}
				},
				parameters: [{
					name: "days",
					in: "query",
					type: "number",
					description: "In the last how many days? (max 30)",
					required: true,
					default: 3
				}]
			}
		},

		"/api/users/search": {
			post: {
				tags: [ "Users", "Search" ],
				summary: "Search users by params",
				description: "Search all users by parameters<br>**All fields is required**",
				consumes: [ "application/json" ],
				parameters: [
					{
						in: "body",
						name: "body",
						required: true,
						schema: {
							type: "object",
							properties: {
								name: {type: "string", required: false},
								bio: {type: "string", required: false},
								verified: {type: "boolean", default: false, required: false},
							}
						}
					}
				],
				responses: {
					200: {description: "Success. Gives out user `users`"},
					422: {description: "Failed! Not all fields has filled"},
					500: {description: "Failed! Unexpected server error"}
				}
			}
		},

		"/api/activities/all": {
			get: {
				tags: [ "Activities" ],
				summary: "Get all activities",
				description: "Get activities of all users",
				consumes: [ "application/json" ],
				// security: [{Bearer: []}],
				parameters: [{
					in: "query",
					name: "type",
					type: "string",
					enum: ["minted", "listed", "offered", "purchased", "following", "liked", "transferred"]
				}],
				responses: {
					200: {description: "Success. Gives out user `activities`"},
					422: {description: "Failed! Not all fields has filled"},
					404: {description: "Failed! User is not found"},
					500: {description: "Failed! Unexpected server error"}
				}
			}
		},

		"/api/activities/my": {
			get: {
				tags: [ "Activities" ],
				summary: "Get my activities",
				description: "Get activities of current user",
				consumes: [ "application/json" ],
				security: [{Bearer: []}],
				parameters: [{
					in: "query",
					name: "type",
					type: "string",
					enum: ["minted", "listed", "offered", "purchased", "following", "liked", "transferred"]
				}],
				responses: {
					200: {description: "Success. Gives out user `activities`"},
					422: {description: "Failed! Not all fields has filled"},
					404: {description: "Failed! User is not found"},
					500: {description: "Failed! Unexpected server error"}
				}
			}
		},

		"/api/activities/following": {
			get: {
				tags: [ "Activities" ],
				summary: "Get following activities",
				description: "Get following activities",
				consumes: [ "application/json" ],
				security: [{Bearer: []}],
				parameters: [{
					in: "query",
					name: "type",
					type: "string",
					enum: ["minted", "listed", "offered", "purchased", "following", "liked", "transferred"]
				}],
				responses: {
					200: {description: "Success. Gives out user `activities`"},
					422: {description: "Failed! Not all fields has filled"},
					404: {description: "Failed! User is not found"},
					500: {description: "Failed! Unexpected server error"}
				}
			}
		},
	}
};