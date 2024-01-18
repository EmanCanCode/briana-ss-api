
import fs from 'fs-extra';
const path = require('path');
import {MongoClient, Db} from 'mongodb';
import { ISpacial, IUser, LoginCredentials } from '../types/interfaces';

const uri = 'mongodb+srv://eman:3ll1pt1cCvrv%23@serverlessinstance0.zntjh3q.mongodb.net/';
const client = new MongoClient(uri);

// okay the only reason why i use try catches is so i can go faster, i should update to get more specific errors and handle them better
export class Mongo {
    dbName: string = "dl";
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

    async getUser(_id: any) {
        try {
            const db = await this.connect();
            const users = db.collection<IUser>('users');
            const user = await users.findOne<IUser>({ _id });
            await this.close();
            if (!user) {
                console.log("User does not exist");
                throw new Error("User does not exist");
            }
            return user;
        } catch (err) {
            console.log("Error: ", err);
            await this.close();
            throw err; // rethrow the error to be handled by the caller
        }
    }

    // create user
    async createUser(user: IUser) {
        try {
            const db = await this.connect();
            const collection = db.collection<IUser>('users');
            const result = await collection.insertOne(user);
            await this.close();
            console.log("Inserted User: ", result.insertedId);
            return result.insertedId;
        } catch (err) {
            console.log("Error: ", err);
            await this.close();
            throw err; // rethrow the error to be handled by the caller
        }
    }
    
    // update user
    async updateUser(user: IUser) {
        try {
            const db = await this.connect();
            const collection = db.collection<IUser>('users');
    
            // determine if user exists
            const exists = await collection.findOne({ _id: user._id });
            if (!exists) {
                console.log("User does not exist");
                await this.close();
                throw new Error("User does not exist");
            }
    
            // update user
            const { _id, ...userWithoutId } = user; // remove _id from user object
            const result = await collection.updateOne({ _id: user._id }, { $set: userWithoutId });
            await this.close();
            console.log("Updated User: ", result.modifiedCount);
            return result.modifiedCount;
        } catch (err) {
            console.log("Error: ", err);
            await this.close();
            throw err; // rethrow the error to be handled by the caller
        }
    }
    
    // delete user
    async deleteUser(user: IUser) {
        try {
            const db = await this.connect();
            const collection = db.collection<IUser>('users');
            
            // determine if user exists
            const userExists = await collection.findOne({ _id: user._id });
            if (!userExists) {
                console.log("User does not exist");
                await this.close();
                throw new Error("User does not exist");
            } 
    
            // delete user
            const result = await collection.deleteOne({ _id: user._id });
            await this.close();
            console.log("Deleted User: ", result.deletedCount);
            return result.deletedCount;
        } catch (err) {
            console.log("Error: ", err);
            await this.close();
            throw err; // rethrow the error to be handled by the caller
        }
    }
    
    // login
    async login(
        LoginCredentials: LoginCredentials
    ): Promise<Omit<IUser, "password">> {
        try {
            const db = await this.connect();
            const collection = db.collection<IUser>('users');
    
            // determine if user exists
            const user = await collection.findOne<IUser>({ username: LoginCredentials.username });
            await this.close();

            if (!user) {
                console.log("User does not exist");
                throw new Error("User does not exist");
            }
    
            // check password
            if (user.password !== LoginCredentials.password) {
                console.log("Incorrect Password");
                throw new Error("Incorrect Password");
            }
            const { password, ...userWithoutPassword } = user;
            return userWithoutPassword;
        } catch (err) { // handle errors
            console.log("Error: ", err);
            await this.close();
            throw err; // rethrow the error to be handled by the caller
        }
    }

    // edit user spacial data
    async updateSpacial(
        spacial: ISpacial,
        _id: any  // user id
    ) {
        try {
            const db = await this.connect();
            const collection = db.collection<IUser>('users');
            // update user
            const result = await collection.updateOne({ _id }, { $set: { lastSpacial: spacial } });
            await this.close();
            console.log("Updated User Spacial: ", result.modifiedCount);
            return true;
        } catch (err) {
            console.log("Error: ", err);
            await this.close();
            throw err; // rethrow the error to be handled by the caller
        }
    }

    // get spacial data
    async getSpacial(
        _id: any  // user id
    ) {
        try {
            const db = await this.connect();
            const users = db.collection<IUser>('users');
            const user = await users.findOne<IUser>({ _id });
            await this.close();
            if (!user) {
                console.log("User does not exist");
                throw new Error("User does not exist");
            }
            return user.lastSpacial;
        } catch (err) {
            console.log("Error: ", err);
            await this.close();
            throw err; // rethrow the error to be handled by the caller
        }
    }

    // get facial data
    async getFacial(
        _id: any  // user id
    ) {
        try {
            const db = await this.connect();
            const collection = db.collection<ISpacial>('facial');
            const result = await collection.findOne<ISpacial>({ _id });
            await this.close();
            if (!result) {
                console.log("Facial does not exist");
                throw new Error("Facial does not exist");
            }
            console.log("Got Facial: ", result);
            return result;
        } catch (err) {
            console.log("Error: ", err);
            await this.close();
            throw err; // rethrow the error to be handled by the caller
        }
    }
}
 