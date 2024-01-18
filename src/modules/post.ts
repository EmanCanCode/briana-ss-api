import { Express, Request, response, Response } from "express";
import { Mongo } from "./mongo";
import { IUser, LoginCredentials, SendTxForm } from "../types/interfaces";
import { AI } from "./ai";
import { Chain } from "./chain";
import { decrypt } from 'eciesjs';

export class POST {
    mongo = new Mongo();
    ai = new AI();
    chain = new Chain();
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
        if (req.originalUrl.split('?').length > 1) {
            GET = {};
            req.originalUrl.split('?')[1].split('&').forEach((keyVal) => {
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
        switch (urlArr[0]) {
            case 'login': {
                const { encrypted } = POST;
                const decrypted = decrypt(process.env.SERVER_SECRET!.slice(2), Buffer.from(encrypted, 'base64')).toString('utf-8');
                const loginCredentials = JSON.parse(decrypted) as LoginCredentials;
                const user = await this.mongo.login(loginCredentials).catch(err => { // lil err handling here
                    console.log(err);
                    res.status(500).send(err);
                });
                if (!user) return;
                else res.status(200).send({ user });
                break;
            }
            case 'sendTx': {
                // todo: find a more secure way to pass the lat,lng,time to the server
                const { _id, spacial, txEncrypted } = POST as SendTxForm;
                try {
                    // todo: //     -----     handle facial auth     -----     //

                    //     -----     handle spacial auth     -----     //

                    // get user last spacial data
                    const user: IUser = await this.mongo.getUser(_id);
                    const { lastSpacial } = user;

                    // determine if current spacial data is reasonable to the last spacial data
                    const isReasonable = await this.ai.isReasonableDistanceTraveled(
                        lastSpacial,
                        spacial
                    );
                    if (!isReasonable) {
                        res.status(401).send('Spacial Auth(): Distance traveled is not reasonable');
                        return;
                    }
                    
                    // send tx to blockchain
                    const { txHash } = await this.chain.sendTx(
                        _id,
                        user.address,
                        txEncrypted
                    )
                    res.status(200).send({ txHash });
                } catch (err) {
                    res.status(500).send(err);
                }
                break;
            }
            case 'createUser': {
                try {
                    const { encryption } = POST;
                    const decrypted = decrypt(process.env.SERVER_SECRET!.slice(2), Buffer.from(encryption, 'base64')).toString('utf-8');
                    const user = JSON.parse(decrypted) as IUser;
                    const userId = await this.mongo.createUser(user);
                    res.status(200).send({ userId });
                } catch (err) {
                    res.status(500).send(err);
                }
                break;
            }
        }
    }
}