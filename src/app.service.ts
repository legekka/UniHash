import { Injectable } from '@nestjs/common';
import { Observable, of } from 'rxjs';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  getHelloObservable(): Observable<string> {
    return of("Hello World Async!");
  }
}
