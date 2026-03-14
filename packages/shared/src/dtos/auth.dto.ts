export interface LoginRequestDto {
    email: string;
    password?: string;
}

export interface RegisterRequestDto {
    email: string;
    name: string;
    password?: string;
}

export interface AuthResponseDto {
    accessToken: string;
    refreshToken?: string;
    user: {
        id: string;
        email: string;
        name: string;
        role: string;
    };
}
