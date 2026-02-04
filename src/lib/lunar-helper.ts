import { Solar } from 'lunar-javascript'

export function formatLunar(date: Date): string {
    const solar = Solar.fromYmd(date.getFullYear(), date.getMonth() + 1, date.getDate())
    const lunar = solar.getLunar()

    // Prioritize festivals
    const festivals = lunar.getFestivals()
    if (festivals.length > 0) return festivals[0]

    // Return readable lunar date
    const lunarDay = lunar.getDay()
    return lunarDay === 1
        ? lunar.getMonthInChinese() + '月'
        : lunar.getDayInChinese()
}
