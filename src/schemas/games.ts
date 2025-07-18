// 获取特定游戏详情
import { z } from "zod"
import { GameSchema, SuccessResponseSchema } from "./index"

export const LanguageSchema = z.enum([
	"arabic",
	"bulgarian",
	"schinese",
	"tchinese",
	"czech",
	"danish",
	"dutch",
	"english",
	"finnish",
	"french",
	"german",
	"greek",
	"hungarian",
	"italian",
	"japanese",
	"koreana",
	"norwegian",
	"polish",
	"brazilian",
	"portuguese",
	"romanian",
	"russian",
	"latam",
	"spanish",
	"swedish",
	"thai",
	"turkish",
	"ukrainian",
	"vietnamese",
])
export const CurrencySchema = z.enum([
	"us",
	"uk",
	"eu",
	"ru",
	"br",
	"jp",
	"id",
	"my",
	"ph",
	"sg",
	"th",
	"vn",
	"kr",
	"ua",
	"mx",
	"ca",
	"au",
	"nz",
	"no",
	"pl",
	"ch",
	"cn",
	"in",
	"cl",
	"pe",
	"co",
	"za",
	"hk",
	"tw",
	"sa",
	"ae",
	"il",
	"kz",
	"kw",
	"qa",
	"cr",
	"uy",
	"az",
	"ar",
	"tr",
	"pk",
])

export const GameDetailsSchema = z.object({
	type: z.string(),
	name: z.string(),
	id: z.number(),
	requiredAge: z.number(),
	isFree: z.boolean(),
	controllerSupport: z.string(),

	dlc: z.array(z.number()),

	detailedDescription: z.string(),
	aboutTheGame: z.string(),
	shortDescription: z.string(),
	supportedLanguages: z.string(),

	headerImage: z.string(),
	capsuleImage: z.string(),
	capsuleImagev5: z.string(),
	website: z.string().nullable(),

	pcRequirements: z.object({
		minimum: z.string(),
		recommended: z.string().optional(),
	}),
	macRequirements: z.object({
		minimum: z.string(),
		recommended: z.string().optional(),
	}),
	linuxRequirements: z.object({
		minimum: z.string(),
		recommended: z.string().optional(),
	}),

	legalNotice: z.string().optional(),

	developers: z.array(z.string()),
	publishers: z.array(z.string()),

	priceOverview: z
		.object({
			currency: z.string(),
			initial: z.number(),
			final: z.number(),
			discountPercent: z.number(),
			initialFormatted: z.string(),
			finalFormatted: z.string(),
		})
		.optional(),

	packages: z.array(z.number()),

	packageGroups: z.array(
		z.object({
			name: z.string(),
			title: z.string(),
			description: z.string(),
			selectionText: z.string(),
			saveText: z.string(),
			displayType: z.number(),
			isRecurringSubscription: z.string(),
			subs: z.array(
				z.object({
					packageid: z.number(),
					percentSavingsText: z.string(),
					percentSavings: z.number(),
					optionText: z.string(),
					optionDescription: z.string(),
					canGetFreeLicense: z.string(),
					isFreeLicense: z.boolean(),
					priceInCentsWithDiscount: z.number(),
				}),
			),
		}),
	),

	platforms: z.object({
		windows: z.boolean(),
		mac: z.boolean(),
		linux: z.boolean(),
	}),

	metacritic: z
		.object({
			score: z.number(),
			url: z.string(),
		})
		.optional(),

	categories: z.array(
		z.object({
			id: z.number(),
			description: z.string(),
		}),
	),

	genres: z.array(
		z.object({
			id: z.string(),
			description: z.string(),
		}),
	),

	screenshots: z.array(
		z.object({
			id: z.number(),
			path_thumbnail: z.string(),
			path_full: z.string(),
		}),
	),

	movies: z.array(
		z.object({
			id: z.number(),
			name: z.string(),
			thumbnail: z.string(),
			webm: z.object({
				"480": z.string(),
				max: z.string(),
			}),
			mp4: z.object({
				"480": z.string(),
				max: z.string(),
			}),
			highlight: z.boolean(),
		}),
	),

	recommendations: z
		.object({
			total: z.number(),
		})
		.optional(),

	achievements: z
		.object({
			total: z.number(),
			highlighted: z.array(
				z.object({
					name: z.string(),
					path: z.string(),
				}),
			),
		})
		.optional(),

	releaseDate: z.object({
		coming_soon: z.boolean(),
		date: z.string(),
	}),

	supportInfo: z.object({
		url: z.string(),
		email: z.string(),
	}),

	background: z.string(),
	backgroundRaw: z.string(),

	contentDescriptors: z.object({
		ids: z.array(z.number()),
		notes: z.string().nullable(),
	}),

	ratings: z.any().optional(),
})

export const GetGameDetailsResponseSchema = SuccessResponseSchema.extend({
	data: GameSchema,
})

export const GetGameStoreRawDataResponseSchema = SuccessResponseSchema.extend({
	data: z.string().describe("游戏商店页原始数据"),
})

// --- CStoreTopSellers Schemas ---

// Corresponds to StoreItem_Assets
const StoreItemAssetsSchema = z.object({
	assetUrlFormat: z.string().optional(),
	mainCapsule: z.string().optional(),
	smallCapsule: z.string().optional(),
	header: z.string().optional(),
	packageHeader: z.string().optional(),
	pageBackground: z.string().optional(),
	heroCapsule: z.string().optional(),
	heroCapsule2X: z.string().optional(),
	libraryCapsule: z.string().optional(),
	libraryCapsule2X: z.string().optional(),
	libraryHero: z.string().optional(),
	libraryHero2X: z.string().optional(),
	communityIcon: z.string().optional(),
	clanAvatar: z.string().optional(),
	pageBackgroundPath: z.string().optional(),
	rawPageBackground: z.string().optional(),
})

// Corresponds to StoreItem_BasicInfo_CreatorHomeLink
const StoreItemBasicInfoCreatorHomeLinkSchema = z.object({
	name: z.string().optional(),
	creatorClanAccountId: z.number().optional(),
})

// Corresponds to StoreItem_BasicInfo
const StoreItemBasicInfoSchema = z.object({
	shortDescription: z.string().optional(),
	publishers: z.array(StoreItemBasicInfoCreatorHomeLinkSchema),
	developers: z.array(StoreItemBasicInfoCreatorHomeLinkSchema),
	franchises: z.array(StoreItemBasicInfoCreatorHomeLinkSchema),
	capsuleHeadline: z.string().optional(),
})

// Corresponds to StoreItem_Categories
const StoreItemCategoriesSchema = z.object({
	supportedPlayerCategoryids: z.array(z.number()),
	featureCategoryids: z.array(z.number()),
	controllerCategoryids: z.array(z.number()),
})

// Corresponds to StoreItem_Reviews_StoreReviewSummary
const StoreItemReviewsStoreReviewSummarySchema = z.object({
	reviewCount: z.number().optional(),
	percentPositive: z.number().optional(),
	reviewScore: z.number().optional(),
	reviewScoreLabel: z.string().optional(),
})

// Corresponds to StoreItem_Reviews
const StoreItemReviewsSchema = z.object({
	summaryFiltered: StoreItemReviewsStoreReviewSummarySchema.optional(),
	summaryUnfiltered: StoreItemReviewsStoreReviewSummarySchema.optional(),
})

// Corresponds to StoreItem_Tag
const StoreItemTagSchema = z.object({
	tagid: z.number().optional(),
	weight: z.number().optional(),
})

// Corresponds to StoreItem_ReleaseInfo
const StoreItemReleaseInfoSchema = z.object({
	steamReleaseDate: z.number().optional(),
	originalReleaseDate: z.number().optional(),
	originalSteamReleaseDate: z.number().optional(),
	isComingSoon: z.boolean().optional(),
	isPreload: z.boolean().optional(),
	customReleaseDateMessage: z.string().optional(),
	isAbridgedReleaseDate: z.boolean().optional(),
	comingSoonDisplay: z.string().optional(),
	isEarlyAccess: z.boolean().optional(),
	macReleaseDate: z.number().optional(),
	linuxReleaseDate: z.number().optional(),
	limitedLaunchActive: z.boolean().optional(),
})

// Corresponds to StoreItem_Platforms_VRSupport
const StoreItemPlatformsVRSupportSchema = z.object({
	vrhmd: z.boolean().optional(),
	vrhmdOnly: z.boolean().optional(),
	htcVive: z.boolean().optional(),
	oculusRift: z.boolean().optional(),
	windowsMr: z.boolean().optional(),
	valveIndex: z.boolean().optional(),
})

// Corresponds to StoreItem_Platforms
const StoreItemPlatformsSchema = z.object({
	windows: z.boolean().optional(),
	mac: z.boolean().optional(),
	linux: z.boolean().optional(),
	vrSupport: StoreItemPlatformsVRSupportSchema.optional(),
	steamDeckCompatCategory: z.number().optional(),
	steamOsCompatCategory: z.number().optional(),
})

// Placeholder for StoreGameRating as its definition is complex/unavailable
const StoreGameRatingSchema = z.any().optional()

// Corresponds to StoreItem_PurchaseOption_Discount
const StoreItemPurchaseOptionDiscountSchema = z.object({
	discountAmount: z.bigint().optional(),
	discountDescription: z.string().optional(),
	discountEndDate: z.number().optional(),
})

// Corresponds to StoreItem_PurchaseOption_RecurrenceInfo
const StoreItemPurchaseOptionRecurrenceInfoSchema = z.object({
	packageid: z.number().optional(),
	billingAgreementType: z.number().optional(),
	renewalTimeUnit: z.number().optional(),
	renewalTimePeriod: z.number().optional(),
	renewalPriceInCents: z.bigint().optional(),
	formattedRenewalPrice: z.string().optional(),
})

// Corresponds to StoreItem_PurchaseOption
const StoreItemPurchaseOptionSchema = z.object({
	packageid: z.number().optional(),
	bundleid: z.number().optional(),
	purchaseOptionName: z.string().optional(),
	finalPriceInCents: z.bigint().optional(),
	originalPriceInCents: z.bigint().optional(),
	userFinalPriceInCents: z.bigint().optional(),
	formattedFinalPrice: z.string().optional(),
	formattedOriginalPrice: z.string().optional(),
	discountPct: z.number().optional(),
	userDiscountPct: z.number().optional(),
	bundleDiscountPct: z.number().optional(),
	isFreeToKeep: z.boolean().optional(),
	priceBeforeBundleDiscount: z.bigint().optional(),
	formattedPriceBeforeBundleDiscount: z.string().optional(),
	activeDiscounts: z.array(StoreItemPurchaseOptionDiscountSchema),
	userActiveDiscounts: z.array(StoreItemPurchaseOptionDiscountSchema),
	inactiveDiscounts: z.array(StoreItemPurchaseOptionDiscountSchema),
	userCanPurchase: z.boolean().optional(),
	userCanPurchaseAsGift: z.boolean().optional(),
	isCommercialLicense: z.boolean().optional(),
	shouldSuppressDiscountPct: z.boolean().optional(),
	hideDiscountPctForCompliance: z.boolean().optional(),
	includedGameCount: z.number().optional(),
	lowestRecentPriceInCents: z.bigint().optional(),
	requiresShipping: z.boolean().optional(),
	recurrenceInfo: StoreItemPurchaseOptionRecurrenceInfoSchema.optional(),
	freeToKeepEnds: z.number().optional(),
})

// Corresponds to StoreItem_Screenshots_Screenshot
const StoreItemScreenshotsScreenshotSchema = z.object({
	filename: z.string().optional(),
	ordinal: z.number().optional(),
})

// Corresponds to StoreItem_Screenshots
const StoreItemScreenshotsSchema = z.object({
	allAgesScreenshots: z.array(StoreItemScreenshotsScreenshotSchema),
	matureContentScreenshots: z.array(StoreItemScreenshotsScreenshotSchema),
})

// Corresponds to StoreItem_Trailers_VideoSource
const StoreItemTrailersVideoSourceSchema = z.object({
	filename: z.string().optional(),
	type: z.string().optional(),
})

// Corresponds to StoreItem_Trailers_Trailer
const StoreItemTrailersTrailerSchema = z.object({
	trailerName: z.string().optional(),
	trailerUrlFormat: z.string().optional(),
	trailer480P: z.array(StoreItemTrailersVideoSourceSchema),
	trailerMax: z.array(StoreItemTrailersVideoSourceSchema),
	microtrailer: z.array(StoreItemTrailersVideoSourceSchema),
	screenshotMedium: z.string().optional(),
	screenshotFull: z.string().optional(),
	trailerBaseId: z.number().optional(),
	trailerCategory: z.number().optional(),
	allAges: z.boolean().optional(),
})

// Corresponds to StoreItem_Trailers
const StoreItemTrailersSchema = z.object({
	highlights: z.array(StoreItemTrailersTrailerSchema),
	otherTrailers: z.array(StoreItemTrailersTrailerSchema),
})

// Corresponds to StoreItem_SupportedLanguage
const StoreItemSupportedLanguageSchema = z.object({
	elanguage: z.number().optional(),
	supported: z.boolean().optional(),
	fullAudio: z.boolean().optional(),
	subtitles: z.boolean().optional(),
	eadditionallanguage: z.number().optional(),
})

// Corresponds to StoreItem_FreeWeekend
const StoreItemFreeWeekendSchema = z.object({
	startTime: z.number().optional(),
	endTime: z.number().optional(),
	text: z.string().optional(),
})

// Placeholder for StoreBrowseFilterFailure
const StoreBrowseFilterFailureSchema = z.any().optional()

// Corresponds to StoreItem_Link
const StoreItemLinkSchema = z.object({
	linkType: z.number().optional(),
	url: z.string().optional(),
	text: z.string().optional(),
})

// Corresponds to StoreItem_RelatedItems
const StoreItemRelatedItemsSchema = z.object({
	parentAppid: z.number().optional(),
	demoAppid: z.array(z.number()),
	standaloneDemoAppid: z.array(z.number()),
})

// Base schema for StoreItem without the recursive part
const BaseStoreItemSchema = z.object({
	itemType: z.number().optional(),
	id: z.number().optional(),
	success: z.number().optional(),
	visible: z.boolean().optional(),
	unvailableForCountryRestriction: z.boolean().optional(),
	name: z.string().optional(),
	storeUrlPath: z.string().optional(),
	appid: z.number().optional(),
	type: z.number().optional(),
	includedTypes: z.array(z.number()),
	includedAppids: z.array(z.number()),
	isFree: z.boolean().optional(),
	isEarlyAccess: z.boolean().optional(),
	relatedItems: StoreItemRelatedItemsSchema.optional(),
	contentDescriptorids: z.array(z.number()),
	tagids: z.array(z.number()),
	categories: StoreItemCategoriesSchema.optional(),
	reviews: StoreItemReviewsSchema.optional(),
	basicInfo: StoreItemBasicInfoSchema.optional(),
	tags: z.array(StoreItemTagSchema),
	assets: StoreItemAssetsSchema.optional(),
	release: StoreItemReleaseInfoSchema.optional(),
	platforms: StoreItemPlatformsSchema.optional(),
	gameRating: StoreGameRatingSchema,
	isComingSoon: z.boolean().optional(),
	bestPurchaseOption: StoreItemPurchaseOptionSchema.optional(),
	purchaseOptions: z.array(StoreItemPurchaseOptionSchema),
	accessories: z.array(StoreItemPurchaseOptionSchema),
	selfPurchaseOption: StoreItemPurchaseOptionSchema.optional(),
	screenshots: StoreItemScreenshotsSchema.optional(),
	trailers: StoreItemTrailersSchema.optional(),
	supportedLanguages: z.array(StoreItemSupportedLanguageSchema),
	storeUrlPathOverride: z.string().optional(),
	freeWeekend: StoreItemFreeWeekendSchema.optional(),
	unlisted: z.boolean().optional(),
	gameCount: z.number().optional(),
	internalName: z.string().optional(),
	fullDescription: z.string().optional(),
	isFreeTemporarily: z.boolean().optional(),
	assetsWithoutOverrides: StoreItemAssetsSchema.optional(),
	userFilterFailure: StoreBrowseFilterFailureSchema,
	links: z.array(StoreItemLinkSchema),
})

// StoreItem schema - 对应 protobuf 中的 StoreItem 类型
export const StoreItemSchema = BaseStoreItemSchema.extend({
	includedItems: z.object({
		includedApps: z.array(z.any()),
		includedPackages: z.array(z.any())
	}).optional()
})

// Corresponds to CStoreTopSellers_GetWeeklyTopSellers_Response_TopSellersRank
const TopSellersRankSchema = z.object({
	rank: z.number().optional(),
	appid: z.number().optional(),
	item: StoreItemSchema.optional(),
	lastWeekRank: z.number().optional(),
	consecutiveWeeks: z.number().optional(),
	firstTop100: z.boolean().optional(),
})

// Corresponds to CStoreTopSellers_GetWeeklyTopSellers_Response
export const CStoreTopSellers_GetWeeklyTopSellers_ResponseSchema = z.object({
	startDate: z.number().optional(),
	ranks: z.array(TopSellersRankSchema),
	nextPageStart: z.number().optional(),
})

export const GetStoreTopSellerResponseSchema = SuccessResponseSchema.extend({
	data: CStoreTopSellers_GetWeeklyTopSellers_ResponseSchema,
})
