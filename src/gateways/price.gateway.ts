import { WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { filter } from "rxjs/operators";
import { Server } from "socket.io";
import { CoinbaseService } from "src/services/coinbase/coinbase.service";

@WebSocketGateway()
export class PriceGateway {

    @WebSocketServer()
    server: Server;

    constructor(
        coinbaseService: CoinbaseService
    ) {
        coinbaseService.getPriceSource().subscribe(priceData => {
            this.server.emit('price', priceData);
        });
    }

}