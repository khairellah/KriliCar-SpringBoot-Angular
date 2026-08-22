// Frontend/src/app/features/admin/profile/admin-profile.component.ts
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

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../../core/auth/auth.service';
import { AdminService } from '../services/admin.service';
import { AdminProfileRequest } from '../../../core/models/admin/admin-profile-request.model';
import { UserDisplayDTO } from '../../../core/models/admin/user-display.model';
import { ChangePasswordRequest } from '../../../core/models/auth/change-password-request.model';
import { ErrorResponse } from '../../../core/models/errors/error-response.model';

interface ProfileForm {
  firstName: FormControl<string>;
  lastName: FormControl<string>;
  phone: FormControl<string>;
}

interface PasswordForm {
  oldPassword: FormControl<string>;
  newPassword: FormControl<string>;
  confirmPassword: FormControl<string>;
}

function passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
  const newPassword = group.get('newPassword')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;
  return newPassword && confirmPassword && newPassword !== confirmPassword
    ? { passwordsMismatch: true }
    : null;
}

@Component({
  selector: 'app-admin-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './admin-profile.component.html',
  styleUrl: './admin-profile.component.scss'
})
export class AdminProfileComponent {
  private readonly fb = inject(FormBuilder);
  private readonly adminService = inject(AdminService);
  private readonly authService = inject(AuthService);

  readonly email = this.authService.email;
  readonly role = this.authService.role;

  // ============================ Chargement initial (US-1.6 ext) ============================
  readonly isInitialLoading = signal(true);
  readonly initialLoadError = signal<string | null>(null);

  // ============================ Formulaire "Informations personnelles" ============================
  readonly isProfileLoading = signal(false);
  readonly profileErrorMessage = signal<string | null>(null);
  readonly profileSuccessMessage = signal<string | null>(null);
  readonly selectedImage = signal<File | null>(null);
  readonly imagePreviewUrl = signal<string | null>(null);

  readonly profileForm: FormGroup<ProfileForm> = this.fb.nonNullable.group({
    firstName: this.fb.nonNullable.control('', [Validators.maxLength(100)]),
    lastName: this.fb.nonNullable.control('', [Validators.maxLength(100)]),
    phone: this.fb.nonNullable.control('', [Validators.pattern(/^[0-9+ ]{8,15}$/)])
  });

  // ============================ Formulaire "Changer le mot de passe" ============================
  readonly isPasswordLoading = signal(false);
  readonly passwordErrorMessage = signal<string | null>(null);
  readonly passwordSuccessMessage = signal<string | null>(null);
  readonly hideOldPassword = signal(true);
  readonly hideNewPassword = signal(true);
  readonly hideConfirmPassword = signal(true);

  readonly passwordForm: FormGroup<PasswordForm> = this.fb.nonNullable.group(
    {
      oldPassword: this.fb.nonNullable.control('', [Validators.required]),
      newPassword: this.fb.nonNullable.control('', [
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(128)
      ]),
      confirmPassword: this.fb.nonNullable.control('', [Validators.required])
    },
    { validators: passwordsMatchValidator }
  );

  constructor() {
    // Pré-remplissage du formulaire au chargement du composant via
    // GET /api/v1/admins/profile. Le formulaire "Informations personnelles"
    // reste désactivé (isInitialLoading) tant que la réponse n'est pas arrivée.
    this.loadProfile();
  }

  private loadProfile(): void {
    this.isInitialLoading.set(true);
    this.initialLoadError.set(null);

    this.adminService.getMyProfile().subscribe({
      next: (profile: UserDisplayDTO) => {
        this.profileForm.patchValue({
          firstName: profile.firstName ?? '',
          lastName: profile.lastName ?? '',
          phone: profile.phone ?? ''
        });
        this.isInitialLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.isInitialLoading.set(false);
        const body = err.error as ErrorResponse | undefined;
        this.initialLoadError.set(
          body?.message ?? 'Impossible de charger vos informations. Veuillez réessayer plus tard.'
        );
      }
    });
  }

  toggleOldPasswordVisibility(): void {
    this.hideOldPassword.update((v) => !v);
  }

  toggleNewPasswordVisibility(): void {
    this.hideNewPassword.update((v) => !v);
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

  onSubmitProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.profileErrorMessage.set(null);
    this.profileSuccessMessage.set(null);
    this.isProfileLoading.set(true);

    const payload: AdminProfileRequest = this.profileForm.getRawValue();

    this.adminService.updateProfile(payload, this.selectedImage()).subscribe({
      next: (updated: UserDisplayDTO) => {
        this.isProfileLoading.set(false);
        this.profileSuccessMessage.set('Vos informations ont été mises à jour avec succès.');
        this.profileForm.reset({
          firstName: updated.firstName ?? '',
          lastName: updated.lastName ?? '',
          phone: updated.phone ?? ''
        });
        this.selectedImage.set(null);
        this.imagePreviewUrl.set(null);
      },
      error: (err: HttpErrorResponse) => {
        this.isProfileLoading.set(false);
        const body = err.error as ErrorResponse | undefined;
        this.profileErrorMessage.set(
          body?.message ?? 'Une erreur est survenue. Veuillez réessayer plus tard.'
        );
      }
    });
  }

  onSubmitPassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.passwordErrorMessage.set(null);
    this.passwordSuccessMessage.set(null);
    this.isPasswordLoading.set(true);

    const { oldPassword, newPassword } = this.passwordForm.getRawValue();
    const payload: ChangePasswordRequest = { oldPassword, newPassword };

    this.adminService.changePassword(payload).subscribe({
      next: () => {
        this.isPasswordLoading.set(false);
        this.passwordSuccessMessage.set('Votre mot de passe a été modifié avec succès.');
        this.passwordForm.reset();
      },
      error: (err: HttpErrorResponse) => {
        this.isPasswordLoading.set(false);
        this.applyPasswordServerErrors(err);
      }
    });
  }

  private applyPasswordServerErrors(err: HttpErrorResponse): void {
    const body = err.error as ErrorResponse | undefined;

    if (err.status === 400 && body?.errors?.length) {
      for (const fieldError of body.errors) {
        const control = this.passwordForm.get(fieldError.field);
        if (control) {
          control.setErrors({ backend: fieldError.message });
          control.markAsTouched();
        }
      }
      this.passwordErrorMessage.set(body.message ?? 'Veuillez corriger les champs invalides.');
      return;
    }

    if (err.status === 403) {
      // UnauthorizedActionException (ancien mot de passe incorrect) -> FORBIDDEN
      const message = body?.message ?? "L'ancien mot de passe est incorrect.";
      this.passwordForm.controls.oldPassword.setErrors({ backend: message });
      this.passwordForm.controls.oldPassword.markAsTouched();
      this.passwordErrorMessage.set(message);
      return;
    }

    if (err.status === 400) {
      this.passwordErrorMessage.set(body?.message ?? 'Requête invalide.');
      return;
    }

    this.passwordErrorMessage.set(
      body?.message ?? 'Une erreur est survenue. Veuillez réessayer plus tard.'
    );
  }
}