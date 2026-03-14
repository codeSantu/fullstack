export interface FestivalDto {
    id: string;
    title: string;
    creatorId: string;
    startDate: string;
    endDate: string;
    description: string | null;
    location: string | null;
    bannerUrl: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface CreateFestivalRequestDto {
    title: string;
    startDate: string;
    endDate: string;
    description?: string;
    location?: string;
}

export interface ElevateRoleRequestDto {
    secretToken: string;
    requestedRole: 'ORGANIZER' | 'ADMIN';
}
