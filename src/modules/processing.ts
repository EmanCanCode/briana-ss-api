import fs from 'fs-extra';
import { CollectionInfo, Cities, RarityAttribute, ChainAsset, AssetRarity, AssetRarityExtended, CollMetaData } from '../types/interfaces';

const path = require('path');
const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore');

const serviceAccount = require('../../assets/serviceAccount.json');


initializeApp({ credential: cert(serviceAccount) });

const db = getFirestore();


export class Process {
    totalAtrSum: {[key: string]: {[key:string]: number}} = {}; 

    constructor() {}

    async gatherPoolCounts() {
        let data: CollectionInfo = await fs.readJSON(path.join(global.paths.root, "assets/asset_headcount.json"));
        
        let counts: any = {
            atlanta: 0,
            chicago: 0,
            distric_of_columbia: 0,
            grand_rapids: 0,
            new_york: 0,
            huston: 0,
            los_angeles: 0
        };
        
        for (var key of Object.keys(data.cities)) {
            let city = data.cities[key as keyof Cities];
            for (var asset of city.assets) {
                if (asset.data) {
                    if(asset.owner == 'airwire') {
                        counts[key] += 1;
                    }
                    
                }
            }
        }

        console.log(counts);
    }

    async process() {
        console.log("---------- Processing Starts Here ----------");
        
        let data: CollectionInfo = await fs.readJSON(path.join(global.paths.root, "assets/asset_headcount.json"));
       

        console.log("---------- Gathering Counts of All Attributes ----------");
        // console.log(data.cities.atlanta.assets[0]);
        let ignoredAttr = ['name', 'file', 'video'];
        let assets: ChainAsset[] = [];

        for (var key of Object.keys(data.cities)) {
            let city = data.cities[key as keyof Cities];
            // For each asset, add count of each rolled attribute to totalAtrSum

            for (var asset of city.assets) {
                if (asset.data) {
                    assets.push(asset);
                    for (var [attribute, value] of Object.entries(<{[key: string]: string}>asset.data)) {
                        let setCount = () => {
                            let v = value.toLowerCase()
                            if(this.totalAtrSum[attribute][v]) {
                                this.totalAtrSum[attribute][v] += 1;
                            } else {
                                this.totalAtrSum[attribute][v] = 1;
                            }
                        };
                        if (!ignoredAttr.includes(attribute)){
                            if (!this.totalAtrSum[attribute]) {
                                this.totalAtrSum[attribute] = {};
                                setCount();
                            } else {
                                setCount();
                            }
                        }
                    }
                }
            }
        }

        let assetRarityResults: AssetRarity[] = [];

        for(let asset of assets) {
            let temp: {[key: string]: RarityAttribute} = {};
            let totalRarity = 0;

            for (var [attribute, value] of Object.entries(<{[key: string]: string}>asset.data)) {
                let v = value.toLowerCase();
                if (!ignoredAttr.includes(attribute)){
                    let attrCount = this.totalAtrSum[attribute][v];
                    let percentage = attrCount / data.info.total * 100;
                    let rarity = +((100 - percentage) * Math.PI).toFixed(0);   
                    totalRarity += rarity;
                    temp[attribute] = {
                        value,
                        percentage,
                        rarity
                    }
                } else {
                    temp[attribute] = {
                        value,
                        percentage: 0,
                        rarity: 0
                    };
                }
            }
            
            assetRarityResults.push({
                asset_id: asset.asset_id,
                totalRarity,
                collection_name: asset.collection_name,
                owner: asset.owner,
                rarity: temp
            })
        }
        assetRarityResults = assetRarityResults.sort((a, b) => {
            return a.totalRarity > b.totalRarity? -1 : b.totalRarity > a.totalRarity ? 1 : 0;
        })

        for (let i = 0; i < assetRarityResults.length; i++) {
            assetRarityResults[i].rank = i + 1;
        }

        // **** Uncomment to write new file ****
        // fs.writeJSON(path.join(global.paths.root, 'rarified.json'), assetRarityResults).catch((err: any) => {
        //     console.log(err);
        // });
        
        // console.log(this.totalAtrSum);
    }
    
    // FROM JSON --> Firebase
    // Collection (monumintal) --> Each DOC is an individual asset.
    async insertDataToFire() {
        let collectionName: string = 'monumintal';
        let data: any = await fs.readJSON(path.join(global.paths.root, "assets/monumintal_rarified.json"));
        let collection = data.monumintal;
        let info = this.generateCollMetaData(collection);
        
        for (let asset of collection) {
            // let assetRef = db.collection('collections').doc(asset.rarity?.name.value);
            let assetRef = db.collection('collections').doc('monumintal').collection('assets').doc(asset.asset_id);
            await assetRef.set(asset);
        }

        db.collection('collections').doc('monumintal').update(info);


        console.log("-----  Done writing to Firestore -----");
        //console.log("Done"); 
    }

    async modifyStructure() {
        let data = await fs.readJSON(path.join(global.paths.root, "assets/rarified.json"));
        let collection: AssetRarity[] = data.monumintal;
        let results: any = {
            "monumintal": []
        };
        
        for( let asset of collection) { 
            let tmp: AssetRarityExtended = Object.assign({}, asset);
            if(asset.rarity) {
                let numAttr = 0;
                for (const [k, v] of Object.entries(asset.rarity)) {
                    
                    tmp['attr:' +  k] = v.value;
                    if (v.value != '' && v.value != 'none' && v.value != 'None' && k != 'name' && k != 'file' && k != 'video') {
                        numAttr += 1;
                    }
                }
                tmp['numAttr'] = numAttr;
            }

            results.monumintal.push(tmp);
        }

        fs.writeJSON(path.join(global.paths.root, 'assets/monumintal_rarified.json'), results).catch((err: any) => {
            console.log(err);
        });
    }

    generateCollMetaData (collection: AssetRarityExtended[]): CollMetaData {
        let info: CollMetaData = {
            name: 'monumintal',
            numAssets: collection.length,
            attributes: {}
        };
        let ignoredAttr = {'attr:name': 0, 'attr:file': 0, 'attr:video': 0};

        for (let asset of collection) {
            for(let [key, val] of Object.entries(asset)) {
                if(key.includes('attr') && !(key in ignoredAttr)) {
                    let attr = key.split(':')[1];
                    attr = attr.replace(' ', '_');
                    
                    // Check if attr i.e.. 'background' exists
                    if(!info.attributes[attr]) {
                        info.attributes[attr] = {};
                    }

                    if(info.attributes[attr][val]) {
                        info.attributes[attr][val] += 1;
                    }else {
                        if(val == '') {
                            info.attributes[attr]['none'] = 1;
                        } else {
                            info.attributes[attr][val] = 1;
                        }
                    }
                }
            }
        }

        return info;
    }
}

