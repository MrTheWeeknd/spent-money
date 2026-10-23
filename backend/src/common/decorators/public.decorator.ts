import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
/** Libera a rota do guard de autenticação global. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
