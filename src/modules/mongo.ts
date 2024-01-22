
import fs from 'fs-extra';
const path = require('path');
import {MongoClient, Db} from 'mongodb';
import { Child } from '../types/interfaces';
import { Parent } from '../types/interfaces';

const uri = 'mongodb+srv://eman:3ll1pt1cCvrv%23@sundayschool.hrlqdx4.mongodb.net/';

const client = new MongoClient(uri);


export class Mongo {
    dbName: string = "SundaySchool";
    db?: Db;
    ready: boolean = false;

    constructor() {}

    // Connects to server returns promise containing a reference to the database.
    connect(): Promise<Db> {
        return new Promise((resolve, reject) => {
            
            if(!this.db) {
                client.connect().then(() => {
                    console.log("Connected correctly to server");
                    this.db = client.db(this.dbName);
                    console.log("Using Database: ", this.dbName);
                    this.ready = true;
                    resolve(this.db);
                }).catch((err) => {
                    reject(err);
                })
            } else {
                resolve(this.db);
            }
        }) 
    };

    // Closes DB connection
    async close() {
        await client.close();
        this.db = undefined;
        console.log("MongoDB Connection Closed Successfully");
    }

    // Create a new collection with a specific type
    async createCollection(name: string) {
        return new Promise(async (resolve, reject) => {
            await this.connect();
            if (!this.db) {
                await this.close();
                return reject("No DB Connection");
            }
            await this.db.createCollection(name);
            await this.close();
            resolve(`Collection ${name} Created Successfully`);
        });
    }

    // ADMINS

    async createAdmin(
        username: string,
        password: string
    ) {
        return new Promise(async (resolve, reject) => {
            await this.connect();
            if (!this.db) {
                await this.close();
                return reject("No DB Connection");
            }

            let admin = await this.db.collection('admins').findOne({ username }).catch(err => {
                reject(err);
            });

            if(admin) {
                await this.close();
                return;
            }

            let result = await this.db.collection('admins').insertOne({ username, password });
            if(!result) {
                await this.close();
                return reject("Admin Could Not Be Created");
            }

            await this.close();
            resolve(`Admin ${username} Created Successfully`);
        });
    }

    async login(
        username: string,
        password: string
    ) {
        return new Promise(async (resolve, reject) => {
            await this.connect();
            if (!this.db) {
                await this.close();
                return reject("No DB Connection");
            }

            let admin = await this.db.collection('admins').findOne({ username }).catch(err => {
                reject(err);
            });

            if(!admin) {
                await this.close();
                return;
            }

            if(admin.password !== password) {
                await this.close();
                return reject("Incorrect Password");
            }

            await this.close();
            resolve(`Admin ${username} Logged In Successfully`);
        });
    }

    async deleteAdmin(
        username: string
    ) {
        return new Promise(async (resolve, reject) => {
            await this.connect();
            if (!this.db) {
                await this.close();
                return reject("No DB Connection");
            }

            let admin = await this.db.collection('admins').findOne({ username }).catch(err => {
                reject(err);
            });

            if(!admin) {
                await this.close();
                return;
            }

            let result = await this.db.collection('admins').deleteOne({ username }).catch(err => {
                reject(err);
            });

            if(!result) {
                await this.close();
                return;
            }

            await this.close();
            resolve(`Admin ${username} Deleted Successfully`);
        });
    }

    async updateAdmin(
        username: string,
        password: string
    ) {
        return new Promise(async (resolve, reject) => {
            await this.connect();
            if (!this.db) {
                await this.close();
                return reject("No DB Connection");
            }

            let admin = await this.db.collection('admins').findOne({ username }).catch(err => {
                reject(err);
            });

            if(!admin) {
                await this.close();
                return;
            }

            let result = await this.db.collection('admins').updateOne({ username }, { $set: { password } }).catch(err => {
                reject(err);
            });

            if(!result) {
                await this.close();
                return;
            }

            await this.close();
            resolve(`Admin ${username} Updated Successfully`);
        });
    }

    // Registry

    async createChild(
        child: Child
    ) {
        return new Promise(async (resolve, reject) => {
            await this.connect();
            if (!this.db) {
                await this.close();
                return reject("No DB Connection");
            }

            let result = await this.db.collection('registry').insertOne(child).catch(err => {
                reject(err);
            });

            if(!result) {
                await this.close();
                return;
            }

            await this.close();
            resolve(`Child ${child.first_name} ${child.last_name} Created Successfully`);
        });
    }

    async createChildren(
        children: Child[]
    ) {
        return new Promise(async (resolve, reject) => {
            await this.connect();
            if (!this.db) {
                await this.close();
                return reject("No DB Connection");
            }

            let result = await this.db.collection('registry').insertMany(children).catch(err => {
                reject(err);
            });

            if(!result) {
                await this.close();
                return;
            }

            await this.close();
            resolve(`Children Created Successfully`);
        });
    }

    // sounds a little dark, but bear with me... 🤣
    async deleteChild(
        id: string
    ) {
        return new Promise(async (resolve, reject) => {
            await this.connect();
            if (!this.db) {
                await this.close();
                return reject("No DB Connection");
            }
            
            // find child
            let found_child = await this.db.collection('registry').findOne({ id });
            console.log(found_child);
            // delete child
            await this.db.collection('registry').deleteOne({ id });
            // let result = await this.db.collection('registry').deleteOne({ id: child.id }).catch(err => {
            //     reject(err);
            // });

            // if(!result || result.deletedCount === 0) {
            //     await this.close();
            //     return;
            // }

            await this.close();
            resolve('nice')
            // resolve(`Child ${child.first_name} ${child.last_name} Deleted Successfully`);
        });
    }

    async deleteManyChildren(
        children: Child[]
    ) {
        return new Promise(async (resolve, reject) => {
            await this.connect();
            if(!this.db) {
                await this.close();
                return reject("No DB Connection");
            }

            let result = await this.db.collection('registry').deleteMany(children).catch(err => {
                reject(err);
            });

            if(!result || result.deletedCount === 0) {
                await this.close();
                return;
            }

            await this.close();
            resolve(`Children Deleted Successfully`);
        });
    }

    async updateChild(newChild: Child) {
        return new Promise(async (resolve, reject) => {
            await this.connect();
            if (!this.db) {
                await this.close();
                return reject("No DB Connection");
            }
    
            let foundChild = await this.db.collection('registry').findOne({ id: newChild.id }).catch(err => {
                reject(err);
            });
    
            if(!foundChild) {
                await this.close();
                return;
            }
    
            // Create a copy of newChild without the '_id' field
            const updateData: any = {...newChild};
            delete updateData._id;  // Remove the _id field
    
            let result = await this.db.collection('registry').updateOne({ id: newChild.id }, { $set: updateData }).catch(err => {
                reject(err);
            });
    
            if(!result) {
                await this.close();
                return;
            }
    
            await this.close();
            resolve(`Child ${foundChild.first_name} ${foundChild.last_name} Updated Successfully`);
        });
    }
    

    // GETTERS

    async getRegistry() {
        return new Promise(async (resolve, reject) => {
            await this.connect();
            if(!this.db) {
                await this.close();
                return reject("No DB Connection");
            }

            let result = await this.db.collection('registry').find().toArray().catch(err => {
                reject(err);
            });

            if(!result) {
                await this.close();
                return;
            }

            await this.close();
            resolve(result);
        });
    }

    async getAdmins() {
        return new Promise(async (resolve, reject) => {
            await this.connect();
            if(!this.db) {
                await this.close();
                return reject("No DB Connection");
            }

            let result = await this.db.collection('admins').find().toArray().catch(err => {
                reject(err);
            });

            if(!result) {
                await this.close();
                return;
            }

            await this.close();
            resolve(result);
        });
    }
}
 