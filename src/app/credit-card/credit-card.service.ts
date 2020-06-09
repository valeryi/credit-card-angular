import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

export interface ICardEvent {
  type: string;
  surface?: any;
  focus?: IFocus;
  btn?: any;
  event?: Event;
  key?: string;
  state?: ICardState;
  errors?: {
    number?: string;
    expire?: string;
    cvv?: string;
  };
  provider?: string;
  url?: string;
}

export interface IFocus {
  element: {
    name?: string;
    element?: HTMLElement;
  };
  coords?: {
    top: number;
    left: number;
    height: number;
    width: number;
  };
}

export interface IState {
  surface: string;
  focus: string;
  card: ICardState;
  errors?: {
    number?: string;
    expire?: string;
    cvv?: string;
  };
}

export interface ICardState {
  number: string;
  month: string;
  year: string;
  cvv: string;
}

@Injectable({
  providedIn: 'root',
})
export class CreditCardService {
  $cardEvent: BehaviorSubject<ICardEvent> = new BehaviorSubject({
    type: 'stepper',
    surface: 'front',
  });

  state: IState = {
    surface: null,
    focus: null,
    card: {
      number: '',
      month: '',
      year: '',
      cvv: '',
    },
    errors: {
      number: '',
      expire: '',
      cvv: '',
    },
  };

  validation(property: string, error: string): void {
    switch (property) {
      case 'number':
        this.state.errors.number = error;
        break;
      case 'expire':
        this.state.errors.expire = error;
        break;
      case 'cvv':
        this.state.errors.cvv = error;
        break;

      default:
        break;
    }
  }

  updateState(property: string, value: string): ICardState {
    switch (property) {
      case 'number':
        this.state.card.number += value;
        break;
      case 'month':
        this.state.card.month += value;
        break;
      case 'year':
        this.state.card.year += value;
        break;
      case 'cvv':
        this.state.card.cvv += value;
        break;

      default:
        break;
    }

    return this.state.card;
  }

  backspaceState(property: string): ICardState {
    switch (property) {
      case 'number':
        this.state.card.number = this.state.card.number.slice(
          0,
          this.state.card.number.length - 1
        );
        break;
      case 'month':
        this.state.card.month = this.state.card.month.slice(
          0,
          this.state.card.month.length - 1
        );
        break;
      case 'year':
        this.state.card.year = this.state.card.year.slice(
          0,
          this.state.card.year.length - 1
        );

        break;
      case 'cvv':
        this.state.card.cvv = this.state.card.cvv.slice(
          0,
          this.state.card.cvv.length - 1
        );

        break;

      default:
        break;
    }

    return this.state.card;
  }

  resetState(): void {
    this.state = {
      surface: null,
      focus: null,
      card: {
        number: '',
        month: '',
        year: '',
        cvv: '',
      },
      errors: {
        number: '',
        expire: '',
        cvv: '',
      },
    };
  }
}
