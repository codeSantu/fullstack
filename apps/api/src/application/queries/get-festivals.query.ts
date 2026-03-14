export class GetFestivalsQuery {
    constructor(
        public readonly creatorId?: string,
        public readonly search?: string,
        public readonly page: number = 1,
        public readonly limit: number = 10
    ) { }
}
