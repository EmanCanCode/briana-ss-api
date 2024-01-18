import { Express, Request, Response } from 'express';
import { Mongo } from './mongo';
import { AI } from './ai';
import { ISpacial } from '../types/interfaces';


export class GET {
    mongo = new Mongo();
    constructor(private app: Express) {
        this.app.get("*", (req, res) => {
            this.proccess(req, res);
        })

        
    }

    async proccess(req: Request, res: Response) {
        // split the request domain
        if(req && res) {
            // var domain = req.get('host').split(':')[0];
    
            // split url into array eg: domain.com/account/settings -> ["account", "settings"] 
            var urlArr = req.originalUrl.split('?')[0].replace(/^\/+|\/+$/g, '').split('/');
            // parse get peramiters
            var GET: any = req.query;
    
            // http or https
            var protocol = req.protocol;
            // load clinet details
    
            // res.send('ok');

            console.log({
                urlArr,
                GET,
                protocol
            })

            switch(urlArr[0]) {
                case "test": {
                    const ai = new AI();
                    const last: ISpacial = { // brooklyn ny
                        lat: "40.652601",
                        lng: "-73.949721",
                        time: "2023-06-18T00:00:00"
                    };
                    const current: ISpacial = {
                        lat: "34.898622",
                        lng: "-117.024431",
                        time: "2023-06-18T08:00:00"
                    };
                    await ai.isReasonableDistanceTraveled(last, current);
                    res.status(200).send({ response: "ok" });
                    break;
                }
            }

        }
    }
}