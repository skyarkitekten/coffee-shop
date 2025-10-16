import { ValidationError } from './errors.js';

export function validateChronology(issueDate: Date, expirationDate: Date) {
    if (expirationDate <= issueDate) {
        throw new ValidationError('expirationDate', expirationDate, 'Expiration date must be after issue date');
    }
    if (expirationDate <= new Date()) {
        throw new ValidationError('expirationDate', expirationDate, 'License has already expired');
    }
    if (issueDate > new Date()) {
        throw new ValidationError('issueDate', issueDate, 'Issue date cannot be in the future');
    }
}

const ALLOWED_MIME = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
const ALLOWED_EXT = ['.pdf', '.jpg', '.jpeg', '.png'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export interface ValidatableFileMeta {
    mimeType: string;
    size: number;
    originalName: string;
}

export function validateFileMeta(file: ValidatableFileMeta) {
    if (file.size > MAX_SIZE) {
        throw new ValidationError('file', file.size, 'File size must be less than 10MB');
    }
    if (!ALLOWED_MIME.includes(file.mimeType)) {
        throw new ValidationError('file', file.mimeType, 'File must be PDF, JPG, or PNG');
    }
    const extension = file.originalName.toLowerCase().substring(file.originalName.lastIndexOf('.'));
    if (!ALLOWED_EXT.includes(extension)) {
        throw new ValidationError('file', extension, 'File extension must be .pdf, .jpg, .jpeg, or .png');
    }
}
