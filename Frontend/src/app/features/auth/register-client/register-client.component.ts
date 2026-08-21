import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
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
import { ClientRegistrationRequest } from '../../../core/models/auth/client-registration-request.model';
import { ErrorResponse } from '../../../core/models/errors/error-response.model';

interface RegisterClientForm {
  firstName: FormControl<string>;
  lastName: FormControl<string>;
  email: FormControl<string>;
  password: FormControl<string>;
  confirmPassword: FormControl<string>;
  phone: FormControl<string>;
}

// Validateur de groupe : confirmation de mot de passe.
// Vérification 100% Frontend, non transmise au backend (même pattern que
// ChangePasswordRequest, cf. commentaire backend "confirmation gérée côté Angular").
function passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;
  return password && confirmPassword && password !== confirmPassword
    ? { passwordsMismatch: true }
    : null;
}

@Component({
  selector: 'app-register-client',
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
  templateUrl: './register-client.component.html',
  styleUrl: './register-client.component.scss'
})
export class RegisterClientComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly hidePassword = signal(true);
  readonly hideConfirmPassword = signal(true);
  readonly selectedImage = signal<File | null>(null);
  readonly imagePreviewUrl = signal<string | null>(null);

  readonly form: FormGroup<RegisterClientForm> = this.fb.nonNullable.group(
    {
      firstName: this.fb.nonNullable.control('', [Validators.required]),
      lastName: this.fb.nonNullable.control('', [Validators.required]),
      email: this.fb.nonNullable.control('', [Validators.required, Validators.email]),
      password: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(6)]),
      confirmPassword: this.fb.nonNullable.control('', [Validators.required]),
      phone: this.fb.nonNullable.control('', [
        Validators.required,
        Validators.pattern(/^[0-9+ ]{8,15}$/)
      ])
    },
    { validators: passwordsMatchValidator }
  );

  togglePasswordVisibility(): void {
    this.hidePassword.update((v) => !v);
  }

  toggleConfirmPasswordVisibility(): void {
    this.hideConfirmPassword.update((v) => !v);
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.selectedImage.set(file);

    if (file) {
      const reader = new FileReader();
      reader.onload = () => this.imagePreviewUrl.set(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      this.imagePreviewUrl.set(null);
    }
  }

  removeImage(): void {
    this.selectedImage.set(null);
    this.imagePreviewUrl.set(null);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.isLoading.set(true);

    const { confirmPassword, ...rest } = this.form.getRawValue();
    const payload: ClientRegistrationRequest = rest;

    this.authService.registerClient(payload, this.selectedImage()).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.successMessage.set(
          'Votre compte a été créé avec succès. Vous pouvez maintenant vous connecter.'
        );
        this.form.reset();
        this.selectedImage.set(null);
        this.imagePreviewUrl.set(null);
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        this.applyServerErrors(err);
      }
    });
  }

  goToLogin(): void {
    this.router.navigateByUrl('/login');
  }

  private applyServerErrors(err: HttpErrorResponse): void {
    const body = err.error as ErrorResponse | undefined;

    if (err.status === 400 && body?.errors?.length) {
      // Mapping des erreurs de validation backend (FieldErrorDTO) vers les
      // contrôles correspondants (noms de champs identiques au DTO backend).
      for (const fieldError of body.errors) {
        const control = this.form.get(fieldError.field);
        if (control) {
          control.setErrors({ backend: fieldError.message });
          control.markAsTouched();
        }
      }
      this.errorMessage.set(body.message ?? 'Veuillez corriger les champs invalides.');
      return;
    }

    if (err.status === 409) {
      this.errorMessage.set(body?.message ?? 'Un compte existe déjà avec cet email.');
      return;
    }

    this.errorMessage.set(
      body?.message ?? 'Une erreur est survenue. Veuillez réessayer plus tard.'
    );
  }
}