import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

interface INotifier {
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class NotifierService {
  $notifierEvent: Subject<INotifier> = new Subject();

  constructor() {}
}
