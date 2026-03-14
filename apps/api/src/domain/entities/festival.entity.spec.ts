import { FestivalEntity } from './festival.entity';

describe('FestivalEntity', () => {
    const organizerId = 'org-1';
    const otherUserId = 'user-2';
    const start = new Date('2026-10-01');
    const end = new Date('2026-10-05');

    it('should create valid festival entity', () => {
        const f = new FestivalEntity('1', 'Tech Fest', organizerId, start, end);
        expect(f.id).toBe('1');
        expect(f.title).toBe('Tech Fest');
    });

    it('should throw error if title is empty', () => {
        expect(() => new FestivalEntity('2', '', organizerId, start, end)).toThrowError('Festival title cannot be empty');
    });

    it('should throw error if end date is before start date', () => {
        expect(() => new FestivalEntity('3', 'Fest', organizerId, end, start)).toThrowError('Festival end date must be after start date');
    });

    describe('Permissions', () => {
        let f: FestivalEntity;
        beforeEach(() => {
            f = new FestivalEntity('1', 'Original Fest', organizerId, start, end);
        });

        it('should allow owner to update', () => {
            const newEnd = new Date('2026-10-10');
            f.updateDetails('New Fest', start, newEnd, null, null, null, organizerId);
            expect(f.title).toBe('New Fest');
        });

        it('should throw unauthorized if requested by non-organizer', () => {
            const newEnd = new Date('2026-10-10');
            expect(() => f.updateDetails('New Fest', start, newEnd, null, null, null, otherUserId)).toThrowError('Unauthorized: You can only modify festivals you organize');
        });
    });
});
