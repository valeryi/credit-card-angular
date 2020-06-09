import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { CreditCardComponent } from './credit-card/credit-card.component';
import { CardFrontComponent } from './credit-card/card-front/card-front.component';
import { CardBackComponent } from './credit-card/card-back/card-back.component';
import { CardControllersComponent } from './credit-card/card-controllers/card-controllers.component';

import { environment } from 'src/environments/environment';
import { AngularFireModule } from '@angular/fire';
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { NotifierComponent } from './notifier/notifier.component';

@NgModule({
  declarations: [
    AppComponent,
    CreditCardComponent,
    CardFrontComponent,
    CardBackComponent,
    CardControllersComponent,
    NotifierComponent,
  ],
  imports: [
    BrowserModule,
    AngularFireModule.initializeApp(environment.firebaseConfig),
    AngularFirestoreModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
