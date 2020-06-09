import {
  Component,
  AfterViewInit,
  ViewChild,
  ElementRef,
  OnDestroy,
} from '@angular/core';
import { takeUntil, map, filter, startWith } from 'rxjs/operators';
import { Subject, OperatorFunction, fromEvent, Observable } from 'rxjs';
import {
  CreditCardService,
  ICardEvent,
  ICardState,
} from '../credit-card.service';

@Component({
  selector: 'app-card-front',
  templateUrl: './card-front.component.html',
  styleUrls: ['./card-front.component.scss'],
})
export class CardFrontComponent implements AfterViewInit, OnDestroy {
  @ViewChild('cardNumberEl') cardNumber: ElementRef;
  @ViewChild('expireEl') expire: ElementRef;

  numberPlaceholder = '0';
  numberSectionAmount = new Array(4);
  $destroy: Subject<boolean> = new Subject();
  $cardNumber: Observable<ICardEvent>;
  $cardExpire: Observable<ICardEvent>;
  $cardProvider: Observable<ICardEvent>;
  private validCards = [
    { number: '4141', provider: 'visa', url: 'assets/img/visa_logo.png' },
    {
      number: '5141',
      provider: 'mastercard',
      url: 'assets/img/mastercard_logo.png',
    },
  ];

  constructor(private cardService: CreditCardService) {
    this.$cardNumber = this.cardService.$cardEvent.pipe(
      filter(
        (event: ICardEvent) =>
          (event.type === 'typing' && event.focus.element?.name === 'number') ||
          event.type === 'backspace'
      ),
      startWith({ type: 'typing' })
    );

    this.$cardExpire = this.cardService.$cardEvent.pipe(
      filter(
        (event: ICardEvent) =>
          (event.type === 'typing' && event.focus.element?.name === 'expire') ||
          event.type === 'backspace'
      ),
      startWith({ type: 'typing' })
    );

    this.$cardProvider = this.cardService.$cardEvent.pipe(
      filter((event: ICardEvent) => event.type === 'provider'),
      startWith({ type: 'provider' })
    );
  }

  ngAfterViewInit(): void {
    // Card Number Event Listener
    fromEvent(this.cardNumber.nativeElement, 'keydown')
      .pipe(
        map((event: Event) => {
          event.preventDefault();
          return event;
        }),
        filter(
          (event: KeyboardEvent) =>
            (this.cardService.state.card.number.length < 16 &&
              /[0-9]/i.test(event.key)) ||
            /^(\bBackspace\b)/i.test(event.code)
        ),
        this.formatTypingEvent(),
        takeUntil(this.$destroy)
      )
      .subscribe({
        error: console.error,
        next: (e: ICardEvent) => {
          let updated: ICardState;

          if (e.type === 'typing') {
            updated = this.cardService.updateState(e.focus.element.name, e.key);
          } else if (e.type === 'backspace') {
            updated = this.cardService.backspaceState(e.focus.element.name);
          }

          if (
            this.cardService.state.card.number.length >=
            this.numberSectionAmount.length
          ) {
            this.cardValidation(
              this.cardService.state.card.number.slice(
                0,
                this.numberSectionAmount.length
              )
            );
          }

          this.cardService.$cardEvent.next({
            ...e,
            state: updated,
            errors: this.cardService.state.errors,
          });
        },
      });

    // Card Expire Event Listener
    fromEvent(this.expire.nativeElement, 'keydown')
      .pipe(
        map((event: Event) => {
          event.preventDefault();
          return event;
        }),
        filter(
          (event: KeyboardEvent) =>
            (this.cardService.state.card.month.length +
              this.cardService.state.card.year.length <
              4 &&
              /[0-9]/i.test(event.code)) ||
            /^(\bBackspace\b)/i.test(event.code)
        ),
        this.formatTypingEvent(),
        takeUntil(this.$destroy)
      )
      .subscribe({
        error: console.error,
        next: (e: ICardEvent) => {
          let updated: ICardState;
          const currentYear = +new Date()
            .getUTCFullYear()
            .toString()
            .slice(2, 4);
          const currentMonth = new Date().getMonth() + 1;

          // Restore validation state
          this.cardService.validation('expire', '');

          if (e.type === 'typing') {
            // Month
            if (!(this.cardService.state.card.month.length >= 2)) {
              if (
                this.cardService.state.card.month.length === 0 &&
                +e.key >= 2
              ) {
                updated = this.cardService.updateState('month', '0' + e.key);
              } else if (
                this.cardService.state.card.month.length === 0 &&
                +e.key <= 2
              ) {
                updated = this.cardService.updateState('month', e.key);
              } else if (
                this.cardService.state.card.month.length === 1 &&
                +e.key > 0
              ) {
                if (!(+e.key > 2)) {
                  updated = this.cardService.updateState('month', e.key);
                }
              } else if (
                this.cardService.state.card.month.length === 1 &&
                +this.cardService.state.card.month !== 0 &&
                +e.key <= 2
              ) {
                updated = this.cardService.updateState('month', e.key);
              }

              // Year
            } else if (!(this.cardService.state.card.year.length >= 2)) {
              if (
                this.cardService.state.card.year.length === 1 &&
                +(this.cardService.state.card.year + e.key) > currentYear
              ) {
                updated = this.cardService.updateState('year', e.key);
              } else if (
                this.cardService.state.card.year.length === 1 &&
                +(this.cardService.state.card.year + e.key) <= currentYear
              ) {
                if (+this.cardService.state.card.month > currentMonth) {
                  updated = this.cardService.updateState('year', e.key);
                } else {
                  updated = this.cardService.updateState('year', e.key);
                  this.cardService.validation(
                    'expire',
                    'current credit card is expired'
                  );
                  console.error('current credit card is expired');
                }
              } else if (this.cardService.state.card.year.length === 0) {
                if (+e.key <= 1) {
                  updated = this.cardService.updateState('year', e.key);
                  this.cardService.validation(
                    'expire',
                    'current credit card is expired'
                  );
                  console.error('current credit card is expired');
                } else {
                  updated = this.cardService.updateState('year', e.key);
                }
              }
            }
          } else {
            this.cardService.state.card.year.length
              ? (updated = this.cardService.backspaceState('year'))
              : (updated = this.cardService.backspaceState('month'));
          }

          if (updated) {
            this.cardService.$cardEvent.next({
              ...e,
              state: updated,
              errors: this.cardService.state.errors,
            });
          }
        },
      });
  }

  private formatTypingEvent(): OperatorFunction<Event, ICardEvent> {
    return map((event: KeyboardEvent) => {
      event.preventDefault();
      const n = event.key;

      if (n !== 'Backspace') {
        return {
          type: 'typing',
          key: n,
          focus: {
            element: {
              name: (event.target as HTMLElement).dataset.focus,
              element: event.target as HTMLElement,
            },
          },
          event,
        };
      } else {
        return {
          type: 'backspace',
          focus: {
            element: {
              name: (event.target as HTMLElement).dataset.focus,
              element: event.target as HTMLElement,
            },
          },
          event,
        };
      }
    });
  }

  getInputOrder(section: number, position: number): number {
    return section * this.numberSectionAmount.length + position + 1;
  }

  getNumber(position: number): number {
    return +this.cardService.state.card.number.split('')[position];
  }

  cardValidation(cardNumber: string) {
    const result = this.validCards.filter(
      (c: any) => c.number === cardNumber
    )[0];

    if (result) {
      this.cardService.validation('number', '');
      this.cardService.$cardEvent.next({
        type: 'provider',
        provider: result.provider,
        url: result.url,
        state: this.cardService.state.card,
      });

      return result;
    }

    this.cardService.validation('number', 'Card number is not valid');
  }

  logoToggle(): boolean {
    if (
      this.cardService.state.card.number.length > 4 &&
      (!this.cardService.state.errors.number ||
        /(16)/i.test(this.cardService.state.errors.number))
    ) {
      return true;
    }

    return false;
  }

  ngOnDestroy(): void {
    this.$destroy.next(true);
    this.$destroy.unsubscribe();
  }
}
