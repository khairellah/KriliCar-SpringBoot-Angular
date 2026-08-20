import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../../core/auth/auth.service';
import { LoginRequest } from '../../../core/models/auth/login-request.model';
import { AuthErrorResponse } from '../../../core/models/auth/auth-error-response.model';
import { Role } from '../../../core/models/enums';

interface LoginForm {
  email: FormControl<string>;
  password: FormControl<string>;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly hidePassword = signal(true);

  readonly form: FormGroup<LoginForm> = this.fb.nonNullable.group({
    email: this.fb.nonNullable.control('', [Validators.required, Validators.email]),
    password: this.fb.nonNullable.control('', [Validators.required])
  });

  togglePasswordVisibility(): void {
    this.hidePassword.update((v) => !v);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);
    this.isLoading.set(true);

    const credentials: LoginRequest = this.form.getRawValue();

    this.authService.login(credentials).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        this.redirectByRole(response.role);
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        this.errorMessage.set(this.resolveErrorMessage(err));
      }
    });
  }

  private redirectByRole(role: Role): void {
    const routesByRole: Record<Role, string> = {
      ADMIN: '/admin',
      COMPANY: '/company',
      CLIENT: '/client'
    };
    // Routes /admin, /company, /client livrées dans les Sprints suivants.
    // Redirection préparée dès maintenant, sans effet cassant : ces routes
    // n'existent simplement pas encore côté router.
    this.router.navigateByUrl(routesByRole[role] ?? '/');
  }

  private resolveErrorMessage(err: HttpErrorResponse): string {
    const body = err.error as AuthErrorResponse | undefined;

    if (err.status === 403) {
      // US-1.1 / US-1.8 : compte désactivé (DisabledException côté backend)
      return body?.message ?? "Ce compte a été désactivé. Veuillez contacter l'administrateur.";
    }

    if (err.status === 401) {
      return body?.message ?? 'Email ou mot de passe incorrect.';
    }

    return 'Une erreur est survenue. Veuillez réessayer plus tard.';
  }
}