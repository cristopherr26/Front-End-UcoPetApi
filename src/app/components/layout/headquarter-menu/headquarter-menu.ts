import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';

import { Headquarter } from '../../../models/headquarter/headquarter.model';
import { HeadquarterService } from '../../../services/headquarter/headquarter.service';
import { SessionService } from '../../../services/session/session.service';

@Component({
  selector: 'app-headquarter-menu',
  imports: [NgbDropdownModule],
  templateUrl: './headquarter-menu.html',
  styleUrl: './headquarter-menu.scss',
})
export class HeadquarterMenu implements OnInit {
  private readonly headquarterService = inject(HeadquarterService);
  protected readonly session = inject(SessionService);

  protected readonly headquarters = signal<Headquarter[]>([]);
  protected readonly search = signal('');
  protected readonly current = computed(
    () =>
      this.headquarters().find((headquarter) => headquarter.id === this.session.headquarterId()) ??
      null,
  );
  protected readonly visible = computed(() => {
    const term = this.search().trim().toLowerCase();
    const list = this.headquarters();
    return term === ''
      ? list
      : list.filter((headquarter) => headquarter.name.toLowerCase().includes(term));
  });

  ngOnInit(): void {
    this.headquarterService.list().subscribe({
      next: (headquarters) => {
        const active = headquarters
          .filter((headquarter) => headquarter.isActive)
          .sort((a, b) => a.name.localeCompare(b.name));
        this.headquarters.set(active);
        const selected = this.session.headquarterId();
        if (selected !== null && !active.some((headquarter) => headquarter.id === selected)) {
          this.session.selectHeadquarter(null);
        }
      },
      error: () => this.headquarters.set([]),
    });
  }

  protected select(headquarterId: string | null): void {
    this.session.selectHeadquarter(headquarterId);
    this.search.set('');
  }

  protected initials(name: string | null): string {
    if (name === null) {
      return 'TS';
    }
    const words = name
      .replace(/^Sede\s+/i, '')
      .split(' ')
      .filter((word) => word.length > 2);
    return (
      words.length > 1 ? words[0][0] + words[1][0] : (words[0] ?? name).slice(0, 2)
    ).toUpperCase();
  }
}
