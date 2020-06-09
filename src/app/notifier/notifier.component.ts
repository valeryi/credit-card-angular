import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  Renderer2,
  OnDestroy,
} from '@angular/core';
import { NotifierService } from './notifier.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-notifier',
  templateUrl: './notifier.component.html',
  styleUrls: ['./notifier.component.scss'],
})
export class NotifierComponent implements OnDestroy, OnInit {
  @ViewChild('notifier') notifierEl: ElementRef;
  $destroy: Subject<boolean> = new Subject();
  notification = '';
  show = false;

  constructor(private notifier: NotifierService, private renderer: Renderer2) {}

  ngOnInit(): void {
    this.notifier.$notifierEvent.pipe(takeUntil(this.$destroy)).subscribe({
      next: this.notifierHandler.bind(this),
    });
  }

  notifierHandler(event: { message: string }): void {
    this.show = true;
    this.notification = event.message;
  }

  close(): void {
    this.show = false;
  }

  ngOnDestroy(): void {
    this.$destroy.next(true);
    this.$destroy.unsubscribe();
  }
}
