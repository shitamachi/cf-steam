// 获取特定游戏详情
import { z } from "zod"
import { GameSchema } from "../steam-service"
import { SuccessResponseSchema } from "./index"

export const GetGameDetailsResponseSchema = SuccessResponseSchema.extend({
	data: GameSchema,
})

export const GetGameStoreRawDataResponseSchema = SuccessResponseSchema.extend({
	data: z.string().describe("游戏商店页原始数据"),
})
