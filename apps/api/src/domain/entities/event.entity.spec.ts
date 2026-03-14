import { EventEntity } from './event.entity';

describe('EventEntity', () => {
    const mockUserId = 'user-123';
    const otherUserId = 'user-456';

    it('should successfully create a valid event', () => {
        const event = new EventEntity('1', 'My Event', mockUserId, new Date());
        expect(event.id).toBe('1');
        expect(event.title).toBe('My Event');
    });

    it('should throw error on empty title', () => {
        expect(() => new EventEntity('2', '', mockUserId, new Date())).toThrowError('Event title cannot be empty');
        expect(() => new EventEntity('2', '   ', mockUserId, new Date())).toThrowError('Event title cannot be empty');
    });

    describe('Row-Level Security / Ownership', () => {
        let event: EventEntity;

        beforeEach(() => {
            event = new EventEntity('1', 'Original Title', mockUserId, new Date());
        });

        it('should allow owner to update details', () => {
            event.updateDetails('New Title', 'Desc', 'Loc', mockUserId);
            expect(event.title).toBe('New Title');
        });

        it('should reject non-owner trying to update details', () => {
            expect(() => {
                event.updateDetails('Hacked Title', null, null, otherUserId);
            }).toThrowError('Unauthorized: You can only modify events you created');
        });

        it('should fail update if new title is empty (even for owner)', () => {
            expect(() => {
                event.updateDetails('', null, null, mockUserId);
            }).toThrowError('Event title cannot be empty');
        });
    });
});
