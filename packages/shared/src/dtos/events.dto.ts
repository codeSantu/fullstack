export interface EventDto {
    id: string;
    title: string;
    creatorId: string;
    date: string;
    description: string | null;
    location: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface CreateEventRequestDto {
    title: string;
    date: string;
    description?: string;
    location?: string;
}

export interface UploadProfilePictureResponseDto {
    uploadUrl: string;
    pictureUrl: string;
}
