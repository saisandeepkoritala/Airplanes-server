const axios = require("axios");
const express = require("express");
const { MongoClient } = require('mongodb');
const querystring = require("querystring");
const cors = require("cors");

const app = express();
let accessToken = null;

app.use(express.json());
app.use(cors());

const getAccessToken = async (req, res, next) => {
    if (!accessToken) {
        try {
            const response = await axios.post("https://test.api.amadeus.com/v1/security/oauth2/token", querystring.stringify({
                grant_type: "client_credentials",
                client_id: "VsxMOAbDHsVYF7LMJMjwgH2dnnhzeOZv",
                client_secret: "5BK8XNAdbMI5gCUg"
            }));
            accessToken = response.data.access_token;
        } catch (error) {
            console.error("Error obtaining access token:", error);
            return res.status(500).json({
                status: "error",
                message: "An error occurred while obtaining access token"
            });
        }
    }
    next();
};

const uri = "mongodb+srv://saisandeepkoritala:SaiSandeep@cluster0.9tcswrz.mongodb.net";
const dbName = 'Airpot3'; 
const collectionName = 'AirpotData'; 
const client = new MongoClient(uri);

app.get('/getData', async (req, res) => {
    try {
        await client.connect();
        const database = client.db(dbName);
        const collection = database.collection(collectionName);
        const documents = await collection.find({}).toArray(); 
        res.json(documents);

    } catch (error) {
        console.error('Error occurred:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
    });


app.post("/getInfo", getAccessToken, async (req, res, next) => {
    console.log("token is",accessToken)
    console.log("body is ",req.body)
    const {originLocationCode,destinationLocationCode,formattedDate,formattedDepDate} = req.body;
    try {
        let response;
        if(!formattedDepDate){
            console.log("hi")
            response = await axios.get(`https://test.api.amadeus.com/v2/shopping/flight-offers?originLocationCode=${destinationLocationCode}&destinationLocationCode=${originLocationCode}&departureDate=${formattedDate}&adults=1&nonStop=false&max=250`, {
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json"
            }
        });
        }
        else{
            console.log("bye")
            console.log(formattedDepDate)
            response = await axios.get(`https://test.api.amadeus.com/v2/shopping/flight-offers?originLocationCode=${destinationLocationCode}&destinationLocationCode=${originLocationCode}&departureDate=${formattedDate}&returnDate=${formattedDepDate}&adults=1&nonStop=false&max=250`, {
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json"
            }
        });
        }
        const data = response.data;
        res.json({
            status: "success",
            message: "Data received successfully",
            data: data
        });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({
            status: "error",
            message: "An error occurred while fetching data"
        });
    }
});


module.exports = app;