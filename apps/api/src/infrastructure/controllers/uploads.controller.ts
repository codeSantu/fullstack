import { Controller, Put, Param, Req, Res, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

// Ensure the uploads directory exists
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

@Controller('uploads')
export class UploadsController {
    @Put(':filename')
    async uploadFile(
        @Param('filename') filename: string,
        @Req() req: Request,
        @Res() res: Response
    ) {
        const filePath = path.join(UPLOADS_DIR, filename);
        const writeStream = fs.createWriteStream(filePath);

        req.pipe(writeStream);

        writeStream.on('finish', () => {
            res.status(HttpStatus.CREATED).json({ message: 'File uploaded successfully', url: `http://localhost:3001/api/uploads/${filename}` });
        });

        writeStream.on('error', (err) => {
            console.error('Upload Error:', err);
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).send('File upload failed');
        });
    }
}
