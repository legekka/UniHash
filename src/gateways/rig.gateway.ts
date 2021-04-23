import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer, WsResponse } from "@nestjs/websockets";
import { filter } from "rxjs/operators";
import { Server } from "socket.io";
import { RigMonitorService } from "src/services/rig-monitor/rig-monitor.service";

@WebSocketGateway()
export class RigGateway {

    @WebSocketServer()
    server: Server;

    constructor(
        rigMonitorService: RigMonitorService
    ) {
        rigMonitorService.getRigMiningDetailsStream().pipe(
            filter(() => Object.keys(this.server.clients().sockets).length > 0)
        ).subscribe(rigMiningDetailsList => {
            this.server.emit('events', rigMiningDetailsList);
        });
    }

}