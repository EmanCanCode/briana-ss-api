import OpenAI from "openai";
import 'dotenv/config';
import { ISpacial } from "../types/interfaces";


export class AI {

    constructor() {}
    
    ai = new OpenAI({
        apiKey: process.env.API_KEY
    });

    async isReasonableDistanceTraveled(lastSpacial: ISpacial, currentSpacial: ISpacial) {
        try {
            const completion = await this.ai.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: "While only responding 'yes' or 'no', determine if the distance traveled between two spatial points is reasonable. Use the following data: \n - Last Spatial Data: " + JSON.stringify(lastSpacial) + "\n - Current Spatial Data: " + JSON.stringify(currentSpacial)
                    },
                ],
                model: "gpt-4-1106-preview",
            });
            if (completion.choices[0].message.content === 'Yes.') return true;
            else return false;
        } catch (err) {
            console.log("Error: ", err);
            throw err;
        }
    }
    
}