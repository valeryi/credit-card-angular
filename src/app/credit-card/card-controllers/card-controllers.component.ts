import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { CreditCardService, ICardEvent, IState } from '../credit-card.service';
import { Observable, Subject } from 'rxjs';
import { filter, takeUntil, startWith, map } from 'rxjs/operators';
import { shuffle } from 'lodash';
import { NotifierService } from 'src/app/notifier/notifier.service';

@Component({
  selector: 'app-card-controllers',
  templateUrl: './card-controllers.component.html',
  styleUrls: ['./card-controllers.component.scss'],
})
export class CardControllersComponent implements AfterViewInit, OnDestroy {
  $stepperEvent: Observable<ICardEvent>;
  $focusEvent: Observable<ICardEvent>;
  $cvvEvent: Observable<ICardEvent>;
  $destroy: Subject<boolean> = new Subject();
  state: IState;
  clickCounter = 0;
  loading = false;

  numbers = [
    { order: '1' },
    { order: '2' },
    { order: '3' },
    { order: '4' },
    { order: '5' },
    { order: '6' },
    { order: '7' },
    { order: '8' },
    { order: '9' },
    { order: '0' },
  ];

  constructor(private cardService: CreditCardService, private notifier: NotifierService) {
    this.$stepperEvent = this.cardService.$cardEvent.pipe(
      filter((event: ICardEvent) => event.type === 'stepper'),
      startWith({ type: 'stepper', surface: 'front' })
    );

    this.$focusEvent = this.cardService.$cardEvent.pipe(
      filter(
        (event: ICardEvent) => event.type === 'focus' || event.type === 'blur'
      ),
      startWith({ type: 'focus' })
    );

    this.$cvvEvent = this.cardService.$cardEvent.pipe(
      map((event: ICardEvent) => {


        if (/[0-9]/i.test(event.btn)) {
          this.clickCounter++;
          if (this.clickCounter === 3) {
            this.clickCounter = 0;
            this.cardService.$cardEvent.next({ type: 'blur' });
          }
        }

        return event;
      }),
      filter((event: ICardEvent) => event.type === 'cvv'),
      startWith({ type: 'cvv' })
    );

    this.state = this.cardService.state;
  }

  ngAfterViewInit(): void {
    this.shuffleNumbers();
    this.cardService.$cardEvent
      .pipe(
        filter(
          (e: ICardEvent) =>
            (e.type === 'cvv' && this.cardService.state.card.cvv.length < 3) ||
            e.btn === 'erase'
        ),
        takeUntil(this.$destroy),
      )
      .subscribe({
        error: console.error,
        next: this.cvvHandler.bind(this),
      });
  }

  private shuffleNumbers(): void {
    this.numbers = shuffle(this.numbers);
  }

  private cvvHandler(event: ICardEvent) {
    const { btn } = event;

    if (btn !== 'erase') {
      this.shuffleNumbers();

      this.cardService.updateState('cvv', btn);

      if (this.cardService.state.card.cvv.length === 3) {
        this.cardService.state.focus = null;
      }
    } else {
      this.cardService.backspaceState('cvv');
    }

  }

  cardBackValidation(): boolean {
    if (
      this.cardFrontValidation() ||
      this.cardService.state.errors.cvv.length ||
      this.cardService.state.card.cvv.length < 3
    ) {
      return true;
    }

    return false;
  }

  cardFrontValidation(): boolean {
    if (
      this.cardService.state.errors.number.length ||
      this.cardService.state.errors.expire.length ||
      this.cardService.state.card.number.length < 16 ||
      this.cardService.state.card.month.length < 2 ||
      this.cardService.state.card.year.length < 2
    ) {
      return true;
    }

    return false;
  }

  submit(): void {
    this.loading = true;
    console.log('card details: ', this.cardService.state.card);

    setTimeout(() => {
      this.loading = false;
      this.notifier.$notifierEvent.next({message: 'Your card details accepted!'});

      this.cardService.$cardEvent.next({
        type: 'typing',
        focus: {
          element: {
            name: 'number',
          },
        },
      });
      this.cardService.$cardEvent.next({
        type: 'typing',
        focus: {
          element: {
            name: 'expire',
          },
        },
      });
      this.cardService.$cardEvent.next({ type: 'stepper', surface: 'front' });
      this.cardService.$cardEvent.next({ type: 'cvv', btn: 'erase' });
      this.cardService.resetState();
    }, 2000);
  }

  ngOnDestroy(): void {
    this.$destroy.next(true);
    this.$destroy.unsubscribe();
  }
}
