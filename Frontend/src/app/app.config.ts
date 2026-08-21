import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideStore } from '@ngrx/store';

import { routes } from './app.routes';
import { authReducer } from './core/store/auth/auth.reducer';
import { jwtInterceptor } from './core/interceptors/jwt.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { AuthService } from './core/auth/auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient(withInterceptors([jwtInterceptor, errorInterceptor])),
    provideStore({ auth: authReducer }),
    // US-1.4 : réhydrate la session depuis le localStorage avant le premier
    // rendu, pour que les guards disposent d'un état à jour dès la toute
    // première navigation (ex: rechargement de page sur une route protégée).
    provideAppInitializer(() => {
      const authService = inject(AuthService);
      authService.restoreSession();
    })
  ]
};