import { Algorithm } from "./algorithm.enum";

export interface Speed {
    algorithm: Algorithm;
    title: string;
    speed: number;
    displaySuffix: string;
}