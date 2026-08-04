import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { User, UserRole } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser$: Observable<User | null>;

  private mockEmpresaUser: User = {
    id: 'usr_empresa_1',
    email: 'contacto@techcorp.com',
    name: 'TechCorp Logistics S.A.',
    role: 'empresa',
    empresaId: 'emp_1',
    contacto: 'Ing. Carlos Mendoza',
    telefono: '+52 55 1234 5678',
    plan: 'Enterprise VIP'
  };

  private mockAdminUser: User = {
    id: 'usr_tech_1',
    email: 'admin@soporte.com',
    name: 'Alex Rivera (Lead Tech)',
    role: 'admin',
    especialidad: 'Redes & Servidores Cloud',
    telefono: '+52 55 5555 0101'
  };

  constructor() {
    const savedUser = localStorage.getItem('soporte_user');
    const initialUser = savedUser ? JSON.parse(savedUser) : this.mockEmpresaUser;
    this.currentUserSubject = new BehaviorSubject<User | null>(initialUser);
    this.currentUser$ = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  public get isEmpresa(): boolean {
    return this.currentUserValue?.role === 'empresa';
  }

  public get isAdminOrTech(): boolean {
    return this.currentUserValue?.role === 'admin' || this.currentUserValue?.role === 'tecnico';
  }

  public loginAsEmpresa(): void {
    this.setUser(this.mockEmpresaUser);
  }

  public loginAsAdmin(): void {
    this.setUser(this.mockAdminUser);
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
