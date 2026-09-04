import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./ability-list/ability-list').then((m) => m.AbilityList),
    title: 'Ability cards by phase',
  },
  { path: '**', redirectTo: '' },
];
