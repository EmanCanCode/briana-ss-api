import { Express, Request, Response } from 'express';
import { Mongo } from './mongo';
import { ethers } from 'ethers';


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
                case "init": {
                    const registry = await this.mongo.getRegistry().catch(err => {
                        res.status(500).send({ success: false, err });
                    });
                    
                    if (registry) {
                        const admins = await this.mongo.getAdmins().catch(err => {
                            res.status(500).send({ success: false, err });
                        });
                        if (admins) {
                            res.status(200).send({ registry, admins });
                        }
                    }
                    break;
                }
            }

        }
    }
}