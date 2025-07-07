// 获取特定游戏详情
import { SuccessResponseSchema } from "./index"
import { GameSchema } from "../steam-service"

export const GetGameDetailsResponseSchema = SuccessResponseSchema.extend({
	data: GameSchema,
})
