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
	website: z.string(),

	pcRequirements: z.object({
		minimum: z.string(),
		recommended: z.string(),
	}),
	macRequirements: z.object({
		minimum: z.string(),
		recommended: z.string(),
	}),
	linuxRequirements: z.object({
		minimum: z.string(),
		recommended: z.string(),
	}),

	legalNotice: z.string(),

	developers: z.array(z.string()),
	publishers: z.array(z.string()),

	priceOverview: z.object({
		currency: z.string(),
		initial: z.number(),
		final: z.number(),
		discountPercent: z.number(),
		initialFormatted: z.string(),
		finalFormatted: z.string(),
	}),

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

	metacritic: z.object({
		score: z.number(),
		url: z.string(),
	}),

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

	recommendations: z.object({
		total: z.number(),
	}),

	achievements: z.object({
		total: z.number(),
		highlighted: z.array(
			z.object({
				name: z.string(),
				path: z.string(),
			}),
		),
	}),

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

	ratings: z.any(),
})

export const GetGameDetailsResponseSchema = SuccessResponseSchema.extend({
	data: GameSchema,
})

export const GetGameStoreRawDataResponseSchema = SuccessResponseSchema.extend({
	data: z.string().describe("游戏商店页原始数据"),
})
