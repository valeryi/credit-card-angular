import {
  Component,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  Renderer2,
} from '@angular/core';
import { fromEvent, Subject, OperatorFunction, Observable } from 'rxjs';
import { takeUntil, map, filter, tap } from 'rxjs/operators';
import { CreditCardService, ICardEvent } from './credit-card.service';

export interface ICoords {
  left: number;
  top: number;
  height: number;
  width: number;
}

@Component({
  selector: 'app-credit-card',
  templateUrl: './credit-card.component.html',
  styleUrls: ['./credit-card.component.scss'],
})
export class CreditCardComponent implements AfterViewInit, OnDestroy {
  @ViewChild('creditCard') wrapper: ElementRef;
  @ViewChild('cardOverlay') overlay: ElementRef;
  @ViewChild('card') card: ElementRef;

  $stepperEvent: Observable<ICardEvent>;
  $destroy: Subject<boolean> = new Subject<boolean>();

  constructor(
    private cardService: CreditCardService,
    private renderer: Renderer2,
  ) {
    this.$stepperEvent = this.cardService.$cardEvent.pipe(
      filter((event: ICardEvent) => event.type === 'stepper')
    );

  }


  private getFocusWrapper(el: HTMLElement) {
    let focus: object;
    return searching(el);

    function searching(element: HTMLElement) {
      if (element && element.dataset && element.dataset.surface) {
        return {
          focus,
          surface: {
            name: element.dataset.surface,
            element,
          },
        };
      }

      if (element && element.dataset && element.dataset.focus) {
        focus = {
          name: element.dataset.focus,
          element,
        };
        return searching(element.parentElement);
      } else {
        if (element && element.parentElement) {
          return searching(element.parentElement);
        } else {
          return null;
        }
      }
    }
  }

  private getFocusCoords(element: HTMLElement): ICoords {
    const coords: ICoords = {
      left: element.offsetLeft,
      top: element.offsetTop,
      height: element.clientHeight,
      width: element.clientWidth,
    };

    return coords;
  }

  private buttonEvent(event: Event): ICardEvent {
    const element: HTMLElement = event.target as HTMLElement;
    const wrapper = this.getFocusWrapper(element);

    return {
      type: 'button',
      btn: {
        name: element.dataset.btn,
        element,
      },
      event,
    };
  }

  private setFocus(event: ICardEvent): void {
    const overlay = this.overlay.nativeElement;
    const { focus } = event;

    if (event.surface.name === 'front') {
      setTimeout(() => {
        this.renderer.setStyle(overlay, 'left', focus.coords.left + 'px');
        this.renderer.setStyle(overlay, 'top', focus.coords.top + 'px');
        this.renderer.setStyle(overlay, 'width', focus.coords.width + 'px');
        this.renderer.setStyle(overlay, 'height', focus.coords.height + 'px');
        this.renderer.setStyle(overlay, 'opacity', '1');
      }, 0);

      this.renderer.setStyle(overlay, 'display', 'block');
    }
  }

  private blurFocus(): void {
    const overlay = this.overlay.nativeElement;

    this.renderer.setStyle(overlay, 'left', 0);
    this.renderer.setStyle(overlay, 'top', 0);
    this.renderer.setStyle(overlay, 'width', '100%');
    this.renderer.setStyle(overlay, 'height', '100%');
    this.renderer.setStyle(overlay, 'opacity', '0');

    setTimeout(() => {
      this.renderer.setStyle(overlay, 'display', 'none');
    }, 500);
  }

  private focusHandler(focus: ICardEvent): void {
    focus.type === 'focus' ? this.setFocus(focus) : this.blurFocus();

    if (
      focus.type === 'blur' &&
      this.cardService.state.card.number.length > 0
    ) {
      if (
        !this.cardService.state.errors.number.length &&
        this.cardService.state.card.number.length < 16
      ) {
        this.cardService.validation(
          'number',
          'Card number should be 16 digits long'
        );
      }
    }

    if (
      focus.type === 'blur' &&
      this.cardService.state.card.cvv.length < 3 &&
      this.cardService.state.card.cvv.length > 0
    ) {
      this.cardService.validation('cvv', 'Invalid CVV Code');
    }

    if (this.cardService.state.card.month.length > 0) {
      if (
        (focus.type === 'blur' &&
          this.cardService.state.card.month.length < 2) ||
        this.cardService.state.card.year.length < 2
      ) {
        this.cardService.validation('expire', 'Invalid Date Provided');
      }
    }
  }

  private stepperEvent(event: Event): ICardEvent {
    const element: HTMLElement = event.target as HTMLElement;

    const stepper: ICardEvent = {
      type: 'stepper',
      state: this.cardService.state.card,
      surface: element.dataset.stepper,
    };

    return stepper;
  }

  private focusEvent(event: Event): ICardEvent {
    const element: HTMLElement = event.target as HTMLElement;
    const wrapper = this.getFocusWrapper(element);
    const coords = wrapper?.focus
      ? this.getFocusCoords(wrapper?.focus.element)
      : null;

    if (wrapper?.focus) {
      this.cardService.state.focus = wrapper?.focus.name;

      return {
        type: 'focus',
        focus: {
          element: wrapper?.focus,
          coords,
        },
        surface: wrapper?.surface,
        event,
      };
    } else {
      this.cardService.state.focus = null;

      return {
        type: 'blur',
        surface: wrapper?.surface,
        event,
      };
    }
  }

  private cvvEvent(event: Event): ICardEvent {
    const element: HTMLElement = event.target as HTMLElement;
    const n = element.dataset.cvv;
    this.cardService.validation('cvv', '');

    return {
      type: 'cvv',
      btn: n,
      state: this.cardService.state.card,
      event,
    };
  }

  private detectEvent(): OperatorFunction<Event, ICardEvent> {
    return map((event: Event) => {
      event.preventDefault();
      const element: HTMLElement = event.target as HTMLElement;

      switch (true) {
        case !!element.dataset.btn:
          const btn = this.buttonEvent(event);
          return btn;
          break;
        case !!element.dataset.stepper:
          const stepper = this.stepperEvent(event);
          this.cardService.state.surface = stepper.surface;
          return stepper;
          break;
        case !!element.dataset.cvv:
          const cvv = this.cvvEvent(event);
          return cvv;
          break;
        default:
          const focus = this.focusEvent(event);

          return focus;
          break;
      }
    });
  }

  ngAfterViewInit(): void {
    // Click Event
    fromEvent(this.wrapper.nativeElement, 'click')
      .pipe(this.detectEvent(), takeUntil(this.$destroy), tap(console.log))
      .subscribe({
        complete: () => console.log('click completed'),
        error: console.error,
        next: (e: ICardEvent) => {
          this.cardService.$cardEvent.next(e);
          this.focusHandler(e);
        },
      });
  }

  ngOnDestroy() {
    this.$destroy.next(true);
    this.$destroy.unsubscribe();
  }
}
