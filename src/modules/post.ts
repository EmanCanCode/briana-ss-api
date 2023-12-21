import { Express, Request, response, Response } from "express";
import { Mongo } from "./mongo";


export class POST {
    mongo = new Mongo();

    constructor(private app: Express) {
        this.app.post('*', (req, res) => {
            this.proccess(req, res);
        })
    }

    async proccess(req: Request, res: Response) {
        // let domain = req.get('host').split(':')[0];
        let urlArr = req.originalUrl.replace(/^(\/)/, '').split('/');
        let protocol = req.protocol;
        // let cookies = parseCookies(req);
        let GET: any = false;
        if(req.originalUrl.split('?').length > 1){
            GET = {};
            req.originalUrl.split('?')[1].split('&').forEach((keyVal)=>{
                let splitKey: any = keyVal.split('=');
                GET[splitKey[0]] = !isNaN(splitKey[1]) ? Number(splitKey[1]) : decodeURI(splitKey[1]);
            });
        }
        let POST = req.body;
        let action = urlArr[0];
        let options = {
            protocol,
            urlArr,
            POST,
            GET,
            action
        }

        // Get Initial Assets ALWAYS called first.
        switch(urlArr[0]) {
            case "register": {
                try {
                    let result = await this.mongo.createChildren(POST.children);
                    res.status(200).send({ success: true, result });
                } catch(err) {
                    console.trace({ err });
                    res.status(500).send({ success: false, err });
                }
                break;
            }
            case 'login': {
                try {
                    let result = await this.mongo.login(POST.username, POST.password);
                    res.status(200).send({ success: true, result });
                } catch(err) {
                    console.trace({ err });
                    res.status(500).send({ success: false, err });
                }
                break;
            }
            case 'deleteChildren': {
                try {
                    let result = await this.mongo.deleteManyChildren(POST.children);
                    res.status(200).send({ success: true, result });
                } catch(err) {
                    console.trace({ err });
                    res.status(500).send({ success: false, err });
                }
                break;
            }
            case 'deleteChild': {
                try {
                    console.log({ post: POST })
                    let result = await this.mongo.deleteChild(POST.id);
                    res.status(200).send({ success: true, result });
                } catch(err) {
                    console.trace({ err });
                    res.status(500).send({ success: false, err });
                }
                break;
            }
            case 'updateChild': {
                try {
                    let result = await this.mongo.updateChild(POST.child);
                    res.status(200).send({ success: true, result });
                } catch(err) {
                    console.trace({ err });
                    res.status(500).send({ success: false, err });
                }
                break;
            }
        }
    }
}