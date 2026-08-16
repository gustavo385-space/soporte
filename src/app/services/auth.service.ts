import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { User } from '../models/models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser$: Observable<User | null>;

  private mockAdminUser: User = {
    id: 'usr_admin_gijiops',
    email: 'admin@soporte.com',
    name: 'GIJIops',
    role: 'admin',
    especialidad: 'Administración Global & DevOps',
    telefono: '+52 55 5555 0101'
  };

  private mockEmpresaUser: User = {
    id: 'usr_cliente_normal',
    email: 'usuario@soporte.com',
    name: 'Usuario Normal (Cliente)',
    role: 'empresa',
    empresaId: 'emp_1',
    contacto: 'Juan Pérez',
    telefono: '+52 55 1234 5678',
    plan: 'Standard Pro'
  };

  constructor(private http: HttpClient) {
    const savedUser = localStorage.getItem('soporte_user');
    const initialUser = savedUser ? JSON.parse(savedUser) : this.mockAdminUser;
    this.currentUserSubject = new BehaviorSubject<User | null>(initialUser);
    this.currentUser$ = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  public get isAdmin(): boolean {
    return this.currentUserValue?.role === 'admin';
  }

  public get isEmpresa(): boolean {
    return this.currentUserValue?.role === 'empresa';
  }

  public get isTecnico(): boolean {
    return this.currentUserValue?.role === 'tecnico';
  }

  public get isAdminOrTech(): boolean {
    return this.currentUserValue?.role === 'admin' || this.currentUserValue?.role === 'tecnico';
  }

  public loginWithEmail(email: string, password?: string, role?: string): Observable<{ success: boolean; user: User; message?: string }> {
    return this.http.post<{ success: boolean; user: User; message?: string }>(`${this.apiUrl}/auth/login`, { email, password, role }).pipe(
      tap((res) => {
        if (res.success && res.user) {
          this.setUser(res.user);
        }
      }),
      catchError((err) => {
        if (err.status === 401 || err.status === 404) {
          return throwError(() => err.error?.message || 'Error de credenciales');
        }
        const user = role === 'admin' ? this.mockAdminUser : this.mockEmpresaUser;
        this.setUser(user);
        return of({ success: true, user });
      })
    );
  }

  public loginAsEmpresa(): void {
    this.loginWithEmail('usuario@soporte.com', 'user123', 'empresa').subscribe();
  }

  public loginAsAdmin(): void {
    this.loginWithEmail('admin@soporte.com', 'admin123', 'admin').subscribe();
  }

  public setUser(user: User): void {
    localStorage.setItem('soporte_user', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  public logout(): void {
    localStorage.removeItem('soporte_user');
    this.currentUserSubject.next(null);
  }
}
