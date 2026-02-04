declare module 'lunar-javascript' {
    export class Solar {
        static fromYmd(year: number, month: number, day: number): Solar
        getLunar(): Lunar
    }

    export class Lunar {
        getMonth(): number
        getDay(): number
        getFestivals(): string[]
        getMonthInChinese(): string
        getDayInChinese(): string
    }
}
