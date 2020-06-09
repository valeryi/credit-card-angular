import { Component } from '@angular/core';
import { CreditCardService, ICardEvent, IState } from '../credit-card.service';
import { Observable } from 'rxjs';
import { filter, startWith, tap } from 'rxjs/operators';

@Component({
  selector: 'app-card-back',
  templateUrl: './card-back.component.html',
  styleUrls: ['./card-back.component.scss'],
})
export class CardBackComponent {
  $cvvEvent: Observable<ICardEvent>;
  $focusEvent: Observable<ICardEvent>;
  state: IState;

  constructor(private cardService: CreditCardService) {
    this.state = this.cardService.state;
    this.$cvvEvent = this.cardService.$cardEvent.pipe(
      filter((event: ICardEvent) => event.type === 'cvv'),
      startWith({ type: 'cvv' })
    );

    // this.$focusEvent = this.cardService.$cardEvent.pipe(
    //   filter(
    //     (event: ICardEvent) => event.type === 'focus' || event.type === 'blur'
    //   ),
    //   startWith({ type: 'focus' })
    // );

  }
}
